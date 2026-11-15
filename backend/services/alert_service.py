"""
Intelligent Weather Alert Engine for WeatherPulse Big Data Platform.
Evaluates newly ingested streaming observations from Kafka/Spark/HDFS against
scientifically validated threshold rules, city baselines, and elevation-aware metrics.
Implements watermark tracking, stable deduplication, 30-min cooldown, severity escalation,
and atomic state persistence.
"""

import os
import json
import time
import hashlib
import threading
from datetime import datetime, timezone
import services.streaming_service as streaming
import services.mapreduce_service as mr

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STATE_FILE = os.path.join(DATA_DIR, "alerts_state.json")
LOCK = threading.RLock()

# Cooldown duration: 30 minutes (1800 seconds)
DEFAULT_COOLDOWN_SECONDS = 1800

# Severity hierarchy ranking for escalation evaluation
SEVERITY_RANKS = {
    "Low": 1,
    "Moderate": 2,
    "High": 3,
    "Critical": 4
}

# Configurable Rule Definitions
RULES_CONFIG = {
    "TEMP_HIGH": {
        "rule_id": "TEMP_HIGH",
        "category": "Temperature",
        "title": "High Temperature Warning",
        "metric_name": "temperature",
        "metric_unit": "°C",
        "description": "Triggered when live surface air temperature exceeds high thermal thresholds.",
        "thresholds": {
            "Low": 33.0,
            "Moderate": 36.0,
            "High": 39.0,
            "Critical": 42.0
        }
    },
    "TEMP_LOW": {
        "rule_id": "TEMP_LOW",
        "category": "Temperature",
        "title": "Low Temperature / Cold Snap Advisory",
        "metric_name": "temperature",
        "metric_unit": "°C",
        "description": "Triggered when live air temperature falls below cold threshold bands.",
        "thresholds": {
            "Low": 18.0,
            "Moderate": 15.0,
            "High": 12.0,
            "Critical": 8.0
        }
    },
    "TEMP_ANOMALY": {
        "rule_id": "TEMP_ANOMALY",
        "category": "Anomaly",
        "title": "Historical Baseline Temperature Anomaly",
        "metric_name": "temperature_deviation",
        "metric_unit": "°C",
        "description": "Absolute deviation of live temperature from city-specific MapReduce historical average.",
        "thresholds": {
            "Low": 3.5,
            "Moderate": 5.0,
            "High": 6.5,
            "Critical": 8.5
        }
    },
    "RAIN_PRECIP": {
        "rule_id": "RAIN_PRECIP",
        "category": "Precipitation",
        "title": "Precipitation Rate Warning",
        "metric_name": "rainfall",
        "metric_unit": "mm/h",
        "description": "Precipitation accumulation over the 1-hour reporting interval.",
        "thresholds": {
            "Low": 1.0,
            "Moderate": 5.0,
            "High": 15.0,
            "Critical": 30.0
        }
    },
    "WIND_HIGH": {
        "rule_id": "WIND_HIGH",
        "category": "Wind",
        "title": "Wind Velocity & Gust Advisory",
        "metric_name": "wind_speed",
        "metric_unit": "km/h",
        "description": "Sustained wind speed measured at 10m height.",
        "thresholds": {
            "Low": 14.0,
            "Moderate": 20.0,
            "High": 28.0,
            "Critical": 40.0
        }
    },
    "COASTAL_HUMID_HEAT": {
        "rule_id": "COASTAL_HUMID_HEAT",
        "category": "Contextual",
        "title": "Coastal High Humidity & Thermal Discomfort Advisory",
        "metric_name": "humidity_and_heat",
        "metric_unit": "°C / %",
        "description": "Combined thermal discomfort from elevated temperature (>=30°C) and high humidity (>=70%) in coastal zones.",
        "cities": ["Mumbai", "Chennai"],
        "thresholds": {
            "Low": {"min_temp": 30.0, "min_hum": 70.0},
            "Moderate": {"min_temp": 32.0, "min_hum": 75.0},
            "High": {"min_temp": 34.0, "min_hum": 80.0},
            "Critical": {"min_temp": 36.0, "min_hum": 85.0}
        }
    },
    "PRESSURE_DROP": {
        "rule_id": "PRESSURE_DROP",
        "category": "Barometric",
        "title": "Barometric Pressure Deficit Advisory",
        "metric_name": "pressure_deficit",
        "metric_unit": "hPa",
        "description": "Significant drop in atmospheric pressure relative to the city's elevation-adjusted baseline.",
        "thresholds": {
            "Low": 8.0,
            "Moderate": 12.0,
            "High": 18.0,
            "Critical": 25.0
        }
    }
}

