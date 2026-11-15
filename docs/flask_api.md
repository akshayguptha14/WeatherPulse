# Flask REST API Documentation

## Overview
This document describes the API endpoints provided by the `app.py` Flask backend. It acts as the middleware integrating the Big Data architecture (HDFS, YARN, MapReduce, Hive, Kafka, Spark) with the React frontend dashboard.

## Environment Variables
The application requires the following environment variables (defined in `.env`):
- `HDFS_NAMENODE_URI`: (e.g. `hdfs://localhost:9000`)
- `HDFS_RAW_PATH`: (e.g. `/weather/raw/sample_weather_data.csv`)
- `HDFS_STREAMING_PATH`: (e.g. `/weather/streaming/raw`)
- `HDFS_MAPREDUCE_PATH`: (e.g. `/weather/mapreduce/city_weather_stats`)
- `YARN_RESOURCE_MANAGER`: (e.g. `http://localhost:8088`)
- `KAFKA_BOOTSTRAP_SERVERS`: (e.g. `localhost:9092`)
- `KAFKA_TOPIC`: (e.g. `weather_stream`)
- `HIVE_JDBC_URL`: (e.g. `jdbc:hive2://localhost:10000/weather_climate`)

## Endpoints

### 1. `GET /api/status`
- **Purpose**: Verify the Flask backend is operational.
- **Source**: Static.
- **Example**:
  ```json
  { "status": "running", "message": "Flask backend is up and running" }
  ```

### 2. `GET /api/ecosystem`
- **Purpose**: Real-time checking of Big Data services.
- **Source**: Subprocess calls to Hadoop CLI, YARN CLI, Kafka CLI, and Beeline.
- **Example**:
  ```json
  {
    "hdfs": { "status": "Running", "details": "HDFS is active..." },
    "kafka": { "status": "Running", "details": "..." }
  }
  ```

### 3. `GET /api/summary`
- **Purpose**: Key Performance Indicators (KPIs) for the overall dataset.
- **Source**: Hive `weather_data` table (MapReduce job executed via `beeline`).
- **Caching**: 5 minutes TTL to prevent redundant MapReduce execution.

### 4. `GET /api/cities`
- **Purpose**: Aggregated statistics grouped by city.
- **Source**: Hive `weather_data` table (MapReduce).

### 5. `GET /api/temperature`, `/api/rainfall`, `/api/humidity`, `/api/wind`
- **Purpose**: Sub-views of the city analytics formatted specifically for the React Recharts library.
- **Source**: Inherits from `/api/cities` and `/api/historical`.

### 6. `GET /api/historical`
- **Purpose**: Time-series view of all historical weather observations.
- **Source**: Hive `weather_data` table.

### 7. `GET /api/stream/recent`
- **Purpose**: Fetches the most recent records processed by Spark Structured Streaming.
- **Source**: Downloads `hdfs://localhost:9000/weather/streaming/raw/*.parquet` to a local temp folder, reads with `pandas` and `pyarrow`, sorts by `spark_processing_timestamp` descending, and returns the top 50 records.

### 8. `GET /api/alerts`
- **Purpose**: Data-derived alerts based on predefined threshold values (e.g., Temp > 40).
- **Source**: Directly queries the `/api/stream/recent` pipeline output.

## Error Handling
If a service is offline or a query times out, endpoints will return a `503 Service Unavailable` with a structured JSON error:
```json
{ "status": "error", "message": "Hive summary unavailable" }
```
