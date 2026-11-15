import subprocess
import time
import json
import os

# Simple in-memory cache
CACHE = {}
CACHE_TTL = 300  # 5 minutes

def run_hive_query(query):
    # Check cache
    if query in CACHE:
        cached_data, timestamp = CACHE[query]
        if time.time() - timestamp < CACHE_TTL:
            return cached_data

    # Write query to a temporary file to avoid bash quoting/escaping issues
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
        f.write(query)
        temp_file_path = f.name
        
    # Convert Windows path to WSL path
    wsl_path = temp_file_path.replace('\\', '/').replace('C:', '/mnt/c')

    # We use beeline since Hive 4.0 proxy CLI prevents -e usage
    cmd = f"source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hive/env.sh && beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 --showHeader=false -f {wsl_path}"
    
    try:
        result = subprocess.run(
            ['wsl', 'bash', '-c', cmd],
            capture_output=True,
            text=True,
            timeout=600
        )
        os.remove(temp_file_path)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            
            # Filter out beeline Log4j/SLF4J spam that might leak into stdout
            clean_lines = []
            for line in lines:
                if not line.strip(): continue
                if " main INFO " in line or " main WARN " in line: continue
                if "SLF4J" in line or "package scanning" in line or "packages" in line or "logging.apache.org" in line: continue
                if "org.apache.logging" in line: continue
                clean_lines.append(line)

            data = [line.split('\t') for line in clean_lines]
            CACHE[query] = (data, time.time())
            return data
        else:
            print("Hive Error:", result.stderr)
            return None
    except Exception as e:
        print("Exception running Hive:", e)
        return None

def get_summary():
    query = """
    USE weather_climate;
    SELECT 
        COUNT(*), 
        COUNT(DISTINCT city), 
        ROUND(AVG(temperature), 2), 
        ROUND(AVG(humidity), 2), 
        ROUND(SUM(rainfall), 2), 
        ROUND(AVG(wind_speed), 2)
    FROM weather_data
    WHERE city != 'city';
    """
    data = run_hive_query(query)
    if data and len(data) > 0 and len(data[0]) == 6:
        row = data[0]
        return {
            "total_records": int(row[0]),
            "cities_monitored": int(row[1]),
            "average_temperature": float(row[2]),
            "average_humidity": float(row[3]),
            "total_rainfall": float(row[4]),
            "average_wind_speed": float(row[5])
        }
    return None

def get_cities():
    query = """
    USE weather_climate;
    SELECT 
        city, 
        COUNT(*) as records, 
        ROUND(AVG(temperature), 2), 
        ROUND(MIN(temperature), 2), 
        ROUND(MAX(temperature), 2), 
        ROUND(AVG(humidity), 2), 
        ROUND(SUM(rainfall), 2), 
        ROUND(AVG(wind_speed), 2), 
        ROUND(MAX(wind_speed), 2), 
        ROUND(AVG(pressure), 2)
    FROM weather_data 
    WHERE city != 'city'
    GROUP BY city 
    ORDER BY city;
    """
    data = run_hive_query(query)
    cities = []
    if data:
        for row in data:
            if len(row) == 10:
                cities.append({
                    "city": row[0],
                    "records": int(row[1]),
                    "avg_temperature": float(row[2]),
                    "min_temperature": float(row[3]),
                    "max_temperature": float(row[4]),
                    "avg_humidity": float(row[5]),
                    "total_rainfall": float(row[6]),
                    "avg_wind_speed": float(row[7]),
                    "max_wind_speed": float(row[8]),
                    "avg_pressure": float(row[9])
                })
    return cities

def get_historical_all():
    query = """
    USE weather_climate;
    SELECT 
        `timestamp`, city, temperature, humidity, rainfall, wind_speed, pressure, weather_condition
    FROM weather_data
    WHERE city != 'city'
    ORDER BY `timestamp` ASC;
    """
    data = run_hive_query(query)
    records = []
    if data:
        for row in data:
            if len(row) == 8:
                records.append({
                    "timestamp": row[0],
                    "city": row[1],
                    "temperature": float(row[2]),
                    "humidity": float(row[3]),
                    "rainfall": float(row[4]),
                    "wind_speed": float(row[5]),
                    "pressure": float(row[6]),
                    "weather_condition": row[7]
                })
    return records
