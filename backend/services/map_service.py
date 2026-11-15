"""
Map Service for Interactive India Weather Map.
Enriches the 5 monitored Indian cities with geographic coordinates, elevation,
live streaming telemetry, Phase 4 alert severities, and MapReduce historical baselines.
"""

import time
import os
from datetime import datetime, timezone
import services.streaming_service as streaming
import services.mapreduce_service as mr
import services.alert_service as alert_svc

_MAP_CACHE = {"data": None, "timestamp": 0.0}
CACHE_TTL = 15.0

# Exact verified geographic metadata for the 5 monitored cities
CITIES_GEO = {
    "Bengaluru": {
        "city": "Bengaluru",
        "state": "Karnataka",
        "coordinates": {"lat": 12.9716, "lon": 77.5946},
        "elevation_meters": 920,
        "climate_zone": "Tropical Savanna / Deccan Plateau",
        "nominal_surface_pressure": 914.0
    },
    "Chennai": {
        "city": "Chennai",
        "state": "Tamil Nadu",
        "coordinates": {"lat": 13.0827, "lon": 80.2707},
        "elevation_meters": 7,
        "climate_zone": "Tropical Wet & Dry / Coromandel Coast",
        "nominal_surface_pressure": 1012.0
    },
    "Delhi": {
        "city": "Delhi",
        "state": "National Capital Region",
        "coordinates": {"lat": 28.6139, "lon": 77.2090},
        "elevation_meters": 216,
        "climate_zone": "Monsoon-influenced Subtropical / Indo-Gangetic Plain",
        "nominal_surface_pressure": 990.0
    },
    "Hyderabad": {
        "city": "Hyderabad",
        "state": "Telangana",
        "coordinates": {"lat": 17.3850, "lon": 78.4867},
        "elevation_meters": 542,
        "climate_zone": "Semi-Arid / Deccan Plateau",
        "nominal_surface_pressure": 957.0
    },
    "Mumbai": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "coordinates": {"lat": 19.0760, "lon": 72.8777},
        "elevation_meters": 14,
        "climate_zone": "Tropical Monsoon / Konkan Coast",
        "nominal_surface_pressure": 1012.0
    }
}

SEVERITY_WEIGHTS = {
    "Critical": 4,
    "High": 3,
    "Moderate": 2,
    "Low": 1,
    "Normal": 0
}

