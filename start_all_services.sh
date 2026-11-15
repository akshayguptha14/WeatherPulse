#!/bin/bash
source scripts/hadoop/env.sh
start-all.sh
sleep 5
source scripts/hive/env.sh
nohup hive --service hiveserver2 > hive.log 2>&1 &
nohup ./scripts/kafka/start-kafka.sh > kafka.log 2>&1 &
sleep 5
source scripts/spark/env.sh
export CHECKPOINT_LOCATION=hdfs://localhost:9000/weather/streaming/checkpoints/kafka_to_hdfs_v4
nohup ./scripts/spark/run-streaming.sh > spark.log 2>&1 &
echo "All services started!"
sleep infinity
