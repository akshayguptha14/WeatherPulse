# Live Weather API Integration

The project supports both historical weather analytics and real-time weather ingestion using the Open-Meteo API. Live observations are fetched, published to Kafka, processed using Spark Structured Streaming, stored in HDFS, and exposed through the Flask/React application.

## 1. Open-Meteo
We utilize the public, open-source Open-Meteo API for real-time weather data. No API key is required.

## 2. API Request Structure
The producer queries the `current` weather fields to match our Big Data schema:
`https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,weather_code`

## 3. City Coordinates
We track live metrics for the existing cities in our pipeline:
* **Bengaluru:** 12.9716, 77.5946
* **Delhi:** 28.6139, 77.2090
* **Mumbai:** 19.0760, 72.8777
* **Chennai:** 13.0827, 80.2707
* **Hyderabad:** 17.3850, 78.4867

## 4. Data Mapping
Responses from Open-Meteo are normalized into our existing Spark schema format. The WMO weather codes (e.g. 0, 1-3, 95) are mapped to human-readable strings like `Clear`, `Partly Cloudy`, `Thunderstorm`, etc. 
To differentiate live data from the historical CSV, the `source_timestamp` field is prefixed with `LIVE|`.

## 5. Kafka Integration
The Python producer uses `kafka-python` to publish each city's JSON observation to the existing `weather_stream` topic on `localhost:9092`. 

## 6. Spark Integration
The existing PySpark Structured Streaming application continuously consumes `weather_stream`. Because we preserved the exact schema, Spark processes the live JSON seamlessly without requiring a code change.

## 7. HDFS Flow
Spark appends the processed live micro-batches as Snappy-compressed Parquet files into the existing HDFS directory:
`/weather/streaming/raw`

## 8. Flask Integration
The `/api/stream/recent` endpoint downloads and queries the latest Parquet files from HDFS using pandas, automatically returning the `LIVE|` prefixed records alongside any historical replays.

## 9. React Integration
The `LiveStreamView` component distinguishes live API records by parsing the `LIVE|` prefix. It powers a 3D `LiveWeatherPanel` that dynamically displays real-time observations and the Open-Meteo connectivity status.

## 10. Running the Live Producer
Use the WSL environment to run the producer:

Run once and exit:
```bash
python3 kafka_streams/live_weather_producer.py --once
```

Run continuously (default interval: 60s):
```bash
python3 kafka_streams/live_weather_producer.py --interval 60
```

## 11. Testing
* Verify Kafka topic: `kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic weather_stream --from-beginning`
* Verify API: The Live Stream page at `http://localhost:5173/stream` will display the new records.

## 12. Error Handling
The script handles `requests` timeouts, invalid JSON, and missing fields. If a city fails or the API goes down, it logs the error without crashing, and moves on to the next city. The React frontend falls back to an "Unavailable / Error" state.

## 13. Historical vs Live Architecture
Crucially, the historical Hive MapReduce analytics are completely isolated. Hive maps to `/weather/raw/sample_weather_data.csv`, while the live data lives in `/weather/streaming/raw`. This ensures that live API ingestion does not skew or alter the 150-record historical summary baseline.
