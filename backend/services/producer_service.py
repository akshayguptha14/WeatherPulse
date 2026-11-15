import subprocess
import json
import time

START_SCRIPT = "/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/kafka/start-weather-producer.sh"
STOP_SCRIPT = "/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/kafka/stop-weather-producer.sh"
PID_FILE = "/tmp/live_weather_producer.pid"
STATUS_FILE = "/tmp/live_weather_producer_status.json"

def get_producer_pid():
    """Read and validate the producer PID from the lockfile and OS process table."""
    cmd = (
        f"if [ -f '{PID_FILE}' ]; then "
        f"  P=$(cat '{PID_FILE}' 2>/dev/null); "
        f"  if [ -n \"$P\" ] && kill -0 \"$P\" 2>/dev/null && grep -q 'live_weather_producer.py' \"/proc/$P/cmdline\" 2>/dev/null; then "
        f"    echo \"$P\"; "
        f"  fi; "
        f"fi"
    )
    try:
        res = subprocess.run(['wsl', 'bash', '-c', cmd], capture_output=True, text=True, timeout=2.5)
        if res.returncode == 0 and res.stdout.strip():
            return int(res.stdout.strip().split()[0])
    except Exception:
        pass
    return None

def check_producer_running():
    """True if verified producer process is actively running in WSL."""
    return get_producer_pid() is not None

def start_producer():
    """
    Launch the producer using the validated startup management script.
    Guarantees pre-flight checks, duplicate prevention, and detached persistence.
    """
    try:
        res = subprocess.run(['wsl', 'bash', START_SCRIPT], capture_output=True, text=True, timeout=15)
        return {
            "success": res.returncode == 0,
            "stdout": res.stdout.strip(),
            "stderr": res.stderr.strip()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def stop_producer():
    """Gracefully stop the producer using the validated shutdown management script."""
    try:
        res = subprocess.run(['wsl', 'bash', STOP_SCRIPT], capture_output=True, text=True, timeout=15)
        return {
            "success": res.returncode == 0,
            "stdout": res.stdout.strip(),
            "stderr": res.stderr.strip()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_producer_telemetry():
    """
    Read genuine heartbeat status file or log tail without modifying process state.
    Returns parsed event timestamps, publishing health, and error messages.
    """
    cmd = (
        f"if [ -f '{STATUS_FILE}' ]; then "
        f"  cat '{STATUS_FILE}'; "
        f"fi"
    )
    try:
        res = subprocess.run(['wsl', 'bash', '-c', cmd], capture_output=True, text=True, timeout=2.0)
        if res.returncode == 0 and res.stdout.strip():
            return json.loads(res.stdout.strip())
    except Exception:
        pass
    return None
