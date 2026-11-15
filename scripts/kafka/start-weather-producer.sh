#!/bin/bash
# ==============================================================================
# WEATHERPULSE - LIVE WEATHER PRODUCER STARTUP MANAGEMENT SCRIPT
# Kernel-level atomic locking (flock), pre-flight checks, and decoupled execution
# ==============================================================================

set -u

PROJECT_DIR="/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project"
PRODUCER_SCRIPT="$PROJECT_DIR/kafka_streams/live_weather_producer.py"
LOG_FILE="$PROJECT_DIR/producer.log"
PID_FILE="/tmp/live_weather_producer.pid"
LOCK_FILE="/tmp/live_weather_producer.lock"
BROKER="localhost:9092"
TOPIC="weather_stream"
INTERVAL="60.0"

echo "=== Weather Producer Startup Sequence ==="

# ------------------------------------------------------------------------------
# 0. KERNEL-LEVEL ATOMIC LOCK ACQUISITION (flock)
# ------------------------------------------------------------------------------
# Open dedicated lockfile on file descriptor 200
exec 200>"$LOCK_FILE"

# Attempt non-blocking kernel lock
if ! flock -n 200; then
    echo "[WARN] Another Weather Producer startup invocation is currently in progress."
    echo "       Kernel atomic lock ($LOCK_FILE) is currently held."
    echo "       Exiting safely to prevent concurrent duplicate process creation."
    exit 0
fi

# Lock is now held exclusively by this process throughout the entire startup decision,
# pre-flight validation, process spawn, and PID registration sequence.

# ------------------------------------------------------------------------------
# 1. PRE-FLIGHT CHECK: Kafka Broker TCP Connectivity
# ------------------------------------------------------------------------------
echo "[1/3] Verifying Kafka broker connectivity on $BROKER..."
if ! /usr/bin/python3 -c "import socket; s = socket.create_connection(('localhost', 9092), timeout=2.0); s.close()" 2>/dev/null; then
    echo "[ERROR] Kafka broker on $BROKER is unreachable. Startup aborted."
    exit 1
fi
echo "      Broker port 9092 is accepting connections."

# ------------------------------------------------------------------------------
# 2. PRE-FLIGHT CHECK: Topic Existence via Cluster Metadata
# ------------------------------------------------------------------------------
echo "[2/3] Verifying Kafka topic '$TOPIC' in cluster metadata..."
TOPIC_EXISTS=$(/usr/bin/python3 -c "
from kafka import KafkaConsumer
try:
    c = KafkaConsumer(bootstrap_servers='$BROKER', request_timeout_ms=2500)
    topics = c.topics()
    print('EXISTS' if '$TOPIC' in topics else 'MISSING')
except Exception as e:
    print('ERROR')
" 2>/dev/null)

if [ "$TOPIC_EXISTS" != "EXISTS" ]; then
    echo "[ERROR] Target Kafka topic '$TOPIC' does not exist in cluster. Startup aborted."
    exit 1
fi
echo "      Topic '$TOPIC' confirmed active in cluster metadata."

# ------------------------------------------------------------------------------
# 3. PID IDENTITY VALIDATION & PROCESS TABLE GUARD
# ------------------------------------------------------------------------------
echo "[3/3] Checking for existing Weather Producer instances..."

if [ -f "$PID_FILE" ]; then
    EXISTING_PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
    if [ -n "$EXISTING_PID" ] && kill -0 "$EXISTING_PID" 2>/dev/null; then
        # Validate process identity before assuming it is the producer
        if grep -q "live_weather_producer.py" "/proc/$EXISTING_PID/cmdline" 2>/dev/null; then
            echo "[WARN] Weather Producer is already running with PID $EXISTING_PID."
            echo "       Startup aborted to prevent duplicate Kafka event generation."
            exit 0
        else
            echo "[INFO] Stale PID file found (PID $EXISTING_PID belongs to another process). Cleaning up."
            rm -f "$PID_FILE"
        fi
    else
        rm -f "$PID_FILE"
    fi
fi

# Secondary process-table scan guard
EXISTING_PROC=$(pgrep -f "python3.*live_weather_producer.py" 2>/dev/null | head -n 1 || true)
if [ -n "$EXISTING_PROC" ] && kill -0 "$EXISTING_PROC" 2>/dev/null; then
    if grep -q "live_weather_producer.py" "/proc/$EXISTING_PROC/cmdline" 2>/dev/null; then
        echo "[WARN] Existing active process found with PID $EXISTING_PROC. Re-registering PID."
        echo "$EXISTING_PROC" > "$PID_FILE"
        exit 0
    fi
fi

# ------------------------------------------------------------------------------
# 4. LAUNCH UNBUFFERED DAEMON WITH CLOSED STDIN
# ------------------------------------------------------------------------------
echo "Launching live_weather_producer.py (interval: ${INTERVAL}s, 5 Indian cities)..."

nohup /usr/bin/python3 -u "$PRODUCER_SCRIPT" \
    --interval "$INTERVAL" \
    --topic "$TOPIC" \
    --broker "$BROKER" \
    </dev/null >> "$LOG_FILE" 2>&1 &

NEW_PID=$!

# Record PID atomically under the active flock mutex
echo "$NEW_PID" > "$PID_FILE"

# Allow 1 second for initialization and verify process health
sleep 1

if kill -0 "$NEW_PID" 2>/dev/null && grep -q "live_weather_producer.py" "/proc/$NEW_PID/cmdline" 2>/dev/null; then
    echo "[SUCCESS] Weather Producer successfully started."
    echo "          PID: $NEW_PID"
    echo "          Log: $LOG_FILE"
    echo "          Topic: $TOPIC"
    echo "          Interval: ${INTERVAL}s"
    exit 0
else
    echo "[ERROR] Process failed to remain active after spawn. Inspect log for details:"
    tail -n 10 "$LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
