# System Architecture

## Data Flow Pipeline

1. **Data Source / API / CSV**  
   Weather data (temperature, humidity, rainfall, wind_speed, pressure, weather_condition) for sample cities is simulated or ingested from an external API.

2. **Apache Kafka (Ingestion)**  
   A Python Kafka Producer streams the data into a Kafka topic (`weather_data`), acting as a highly reliable, scalable messaging system.

3. **Apache Spark Streaming (Near Real-Time Processing)**  
   Spark Streaming consumes the data from the Kafka topic, performs near real-time transformations and aggregations, and writes the processed output to HDFS.

4. **Hadoop HDFS (Distributed Storage)**  
   HDFS serves as the primary data lake, durably storing both the raw ingested data and the processed streaming data across a distributed cluster.

5. **Hadoop MapReduce & Apache Hive (Batch Analytics)**  
   - **YARN** manages the compute resources.
   - **MapReduce** jobs (written in Java) periodically run complex batch analyses on the historical HDFS data.
   - **Hive** overlays a schema on the HDFS data, allowing analytical queries using HiveQL (e.g., finding temperature trends, average rainfall per city).

6. **Flask REST API (Serving Layer)**  
   A Python Flask application connects to HDFS/Hive (via PyHive or similar connectors) and Spark output to expose the analyzed data through RESTful endpoints.

7. **React Dashboard (Visualization)**  
   A modern React (Vite) frontend application fetches data from the Flask API and displays it using charting libraries (Recharts/Chart.js).

## Component Architecture

```text
[ Weather API / CSV ]
        |
        v
[ Kafka Producer ] ---> [ Kafka Topic ] ---> [ Spark Streaming ] ---> [ HDFS ]
                                                                        |
                                                                        v
                                                              [ MapReduce + Hive ]
                                                                        |
                                                                        v
[ React Dashboard ] <----------------------------------------- [ Flask REST API ]
```
