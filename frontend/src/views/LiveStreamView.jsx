import React, { useState, useEffect } from 'react';
import { getRecentStream, getHistorical } from '../services/api';
import LiveWeatherPanel from '../components/LiveWeatherPanel';
import KafkaStreamMetrics from '../components/KafkaStreamMetrics';
import LiveCharts from '../components/LiveCharts';
import LiveCityComparison from '../components/LiveCityComparison';
import StreamingTable from '../components/StreamingTable';
import EcosystemStatus from '../components/EcosystemStatus';
import { CloudLightning, Radio, Layers, Database } from 'lucide-react';

const LiveStreamView = ({ refreshTrigger }) => {
  const [streamData, setStreamData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [liveByCity, setLiveByCity] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAllData = () => {
    Promise.allSettled([
      getRecentStream(),
      getHistorical()
    ]).then(([streamRes, histRes]) => {
      const streams = streamRes.status === 'fulfilled' && streamRes.value ? streamRes.value : [];
      const hists = histRes.status === 'fulfilled' && histRes.value ? histRes.value : [];

      setStreamData(streams);
      setHistoricalData(hists);

      // Group latest live record by city
      const byCity = {};
      for (const row of streams) {
        if (row.city && !byCity[row.city]) {
          byCity[row.city] = row;
        }
      }
      setLiveByCity(byCity);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 15000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  return (
    <div className="view-container fade-in">
      {/* View Header */}
      <div className="view-header">
        <div className="header-badge-row">
          <span className="live-status-pill">
            <span className="live-dot pulse"></span>
            REAL-TIME PIPELINE
          </span>
          <span className="source-label streaming">Open-Meteo &rarr; Kafka &rarr; Spark Streaming &rarr; HDFS</span>
        </div>
        <h2>Live Climate Stream Monitor</h2>
        <p>Continuous event ingestion, Spark micro-batch processing, and real-time comparative analytics</p>
      </div>

      {/* 1. Real-Time Kafka Ingestion & Infrastructure Telemetry */}
      <KafkaStreamMetrics refreshTrigger={refreshTrigger} />

      {/* 2. Live Weather 5-City Observation Cards (Temp, Hum, Rain, Wind, Press, Cond) */}
      <LiveWeatherPanel refreshTrigger={refreshTrigger} />

      {/* 3. Live Temperature & Humidity Comparative Charts */}
      <LiveCharts streamData={streamData} />

      {/* 4. City-Wise Comparative Matrix & Live vs Historical Variance */}
      <LiveCityComparison liveData={liveByCity} historicalData={historicalData} />

      {/* 5. Bottom Stream Layout: Raw Microbatch Table + Pipeline Architecture */}
      <div className="stream-layout">
        <div className="stream-main">
          <StreamingTable refreshTrigger={refreshTrigger} streamRecords={streamData} />
        </div>
        <div className="stream-sidebar">
          <div className="info-card live-source-card">
            <div className="source-info-header">
              <CloudLightning size={20} className="source-icon" />
              <h3>Data Source &amp; Architecture</h3>
            </div>
            
            <div className="source-info-section">
              <span className="source-info-tag">LIVE SOURCE</span>
              <div className="source-info-title">Open-Meteo API (5 Cities)</div>
              <p className="source-info-desc">
                Real-time API observations polled every 60s for Bengaluru, Delhi, Mumbai, Chennai, and Hyderabad.
              </p>
            </div>

            <div className="source-info-divider"></div>

            <div className="source-info-section">
              <span className="source-info-tag">INGESTION &amp; STREAMING</span>
              <div className="source-info-title">Kafka &rarr; Spark &rarr; HDFS</div>
              <p className="source-info-desc">
                Event publication to topic <code>weather_stream</code> on port 9092, consumed by Spark Structured Streaming on YARN, persisted as Parquet to HDFS.
              </p>
            </div>

            <div className="source-info-divider"></div>

            <div className="source-info-section">
              <span className="source-info-tag">HISTORICAL BASELINE</span>
              <div className="source-info-title">Hadoop MapReduce &rarr; Hive</div>
              <p className="source-info-desc">
                Aggregated batch statistics computed from historical archives, providing variance comparison against real-time measurements.
              </p>
            </div>
          </div>
          
          <EcosystemStatus refreshTrigger={refreshTrigger} minimal={true} />
        </div>
      </div>
    </div>
  );
};

export default LiveStreamView;