# State Container
STATE = {
    "watermark": None,            # Latest processed observation identifier or timestamp
    "processed_obs_ids": set(),   # Set of recently processed observation keys (bounded)
    "cooldowns": {},              # { "city:rule_id": { "severity": str, "timestamp": float, "alert_id": str } }
    "active_alerts": {},          # { alert_id: alert_dict }
    "alerts_history": [],         # [ alert_dict, ... ] (capped at 1000 items)
    "last_evaluation_time": None,
    "evaluations_count": 0
}

# In-memory city baseline cache (from MapReduce part-r-00000)
CITY_BASELINES = {}

def get_city_baselines():
    global CITY_BASELINES
    if CITY_BASELINES:
        return CITY_BASELINES

    # Default fallback baselines precalculated from historical MapReduce part-r-00000
    # nominal_surface_pressure accounts for city elevation: Bengaluru ~920m (914 hPa), Hyderabad ~542m (957 hPa), Delhi ~216m (990 hPa), coastal ~0m (1012 hPa)
    defaults = {
        "Bengaluru": {"avg_temperature": 29.78, "avg_humidity": 61.89, "avg_pressure": 1008.61, "nominal_surface_pressure": 914.0, "avg_wind_speed": 11.41},
        "Chennai": {"avg_temperature": 30.98, "avg_humidity": 69.88, "avg_pressure": 1007.35, "nominal_surface_pressure": 1012.0, "avg_wind_speed": 11.65},
        "Delhi": {"avg_temperature": 31.02, "avg_humidity": 65.47, "avg_pressure": 1007.33, "nominal_surface_pressure": 990.0, "avg_wind_speed": 12.30},
        "Hyderabad": {"avg_temperature": 32.19, "avg_humidity": 63.43, "avg_pressure": 1008.23, "nominal_surface_pressure": 957.0, "avg_wind_speed": 16.77},
        "Mumbai": {"avg_temperature": 30.80, "avg_humidity": 70.65, "avg_pressure": 1009.55, "nominal_surface_pressure": 1012.0, "avg_wind_speed": 12.80}
    }

    try:
        mr_stats = mr.get_mapreduce_stats()
        if mr_stats:
            for s in mr_stats:
                city = s.get("city")
                if city and city in defaults:
                    defaults[city]["avg_temperature"] = s.get("avg_temperature", defaults[city]["avg_temperature"])
                    defaults[city]["avg_humidity"] = s.get("avg_humidity", defaults[city]["avg_humidity"])
                    defaults[city]["avg_pressure"] = s.get("avg_pressure", defaults[city]["avg_pressure"])
                    defaults[city]["avg_wind_speed"] = s.get("avg_wind_speed", defaults[city]["avg_wind_speed"])
    except Exception as e:
        pass

    CITY_BASELINES = defaults
    return CITY_BASELINES

def _load_state():
    """Loads alert engine state atomically from disk if present."""
    with LOCK:
        if not os.path.exists(STATE_FILE):
            return

        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                STATE["watermark"] = data.get("watermark")
                STATE["processed_obs_ids"] = set(data.get("processed_obs_ids", []))
                STATE["cooldowns"] = data.get("cooldowns", {})
                STATE["active_alerts"] = data.get("active_alerts", {})
                STATE["alerts_history"] = data.get("alerts_history", [])
                STATE["last_evaluation_time"] = data.get("last_evaluation_time")
                STATE["evaluations_count"] = data.get("evaluations_count", 0)
        except Exception as e:
            print(f"[ALERT_SERVICE] Error loading state from {STATE_FILE}: {e}")

