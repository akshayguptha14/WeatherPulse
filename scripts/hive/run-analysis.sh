#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hive/env.sh

SCRIPTS_DIR="/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/hadoop_jobs/Hive/scripts"
OUTPUT_DIR="/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/data/results/hive"

mkdir -p "$OUTPUT_DIR"

echo "=== Running Hive Analytical Queries ==="

echo "1. City Summary"
beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 -f "$SCRIPTS_DIR/03_city_summary.hql" > "$OUTPUT_DIR/city_summary.txt"

echo "2. Temperature Analysis"
beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 -f "$SCRIPTS_DIR/04_temperature_analysis.hql" > "$OUTPUT_DIR/temperature_analysis.txt"

echo "3. Rainfall Analysis"
beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 -f "$SCRIPTS_DIR/05_rainfall_analysis.hql" > "$OUTPUT_DIR/rainfall_analysis.txt"

echo "4. Humidity Analysis"
beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 -f "$SCRIPTS_DIR/06_humidity_analysis.hql" > "$OUTPUT_DIR/humidity_analysis.txt"

echo "5. Wind Analysis"
beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 -f "$SCRIPTS_DIR/07_wind_analysis.hql" > "$OUTPUT_DIR/wind_analysis.txt"

echo "6. Pressure Analysis"
beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 -f "$SCRIPTS_DIR/08_pressure_analysis.hql" > "$OUTPUT_DIR/pressure_analysis.txt"

echo "7. Weather Conditions Analysis"
beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 -f "$SCRIPTS_DIR/09_weather_conditions.hql" > "$OUTPUT_DIR/weather_conditions.txt"

echo "8. Extreme Weather Records"
beeline -u jdbc:hive2://localhost:10000/weather_climate --silent=true --outputformat=tsv2 -f "$SCRIPTS_DIR/10_extreme_weather.hql" > "$OUTPUT_DIR/extreme_weather.txt"

echo "=== Analysis Complete ==="
ls -l "$OUTPUT_DIR"
