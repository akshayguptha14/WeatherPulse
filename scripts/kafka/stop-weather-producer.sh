#!/bin/bash
# ==============================================================================
# WEATHERPULSE - LIVE WEATHER PRODUCER SHUTDOWN MANAGEMENT SCRIPT
# Validated process identity check, graceful SIGINT flush, and cleanup
# ==============================================================================

set -u

PID_FILE="/tmp/live_weather_producer.pid"

echo "=== Weather Producer Shutdown Sequence ==="

TARGET_PID=""

# 1. Check PID file
if [ -f "$PID_FILE" ]; then
    RECORDED_PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
    if [ -n "$RECORDED_PID" ] && kill -0 "$RECORDED_PID" 2>/dev/null; then
        # Validate identity: must contain live_weather_producer.py
        if grep -q "live_weather_producer.py" "/proc/$RECORDED_PID/cmdline" 2>/dev/null; then
            TARGET_PID="$RECORDED_PID"
        else
            echo "[WARN] PID $RECORDED_PID does not match live_weather_producer.py. Removing stale PID file."
            rm -f "$PID_FILE"
        fi
    else
        rm -f "$PID_FILE"
    fi
fi

# 2. Secondary scoped search if PID file was missing or stale
if [ -z "$TARGET_PID" ]; then
    SCOPED_PID=$(pgrep -f "python3.*live_weather_producer.py" 2>/dev/null | head -n 1 || true)
    if [ -n "$SCOPED_PID" ] && kill -0 "$SCOPED_PID" 2>/dev/null; then
        if grep -q "live_weather_producer.py" "/proc/$SCOPED_PID/cmdline" 2>/dev/null; then
            TARGET_PID="$SCOPED_PID"
        fi
    fi
fi

if [ -z "$TARGET_PID" ]; then
    echo "[INFO] No active Weather Producer process was found."
    rm -f "$PID_FILE"
    exit 0
fi

echo "Stopping Weather Producer (PID: $TARGET_PID)..."

# 3. Graceful shutdown: send SIGINT to allow Kafka flush and clean closure
kill -SIGINT "$TARGET_PID" 2>/dev/null || true

# Wait up to 6 seconds for clean termination
SHUTDOWN_CLEAN=false
for i in {1..12}; do
    if ! kill -0 "$TARGET_PID" 2>/dev/null; then
        SHUTDOWN_CLEAN=true
        break
    fi
    sleep 0.5
done

# If still running, escalate to SIGTERM
if [ "$SHUTDOWN_CLEAN" != "true" ]; then
    echo "[WARN] Process didn't exit on SIGINT. Sending SIGTERM to PID $TARGET_PID..."
    kill -SIGTERM "$TARGET_PID" 2>/dev/null || true
    sleep 2
    if ! kill -0 "$TARGET_PID" 2>/dev/null; then
        SHUTDOWN_CLEAN=true
    fi
fi

# Forced termination strictly as last resort
if [ "$SHUTDOWN_CLEAN" != "true" ]; then
    echo "[WARN] Process unresponsive. Issuing SIGKILL to PID $TARGET_PID..."
    kill -9 "$TARGET_PID" 2>/dev/null || true
fi

rm -f "$PID_FILE"
echo "[SUCCESS] Weather Producer stopped successfully."
exit 0
