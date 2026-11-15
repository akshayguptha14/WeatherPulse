"""
Quality Monitoring Service for Big Data Streaming Pipeline.
Audits recent HDFS streaming Parquet observations against meteorological physical bounds,
transport integrity, schema completeness, and end-to-end latency.

All evaluations are performed on genuine project streaming observations.
The composite Data Quality Score (DQS) is an explainable, project-defined metric
calibrated specifically for this 5-city Kafka -> Spark -> HDFS pipeline.
"""

import os
import json
import time
import math
import threading
from datetime import datetime, timezone
import services.streaming_service as streaming
import services.ecosystem_service as ecosystem
import services.producer_service as producer_svc

QUALITY_STATE_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'quality_state.json')

_QUALITY_LOCK = threading.RLock()
_AUDIT_CACHE = {
    "summary": None,
    "metrics": None,
    "pipeline": None,
    "timestamp": 0.0
}
CACHE_TTL = 15.0  # 15 seconds cache alignment with frontend polling

# Canonical Indian cities in pipeline
MONITORED_CITIES = ["Bengaluru", "Chennai", "Delhi", "Hyderabad", "Mumbai"]

# Stored schema columns expected in HDFS Parquet records
SCHEMA_FIELDS = [
    "city",
    "temperature",
    "humidity",
    "rainfall",
    "wind_speed",
    "pressure",
    "weather_condition",
    "source_timestamp",
    "ingest_timestamp",
    "spark_processing_timestamp"
]

# Physical meteorological sanity envelopes (Indian regional climate)
METRIC_BOUNDS = {
    "temperature": {"min": -10.0, "max": 55.0, "unit": "°C"},
    "humidity": {"min": 0.0, "max": 100.0, "unit": "%"},
    "rainfall": {"min": 0.0, "max": 300.0, "unit": "mm/h"},
    "wind_speed": {"min": 0.0, "max": 300.0, "unit": "km/h"},
    "pressure": {"min": 800.0, "max": 1080.0, "unit": "hPa"}
}

VALID_CONDITIONS = {
    "Clear", "Partly Cloudy", "Cloudy", "Fog", "Rain", "Snow", "Thunderstorm", "Unknown"
}

def _parse_to_utc_epoch(ts_val):
    """
    Safely parse various ISO-8601 or prefixed timestamp strings into a UTC epoch float.
    Returns float seconds or None on unparseable format.
    """
    if not ts_val:
        return None
    try:
        s = str(ts_val).strip()
        if s.startswith("LIVE|"):
            s = s[5:].strip()
        
        # Replace space between date and time with T
        if " " in s and "T" not in s:
            parts = s.split(" ")
            s = f"{parts[0]}T{parts[1]}"
            
        # Parse ISO format
        # If no timezone offset is present, assume UTC
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).timestamp()
    except Exception:
        # Fallback regex/strptime parse if fromisoformat fails on Python microsecond edge cases
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S"):
            try:
                dt = datetime.strptime(s, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).timestamp()
            except Exception:
                continue
    return None