def _save_state_atomic():
    """Atomically serializes state to disk to prevent corrupt writes."""
    with LOCK:
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            temp_file = STATE_FILE + f".tmp.{os.getpid()}"

            # Prepare json-serializable copy
            serializable = {
                "watermark": STATE["watermark"],
                "processed_obs_ids": list(STATE["processed_obs_ids"])[-1000:],  # bound set
                "cooldowns": STATE["cooldowns"],
                "active_alerts": STATE["active_alerts"],
                "alerts_history": STATE["alerts_history"][-1000:],
                "last_evaluation_time": STATE["last_evaluation_time"],
                "evaluations_count": STATE["evaluations_count"],
                "saved_at": datetime.now(timezone.utc).isoformat()
            }

            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2)

            os.replace(temp_file, STATE_FILE)
        except Exception as e:
            print(f"[ALERT_SERVICE] Atomic save error: {e}")

# Load state on module import
_load_state()

def _make_obs_id(rec):
    """Generates a stable, reproducible observation ID from record metadata."""
    city = rec.get("city", "Unknown")
    src_ts = rec.get("source_timestamp", "")
    ing_ts = rec.get("ingest_timestamp", "")
    return f"{city}|{src_ts}|{ing_ts}"

def evaluate_observation(record, baselines=None):
    """
    Evaluates a single genuine weather observation against rule definitions.
    Returns a list of qualified alert candidates (unfiltered by cooldown).
    """
    if not record or not isinstance(record, dict):
        return []

    city = record.get("city")
    if not city:
        return []

    if baselines is None:
        baselines = get_city_baselines()
    city_base = baselines.get(city, {})

    temp = record.get("temperature")
    humidity = record.get("humidity")
    rainfall = record.get("rainfall")
    wind_speed = record.get("wind_speed")
    pressure = record.get("pressure")

    src_ts = record.get("source_timestamp")
    ing_ts = record.get("ingest_timestamp")
    spark_ts = record.get("spark_processing_timestamp")

    candidates = []

    # 1. Rule: High Temperature (TEMP_HIGH)
    if temp is not None:
        cfg = RULES_CONFIG["TEMP_HIGH"]
        th = cfg["thresholds"]
        sev = None
        if temp >= th["Critical"]: sev = "Critical"
        elif temp >= th["High"]: sev = "High"
        elif temp >= th["Moderate"]: sev = "Moderate"
        elif temp >= th["Low"]: sev = "Low"

        if sev:
            candidates.append({
                "rule_id": "TEMP_HIGH",
                "title": cfg["title"],
                "category": cfg["category"],
                "severity": sev,
                "city": city,
                "metric_name": "temperature",
                "metric_unit": "°C",
                "metric_value": temp,
                "threshold_value": th[sev],
                "baseline_value": city_base.get("avg_temperature"),
                "message": f"{city} registered high temperature of {temp:.1f}°C (Threshold: {th[sev]}°C).",
                "source_timestamp": src_ts,
                "ingest_timestamp": ing_ts,
                "spark_processing_timestamp": spark_ts,
            })

    # 2. Rule: Low Temperature (TEMP_LOW)
    if temp is not None:
        cfg = RULES_CONFIG["TEMP_LOW"]
        th = cfg["thresholds"]
        sev = None
        if temp < th["Critical"]: sev = "Critical"
        elif temp <= th["High"]: sev = "High"
        elif temp <= th["Moderate"]: sev = "Moderate"
        elif temp <= th["Low"]: sev = "Low"

        if sev:
            candidates.append({
                "rule_id": "TEMP_LOW",
                "title": cfg["title"],
                "category": cfg["category"],
                "severity": sev,
                "city": city,
                "metric_name": "temperature",
                "metric_unit": "°C",
                "metric_value": temp,
                "threshold_value": th[sev],
                "baseline_value": city_base.get("avg_temperature"),
                "message": f"{city} experienced cold temperature of {temp:.1f}°C (Advisory limit: {th[sev]}°C).",
                "source_timestamp": src_ts,
                "ingest_timestamp": ing_ts,
                "spark_processing_timestamp": spark_ts,
            })

    # 3. Rule: Historical Baseline Temperature Anomaly (TEMP_ANOMALY)
    if temp is not None and city_base.get("avg_temperature") is not None:
        hist_mean = city_base["avg_temperature"]
        diff = round(temp - hist_mean, 2)
        abs_diff = abs(diff)
        cfg = RULES_CONFIG["TEMP_ANOMALY"]
        th = cfg["thresholds"]
        sev = None
        if abs_diff >= th["Critical"]: sev = "Critical"
        elif abs_diff >= th["High"]: sev = "High"
        elif abs_diff >= th["Moderate"]: sev = "Moderate"
        elif abs_diff >= th["Low"]: sev = "Low"

        if sev:
            direction = "above" if diff > 0 else "below"
            candidates.append({
                "rule_id": "TEMP_ANOMALY",
                "title": cfg["title"],
                "category": cfg["category"],
                "severity": sev,
                "city": city,
                "metric_name": "temperature_deviation",
                "metric_unit": "°C",
                "metric_value": diff,
                "threshold_value": th[sev],
                "baseline_value": hist_mean,
                "message": f"{city} live temperature ({temp:.1f}°C) deviates {abs_diff:.1f}°C {direction} historical MapReduce baseline ({hist_mean:.1f}°C).",
                "source_timestamp": src_ts,
                "ingest_timestamp": ing_ts,
                "spark_processing_timestamp": spark_ts,
            })

    # 4. Rule: Precipitation Rate (RAIN_PRECIP)
    if rainfall is not None and rainfall > 0:
        cfg = RULES_CONFIG["RAIN_PRECIP"]
        th = cfg["thresholds"]
        sev = None
        if rainfall >= th["Critical"]: sev = "Critical"
        elif rainfall >= th["High"]: sev = "High"
        elif rainfall >= th["Moderate"]: sev = "Moderate"
        elif rainfall >= th["Low"]: sev = "Low"

        if sev:
            candidates.append({
                "rule_id": "RAIN_PRECIP",
                "title": cfg["title"],
                "category": cfg["category"],
                "severity": sev,
                "city": city,
                "metric_name": "rainfall",
                "metric_unit": "mm/h",
                "metric_value": rainfall,
                "threshold_value": th[sev],
                "baseline_value": None,
                "message": f"{city} reported precipitation accumulation of {rainfall:.1f} mm/h (Threshold: {th[sev]} mm/h).",
                "source_timestamp": src_ts,
                "ingest_timestamp": ing_ts,
                "spark_processing_timestamp": spark_ts,
            })

    # 5. Rule: Wind Velocity (WIND_HIGH)
    if wind_speed is not None:
        cfg = RULES_CONFIG["WIND_HIGH"]
        th = cfg["thresholds"]
        sev = None
        if wind_speed >= th["Critical"]: sev = "Critical"
        elif wind_speed >= th["High"]: sev = "High"
        elif wind_speed >= th["Moderate"]: sev = "Moderate"
        elif wind_speed >= th["Low"]: sev = "Low"

        if sev:
            candidates.append({
                "rule_id": "WIND_HIGH",
                "title": cfg["title"],
                "category": cfg["category"],
                "severity": sev,
                "city": city,
                "metric_name": "wind_speed",
                "metric_unit": "km/h",
                "metric_value": wind_speed,
                "threshold_value": th[sev],
                "baseline_value": city_base.get("avg_wind_speed"),
                "message": f"{city} recorded elevated wind velocity of {wind_speed:.1f} km/h (Threshold: {th[sev]} km/h).",
                "source_timestamp": src_ts,
                "ingest_timestamp": ing_ts,
                "spark_processing_timestamp": spark_ts,
            })

    # 6. Rule: Coastal Moisture & Thermal Discomfort (COASTAL_HUMID_HEAT)
    cfg_coast = RULES_CONFIG["COASTAL_HUMID_HEAT"]
    if city in cfg_coast.get("cities", []) and temp is not None and humidity is not None:
        th = cfg_coast["thresholds"]
        sev = None
        if temp >= th["Critical"]["min_temp"] and humidity >= th["Critical"]["min_hum"]: sev = "Critical"
        elif temp >= th["High"]["min_temp"] and humidity >= th["High"]["min_hum"]: sev = "High"
        elif temp >= th["Moderate"]["min_temp"] and humidity >= th["Moderate"]["min_hum"]: sev = "Moderate"
        elif temp >= th["Low"]["min_temp"] and humidity >= th["Low"]["min_hum"]: sev = "Low"

        if sev:
            target_th = th[sev]
            candidates.append({
                "rule_id": "COASTAL_HUMID_HEAT",
                "title": cfg_coast["title"],
                "category": cfg_coast["category"],
                "severity": sev,
                "city": city,
                "metric_name": "humidity_and_heat",
                "metric_unit": "°C / %",
                "metric_value": f"{temp:.1f}°C / {humidity:.0f}%",
                "threshold_value": f"{target_th['min_temp']}°C / {target_th['min_hum']}%",
                "baseline_value": f"{city_base.get('avg_temperature', 'N/A')}°C / {city_base.get('avg_humidity', 'N/A')}%",
                "message": f"Coastal advisory for {city}: Temperature {temp:.1f}°C with relative humidity {humidity:.0f}% creates muggy thermal discomfort.",
                "source_timestamp": src_ts,
                "ingest_timestamp": ing_ts,
                "spark_processing_timestamp": spark_ts,
            })

    # 7. Rule: Elevation-Aware Barometric Pressure Anomaly (PRESSURE_DROP)
    if pressure is not None and (city_base.get("nominal_surface_pressure") is not None or city_base.get("avg_pressure") is not None):
        base_press = city_base.get("nominal_surface_pressure", city_base.get("avg_pressure", 1012.0))
        # Elevation-aware: compares live surface pressure against city elevation baseline
        # (e.g. Bengaluru ~914 hPa, Hyderabad ~957 hPa, coastal ~1012 hPa)
        press_drop = round(base_press - pressure, 1)
        cfg_p = RULES_CONFIG["PRESSURE_DROP"]
        th = cfg_p["thresholds"]
        sev = None
        if press_drop >= th["Critical"]: sev = "Critical"
        elif press_drop >= th["High"]: sev = "High"
        elif press_drop >= th["Moderate"]: sev = "Moderate"
        elif press_drop >= th["Low"]: sev = "Low"

        if sev:
            candidates.append({
                "rule_id": "PRESSURE_DROP",
                "title": cfg_p["title"],
                "category": cfg_p["category"],
                "severity": sev,
                "city": city,
                "metric_name": "pressure_deficit",
                "metric_unit": "hPa",
                "metric_value": press_drop,
                "threshold_value": th[sev],
                "baseline_value": base_press,
                "message": f"Atmospheric pressure in {city} dropped by {press_drop:.1f} hPa below baseline ({base_press:.1f} hPa). Current: {pressure:.1f} hPa.",
                "source_timestamp": src_ts,
                "ingest_timestamp": ing_ts,
                "spark_processing_timestamp": spark_ts,
            })

    return candidates

