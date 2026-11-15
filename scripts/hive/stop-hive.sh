#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hive/env.sh

echo "=== Stopping HiveServer2 ==="
if [ -f /tmp/hiveserver2.pid ]; then
    kill $(cat /tmp/hiveserver2.pid)
    rm /tmp/hiveserver2.pid
    echo "HiveServer2 stopped."
else
    # Fallback to kill by name if pid file is missing
    PIDS=$(jps | grep RunJar | awk '{print $1}')
    if [ ! -z "$PIDS" ]; then
        kill $PIDS
        echo "HiveServer2 stopped via jps."
    else
        echo "HiveServer2 is not running."
    fi
fi
