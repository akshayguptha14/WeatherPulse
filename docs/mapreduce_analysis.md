# Phase 3: Hadoop MapReduce Weather Analysis

## Objective
The objective of Phase 3 is to implement and execute a real Apache Hadoop MapReduce job against the raw weather dataset stored in HDFS. This demonstrates distributed batch processing capabilities by aggregating weather metrics (such as temperature, humidity, rainfall, wind speed, and pressure) on a per-city basis.

## Data Flow
* **Input HDFS Path:** `/weather/raw/sample_weather_data.csv`
* **Output HDFS Path:** `/weather/mapreduce/city_weather_stats`
* **Local Copy:** `data/results/mapreduce_city_weather_stats.txt`

## Components

### 1. WeatherStatsMapper
The Mapper reads the raw CSV dataset line-by-line from HDFS. It performs the following responsibilities:
- Skips the CSV header row.
- Extracts individual fields (city, temperature, humidity, rainfall, wind speed, pressure).
- Safely handles parsing errors (ignoring malformed rows).
- Uses Hadoop Counters (`VALID_RECORDS`, `MALFORMED_RECORDS`, `HEADER_RECORDS`) for data quality monitoring.
- Emits the parsed data wrapped in a custom `WeatherStatsWritable` object, keyed by the city name.

### 2. WeatherStatsWritable
A custom Hadoop `Writable` class designed to efficiently serialize and pass the extracted weather metrics from the Mapper to the Reducer. It contains numeric fields for count, temperature, humidity, rainfall, wind speed, and pressure, avoiding the overhead of string serialization.

### 3. WeatherStatsReducer
The Reducer receives the stream of `WeatherStatsWritable` objects grouped by city. It aggregates these records to calculate:
- Total record count
- Average, minimum, and maximum temperature
- Average humidity
- Total rainfall
- Average and maximum wind speed
- Average atmospheric pressure

## Build & Execution Procedure

### Building the Job
The Java classes are compiled and packaged into a JAR file using the Hadoop classpath:
```bash
bash scripts/mapreduce/build-weather-job.sh
```
This generates `hadoop_jobs/MapReduce/build/weather-mapreduce.jar`.

### Executing the Job
The MapReduce job is submitted to YARN using the wrapper script:
```bash
bash scripts/mapreduce/run-weather-job.sh
```
This script leverages YARN (`hadoop jar`) to schedule and run the application in the cluster.

## Results & YARN Involvement
The job successfully ran under YARN's management.
* **YARN Application ID:** `application_1789573276279_0001`
* **MapReduce Job ID:** `job_1789573276279_0001`

**Hadoop Counters Output:**
- `VALID_RECORDS` = 150
- `HEADER_RECORDS` = 1
- `MALFORMED_RECORDS` = 0

**Aggregated Output:**
The results were verified via `hdfs dfs -cat /weather/mapreduce/city_weather_stats/part-r-00000`:
```text
Bengaluru	28 29.78 17.60 43.30 61.89 305.10 11.41 25.00 1008.61
Chennai	26 30.98 16.20 42.90 69.88 223.30 11.65 24.80 1007.35
Delhi	30 31.02 15.30 45.00 65.47 273.10 12.30 25.00 1007.33
Hyderabad	35 32.19 17.50 44.50 63.43 466.30 16.77 24.70 1008.23
Mumbai	31 30.80 16.10 44.20 70.65 223.20 12.80 24.00 1009.55
```
These metrics prove that distributed map-reduce successfully aggregated the data without simulated or hardcoded data.
