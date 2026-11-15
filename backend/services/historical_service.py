import subprocess
import time
import os
import io
import csv
from datetime import datetime
import services.mapreduce_service as mr
import services.hive_service as hive

# In-memory cache for expensive distributed queries (300 seconds TTL)
CACHE = {
    "daily_trends": {"data": None, "timestamp": 0},
    "conditions": {"data": None, "timestamp": 0},
    "extremes": {"data": None, "timestamp": 0},
    "raw_records": {"data": None, "timestamp": 0}
}
CACHE_TTL = 300  # 5 minutes

HDFS_RAW_PATH = "/weather/raw/sample_weather_data.csv"
HIVE_SCRIPTS_DIR = "/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/hadoop_jobs/Hive/scripts"

def get_raw_historical_records(city=None, start_date=None, end_date=None):
    """
    Reads genuine historical weather observations from HDFS raw table (/weather/raw/sample_weather_data.csv).
    This dataset backs the Hive weather_data external table.
    Filters by city, start_date (YYYY-MM-DD), and end_date (YYYY-MM-DD).
    Missing values are preserved as None (null).
    """
    global CACHE
    now = time.time()
    
    # Check cache for base dataset
    records = None
    if CACHE["raw_records"]["data"] and (now - CACHE["raw_records"]["timestamp"] < CACHE_TTL):
        records = CACHE["raw_records"]["data"]
    else:
        cmd = f"source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh && hdfs dfs -cat {HDFS_RAW_PATH}"
        try:
            res = subprocess.run(['wsl', 'bash', '-c', cmd], capture_output=True, text=True, timeout=15)
            if res.returncode == 0 and res.stdout.strip():
                lines = res.stdout.strip().splitlines()
                reader = csv.reader(lines)
                header = next(reader, None)
                
                parsed = []
                for row in reader:
                    if not row or len(row) < 8:
                        continue
                    # timestamp,city,temperature,humidity,rainfall,wind_speed,pressure,weather_condition
                    ts_val = row[0].strip()
                    city_val = row[1].strip()
                    if city_val.lower() == 'city':
                        continue
                        
                    def parse_num(v):
                        try:
                            return float(v.strip())
                        except (ValueError, TypeError):
                            return None

                    parsed.append({
                        "timestamp": ts_val,
                        "date": ts_val[:10] if len(ts_val) >= 10 else ts_val,
                        "city": city_val,
                        "temperature": parse_num(row[2]),
                        "humidity": parse_num(row[3]),
                        "rainfall": parse_num(row[4]),
                        "wind_speed": parse_num(row[5]),
                        "pressure": parse_num(row[6]),
                        "weather_condition": row[7].strip() if len(row) > 7 and row[7].strip() else None
                    })
                
                CACHE["raw_records"]["data"] = parsed
                CACHE["raw_records"]["timestamp"] = now
                records = parsed
        except Exception as e:
            print("Exception reading raw records from HDFS:", e)
            if CACHE["raw_records"]["data"]:
                records = CACHE["raw_records"]["data"]

    if records is None:
        return []

    # Apply filters
    filtered = records
    if city and city.lower() != 'all':
        filtered = [r for r in filtered if r["city"].lower() == city.lower()]
    if start_date:
        filtered = [r for r in filtered if r["date"] >= start_date]
    if end_date:
        filtered = [r for r in filtered if r["date"] <= end_date]

    return filtered