def process_stream_batch(records=None):
    """
    Evaluates new streaming records that have arrived since the processing watermark.
    Enforces deduplication, 30-minute cooldown, and severity escalation.
    Persists updated state atomically.
    """
    if records is None:
        records = streaming.get_recent_stream()

    if not records:
        return {"processed": 0, "alerts_generated": 0}

    with LOCK:
        now_ts = datetime.now(timezone.utc).isoformat()
        now_epoch = time.time()
        baselines = get_city_baselines()

        # Sort records chronologically (oldest to newest) to maintain natural timeline
        sorted_records = sorted(
            records,
            key=lambda r: (r.get("spark_processing_timestamp") or r.get("ingest_timestamp") or "")
        )

        processed_count = 0
        new_alerts_count = 0
        highest_spark_ts = STATE["watermark"]

        for rec in sorted_records:
            obs_id = _make_obs_id(rec)
            spark_ts = rec.get("spark_processing_timestamp") or rec.get("ingest_timestamp") or ""

            # Watermark and deduplication check
            if obs_id in STATE["processed_obs_ids"]:
                continue

            processed_count += 1
            STATE["processed_obs_ids"].add(obs_id)

            if spark_ts and (not highest_spark_ts or spark_ts > highest_spark_ts):
                highest_spark_ts = spark_ts

            # Evaluate rules for observation
            candidates = evaluate_observation(rec, baselines=baselines)

            for cand in candidates:
                city = cand["city"]
                rule_id = cand["rule_id"]
                cand_sev = cand["severity"]
                cooldown_key = f"{city}:{rule_id}"
                last_event = STATE["cooldowns"].get(cooldown_key)

                should_alert = False
                is_escalation = False

                if not last_event:
                    should_alert = True
                else:
                    elapsed = now_epoch - last_event.get("timestamp", 0)
                    last_sev = last_event.get("severity", "Low")
                    cand_rank = SEVERITY_RANKS.get(cand_sev, 1)
                    last_rank = SEVERITY_RANKS.get(last_sev, 1)

                    if elapsed >= DEFAULT_COOLDOWN_SECONDS:
                        should_alert = True
                    elif cand_rank > last_rank:
                        # Severity escalation overrides cooldown!
                        should_alert = True
                        is_escalation = True

                if should_alert:
                    # Construct unique alert ID
                    hash_input = f"{obs_id}_{rule_id}_{cand_sev}"
                    h_code = hashlib.sha256(hash_input.encode()).hexdigest()[:10]
                    alert_id = f"alert_{city.lower()}_{rule_id.lower()}_{h_code}"

                    msg = cand["message"]
                    if is_escalation:
                        msg = f"[Escalation: {last_event.get('severity')} → {cand_sev}] " + msg

                    alert_obj = {
                        "id": alert_id,
                        "rule_id": rule_id,
                        "title": cand["title"],
                        "category": cand["category"],
                        "severity": cand_sev,
                        "city": city,
                        "message": msg,
                        "metric_name": cand["metric_name"],
                        "metric_unit": cand["metric_unit"],
                        "metric_value": cand["metric_value"],
                        "threshold_value": cand["threshold_value"],
                        "baseline_value": cand["baseline_value"],
                        "source_timestamp": cand["source_timestamp"],
                        "ingest_timestamp": cand["ingest_timestamp"],
                        "spark_processing_timestamp": cand["spark_processing_timestamp"],
                        "alert_timestamp": now_ts,
                        "status": "ACTIVE",
                        "acknowledged_at": None,
                        "acknowledged_note": None,
                        "provenance": {
                            "source": "Open-Meteo Live API",
                            "transport": "Kafka topic 'weather_stream' (localhost:9092)",
                            "processing": "Apache Spark Structured Streaming",
                            "storage": "Hadoop HDFS /weather/streaming/raw"
                        }
                    }

                    # Update active registry and history
                    STATE["active_alerts"][alert_id] = alert_obj
                    STATE["alerts_history"].append(alert_obj)
                    new_alerts_count += 1

                    # Update cooldown tracking
                    STATE["cooldowns"][cooldown_key] = {
                        "severity": cand_sev,
                        "timestamp": now_epoch,
                        "alert_id": alert_id
                    }

        # Auto-resolve active alerts if the city's latest observation has returned to normal
        # Group latest observation by city
        latest_by_city = {}
        for r in sorted_records:
            if r.get("city"):
                latest_by_city[r["city"]] = r

        resolved_ids = []
        for a_id, active_al in list(STATE["active_alerts"].items()):
            c_name = active_al["city"]
            r_id = active_al["rule_id"]
            if c_name in latest_by_city:
                latest_cands = evaluate_observation(latest_by_city[c_name], baselines=baselines)
                still_active = any(c["rule_id"] == r_id for c in latest_cands)
                if not still_active:
                    active_al["status"] = "RESOLVED"
                    active_al["resolved_at"] = now_ts
                    resolved_ids.append(a_id)
                    # Clear cooldown so future violations can alert immediately
                    cooldown_k = f"{c_name}:{r_id}"
                    STATE["cooldowns"].pop(cooldown_k, None)

        for a_id in resolved_ids:
            STATE["active_alerts"].pop(a_id, None)

        if highest_spark_ts:
            STATE["watermark"] = highest_spark_ts

        STATE["last_evaluation_time"] = now_ts
        STATE["evaluations_count"] += 1

        if processed_count > 0 or resolved_ids:
            _save_state_atomic()

        return {"processed": processed_count, "alerts_generated": new_alerts_count, "resolved": len(resolved_ids)}

