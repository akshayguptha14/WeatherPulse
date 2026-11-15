#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

echo "=== Fixing line endings for scripts ==="
sed -i 's/\r$//' /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/*.sh
sed -i 's/\r$//' /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/hadoop_config.sh

echo "=== Running Configuration ==="
bash /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/hadoop_config.sh

echo "=== Formatting NameNode (Safely) ==="
if [ -z "$(ls -A ~/hadoop_data/namenode 2>/dev/null)" ]; then
    echo "Formatting NameNode..."
    hdfs namenode -format -force
else
    echo "NameNode directory is not empty. Skipping format."
fi

echo "=== Create HDFS directories ==="
/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/start-hadoop.sh

echo "Waiting for HDFS to exit safe mode..."
hdfs dfsadmin -safemode wait

echo "Creating HDFS Directories..."
hdfs dfs -mkdir -p /weather/raw
hdfs dfs -mkdir -p /weather/processed
hdfs dfs -mkdir -p /weather/streaming
hdfs dfs -mkdir -p /weather/mapreduce
hdfs dfs -mkdir -p /weather/hive
hdfs dfs -mkdir -p /user/$USER

echo "=== Verify HDFS Directories ==="
hdfs dfs -ls /weather

echo "=== Uploading Data ==="
bash /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/upload-weather-data.sh

echo "=== Setup Complete ==="