def get_daily_trends(city=None, start_date=None, end_date=None):
    """
    Computes or retrieves daily aggregated historical weather trends from Hive.
    Query: 11_daily_trends.hql
    Grouped by calendar date (YYYY-MM-DD) and city.
    Cached for 300 seconds.
    """
    global CACHE
    now = time.time()
    trends = None

    if CACHE["daily_trends"]["data"] and (now - CACHE["daily_trends"]["timestamp"] < CACHE_TTL):
        trends = CACHE["daily_trends"]["data"]
    else:
        # Execute Hive query via beeline
        query = """
        USE weather_climate;
        SELECT 
            substr(`timestamp`, 1, 10) as date_val,
            city,
            COUNT(*) as records,
            ROUND(AVG(temperature), 2) as avg_temp,
            ROUND(MIN(temperature), 2) as min_temp,
            ROUND(MAX(temperature), 2) as max_temp,
            ROUND(AVG(humidity), 2) as avg_humidity,
            ROUND(SUM(rainfall), 2) as total_rainfall,
            ROUND(AVG(wind_speed), 2) as avg_wind_speed,
            ROUND(MAX(wind_speed), 2) as max_wind_speed,
            ROUND(AVG(pressure), 2) as avg_pressure
        FROM weather_data
        WHERE city != 'city'
        GROUP BY substr(`timestamp`, 1, 10), city
        ORDER BY date_val ASC, city ASC;
        """
        raw_data = hive.run_hive_query(query)
        if raw_data:
            parsed = []
            for row in raw_data:
                if len(row) >= 11 and row[0].lower() != 'date_val':
                    def parse_val(v):
                        try:
                            return float(v)
                        except (ValueError, TypeError):
                            return None

                    def parse_int(v):
                        try:
                            return int(v)
                        except (ValueError, TypeError):
                            return 0

                    parsed.append({
                        "date": row[0],
                        "city": row[1],
                        "records": parse_int(row[2]),
                        "avg_temperature": parse_val(row[3]),
                        "min_temperature": parse_val(row[4]),
                        "max_temperature": parse_val(row[5]),
                        "avg_humidity": parse_val(row[6]),
                        "total_rainfall": parse_val(row[7]),
                        "avg_wind_speed": parse_val(row[8]),
                        "max_wind_speed": parse_val(row[9]),
                        "avg_pressure": parse_val(row[10])
                    })
            if parsed:
                CACHE["daily_trends"]["data"] = parsed
                CACHE["daily_trends"]["timestamp"] = now
                trends = parsed

    # Fallback to authentic calculation on HDFS raw records if Hive query was unreachable
    if trends is None:
        raw = get_raw_historical_records()
        if raw:
            # Group by date and city
            grouped = {}
            for r in raw:
                key = (r["date"], r["city"])
                if key not in grouped:
                    grouped[key] = []
                grouped[key].append(r)

            parsed = []
            for (dt, c), items in sorted(grouped.items()):
                cnt = len(items)
                temps = [x["temperature"] for x in items if x["temperature"] is not None]
                hums = [x["humidity"] for x in items if x["humidity"] is not None]
                rains = [x["rainfall"] for x in items if x["rainfall"] is not None]
                winds = [x["wind_speed"] for x in items if x["wind_speed"] is not None]
                press = [x["pressure"] for x in items if x["pressure"] is not None]

                parsed.append({
                    "date": dt,
                    "city": c,
                    "records": cnt,
                    "avg_temperature": round(sum(temps) / len(temps), 2) if temps else None,
                    "min_temperature": min(temps) if temps else None,
                    "max_temperature": max(temps) if temps else None,
                    "avg_humidity": round(sum(hums) / len(hums), 2) if hums else None,
                    "total_rainfall": round(sum(rains), 2) if rains else None,
                    "avg_wind_speed": round(sum(winds) / len(winds), 2) if winds else None,
                    "max_wind_speed": max(winds) if winds else None,
                    "avg_pressure": round(sum(press) / len(press), 2) if press else None
                })
            CACHE["daily_trends"]["data"] = parsed
            CACHE["daily_trends"]["timestamp"] = now
            trends = parsed
        else:
            trends = []

    # Apply filters
    filtered = trends
    if city and city.lower() != 'all':
        filtered = [t for t in filtered if t["city"].lower() == city.lower()]
    if start_date:
        filtered = [t for t in filtered if t["date"] >= start_date]
    if end_date:
        filtered = [t for t in filtered if t["date"] <= end_date]

    return filtered

