#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

echo "=== Stopping YARN ==="
$HADOOP_HOME/sbin/stop-yarn.sh

echo "=== Stopping HDFS ==="
$HADOOP_HOME/sbin/stop-dfs.sh

echo "=== Hadoop Stopped ==="
jps
