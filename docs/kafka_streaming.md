# Phase 5: Kafka Streaming Pipeline

## Overview
This phase sets up the real-time ingestion layer using **Apache Kafka** running in KRaft mode. A custom Python producer simulates a live stream by replaying historical weather data from a CSV file.

## Architecture
- **Source**: `data/sample_weather_data.csv`
- **Simulated Stream**: Python script (`kafka_streams/producer.py`) acting as a "CSV Replay Real-Time Weather Source"
- **Message Broker**: Apache Kafka 4.3.1 (KRaft Mode)
- **Topic**: `weather_stream` (3 partitions, Replication Factor 1)

## Components Created
- `scripts/kafka/init-kafka.sh`: Safely formats KRaft storage.
- `scripts/kafka/start-kafka.sh`: Starts the Kafka broker daemon.
- `scripts/kafka/stop-kafka.sh`: Gracefully shuts down Kafka.
- `scripts/kafka/create-topic.sh`: Initializes the `weather_stream` topic.
- `kafka_streams/producer.py`: Python producer using `kafka-python-ng`.

## Execution
1. Initialize and start Kafka:
   ```bash
   ./scripts/kafka/init-kafka.sh
   ./scripts/kafka/start-kafka.sh
   ```
2. Create topic:
   ```bash
   ./scripts/kafka/create-topic.sh
   ```
3. Run the producer (in WSL):
   ```bash
   cd kafka_streams
   python3 producer.py --interval 0.5 --max-records 30
   ```

## Verification
Kafka was verified natively via the `kafka-console-consumer.sh` CLI before passing data to Spark. Data correctly preserves original timestamps while appending a new ingestion timestamp.
