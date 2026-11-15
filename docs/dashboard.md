# React Big Data Dashboard Documentation

## Overview
The React application (`frontend/`) visualizes both historical analytical results (from Hive and MapReduce) and near-real-time streaming data (from Kafka and Spark) served securely through the Flask API layer.

## Layout & Architecture
The dashboard employs a modern, responsive layout (`App.jsx` + `App.css`) structured around data pipelines rather than generic weather.

### 1. Header
- Displays the general pipeline architecture.
- Controls data refresh events through centralized state mapping.

### 2. Ecosystem Status
- Components: `EcosystemStatus.jsx`
- Polls `/api/ecosystem` every 15 seconds.
- Accurately renders whether HDFS, YARN, Kafka, Spark, Hive, and MapReduce are online. Does not use mock "Running" strings.

### 3. KPI Cards
- Components: `KPICards.jsx`
- Fetches totals and averages across the entire dataset.

### 4. Analytical Charts
- Components: `TemperatureChart.jsx`, `RainfallChart.jsx`, `HumidityChart.jsx`, `WindAnalysis.jsx`
- Utilizing Recharts, these modules convert structured JSON from Hive MapReduce aggregations into visual insights.

### 5. Historical Analysis
- Components: `HistoricalAnalysis.jsx`
- A raw data table showing exact city-level aggregations calculated by the Hadoop MapReduce / Hive engine.

### 6. Live Stream Monitor & Alerts
- Components: `StreamingTable.jsx`, `AlertsPanel.jsx`
- Distinctly separated from historical data. Represents the **Kafka -> Spark -> HDFS** pipeline.
- Polls `/api/stream/recent` every 10 seconds.
- Applies CSS animations when new records enter the pipeline.
- Scans ingested records to trigger severe weather threshold alerts (e.g., Temperature >= 40°C).

## Interaction with Backend
The React frontend handles failed APIs gracefully using Skeleton loading states and Error boundary components. The API configuration resides centrally in `src/services/api.js`.