def _load_quality_state():
    """Load persistent issues log from JSON state file."""
    with _QUALITY_LOCK:
        if os.path.exists(QUALITY_STATE_FILE):
            try:
                with open(QUALITY_STATE_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[QUALITY_SERVICE] Error loading state file: {e}")
        return {
            "total_audits_performed": 0,
            "last_audit_time": None,
            "issues_history": []
        }

def _save_quality_state(state):
    """Atomically write quality state to disk."""
    with _QUALITY_LOCK:
        try:
            os.makedirs(os.path.dirname(os.path.abspath(QUALITY_STATE_FILE)), exist_ok=True)
            tmp_path = QUALITY_STATE_FILE + ".tmp"
            with open(tmp_path, 'w', encoding='utf-8') as f:
                json.dump(state, f, indent=2)
            os.replace(tmp_path, QUALITY_STATE_FILE)
        except Exception as e:
            print(f"[QUALITY_SERVICE] Error saving state file: {e}")

def run_quality_audit(force_fresh=False):
    """
    Main evaluation routine. Reads latest 50 streaming Parquet records from HDFS.
    Calculates missingness, duplicate observations, duplicate ingestions, physical bounds,
    timestamp consistency, city-wise completeness, freshness, and composite DQS score.
    Caches results for 15 seconds.
    """
    global _AUDIT_CACHE
    now_epoch = time.time()

    if not force_fresh and _AUDIT_CACHE["summary"] and (now_epoch - _AUDIT_CACHE["timestamp"] < CACHE_TTL):
        return _AUDIT_CACHE["summary"], _AUDIT_CACHE["metrics"], _AUDIT_CACHE["pipeline"]

    with _QUALITY_LOCK:
        # Re-check cache inside lock
        if not force_fresh and _AUDIT_CACHE["summary"] and (now_epoch - _AUDIT_CACHE["timestamp"] < CACHE_TTL):
            return _AUDIT_CACHE["summary"], _AUDIT_CACHE["metrics"], _AUDIT_CACHE["pipeline"]

        # Fetch recent records from streaming service
        records = streaming.get_recent_stream()
        if not records:
            records = []

        total_records = len(records)
        sample_scope_label = f"Latest {total_records} Observations" if total_records > 0 else "0 Records Available"

        # Initialize violation counters
        field_missing_counts = {col: 0 for col in SCHEMA_FIELDS}
        field_invalid_counts = {col: 0 for col in METRIC_BOUNDS}
        field_invalid_counts["weather_condition"] = 0
        timestamp_anomalies_count = 0
        
        seen_observation_keys = set()
        duplicate_observations = []
        
        seen_ingestion_keys = set()
        duplicate_ingestions = []

        new_detected_issues = []
        city_received_counts = {c: 0 for c in MONITORED_CITIES}
        spark_latencies = []
        e2e_latencies = []
        latest_ingest_epoch = 0.0

        for idx, rec in enumerate(records):
            city = rec.get("city")
            if city in city_received_counts:
                city_received_counts[city] += 1

            source_ts = rec.get("source_timestamp")
            ingest_ts = rec.get("ingest_timestamp")
            spark_ts = rec.get("spark_processing_timestamp")

            # 1. Missing Value Detection
            rec_has_missing = False
            for field in SCHEMA_FIELDS:
                val = rec.get(field)
                if val is None or (isinstance(val, str) and val.strip() == ""):
                    field_missing_counts[field] += 1
                    rec_has_missing = True
                    new_detected_issues.append({
                        "id": f"miss_{city}_{field}_{idx}_{int(now_epoch)}",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "severity": "High" if field in ["city", "temperature", "source_timestamp"] else "Moderate",
                        "rule": "MISSING_FIELD",
                        "city": city or "Unknown",
                        "field": field,
                        "observed_value": None,
                        "allowed_range": "Not Null",
                        "message": f"Record #{idx} for {city or 'Unknown'} has missing/null '{field}'."
                    })

            # 2. Duplicate Detection: Separate Observation vs Ingestion Duplication
            # A) Duplicate observation: Same city & source_timestamp
            if city and source_ts:
                obs_key = f"{city}|{source_ts}"
                if obs_key in seen_observation_keys:
                    duplicate_observations.append(obs_key)
                    new_detected_issues.append({
                        "id": f"dup_obs_{city}_{idx}_{int(now_epoch)}",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "severity": "Moderate",
                        "rule": "DUPLICATE_OBSERVATION",
                        "city": city,
                        "field": "source_timestamp",
                        "observed_value": str(source_ts),
                        "allowed_range": "Unique per city cycle",
                        "message": f"Duplicate meteorological observation detected for {city} at source time '{source_ts}'."
                    })
                else:
                    seen_observation_keys.add(obs_key)

            # B) Duplicate ingestion: Identical city, source_ts, and ingest_ts
            if city and source_ts and ingest_ts:
                ingest_key = f"{city}|{source_ts}|{ingest_ts}"
                if ingest_key in seen_ingestion_keys:
                    duplicate_ingestions.append(ingest_key)
                    new_detected_issues.append({
                        "id": f"dup_ing_{city}_{idx}_{int(now_epoch)}",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "severity": "High",
                        "rule": "DUPLICATE_INGESTION_EVENT",
                        "city": city,
                        "field": "ingest_timestamp",
                        "observed_value": str(ingest_ts),
                        "allowed_range": "Unique transport ingestion event",
                        "message": f"Duplicate Kafka/HDFS ingestion event identity detected for {city}."
                    })
                else:
                    seen_ingestion_keys.add(ingest_key)

            # 3. Physical Meteorological Bounds Validation
            for field, bounds in METRIC_BOUNDS.items():
                val = rec.get(field)
                if val is not None:
                    try:
                        f_val = float(val)
                        if math.isnan(f_val) or math.isinf(f_val):
                            field_invalid_counts[field] += 1
                        elif f_val < bounds["min"] or f_val > bounds["max"]:
                            field_invalid_counts[field] += 1
                            new_detected_issues.append({
                                "id": f"bound_{city}_{field}_{idx}_{int(now_epoch)}",
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                                "severity": "Critical" if (f_val < bounds["min"] - 10 or f_val > bounds["max"] + 15) else "High",
                                "rule": "METRIC_OUT_OF_BOUNDS",
                                "city": city,
                                "field": field,
                                "observed_value": f_val,
                                "allowed_range": f"{bounds['min']} to {bounds['max']} {bounds['unit']}",
                                "message": f"{city} {field} ({f_val} {bounds['unit']}) violates physical bounds [{bounds['min']}, {bounds['max']}]."
                            })
                    except (ValueError, TypeError):
                        field_invalid_counts[field] += 1

            # Weather Condition Enum validation
            cond = rec.get("weather_condition")
            if cond is not None and cond not in VALID_CONDITIONS:
                field_invalid_counts["weather_condition"] += 1
                new_detected_issues.append({
                    "id": f"cond_{city}_{idx}_{int(now_epoch)}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "severity": "Low",
                    "rule": "INVALID_CONDITION_ENUM",
                    "city": city,
                    "field": "weather_condition",
                    "observed_value": str(cond),
                    "allowed_range": ", ".join(VALID_CONDITIONS),
                    "message": f"Weather condition '{cond}' not in recognized WMO category set."
                })

            # 4. UTC Timestamp Validation & Chronological Integrity
            src_epoch = _parse_to_utc_epoch(source_ts)
            ing_epoch = _parse_to_utc_epoch(ingest_ts)
            spk_epoch = _parse_to_utc_epoch(spark_ts)

            if ing_epoch and ing_epoch > latest_ingest_epoch:
                latest_ingest_epoch = ing_epoch

            ts_error = False
            # Check 4.1: Clock skew / future timestamp
            if src_epoch and src_epoch > now_epoch + 300.0:
                ts_error = True
                new_detected_issues.append({
                    "id": f"future_src_{city}_{idx}_{int(now_epoch)}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "severity": "High",
                    "rule": "FUTURE_TIMESTAMP",
                    "city": city,
                    "field": "source_timestamp",
                    "observed_value": str(source_ts),
                    "allowed_range": f"<= now + 300s (UTC)",
                    "message": f"Source timestamp for {city} is in the future by > 300 seconds."
                })
            
            # Check 4.2: Ingestion inversion (ingest before source)
            if ing_epoch and src_epoch and (ing_epoch < src_epoch - 60.0):
                ts_error = True
                new_detected_issues.append({
                    "id": f"inv_ing_{city}_{idx}_{int(now_epoch)}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "severity": "Moderate",
                    "rule": "TRANSPORT_INVERSION",
                    "city": city,
                    "field": "ingest_timestamp",
                    "observed_value": f"ingest={ingest_ts} < source={source_ts}",
                    "allowed_range": "ingest >= source",
                    "message": f"Ingestion timestamp occurred before source observation for {city}."
                })

            # Check 4.3: Processing inversion (Spark processing before Kafka ingestion)
            if spk_epoch and ing_epoch and (spk_epoch < ing_epoch - 5.0):
                ts_error = True
                new_detected_issues.append({
                    "id": f"inv_spk_{city}_{idx}_{int(now_epoch)}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "severity": "Moderate",
                    "rule": "PROCESSING_INVERSION",
                    "city": city,
                    "field": "spark_processing_timestamp",
                    "observed_value": f"spark={spark_ts} < ingest={ingest_ts}",
                    "allowed_range": "spark >= ingest",
                    "message": f"Spark micro-batch commit timestamp occurred before Kafka ingestion timestamp."
                })

            if ts_error:
                timestamp_anomalies_count += 1

            # Latency tracking (positive seconds)
            if spk_epoch and ing_epoch and spk_epoch >= ing_epoch:
                spark_latencies.append(round(spk_epoch - ing_epoch, 2))
            if spk_epoch and src_epoch and spk_epoch >= src_epoch:
                e2e_latencies.append(round(spk_epoch - src_epoch, 2))

        # 5. City-wise Completeness Calculation
        # Expected cycles in sample = total_records / 5 (since 5 cities polled uniformly)
        expected_per_city = max(1, math.ceil(total_records / len(MONITORED_CITIES))) if total_records > 0 else 1
        city_completeness = {}
        completeness_sum = 0.0

        for c in MONITORED_CITIES:
            rec_c = city_received_counts.get(c, 0)
            ratio = min(100.0, round((rec_c / expected_per_city) * 100.0, 1)) if expected_per_city > 0 else 0.0
            city_completeness[c] = {
                "received_observations": rec_c,
                "expected_observations": expected_per_city,
                "completeness_percentage": ratio,
                "is_active": rec_c > 0
            }
            completeness_sum += ratio

        avg_completeness = round(completeness_sum / len(MONITORED_CITIES), 1) if MONITORED_CITIES else 100.0

        # 6. Stream Freshness (Age in seconds)
        freshness_seconds = round(now_epoch - latest_ingest_epoch, 1) if latest_ingest_epoch > 0 else None
        if freshness_seconds is not None:
            if freshness_seconds <= 90.0:
                freshness_status = "Optimal (Real-time)"
            elif freshness_seconds <= 240.0:
                freshness_status = "Acceptable (Slight Lag)"
            elif freshness_seconds <= 600.0:
                freshness_status = "Delayed"
            else:
                freshness_status = "Stale / Blocked"
        else:
            freshness_status = "Unknown (No Stream Data)"

        # 7. Mathematical Rate Calculations (All in % of sample)
        total_cells = total_records * len(SCHEMA_FIELDS)
        total_missing_cells = sum(field_missing_counts.values())
        missing_rate_pct = round((total_missing_cells / total_cells) * 100.0, 2) if total_cells > 0 else 0.0

        dup_obs_count = len(duplicate_observations)
        dup_obs_rate_pct = round((dup_obs_count / total_records) * 100.0, 2) if total_records > 0 else 0.0

        dup_ing_count = len(duplicate_ingestions)
        dup_ing_rate_pct = round((dup_ing_count / total_records) * 100.0, 2) if total_records > 0 else 0.0

        total_invalid_metrics = sum(field_invalid_counts.values())
        invalid_rate_pct = round((total_invalid_metrics / (total_records * (len(METRIC_BOUNDS) + 1))) * 100.0, 2) if total_records > 0 else 0.0

        ts_anomaly_rate_pct = round((timestamp_anomalies_count / total_records) * 100.0, 2) if total_records > 0 else 0.0

        # 8. Deductive Composite Data Quality Score (DQS) Formula
        # DQS = 100 - (P_missing + P_duplicates + P_invalid + P_timestamp + P_completeness + P_freshness)
        p_missing = min(25.0, missing_rate_pct * 2.5)
        p_duplicates = min(20.0, (dup_obs_rate_pct + dup_ing_rate_pct) * 2.0)
        p_invalid = min(25.0, invalid_rate_pct * 5.0)
        p_timestamp = min(15.0, ts_anomaly_rate_pct * 3.0)
        p_completeness = max(0.0, (100.0 - avg_completeness) * 0.20)
        
        p_freshness = 0.0
        if freshness_seconds is not None:
            if freshness_seconds > 300.0:
                p_freshness = 20.0
            elif freshness_seconds > 180.0:
                p_freshness = 10.0
            elif freshness_seconds > 90.0:
                p_freshness = 5.0

        total_penalty = p_missing + p_duplicates + p_invalid + p_timestamp + p_completeness + p_freshness
        raw_dqs = max(0.0, min(100.0, 100.0 - total_penalty))
        dqs_score = round(raw_dqs, 1)

        # Health Grade Mapping
        if dqs_score >= 95.0:
            quality_grade = "A+"
            grade_label = "Optimal Enterprise Quality"
        elif dqs_score >= 85.0:
            quality_grade = "A"
            grade_label = "High Quality • Minor Warnings"
        elif dqs_score >= 75.0:
            quality_grade = "B"
            grade_label = "Acceptable • Action Recommended"
        elif dqs_score >= 60.0:
            quality_grade = "C"
            grade_label = "Degraded Quality • Ingestion Issues"
        else:
            quality_grade = "D"
            grade_label = "Critical Pipeline Quality Failure"

        # Latency statistics
        avg_spark_lat = round(sum(spark_latencies) / len(spark_latencies), 2) if spark_latencies else 0.0
        avg_e2e_lat = round(sum(e2e_latencies) / len(e2e_latencies), 2) if e2e_latencies else 0.0

        # Update persistent issue history
        state = _load_quality_state()
        state["total_audits_performed"] = state.get("total_audits_performed", 0) + 1
        state["last_audit_time"] = datetime.now(timezone.utc).isoformat()
        
        # Deduplicate and append new issues (preserve up to 300 most recent issues)
        existing_issue_ids = {iss.get("id") for iss in state.get("issues_history", [])}
        for iss in new_detected_issues:
            if iss["id"] not in existing_issue_ids:
                state["issues_history"].append(iss)
        
        # Sort issues newest first and truncate to 300
        state["issues_history"] = state["issues_history"][-300:]
        _save_quality_state(state)

        # Build Responses
        summary_payload = {
            "dqs_score": dqs_score,
            "quality_grade": quality_grade,
            "grade_label": grade_label,
            "audit_scope": sample_scope_label,
            "metric_type": "Project-Defined Experimental Quality Index (Non-certified)",
            "disclaimer": "Evaluated exclusively over the latest 50 HDFS streaming observations. Not a certified industrial quality index or a claim regarding historical data completeness.",
            "total_records_audited": total_records,
            "missing_cells_count": total_missing_cells,
            "missing_rate_percentage": missing_rate_pct,
            "duplicate_observations_count": dup_obs_count,
            "duplicate_ingestions_count": dup_ing_count,
            "invalid_measurements_count": total_invalid_metrics,
            "timestamp_anomalies_count": timestamp_anomalies_count,
            "average_completeness_percentage": avg_completeness,
            "stream_freshness_seconds": freshness_seconds,
            "stream_freshness_status": freshness_status,
            "penalties": {
                "missing": round(p_missing, 1),
                "duplicates": round(p_duplicates, 1),
                "invalid": round(p_invalid, 1),
                "timestamp": round(p_timestamp, 1),
                "completeness": round(p_completeness, 1),
                "freshness": round(p_freshness, 1),
                "total_deducted": round(total_penalty, 1)
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        metrics_payload = {
            "audit_scope": sample_scope_label,
            "field_missing_counts": field_missing_counts,
            "field_invalid_counts": field_invalid_counts,
            "city_completeness": city_completeness,
            "duplicate_breakdown": {
                "duplicate_observations": dup_obs_count,
                "duplicate_ingestion_events": dup_ing_count
            },
            "latency": {
                "avg_spark_processing_seconds": avg_spark_lat,
                "avg_end_to_end_seconds": avg_e2e_lat,
                "samples_computed": len(spark_latencies)
            },
            "validation_bounds": METRIC_BOUNDS,
            "valid_weather_conditions": sorted(list(VALID_CONDITIONS)),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Pipeline Health Hop-by-Hop Telemetry
        eco = ecosystem.get_ecosystem_status(force_fresh=False)
        kafka_meta = eco.get("kafka", {})
        hdfs_meta = eco.get("hdfs", {})
        spark_meta = eco.get("spark", {})
        producer_pid = producer_svc.get_producer_pid()
        producer_tel = producer_svc.get_producer_telemetry()

        pipeline_payload = {
            "hops": [
                {
                    "step": 1,
                    "name": "Live Weather Producer",
                    "type": "Data Ingestion Source",
                    "status": "Running" if producer_pid else "Stopped",
                    "pid": producer_pid,
                    "target_topic": "weather_stream",
                    "interval_sec": 60.0,
                    "last_fetch": producer_tel.get("last_weather_fetch") if producer_tel else None,
                    "last_publish": producer_tel.get("last_kafka_publish") if producer_tel else None,
                    "last_city": producer_tel.get("last_city_published") if producer_tel else None
                },
                {
                    "step": 2,
                    "name": "Apache Kafka (KRaft)",
                    "type": "Distributed Event Broker",
                    "status": kafka_meta.get("status", "Unknown"),
                    "broker": f"localhost:{ecosystem.KAFKA_PORT}",
                    "topic": "weather_stream",
                    "total_messages": kafka_meta.get("metrics", {}).get("total_messages", 0),
                    "partitions": kafka_meta.get("metrics", {}).get("partitions", {})
                },
                {
                    "step": 3,
                    "name": "Apache Spark Structured Streaming",
                    "type": "Micro-Batch Stream Processing",
                    "status": spark_meta.get("status", "Unknown"),
                    "trigger_interval": "5 seconds",
                    "app_id": spark_meta.get("metrics", {}).get("app_id"),
                    "avg_microbatch_latency_sec": avg_spark_lat
                },
                {
                    "step": 4,
                    "name": "Hadoop HDFS Storage",
                    "type": "Distributed Parquet Sink",
                    "status": hdfs_meta.get("status", "Unknown"),
                    "path": "/weather/streaming/raw",
                    "total_storage_formatted": hdfs_meta.get("metrics", {}).get("total_storage_formatted", "N/A"),
                    "used_storage_formatted": hdfs_meta.get("metrics", {}).get("used_storage_formatted", "N/A"),
                    "live_datanodes": hdfs_meta.get("metrics", {}).get("live_datanodes", 0)
                }
            ],
            "overall_pipeline_healthy": bool(producer_pid and kafka_meta.get("status") in ["Running", "Available"] and hdfs_meta.get("status") == "Running"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Cache results
        _AUDIT_CACHE["summary"] = summary_payload
        _AUDIT_CACHE["metrics"] = metrics_payload
        _AUDIT_CACHE["pipeline"] = pipeline_payload
        _AUDIT_CACHE["timestamp"] = now_epoch

        return summary_payload, metrics_payload, pipeline_payload

def get_quality_summary():
    s, _, _ = run_quality_audit()
    return s

def get_quality_metrics():
    _, m, _ = run_quality_audit()
    return m

def get_quality_pipeline():
    _, _, p = run_quality_audit()
    return p

def get_quality_issues(page=1, page_size=20, severity=None, city=None, rule=None):
    """Return paginated, filterable quality issue audit log."""
    run_quality_audit()  # Ensure state is fresh
    state = _load_quality_state()
    issues = state.get("issues_history", [])
    
    # Newest issues first
    filtered = list(reversed(issues))

    if severity and severity != 'All':
        filtered = [iss for iss in filtered if iss.get('severity', '').lower() == severity.lower()]
    if city and city != 'All':
        filtered = [iss for iss in filtered if iss.get('city', '').lower() == city.lower()]
    if rule and rule != 'All':
        filtered = [iss for iss in filtered if iss.get('rule', '').lower() == rule.lower()]

    total_items = len(filtered)
    total_pages = max(1, math.ceil(total_items / page_size)) if page_size > 0 else 1
    page = max(1, min(page, total_pages))
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_items = filtered[start_idx:end_idx]

    return {
        "items": page_items,
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages
    }
