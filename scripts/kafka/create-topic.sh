#!/bin/bash

# Source environment
source "$(dirname "$0")/env.sh"

TOPIC_NAME="weather_stream"

echo "=== Creating Kafka Topic: $TOPIC_NAME ==="

# Check if topic already exists
EXISTING_TOPICS=$($KAFKA_HOME/bin/kafka-topics.sh --list --bootstrap-server localhost:9092 2>/dev/null)

if echo "$EXISTING_TOPICS" | grep -q "^$TOPIC_NAME$"; then
    echo "[INFO] Topic '$TOPIC_NAME' already exists."
else
    # Create topic
    $KAFKA_HOME/bin/kafka-topics.sh --create \
        --topic $TOPIC_NAME \
        --bootstrap-server localhost:9092 \
        --partitions 3 \
        --replication-factor 1
    
    if [ $? -eq 0 ]; then
        echo "[SUCCESS] Topic '$TOPIC_NAME' created successfully."
    else
        echo "[ERROR] Failed to create topic."
        exit 1
    fi
fi

# Describe topic
echo "--- Topic Details ---"
$KAFKA_HOME/bin/kafka-topics.sh --describe --topic $TOPIC_NAME --bootstrap-server localhost:9092
