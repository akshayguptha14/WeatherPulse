#!/bin/bash

# Source environment
source "$(dirname "$0")/env.sh"

echo "=== Initializing Kafka KRaft Storage ==="

LOG_DIR="/home/akshay/bigdata/kafka/kraft-combined-logs"
META_FILE="$LOG_DIR/meta.properties"

if [ -f "$META_FILE" ]; then
    echo "[INFO] Kafka KRaft storage is already initialized at $LOG_DIR."
    echo "[INFO] Refusing to reformat to prevent data loss."
    exit 0
fi

# Generate Cluster UUID
echo "[INFO] Generating Kafka Cluster UUID..."
KAFKA_CLUSTER_ID=$($KAFKA_HOME/bin/kafka-storage.sh random-uuid)
echo "[INFO] Cluster ID: $KAFKA_CLUSTER_ID"

# Format Storage
echo "[INFO] Formatting KRaft storage..."
$KAFKA_HOME/bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c $KAFKA_HOME/config/server.properties --standalone

if [ $? -eq 0 ]; then
    echo "[SUCCESS] Kafka KRaft storage formatted successfully."
else
    echo "[ERROR] Failed to format Kafka storage."
    exit 1
fi
