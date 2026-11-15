import argparse
import json
import time
import requests
import sys
import os
import signal
from datetime import datetime, timezone
from kafka import KafkaProducer

CITIES = {
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946},
    "Delhi": {"lat": 28.6139, "lon": 77.2090},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Chennai": {"lat": 13.0827, "lon": 80.2707},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867}
}

STATUS_FILE = "/tmp/live_weather_producer_status.json"

def _update_status_file(data):
    """Atomically write heartbeat status file for genuine monitoring inspection."""
    try:
        tmp_path = STATUS_FILE + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f)
        os.replace(tmp_path, STATUS_FILE)
    except Exception:
        pass

# Open-Meteo Weather code mapping (WMO code)
def map_weather_code(code):
    if code == 0: return "Clear"
    elif code in [1, 2, 3]: return "Partly Cloudy" if code == 1 else "Cloudy"
    elif code in [45, 48]: return "Fog"
    elif code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]: return "Rain"
    elif code in [71, 73, 75, 77, 85, 86]: return "Snow"
    elif code in [95, 96, 99]: return "Thunderstorm"
    return "Unknown"

def fetch_weather(city_name, lat, lon):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        current = data.get("current_weather", {})
        if not current:
            raise ValueError("Missing 'current_weather' in response")
        
        event = {
            "source_timestamp": current.get("time", datetime.now(timezone.utc).isoformat()),
            "ingest_timestamp": datetime.now(timezone.utc).isoformat(),
            "city": city_name,
            "temperature": float(current.get("temperature", 0.0)),
        }
    except Exception as e:
        ts = datetime.now(timezone.utc).isoformat()
        print(f"[{ts}] [ERROR] Open-Meteo request failed for {city_name}: {e}", flush=True)
        return None
    return event

def fetch_weather_v2(city_name, lat, lon):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,weather_code"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        current = data.get("current", {})
        if not current:
            raise ValueError("Missing 'current' in response")
            
        event = {
            "source_timestamp": "LIVE|" + current.get("time", datetime.now(timezone.utc).isoformat()),
            "ingest_timestamp": datetime.now(timezone.utc).isoformat(),
            "city": city_name,
            "temperature": float(current.get("temperature_2m", 0.0)),
            "humidity": float(current.get("relative_humidity_2m", 0.0)),
            "rainfall": float(current.get("precipitation", 0.0)),
            "wind_speed": float(current.get("wind_speed_10m", 0.0)),
            "pressure": float(current.get("surface_pressure", 0.0)),
            "weather_condition": map_weather_code(current.get("weather_code", -1)),
        }
        return event
    except Exception as e:
        ts = datetime.now(timezone.utc).isoformat()
        print(f"[{ts}] [ERROR] Open-Meteo request failed for {city_name}: {e}", flush=True)
        return None

def main():
    parser = argparse.ArgumentParser(description="Live Weather API Kafka Producer")
    parser.add_argument('--interval', type=float, default=60.0, help="Interval in seconds between fetches")
    parser.add_argument('--once', action='store_true', help="Fetch exactly once and exit")
    parser.add_argument('--city', type=str, default=None, help="Fetch for a single city")
    parser.add_argument('--topic', type=str, default='weather_stream', help="Kafka topic")
    parser.add_argument('--broker', type=str, default='localhost:9092', help="Kafka broker address")

    args = parser.parse_args()

    # Graceful SIGTERM handling (translates to KeyboardInterrupt for clean cleanup)
    def _sigterm_handler(signum, frame):
        raise KeyboardInterrupt
    try:
        signal.signal(signal.SIGTERM, _sigterm_handler)
    except Exception:
        pass
    
    ts_start = datetime.now(timezone.utc).isoformat()
    print(f"[{ts_start}] === Open-Meteo Live Weather Kafka Producer (PID: {os.getpid()}) ===", flush=True)
    
    # Connect with bounded retries for robust startup sequence
    producer = None
    for attempt in range(1, 4):
        try:
            producer = KafkaProducer(
                bootstrap_servers=args.broker,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda v: v.encode('utf-8')
            )
            break
        except Exception as e:
            ts = datetime.now(timezone.utc).isoformat()
            if attempt < 3:
                print(f"[{ts}] [WARN] Kafka broker connect attempt {attempt} failed: {e}. Retrying in 1.5s...", flush=True)
                time.sleep(1.5)
            else:
                print(f"[{ts}] [ERROR] Kafka broker unavailable after 3 attempts: {e}", flush=True)
                _update_status_file({
                    "pid": os.getpid(),
                    "status": "failed",
                    "last_error": str(e),
                    "last_error_time": ts
                })
                sys.exit(1)

    cities_to_fetch = CITIES
    if args.city:
        if args.city in CITIES:
            cities_to_fetch = {args.city: CITIES[args.city]}
        else:
            print(f"[ERROR] Unknown city: {args.city}. Available: {list(CITIES.keys())}", flush=True)
            sys.exit(1)

    # Initial status registration
    status_data = {
        "pid": os.getpid(),
        "status": "running",
        "interval_sec": args.interval,
        "cities_count": len(cities_to_fetch),
        "target_topic": args.topic,
        "last_weather_fetch": None,
        "last_kafka_publish": None,
        "last_city_published": None,
        "last_error": None
    }
    _update_status_file(status_data)
            
    try:
        while True:
            for city_name, coords in cities_to_fetch.items():
                ts_fetch = datetime.now(timezone.utc).isoformat()
                print(f"[{ts_fetch}] [LIVE API] Fetching {city_name}...", flush=True)
                event = fetch_weather_v2(city_name, coords["lat"], coords["lon"])
                if event:
                    ts_fetched = datetime.now(timezone.utc).isoformat()
                    status_data["last_weather_fetch"] = ts_fetched
                    print(f"[{ts_fetched}] [LIVE API] {city_name}: {event['temperature']}°C, {event['humidity']}% humidity, {event['weather_condition']}", flush=True)
                    try:
                        producer.send(args.topic, key=city_name, value=event)
                        ts_pub = datetime.now(timezone.utc).isoformat()
                        status_data["last_kafka_publish"] = ts_pub
                        status_data["last_city_published"] = city_name
                        status_data["last_error"] = None
                        print(f"[{ts_pub}] [KAFKA] Published {city_name}", flush=True)
                    except Exception as e:
                        ts_err = datetime.now(timezone.utc).isoformat()
                        status_data["last_error"] = f"Failed to publish to Kafka: {e}"
                        print(f"[{ts_err}] [ERROR] Failed to publish to Kafka: {e}", flush=True)
                else:
                    status_data["last_error"] = f"Open-Meteo request failed for {city_name}"
            
            producer.flush()
            _update_status_file(status_data)
            
            if args.once:
                break
                
            ts_wait = datetime.now(timezone.utc).isoformat()
            print(f"[{ts_wait}] Waiting {args.interval} seconds...", flush=True)
            time.sleep(args.interval)
            
    except KeyboardInterrupt:
        ts_exit = datetime.now(timezone.utc).isoformat()
        print(f"\n[{ts_exit}] [INFO] Graceful shutdown requested. Exiting.", flush=True)
    finally:
        if producer:
            producer.close()
        status_data["status"] = "stopped"
        _update_status_file(status_data)
        print("Producer closed.", flush=True)

if __name__ == '__main__':
    main()
