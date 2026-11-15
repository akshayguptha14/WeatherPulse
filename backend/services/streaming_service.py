import subprocess
import os
import shutil
import pandas as pd
import tempfile
import time

CACHE = {"data": [], "timestamp": 0}
CACHE_TTL = 15  # 15 seconds, aligned with frontend polling cadence

def get_recent_stream():
    global CACHE
    now = time.time()
    if CACHE["data"] and (now - CACHE["timestamp"] < CACHE_TTL):
        return CACHE["data"]

    temp_dir = tempfile.mkdtemp()
    try:
        # Check active versioned streaming path first, falling back cleanly to /weather/streaming/raw
        active_path = "/weather/streaming/raw_v5"
        fallback_path = "/weather/streaming/raw"
        
        # Convert backslashes to forward slashes for bash to avoid escape issues
        temp_dir_fwd = temp_dir.replace('\\', '/')
        
        # 1. Get list of files (prefers active v5 sink, gracefully falls back to raw if v5 has no files)
        env_cmd = "source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh && "
        ls_cmd = env_cmd + f"hdfs dfs -ls -t {active_path} | grep '\\.parquet$'"
        ls_res = subprocess.run(['wsl', 'bash', '-c', ls_cmd], capture_output=True, text=True, timeout=20)
        
        if ls_res.returncode != 0 or not ls_res.stdout.strip():
            ls_cmd = env_cmd + f"hdfs dfs -ls -t {fallback_path} | grep '\\.parquet$'"
            ls_res = subprocess.run(['wsl', 'bash', '-c', ls_cmd], capture_output=True, text=True, timeout=20)
        
        ls_res = subprocess.run(['wsl', 'bash', '-c', ls_cmd], capture_output=True, text=True, timeout=20)
        
        if ls_res.returncode == 0:
            lines = ls_res.stdout.strip().split('\n')
            # Get top 10 newest files
            files_to_copy = []
            for line in lines[:10]:
                parts = line.split()
                if len(parts) >= 8:
                    files_to_copy.append(parts[7])
            
            if files_to_copy:
                # 2. Copy files locally
                subprocess.run(['wsl', 'bash', '-c', env_cmd + "rm -rf /tmp/hdfs_copy && mkdir -p /tmp/hdfs_copy"], capture_output=True, timeout=20)
                
                # Copy all files at once
                files_str = " ".join(files_to_copy)
                subprocess.run(['wsl', 'bash', '-c', env_cmd + f"hdfs dfs -copyToLocal -f {files_str} /tmp/hdfs_copy/"], capture_output=True, timeout=60)
                
                # 3. Move to Windows temp dir
                subprocess.run(['wsl', 'bash', '-c', f"cp -r /tmp/hdfs_copy/* $(wslpath '{temp_dir_fwd}')/"], capture_output=True, timeout=20)
        else:
            if "No such file or directory" not in ls_res.stderr:
                print("Error listing HDFS:", ls_res.stderr)
            # If the directory doesn't exist, it means streaming hasn't started yet.
            pass

        # 2. Read with pandas
        # We only care about .parquet files
        all_records = []
        for file in os.listdir(temp_dir):
            if file.endswith('.parquet'):
                filepath = os.path.join(temp_dir, file)
                df = pd.read_parquet(filepath)
                # Convert DataFrame to dictionary
                records = df.to_dict('records')
                all_records.extend(records)
        
        # 3. Sort by spark_processing_timestamp descending
        if all_records:
            all_records.sort(key=lambda x: x.get('spark_processing_timestamp', ''), reverse=True)
            # Limit to recent 50 records
            all_records = all_records[:50]
            
            # Clean records: convert Timestamps to ISO strings, and convert NaNs to None (JSON null)
            for r in all_records:
                for k, v in list(r.items()):
                    if pd.isna(v):
                        r[k] = None
                    elif pd.api.types.is_datetime64_any_dtype(type(v)) or isinstance(v, pd.Timestamp):
                        r[k] = str(v)

            CACHE["data"] = all_records
            CACHE["timestamp"] = time.time()
            return all_records

    except Exception as e:
        print("Error reading streaming data:", e)
        if CACHE["data"]:
            return CACHE["data"]
        return []
    finally:
        # Cleanup temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)
