#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hive/env.sh

echo "=== Hive Environment ==="
echo "HIVE_HOME: $HIVE_HOME"
beeline --version

echo "=== HiveServer2 Process ==="
jps | grep RunJar || echo "HiveServer2 not running."

echo "=== Listening Ports ==="
netstat -tlnp 2>/dev/null | grep 10000 || echo "Port 10000 not listening."

echo "=== Beeline Connectivity & Database Verification ==="
beeline -u jdbc:hive2://localhost:10000/default -e "SHOW DATABASES; USE weather_climate; SHOW TABLES; DESCRIBE weather_data; SELECT COUNT(*) FROM weather_data;"