def get_weather_conditions_distribution():
    """
    Returns weather condition frequency distribution computed by Hive 09_weather_conditions.hql.
    Cached for 300 seconds.
    """
    global CACHE
    now = time.time()
    
    if CACHE["conditions"]["data"] and (now - CACHE["conditions"]["timestamp"] < CACHE_TTL):
        return CACHE["conditions"]["data"]

    query = """
    USE weather_climate;
    SELECT weather_condition, COUNT(*) as condition_count 
    FROM weather_data 
    WHERE city != 'city' AND weather_condition IS NOT NULL
    GROUP BY weather_condition 
    ORDER BY condition_count DESC;
    """
    raw_data = hive.run_hive_query(query)
    conditions = []
    if raw_data:
        for row in raw_data:
            if len(row) >= 2 and row[0].lower() != 'weather_condition':
                try:
                    conditions.append({
                        "condition": row[0],
                        "weather_condition": row[0],
                        "count": int(row[1])
                    })
                except ValueError:
                    pass

    # Fallback to counting genuine raw records from HDFS
    if not conditions:
        records = get_raw_historical_records()
        from collections import Counter
        counts = Counter(r["weather_condition"] for r in records if r["weather_condition"])
        conditions = [{"condition": k, "weather_condition": k, "count": v} for k, v in counts.most_common()]

    if conditions:
        CACHE["conditions"]["data"] = conditions
        CACHE["conditions"]["timestamp"] = now

    return conditions

def get_extreme_weather_records():
    """
    Returns notable historical records based on extreme condition thresholds (Hive 10_extreme_weather.hql):
    - Temperature >= 40.0 °C (Extreme Heat)
    - Rainfall >= 20.0 mm (Heavy Rainfall)
    - Wind Speed >= 20.0 km/h (Strong Wind)
    Cached for 300 seconds.
    """
    global CACHE
    now = time.time()

    if CACHE["extremes"]["data"] and (now - CACHE["extremes"]["timestamp"] < CACHE_TTL):
        return CACHE["extremes"]["data"]

    query = """
    USE weather_climate;
    SELECT 
        `timestamp`, 
        city, 
        temperature, 
        humidity, 
        rainfall, 
        wind_speed, 
        pressure,
        weather_condition 
    FROM weather_data 
    WHERE city != 'city'
      AND (temperature >= 40.0 OR rainfall >= 20.0 OR wind_speed >= 20.0)
    ORDER BY `timestamp` DESC;
    """
    raw_data = hive.run_hive_query(query)
    extremes = []
    if raw_data:
        for row in raw_data:
            if len(row) >= 8 and row[0].lower() != 'timestamp':
                try:
                    extremes.append({
                        "timestamp": row[0],
                        "date": row[0][:10],
                        "city": row[1],
                        "temperature": float(row[2]) if row[2] != 'NULL' else None,
                        "humidity": float(row[3]) if row[3] != 'NULL' else None,
                        "rainfall": float(row[4]) if row[4] != 'NULL' else None,
                        "wind_speed": float(row[5]) if row[5] != 'NULL' else None,
                        "pressure": float(row[6]) if row[6] != 'NULL' else None,
                        "weather_condition": row[7] if len(row) > 7 else None
                    })
                except (ValueError, TypeError):
                    pass

    # Fallback to filtering raw records
    if not extremes:
        records = get_raw_historical_records()
        for r in records:
            t = r.get("temperature") or 0
            rn = r.get("rainfall") or 0
            w = r.get("wind_speed") or 0
            if t >= 40.0 or rn >= 20.0 or w >= 20.0:
                extremes.append(r)
        extremes.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    if extremes:
        CACHE["extremes"]["data"] = extremes
        CACHE["extremes"]["timestamp"] = now

    return extremes