def get_map_cities(force_fresh=False):
    """
    Returns consolidated geo-located weather objects for Bengaluru, Chennai, Delhi, Hyderabad, and Mumbai.
    Includes live weather metrics, MapReduce baseline variance, active alert severity, and provenance timestamps.
    """
    global _MAP_CACHE
    now = time.time()

    if not force_fresh and _MAP_CACHE["data"] and (now - _MAP_CACHE["timestamp"] < CACHE_TTL):
        return _MAP_CACHE["data"]

    # 1. Fetch newest live streaming records
    stream_records = streaming.get_recent_stream() or []
    latest_live_by_city = {}
    for rec in stream_records:
        city = rec.get("city")
        if city in CITIES_GEO and city not in latest_live_by_city:
            latest_live_by_city[city] = rec

    # 2. Fetch MapReduce historical baselines
    mr_stats = mr.get_mapreduce_stats() or []
    baselines_by_city = {r.get("city"): r for r in mr_stats if r.get("city")}

    # Fallback default historical averages if MapReduce is cold
    default_baselines = {
        "Bengaluru": {"avg_temperature": 29.8, "avg_humidity": 65.0, "avg_wind_speed": 12.0},
        "Chennai": {"avg_temperature": 31.0, "avg_humidity": 74.0, "avg_wind_speed": 14.0},
        "Delhi": {"avg_temperature": 30.5, "avg_humidity": 56.0, "avg_wind_speed": 10.0},
        "Hyderabad": {"avg_temperature": 30.2, "avg_humidity": 61.0, "avg_wind_speed": 11.0},
        "Mumbai": {"avg_temperature": 30.8, "avg_humidity": 72.0, "avg_wind_speed": 15.0}
    }

    # 3. Fetch active alerts from Phase 4 alert engine
    all_active_alerts = alert_svc.get_active_alerts() or []
    alerts_by_city = {city: [] for city in CITIES_GEO}
    for alt in all_active_alerts:
        city = alt.get("city")
        if city in alerts_by_city:
            alerts_by_city[city].append(alt)

    # 4. Construct rich geo response
    city_nodes = []
    for city_name, geo in CITIES_GEO.items():
        live_rec = latest_live_by_city.get(city_name, {})
        base_rec = baselines_by_city.get(city_name, default_baselines.get(city_name, {}))
        city_alerts = alerts_by_city.get(city_name, [])

        # Determine highest alert severity
        highest_sev = "Normal"
        max_wt = 0
        for alt in city_alerts:
            sev = alt.get("severity", "Normal")
            wt = SEVERITY_WEIGHTS.get(sev, 0)
            if wt > max_wt:
                max_wt = wt
                highest_sev = sev

        # Live values (preserving None if missing)
        live_temp = live_rec.get("temperature")
        live_hum = live_rec.get("humidity")
        live_rain = live_rec.get("rainfall")
        live_wind = live_rec.get("wind_speed")
        live_press = live_rec.get("pressure")
        live_cond = live_rec.get("weather_condition", "Unknown")

        # Baseline values
        base_temp = base_rec.get("avg_temperature")
        base_hum = base_rec.get("avg_humidity")
        nom_press = geo["nominal_surface_pressure"]

        # Calculate exact variance (Live - Baseline)
        temp_variance = round(live_temp - base_temp, 2) if (live_temp is not None and base_temp is not None) else None
        hum_variance = round(live_hum - base_hum, 2) if (live_hum is not None and base_hum is not None) else None
        press_variance = round(live_press - nom_press, 2) if (live_press is not None and nom_press is not None) else None

        node = {
            "city": city_name,
            "state": geo["state"],
            "coordinates": geo["coordinates"],
            "elevation_meters": geo["elevation_meters"],
            "climate_zone": geo["climate_zone"],
            "live": {
                "temperature": live_temp,
                "humidity": live_hum,
                "rainfall": live_rain,
                "wind_speed": live_wind,
                "pressure": live_press,
                "weather_condition": live_cond,
                "source_timestamp": live_rec.get("source_timestamp"),
                "ingest_timestamp": live_rec.get("ingest_timestamp"),
                "spark_processing_timestamp": live_rec.get("spark_processing_timestamp")
            },
            "baseline": {
                "avg_temperature": base_temp,
                "avg_humidity": base_hum,
                "nominal_surface_pressure": nom_press
            },
            "variance": {
                "temperature_difference": temp_variance,
                "humidity_difference": hum_variance,
                "pressure_difference": press_variance
            },
            "alert_status": {
                "highest_severity": highest_sev,
                "active_alert_count": len(city_alerts),
                "alerts": [
                    {
                        "id": a.get("id"),
                        "rule_id": a.get("rule_id"),
                        "title": a.get("title"),
                        "severity": a.get("severity"),
                        "message": a.get("message"),
                        "status": a.get("status")
                    } for a in city_alerts
                ]
            },
            "provenance": {
                "source": "Open-Meteo Live API",
                "transport": "Kafka topic 'weather_stream' (localhost:9092)",
                "processing": "Apache Spark Structured Streaming",
                "storage": "Hadoop HDFS /weather/streaming/raw"
            }
        }
        city_nodes.append(node)

    result = {
        "cities": city_nodes,
        "count": len(city_nodes),
        "map_center": {"lat": 21.5, "lon": 78.9},
        "default_zoom": 5,
        "bounds": {
            "south_west": [6.5, 66.0],
            "north_east": [37.5, 99.0]
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    _MAP_CACHE["data"] = result
    _MAP_CACHE["timestamp"] = now
    return result
