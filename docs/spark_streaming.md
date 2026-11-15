# Phase 5: Spark Structured Streaming

## Overview
This phase integrates **Apache Spark 4.2.0** to consume the real-time weather stream from Kafka, process it, and persist it to **HDFS**. The application runs on **YARN** as the resource manager.

## Architecture
- **Stream Processing**: Apache Spark 4.2.0 Structured Streaming
- **Execution Engine**: YARN (`--master yarn --deploy-mode client`)
- **Input**: Kafka Topic (`weather_stream`)
- **Output**: HDFS Parquet Files (`/weather/streaming/raw`)
- **Checkpointing**: HDFS (`/weather/streaming/checkpoints/kafka_to_hdfs`)

## Components Created
- `spark_jobs/streaming/kafka_to_hdfs.py`: The PySpark streaming application.
- `scripts/spark/run-streaming.sh`: YARN submission script with required Kafka connector dependencies.
- `spark_jobs/streaming/verify_parquet.py`: A verification script to read and count the HDFS Parquet files.

## Execution
1. Ensure HDFS, YARN, and Kafka are running.
2. Submit the streaming job:
   ```bash
   ./scripts/spark/run-streaming.sh
   ```
3. Run the Kafka producer (from the `kafka_streams` directory) to push data.
4. The Spark job will write micro-batches to HDFS.

## Verification
- **YARN ResourceManager**: The application appears as `RUNNING` in the YARN web UI (port 8088).
- **HDFS**: Parquet files are generated incrementally in `/weather/streaming/raw/`.
- **Validation**: Running `verify_parquet.py` via `spark-submit` confirmed exactly 35 records successfully persisted across all 5 cities (Bengaluru, Chennai, Delhi, Hyderabad, Mumbai).
