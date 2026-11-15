#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

echo "=== Building MapReduce Job ==="
if [ -z "$JAVA_HOME" ]; then
    echo "Error: JAVA_HOME is not set."
    exit 1
fi
if [ -z "$HADOOP_HOME" ]; then
    echo "Error: HADOOP_HOME is not set."
    exit 1
fi

PROJECT_DIR="/mnt/c/Users/aksha/Desktop/BDT/weather_climate_project"
SRC_DIR="$PROJECT_DIR/hadoop_jobs/MapReduce/src"
BUILD_DIR="$PROJECT_DIR/hadoop_jobs/MapReduce/build"
CLASSES_DIR="$BUILD_DIR/classes"

rm -rf "$BUILD_DIR"
mkdir -p "$CLASSES_DIR"

echo "Compiling Java sources..."
javac -classpath $($HADOOP_HOME/bin/hadoop classpath) -d "$CLASSES_DIR" "$SRC_DIR/com/weather/analysis/"*.java

echo "Packaging JAR..."
jar -cvf "$BUILD_DIR/weather-mapreduce.jar" -C "$CLASSES_DIR" .

echo "=== Build Complete ==="
echo "JAR created at: $BUILD_DIR/weather-mapreduce.jar"
