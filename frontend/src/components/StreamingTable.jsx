import React, { useState, useEffect } from 'react';
import { getRecentStream } from '../services/api';
import { Activity, Loader2, AlertCircle, Database } from 'lucide-react';

const formatTimestamp = (ts) => {
  if (!ts) return 'N/A';
  let clean = ts.replace(/^LIVE\|/, '');
  // Format to YYYY-MM-DD HH:mm:ss
  clean = clean.split('.')[0].replace('T', ' ');
  return clean;
};

const StreamingTable = ({ refreshTrigger, streamRecords = null }) => {
  const [data, setData] = useState(streamRecords || []);
  const [loading, setLoading] = useState(!streamRecords);
  const [error, setError] = useState(null);

  const fetchStream = () => {
    getRecentStream().then(res => {
      setData(res || []);
      setLoading(false);
      setError(null);
    }).catch(err => {
      setError("Stream data currently unavailable from backend");
      setLoading(false);
    });
  };

  useEffect(() => {
    if (streamRecords) {
      setData(streamRecords);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchStream();
    
    // Auto refresh streaming data every 15 seconds
    const interval = setInterval(fetchStream, 15000);
    return () => clearInterval(interval);
  }, [refreshTrigger, streamRecords]);

  if (loading && data.length === 0) {
    return (
      <section className="streaming-card">
        <div className="card-header-flex">
          <div>
            <h3 style={{ margin: '0 0 4px 0' }}>Live Stream Microbatch Records</h3>
            <span className="source-label streaming">Kafka &rarr; Spark Streaming &rarr; HDFS Parquet</span>
          </div>
          <span className="live-pulse"><Activity size={16} /> LIVE</span>
        </div>
        <div className="empty-state">
          <Loader2 size={24} className="animate-spin" style={{marginBottom: '8px'}} />
          <div>Loading live stream records...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="streaming-card">
      <div className="card-header-flex">
        <div>
          <h3 style={{ margin: '0 0 4px 0' }}>Live Stream Microbatch Records</h3>
          <span className="source-label streaming">Kafka &rarr; Spark Streaming &rarr; HDFS Parquet</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge-live-tag">
            <span className="live-dot pulse"></span>
            {data.length} Recent Observations
          </span>
        </div>
      </div>
      
      {error && data.length === 0 ? (
        <div className="empty-state error">
          <AlertCircle size={24} className="text-warning" style={{marginBottom: '8px'}} />
          <div>{error}</div>
          <button className="btn-secondary btn-sm mt-3" onClick={() => { setLoading(true); fetchStream(); }}>Retry</button>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <Activity size={24} style={{marginBottom: '8px', color: 'var(--accent)'}} />
          <div>Waiting for live weather data...</div>
          <p className="text-muted" style={{fontSize: '0.8rem', marginTop: '4px'}}>
            Live micro-batches are being processed by Spark and stored in HDFS.
          </p>
        </div>
      ) : (
        <div className="table-responsive streaming-table-container">
          <table className="data-table streaming-table">
            <thead>
              <tr>
                <th className="sticky-col">City</th>
                <th>Temp (&deg;C)</th>
                <th>Humidity</th>
                <th>Rainfall</th>
                <th>Wind</th>
                <th>Pressure</th>
                <th>Condition</th>
                <th>Source Time (Open-Meteo)</th>
                <th>Ingest Time (Kafka)</th>
                <th>Process Time (Spark)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="new-row-animation">
                  <td className="sticky-col"><strong>{row.city}</strong></td>
                  <td>{row.temperature !== null && row.temperature !== undefined ? `${row.temperature}°C` : 'N/A'}</td>
                  <td>{row.humidity !== null && row.humidity !== undefined ? `${row.humidity}%` : 'N/A'}</td>
                  <td>{row.rainfall !== null && row.rainfall !== undefined ? `${row.rainfall} mm` : 'N/A'}</td>
                  <td>{row.wind_speed !== null && row.wind_speed !== undefined ? `${row.wind_speed} km/h` : 'N/A'}</td>
                  <td>{row.pressure !== null && row.pressure !== undefined ? `${row.pressure} hPa` : 'N/A'}</td>
                  <td><span className="condition-pill">{row.weather_condition || 'N/A'}</span></td>
                  <td className="time-col">{formatTimestamp(row.source_timestamp)}</td>
                  <td className="time-col">{formatTimestamp(row.ingest_timestamp)}</td>
                  <td className="time-col">{formatTimestamp(row.spark_processing_timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default StreamingTable;
