import React, { useState, useEffect } from 'react';
import EcosystemStatus from '../components/EcosystemStatus';
import KPICards from '../components/KPICards';
import TemperatureChart from '../components/TemperatureChart';
import RainfallChart from '../components/RainfallChart';
import HumidityChart from '../components/HumidityChart';
import PipelineVisualizer from '../components/PipelineVisualizer';
import { getCities } from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

const DashboardView = ({ refreshTrigger }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    getCities().then(res => {
      if (isMounted) {
        if (res && res.length > 0) {
          setData(res);
        } else {
          setData([]);
        }
        setLoading(false);
      }
    }).catch(err => {
      if (isMounted) {
        console.error("Error fetching cities for dashboard:", err);
        setError("Unable to load analytics");
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <div className="header-badge-row">
          <span className="live-status-pill">
            <span className="live-dot pulse"></span>
            BIG DATA PLATFORM
          </span>
          <span className="source-label streaming">
            Hadoop HDFS • YARN • Kafka • Spark Streaming • Hive
          </span>
        </div>
        <h2>Dashboard Overview</h2>
        <p>Enterprise cluster telemetry, dual batch & streaming pipelines, and city meteorological analytics</p>
      </div>

      <PipelineVisualizer />
      
      <EcosystemStatus refreshTrigger={refreshTrigger} />
      
      <KPICards refreshTrigger={refreshTrigger} />
      
      {loading ? (
        <div className="chart-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <Loader2 size={24} className="animate-spin" style={{margin: '0 auto 10px', color: 'var(--accent)'}} />
          <div>Loading analytics...</div>
        </div>
      ) : error ? (
        <div className="chart-card error-card">
          <div className="empty-state error">
            <AlertCircle size={28} className="text-warning" style={{margin: '0 auto 10px'}} />
            <h3>Unable to load analytics</h3>
            <p className="text-muted" style={{fontSize: '0.9rem'}}>{error}</p>
            <button className="btn-primary mt-3" onClick={() => {
              setLoading(true);
              setError(null);
              getCities().then(res => {
                setData(res || []);
                setLoading(false);
              }).catch(err => {
                setError("Unable to load analytics");
                setLoading(false);
              });
            }}>Retry</button>
          </div>
        </div>
      ) : (
        <div className="dashboard-charts-grid">
          <TemperatureChart data={data} refreshTrigger={refreshTrigger} />
          <RainfallChart data={data} refreshTrigger={refreshTrigger} />
          <HumidityChart data={data} refreshTrigger={refreshTrigger} />
        </div>
      )}
    </div>
  );
};

export default DashboardView;
