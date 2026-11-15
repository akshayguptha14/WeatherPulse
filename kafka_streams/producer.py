import argparse
import csv
import json
import time
from datetime import datetime, timezone
from kafka import KafkaProducer

def main():
    parser = argparse.ArgumentParser(description="CSV Replay Real-Time Weather Source")
    parser.add_argument('--interval', type=float, default=1.0, help="Interval in seconds between sending records")
    parser.add_argument('--max-records', type=int, default=30, help="Maximum number of records to send per execution")
    parser.add_argument('--loop', action='store_true', help="Loop over the CSV data indefinitely")
    parser.add_argument('--city', type=str, default=None, help="Filter by a specific city")
    parser.add_argument('--topic', type=str, default='weather_stream', help="Kafka topic to publish to")
    parser.add_argument('--broker', type=str, default='localhost:9092', help="Kafka broker address")
    parser.add_argument('--csv-file', type=str, default='../data/sample_weather_data.csv', help="Path to source CSV file")

    args = parser.parse_args()

    print("=== CSV Replay Real-Time Weather Source ===")
    print(f"Broker: {args.broker}")
    print(f"Topic: {args.topic}")
    print(f"Source: {args.csv_file}")
    print(f"Interval: {args.interval}s")
    if args.city:
        print(f"City Filter: {args.city}")

    producer = KafkaProducer(
        bootstrap_servers=args.broker,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        key_serializer=lambda v: v.encode('utf-8')
    )

    records_sent = 0
    keep_running = True

    while keep_running:
        try:
            with open(args.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if args.city and row['city'].lower() != args.city.lower():
                        continue

                    event = {
                        "source_timestamp": row['timestamp'],
                        "ingest_timestamp": datetime.now(timezone.utc).isoformat(),
                        "city": row['city'],
                        "temperature": float(row['temperature']),
                        "humidity": float(row['humidity']),
                        "rainfall": float(row['rainfall']),
                        "wind_speed": float(row['wind_speed']),
                        "pressure": float(row['pressure']),
                        "weather_condition": row['weather_condition']
                    }

                    producer.send(args.topic, key=event['city'], value=event)
                    print(f"Record successfully delivered to {args.topic}")
                    
                    records_sent += 1
                    time.sleep(args.interval)

                    if not args.loop and args.max_records and records_sent >= args.max_records:
                        print(f"Reached maximum records limit ({args.max_records}). Exiting.")
                        keep_running = False
                        break

        except FileNotFoundError:
            print(f"Error: The file {args.csv_file} was not found.")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            break

        if not args.loop:
            break

    print("Flushing outstanding messages...")
    producer.flush()
    print(f"Finished. Total records sent: {records_sent}")

if __name__ == '__main__':
    main()
