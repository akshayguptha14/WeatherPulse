#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

INPUT_DIR="/weather/raw/sample_weather_data.csv"
OUTPUT_DIR="/weather/mapreduce/city_weather_stats"

echo "=== Running Weather MapReduce Job ==="

# Check if output directory exists
if hdfs dfs -test -d "$OUTPUT_DIR"; then
    echo "Error: Output directory $OUTPUT_DIR already exists."
    echo "Please use a different output path or delete the existing directory manually."
    echo "Example: /weather/mapreduce/city_weather_stats_v2"
    exit 1
fi

PROJECT_DIR="/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project"
JAR_FILE="$PROJECT_DIR/hadoop_jobs/MapReduce/build/weather-mapreduce.jar"

if [ ! -f "$JAR_FILE" ]; then
    echo "Error: JAR file not found at $JAR_FILE. Please build the job first."
    exit 1
fi

$HADOOP_HOME/bin/hadoop jar "$JAR_FILE" com.weather.analysis.WeatherStatsDriver "$INPUT_DIR" "$OUTPUT_DIR"

echo "=== Job Execution Complete ==="
