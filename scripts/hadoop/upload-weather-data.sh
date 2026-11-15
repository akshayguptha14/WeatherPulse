#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

FILE_PATH="/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/data/sample_weather_data.csv"

echo "=== Uploading Data to HDFS ==="
if [ -f "$FILE_PATH" ]; then
    hdfs dfs -put -f "$FILE_PATH" /weather/raw/
    echo "Upload complete. Verifying:"
    hdfs dfs -ls /weather/raw/
    hdfs dfs -cat /weather/raw/sample_weather_data.csv | head -n 5
    echo "Row count:"
    hdfs dfs -cat /weather/raw/sample_weather_data.csv | wc -l
else
    echo "Error: File $FILE_PATH does not exist."
fi
