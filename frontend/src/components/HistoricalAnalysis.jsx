import React, { useState, useEffect } from 'react';
import { getHistorical } from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

const HistoricalAnalysis = ({ refreshTrigger }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistorical = () => {
    setLoading(true);
    setError(null);
    getHistorical().then(res => {
      if (res && res.length > 0) {
        setData(res);
      } else {
        setData([]);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Historical request failed", err);
      setError("Unable to load historical climate data from Hive/MapReduce.");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchHistorical();
  }, [refreshTrigger]);

  if (loading && data.length === 0) {
    return (
      <section className="historical-card">
        <div className="card-header-flex">
          <h3>Historical Climate Analysis <span className="source-label">MapReduce &rarr; Hive</span></h3>
        </div>
        <div className="empty-state">
          <Loader2 size={24} className="animate-spin" style={{marginBottom: '8px', color: 'var(--accent)'}} />
          <div>Loading historical analytics from Hive/MapReduce...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="historical-card">
      <div className="card-header-flex">
        <h3>Historical Climate Analysis <span className="source-label">MapReduce &rarr; Hive</span></h3>
      </div>
      {error && data.length === 0 ? (
        <div className="empty-state error">
          <AlertCircle size={28} className="text-warning" style={{marginBottom: '8px'}} />
          <div>{error}</div>
          <button className="btn-secondary btn-sm mt-3" onClick={fetchHistorical}>Retry</button>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">No historical data available.</div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sticky-col">City</th>
                <th>Records</th>
                <th>Avg Temp (&deg;C)</th>
                <th>Min Temp</th>
                <th>Max Temp</th>
                <th>Avg Humidity (%)</th>
                <th>Total Rainfall (mm)</th>
                <th>Avg Wind (km/h)</th>
                <th>Avg Pressure (hPa)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="sticky-col"><strong>{row.city}</strong></td>
                  <td>{row.records}</td>
                  <td>{row.avg_temperature}</td>
                  <td>{row.min_temperature}</td>
                  <td>{row.max_temperature}</td>
                  <td>{row.avg_humidity}</td>
                  <td>{row.total_rainfall}</td>
                  <td>{row.avg_wind_speed}</td>
                  <td>{row.avg_pressure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default HistoricalAnalysis;
