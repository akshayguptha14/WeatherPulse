#!/bin/bash

# Source environment
source "$(dirname "$0")/env.sh"

echo "=== Stopping Apache Kafka ==="

if ! jps | grep -q "Kafka"; then
    echo "[INFO] Kafka is not running."
    exit 0
fi

$KAFKA_HOME/bin/kafka-server-stop.sh

echo "[INFO] Waiting for Kafka to stop..."
sleep 5

if jps | grep -q "Kafka"; then
    echo "[WARN] Kafka is still running. You may need to kill it manually."
else
    echo "[SUCCESS] Kafka stopped successfully."
fi
