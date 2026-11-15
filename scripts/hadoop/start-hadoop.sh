#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

echo "=== Starting HDFS ==="
$HADOOP_HOME/sbin/start-dfs.sh

echo "=== Starting YARN ==="
$HADOOP_HOME/sbin/start-yarn.sh

echo "=== Hadoop Started ==="
jps
