#!/bin/bash

# Source environment
source "$(dirname "$0")/env.sh"

echo "=== Verifying Apache Kafka ==="

# Check process
if jps | grep -q "Kafka"; then
    echo "[SUCCESS] Kafka Java process is running."
else
    echo "[ERROR] Kafka process is not running."
    exit 1
fi

# List topics
echo "--- Available Topics ---"
$KAFKA_HOME/bin/kafka-topics.sh --list --bootstrap-server localhost:9092
