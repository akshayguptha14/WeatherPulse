#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hive/env.sh

echo "=== Verifying Hadoop ==="
jps | grep -E 'NameNode|DataNode|ResourceManager|NodeManager' || { echo "Hadoop daemons missing. Please start Hadoop first."; exit 1; }

echo "=== Starting HiveServer2 ==="
if [ ! -d ~/hive_data/metastore ]; then
    echo "Metastore data not found. Initializing schema..."
    schematool -dbType derby -initSchema
fi

nohup hiveserver2 > ~/hive_data/hiveserver2.log 2>&1 &
echo $! > /tmp/hiveserver2.pid
echo "HiveServer2 started with PID $(cat /tmp/hiveserver2.pid)"