def get_active_alerts(city=None, severity=None, rule_id=None, limit=50):
    """Returns currently active alerts from state matching filter criteria."""
    with LOCK:
        alerts = list(STATE["active_alerts"].values())

        if city and city != "All":
            alerts = [a for a in alerts if a["city"] == city]
        if severity and severity != "All":
            alerts = [a for a in alerts if a["severity"] == severity]
        if rule_id and rule_id != "All":
            alerts = [a for a in alerts if a["rule_id"] == rule_id]

        # Sort newest first
        alerts.sort(key=lambda a: a.get("alert_timestamp", ""), reverse=True)
        return alerts[:limit]

def get_alerts_history(city=None, severity=None, page=1, page_size=20):
    """Returns paginated history of alerts."""
    with LOCK:
        history = list(STATE["alerts_history"])

        if city and city != "All":
            history = [a for a in history if a["city"] == city]
        if severity and severity != "All":
            history = [a for a in history if a["severity"] == severity]

        history.sort(key=lambda a: a.get("alert_timestamp", ""), reverse=True)

        total_count = len(history)
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        items = history[start_idx : start_idx + page_size]

        return {
            "page": page,
            "page_size": page_size,
            "total_items": total_count,
            "total_pages": total_pages,
            "items": items
        }

def acknowledge_alert(alert_id, note=None):
    """Marks an active alert as acknowledged."""
    with LOCK:
        now_ts = datetime.now(timezone.utc).isoformat()
        if alert_id in STATE["active_alerts"]:
            alert = STATE["active_alerts"][alert_id]
            alert["status"] = "ACKNOWLEDGED"
            alert["acknowledged_at"] = now_ts
            alert["acknowledged_note"] = note or "Acknowledged by operator"

            # Update in history list as well
            for h in STATE["alerts_history"]:
                if h["id"] == alert_id:
                    h["status"] = "ACKNOWLEDGED"
                    h["acknowledged_at"] = now_ts
                    h["acknowledged_note"] = note or "Acknowledged by operator"

            _save_state_atomic()
            return alert
        return None

