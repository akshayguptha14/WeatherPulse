# Phase 4: Apache Hive Analytics

## Objective
The objective of Phase 4 is to demonstrate the integration of **Apache Hive** into the existing Hadoop ecosystem, enabling SQL-like analytical queries over the distributed dataset stored in HDFS. This phase reuses the verified MapReduce execution engine to aggregate and analyze the weather data.

## Environment Details
- **Hive Version:** Apache Hive 4.1.0
- **Hadoop Version:** Apache Hadoop 3.5.0
- **Java Version:** OpenJDK 17.0.20
- **HIVE_HOME:** `/home/akshay/bigdata/hive`
- **Execution Engine:** MapReduce (`hive.execution.engine=mr`)
- **Metastore:** Embedded Apache Derby

### Compatibility
Apache Hive 4.1.0 officially targets Hadoop 3.4.1. In our smoke testing against Hadoop 3.5.0, Hive operated smoothly without any API incompatibility issues, executing jobs successfully on YARN.

## Architecture

### 1. Metastore
An embedded Apache Derby database is initialized and stored under the Linux filesystem at `~/hive_data/metastore`. It maintains the schema definition for the `weather_climate` database and the `weather_data` table.

### 2. External Table
Hive uses an `EXTERNAL TABLE` configuration. The table schema applies structure over the raw CSV stored in HDFS without moving or owning the data.
- **Source Data Path:** `/weather/raw/`
- **Table:** `weather_climate.weather_data`

### 3. HiveServer2 & Beeline
`HiveServer2` provides an interface to connect to Hive remotely. `Beeline` connects via JDBC (`jdbc:hive2://localhost:10000/default`) to submit HiveQL queries.

## Analytical Queries

The project contains several HQL scripts to answer business questions about the weather data. The outputs of these queries are saved locally in `data/results/hive/` for documentation purposes.

### 1. City Summary (`03_city_summary.hql`)
Calculates totals and averages for each city, allowing a 1:1 comparison with the Java MapReduce output from Phase 3.
**Result Comparison with Phase 3 MapReduce:**
The record counts and numeric aggregates perfectly match the Phase 3 MapReduce results (e.g., Bengaluru=28, Chennai=26, Delhi=30, Hyderabad=35, Mumbai=31; Total=150), confirming Hive accurately parsed the data.

### 2. Temperature Analysis (`04_temperature_analysis.hql`)
Finds average, max, and min temperatures for each city.

### 3. Rainfall Analysis (`05_rainfall_analysis.hql`)
Calculates total and average rainfall per city.

### 4. Humidity Analysis (`06_humidity_analysis.hql`)
Calculates average, max, and min humidity.

### 5. Wind Analysis (`07_wind_analysis.hql`)
Finds the average and maximum wind speeds.

### 6. Pressure Analysis (`08_pressure_analysis.hql`)
Calculates atmospheric pressure statistics.

### 7. Weather Conditions (`09_weather_conditions.hql`)
Aggregates the frequencies of text-based weather conditions.

### 8. Extreme Weather (`10_extreme_weather.hql`)
Filters and identifies severe weather events:
- Temperature >= 40.0
- Rainfall >= 20.0
- Wind Speed >= 20.0

## Execution Engine & YARN Involvement
By explicitly configuring `hive.execution.engine=mr` in `hive-site.xml`, Hive leverages the Hadoop MapReduce framework. 
When executing `GROUP BY`, `ORDER BY`, or aggregation queries, Hive parses the HQL, generates a MapReduce execution plan, and submits the job to the YARN `ResourceManager`. The progress is tracked exactly like a native Java MapReduce job, proving authentic distributed processing.

## Management Scripts
Helper scripts are located in `scripts/hive/`:
- `env.sh`: Exports `HIVE_HOME` and merges with Hadoop environments.
- `start-hive.sh`: Initializes Derby (if needed) and starts `HiveServer2`.
- `stop-hive.sh`: Terminates `HiveServer2`.
- `verify-hive.sh`: Checks processes, ports, and runs test queries.
- `run-analysis.sh`: Executes all HQL scripts via Beeline.
