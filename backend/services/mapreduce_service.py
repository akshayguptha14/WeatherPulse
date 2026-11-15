import subprocess
import time

CACHE = None
CACHE_TIMESTAMP = 0
CACHE_TTL = 300  # 5 minutes

def get_mapreduce_stats():
    global CACHE, CACHE_TIMESTAMP
    current_time = time.time()
    
    if CACHE is not None and (current_time - CACHE_TIMESTAMP < CACHE_TTL):
        return CACHE

    cmd = "source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh && hdfs dfs -cat /weather/mapreduce/city_weather_stats/part-r-*"
    
    try:
        result = subprocess.run(
            ['wsl', 'bash', '-c', cmd],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            parsed_data = []
            
            for line in lines:
                if not line.strip(): continue
                # The format is: City\trecords avg_temp min_temp max_temp avg_humidity total_rainfall avg_wind_speed max_wind_speed avg_pressure
                parts = line.split('\t')
                if len(parts) != 2:
                    continue
                
                city = parts[0].strip()
                if city.lower() == 'city': continue  # Skip header if any
                
                stats = parts[1].strip().split(' ')
                if len(stats) >= 9:
                    try:
                        parsed_data.append({
                            "city": city,
                            "records": int(stats[0]),
                            "avg_temperature": float(stats[1]),
                            "min_temperature": float(stats[2]),
                            "max_temperature": float(stats[3]),
                            "avg_humidity": float(stats[4]),
                            "total_rainfall": float(stats[5]),
                            "avg_wind_speed": float(stats[6]),
                            "max_wind_speed": float(stats[7]),
                            "avg_pressure": float(stats[8])
                        })
                    except ValueError:
                        pass
                        
            if parsed_data:
                CACHE = parsed_data
                CACHE_TIMESTAMP = current_time
                return CACHE
    except Exception as e:
        print("Exception reading MapReduce output:", e)
        
    return None