def get_alerts_summary():
    """Computes distribution and engine metrics."""
    with LOCK:
        active = list(STATE["active_alerts"].values())
        history = STATE["alerts_history"]

        by_severity = {"Critical": 0, "High": 0, "Moderate": 0, "Low": 0}
        by_city = {"Bengaluru": 0, "Chennai": 0, "Delhi": 0, "Hyderabad": 0, "Mumbai": 0}
        by_category = {}

        for a in active:
            sev = a.get("severity", "Low")
            by_severity[sev] = by_severity.get(sev, 0) + 1

            city = a.get("city")
            if city in by_city:
                by_city[city] += 1

            cat = a.get("category", "General")
            by_category[cat] = by_category.get(cat, 0) + 1

        return {
            "total_active": len(active),
            "total_historical": len(history),
            "by_severity": by_severity,
            "by_city": by_city,
            "by_category": by_category,
            "engine_status": {
                "status": "RUNNING",
                "watermark": STATE["watermark"],
                "last_evaluation_time": STATE["last_evaluation_time"],
                "evaluations_count": STATE["evaluations_count"],
                "active_cooldowns_count": len(STATE["cooldowns"])
            }
        }

def get_threshold_definitions():
    """Returns the rule configuration schema."""
    baselines = get_city_baselines()
    return {
        "rules": RULES_CONFIG,
        "cooldown_period_seconds": DEFAULT_COOLDOWN_SECONDS,
        "severity_hierarchy": ["Low", "Moderate", "High", "Critical"],
        "city_baselines": baselines
    }

# Background thread daemon for periodic evaluation
_EVALUATOR_THREAD = None
_STOP_EVENT = threading.Event()

def _evaluator_loop(interval=15):
    """Background daemon loop evaluating stream partitions."""
    while not _STOP_EVENT.is_set():
        try:
            process_stream_batch()
        except Exception as e:
            print(f"[ALERT_ENGINE] Evaluator loop error: {e}")
        time.sleep(interval)

def start_alert_evaluator():
    """Starts the background evaluation daemon thread if not already active."""
    global _EVALUATOR_THREAD
    with LOCK:
        if _EVALUATOR_THREAD is None or not _EVALUATOR_THREAD.is_alive():
            _STOP_EVENT.clear()
            _EVALUATOR_THREAD = threading.Thread(
                target=_evaluator_loop,
                args=(15,),
                daemon=True,
                name="WeatherAlertEvaluatorDaemon"
            )
            _EVALUATOR_THREAD.start()
            print("[ALERT_ENGINE] Background Alert Evaluator Daemon started.")
