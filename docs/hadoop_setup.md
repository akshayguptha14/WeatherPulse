# Phase 2: Hadoop Configuration (WSL)

## Overview
This project relies on a single-node, pseudo-distributed Apache Hadoop cluster running inside Windows Subsystem for Linux (WSL).

## Environment Details
* **Architecture:** WSL 2 (Ubuntu)
* **Java Version:** OpenJDK 17
* **Hadoop Version:** Apache Hadoop 3.5.0
* **HADOOP_HOME:** `~/bigdata/hadoop`
* **HDFS Storage:** Linux-native directories (`~/hadoop_data/namenode`, `~/hadoop_data/datanode`)

## Starting and Stopping Services
Custom shell scripts have been provided to manage the Hadoop lifecycle safely.

To **start** Hadoop (HDFS & YARN):
```bash
bash scripts/hadoop/start-hadoop.sh
```

To **stop** Hadoop:
```bash
bash scripts/hadoop/stop-hadoop.sh
```

To **verify** Hadoop processes:
```bash
bash scripts/hadoop/verify-hadoop.sh
```

## HDFS Structure
The following directory structure has been created inside HDFS for the project:
* `/weather/raw` — Raw ingested data (e.g., CSV files)
* `/weather/processed` — Cleaned/Processed data
* `/weather/streaming` — Live streaming outputs
* `/weather/mapreduce` — MapReduce job outputs
* `/weather/hive` — Hive warehouse tables

## Data Ingestion
To upload the sample Windows data into HDFS, run:
```bash
bash scripts/hadoop/upload-weather-data.sh
```

## Hadoop Web Interfaces
* **NameNode UI:** [http://localhost:9870](http://localhost:9870/)
* **ResourceManager UI:** [http://localhost:8088](http://localhost:8088/)
*(These are accessible directly from Windows via localhost routing).*
