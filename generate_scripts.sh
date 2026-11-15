mkdir -p C:/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop

cat << 'EOF' > C:/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/start-hadoop.sh
#!/bin/bash
source ~/.bashrc

echo "=== Starting HDFS ==="
$HADOOP_HOME/sbin/start-dfs.sh

echo "=== Starting YARN ==="
$HADOOP_HOME/sbin/start-yarn.sh

echo "=== Hadoop Started ==="
jps
EOF

cat << 'EOF' > C:/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/stop-hadoop.sh
#!/bin/bash
source ~/.bashrc

echo "=== Stopping YARN ==="
$HADOOP_HOME/sbin/stop-yarn.sh

echo "=== Stopping HDFS ==="
$HADOOP_HOME/sbin/stop-dfs.sh

echo "=== Hadoop Stopped ==="
jps
EOF

cat << 'EOF' > C:/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/verify-hadoop.sh
#!/bin/bash
source ~/.bashrc

echo "=== Verifying Java Processes ==="
jps

echo "=== Verifying HDFS ==="
hdfs dfsadmin -report

echo "=== Verifying YARN NodeManagers ==="
yarn node -list

echo "=== Verifying HDFS Accessibility ==="
hdfs dfs -ls /
EOF

cat << 'EOF' > C:/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/upload-weather-data.sh
#!/bin/bash
source ~/.bashrc

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
EOF

chmod +x C:/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/*.sh
