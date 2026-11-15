#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

echo "=== Verifying Java Processes ==="
jps

echo "=== Verifying HDFS ==="
hdfs dfsadmin -report

echo "=== Verifying YARN NodeManagers ==="
yarn node -list

echo "=== Verifying HDFS Accessibility ==="
hdfs dfs -ls /