def generate_csv_report(dataset_type='summary', city=None, start_date=None, end_date=None):
    """
    Generates authentic downloadable CSV reports from genuine MapReduce, Hive, and HDFS datasets.
    Supported types:
    - 'summary': City Aggregate Statistics (MapReduce)
    - 'daily': Daily Weather Trends (Hive)
    - 'raw': Raw Historical Weather Observations (HDFS Table)
    - 'extremes': Notable Extreme Climate Events (Hive)
    """
    output = io.StringIO()
    writer = csv.writer(output, lineterminator='\r\n')

    if dataset_type == 'summary':
        # City aggregates from MapReduce
        stats = mr.get_mapreduce_stats() or []
        writer.writerow([
            "City", "Records", "Avg Temperature (C)", "Min Temperature (C)", "Max Temperature (C)",
            "Avg Humidity (%)", "Total Rainfall (mm)", "Avg Wind Speed (km/h)", "Max Wind Speed (km/h)",
            "Avg Atmospheric Pressure (hPa)"
        ])
        for r in stats:
            if city and city.lower() != 'all' and r.get("city", "").lower() != city.lower():
                continue
            writer.writerow([
                r.get("city"),
                r.get("records"),
                r.get("avg_temperature"),
                r.get("min_temperature"),
                r.get("max_temperature"),
                r.get("avg_humidity"),
                r.get("total_rainfall"),
                r.get("avg_wind_speed"),
                r.get("max_wind_speed"),
                r.get("avg_pressure")
            ])

    elif dataset_type == 'daily':
        # Daily trends from Hive
        trends = get_daily_trends(city=city, start_date=start_date, end_date=end_date)
        writer.writerow([
            "Date", "City", "Observations", "Avg Temperature (C)", "Min Temperature (C)", "Max Temperature (C)",
            "Avg Humidity (%)", "Total Rainfall (mm)", "Avg Wind Speed (km/h)", "Max Wind Speed (km/h)",
            "Avg Atmospheric Pressure (hPa)"
        ])
        for t in trends:
            writer.writerow([
                t.get("date"),
                t.get("city"),
                t.get("records"),
                t.get("avg_temperature"),
                t.get("min_temperature"),
                t.get("max_temperature"),
                t.get("avg_humidity"),
                t.get("total_rainfall"),
                t.get("avg_wind_speed"),
                t.get("max_wind_speed"),
                t.get("avg_pressure")
            ])

    elif dataset_type == 'extremes':
        # Extreme events from Hive
        extremes = get_extreme_weather_records()
        writer.writerow([
            "Timestamp (UTC)", "City", "Temperature (C)", "Humidity (%)", "Rainfall (mm)",
            "Wind Speed (km/h)", "Pressure (hPa)", "Condition"
        ])
        for ex in extremes:
            if city and city.lower() != 'all' and ex.get("city", "").lower() != city.lower():
                continue
            if start_date and ex.get("date", "") < start_date:
                continue
            if end_date and ex.get("date", "") > end_date:
                continue
            writer.writerow([
                ex.get("timestamp"),
                ex.get("city"),
                ex.get("temperature"),
                ex.get("humidity"),
                ex.get("rainfall"),
                ex.get("wind_speed"),
                ex.get("pressure"),
                ex.get("weather_condition")
            ])

    else:
        # Raw records from HDFS table
        raw = get_raw_historical_records(city=city, start_date=start_date, end_date=end_date)
        writer.writerow([
            "Timestamp (UTC)", "City", "Temperature (C)", "Humidity (%)", "Rainfall (mm)",
            "Wind Speed (km/h)", "Pressure (hPa)", "Weather Condition"
        ])
        for r in raw:
            writer.writerow([
                r.get("timestamp"),
                r.get("city"),
                r.get("temperature"),
                r.get("humidity"),
                r.get("rainfall"),
                r.get("wind_speed"),
                r.get("pressure"),
                r.get("weather_condition")
            ])

    return output.getvalue()
