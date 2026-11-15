#!/bin/bash

# Source environment
source "$(dirname "$0")/env.sh"

echo "=== Starting Apache Kafka (KRaft Mode) ==="

# Check if Kafka is already running
if jps | grep -q "Kafka"; then
    echo "[INFO] Kafka is already running."
    exit 0
fi

# Run init just in case, it's safe because it checks first
bash "$(dirname "$0")/init-kafka.sh"

$KAFKA_HOME/bin/kafka-server-start.sh -daemon $KAFKA_HOME/config/server.properties

echo "[INFO] Kafka starting in the background..."
sleep 5

# Check if it started
if jps | grep -q "Kafka"; then
    echo "[SUCCESS] Kafka started successfully."
else
    echo "[ERROR] Kafka failed to start. Check logs in $KAFKA_HOME/logs/"
    exit 1
fi
