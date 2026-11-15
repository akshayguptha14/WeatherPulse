#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

source "$SCRIPT_DIR/env.sh"

echo "=== Launching PySpark Structured Streaming Job on YARN ==="
echo "Project Directory: $PROJECT_DIR"

# Note: The connector version must match Spark 4.2.0 and Scala 2.13
CONNECTOR="org.apache.spark:spark-sql-kafka-0-10_2.13:4.2.0"

# Versioned paths for isolated, non-destructive streaming pipeline
export OUTPUT_LOCATION="hdfs://localhost:9000/weather/streaming/raw_v5"
export CHECKPOINT_LOCATION="hdfs://localhost:9000/weather/streaming/checkpoints/kafka_to_hdfs_v5"
export STARTING_OFFSETS="latest"

spark-submit \
    --master yarn \
    --deploy-mode client \
    --driver-memory 1g \
    --executor-memory 2g \
    --executor-cores 1 \
    --num-executors 1 \
    --packages "$CONNECTOR" \
    "$PROJECT_DIR/spark_jobs/streaming/kafka_to_hdfs.py"
