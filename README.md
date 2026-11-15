# Weather & Climate Real-Time Big Data Analytics

An end-to-end Big Data project demonstrating real-time and historical weather data processing using the Hadoop ecosystem.

## LIVE WEATHER API INTEGRATION
The project supports historical weather analytics using the existing CSV dataset and real-time weather ingestion using the Open-Meteo API. Live observations are published to Kafka, processed using Spark Structured Streaming, stored in HDFS, and exposed through the Flask/React application. 
For more details, see [Live Weather API Documentation](docs/live_weather_api.md).

## Technologies Used
- **Hadoop HDFS**: Distributed storage of historical and streamed weather data
- **Hadoop MapReduce**: Batch analysis of weather datasets
- **Apache Hive**: SQL-like analytics over data stored in HDFS
- **Apache Spark**: Fast and near-real-time data processing
- **Apache Kafka**: Continuous weather data streaming
- **Hadoop YARN**: Resource/job management
- **Flask REST API**: Backend to serve analyzed data
- **React**: Dashboard for visualizing processed weather information

## Architecture
See [docs/architecture.md](docs/architecture.md) for details on the data flow and system design.
See [docs/hadoop_setup.md](docs/hadoop_setup.md) for Hadoop pseudo-distributed cluster setup instructions.
See [docs/mapreduce_analysis.md](docs/mapreduce_analysis.md) for MapReduce batch processing implementation.
See [docs/hive_analysis.md](docs/hive_analysis.md) for Apache Hive analytics implementation.

## Running Phase 4 (Apache Hive)

**Ensure Hadoop is running** and raw data is present in HDFS.

1. Start HiveServer2:
   ```bash
   bash scripts/hive/start-hive.sh
   ```
2. Wait ~30 seconds, then verify Hive is running and accessible:
   ```bash
   bash scripts/hive/verify-hive.sh
   ```
3. Run the analytical queries:
   ```bash
   bash scripts/hive/run-analysis.sh
   ```
4. View the results stored in `data/results/hive/`.

## Running Phase 3 (Hadoop MapReduce)

**Ensure Hadoop is running** and raw data is present in HDFS (`/weather/raw`).

1. Build the MapReduce job:
   ```bash
   bash scripts/mapreduce/build-weather-job.sh
   ```
2. Execute the job on YARN:
   ```bash
   bash scripts/mapreduce/run-weather-job.sh
   ```
3. View the generated statistics:
   ```bash
   hdfs dfs -cat /weather/mapreduce/city_weather_stats/part-r-00000
   ```

## Running Phase 6 (Flask & React Dashboard Integration)

To run the full integrated dashboard pipeline:

1. **Terminal 1 — Hadoop/YARN & Hive:**
   ```bash
   ./scripts/hadoop/start-dfs.sh
   ./scripts/hadoop/start-yarn.sh
   ./scripts/hive/start-hive.sh
   ```

2. **Terminal 2 — Kafka:**
   ```bash
   ./scripts/kafka/start-kafka.sh
   ```

3. **Terminal 3 — Spark Streaming:**
   ```bash
   ./scripts/spark/run-streaming.sh
   ```

4. **Terminal 4 — Flask Backend:**
   Open a Windows Command Prompt/PowerShell.
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

5. **Terminal 5 — React Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Terminal 6 — Kafka Producer:**
   To see live data arriving in the dashboard:
   ```bash
   cd kafka_streams
   python3 producer.py --interval 1.0 --max-records 100
   ```

## Running Phase 5 (Real-Time Kafka & Spark Streaming)

To run the real-time pipeline:

1. **Start Kafka KRaft Server:**
   ```bash
   ./scripts/kafka/init-kafka.sh
   ./scripts/kafka/start-kafka.sh
   ./scripts/kafka/create-topic.sh
   ```

2. **Start Spark Structured Streaming:**
   Ensure HDFS and YARN are running (`start-dfs.sh` and `start-yarn.sh`), then launch:
   ```bash
   ./scripts/spark/run-streaming.sh
   ```

3. **Produce Real-Time Data:**
   In a separate WSL terminal, run the simulated CSV Replay Producer:
   ```bash
   cd kafka_streams
   python3 producer.py --interval 1.0 --max-records 50
   ```

Spark will consume the Kafka stream and persist micro-batches to HDFS at `/weather/streaming/raw`.

## Running Phase 1 (Frontend & Backend)

### Backend (Flask)
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `python app.py`

### Frontend (React)
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
