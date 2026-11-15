import React, { useState, useEffect } from 'react';
import { getSummary } from '../services/api';
import { 
  Database, 
  MapPin, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const KPI_CONFIG = [
  { key: 'total_records', label: 'Total Observations', icon: Database, color: '#38bdf8', unit: 'records', format: (v) => v?.toLocaleString() },
  { key: 'cities_monitored', label: 'Metropolises Monitored', icon: MapPin, color: '#c4b5fd', unit: 'Indian cities', format: (v) => `${v} / 5 Active` },
  { key: 'average_temperature', label: 'Mean Temperature', icon: Thermometer, color: '#f59e0b', unit: '°C baseline', format: (v) => `${v}°C` },
  { key: 'average_humidity', label: 'Mean Relative Humidity', icon: Droplets, color: '#06b6d4', unit: '% saturation', format: (v) => `${v}%` },
  { key: 'total_rainfall', label: 'Cumulative Rainfall', icon: CloudRain, color: '#818cf8', unit: 'mm volume', format: (v) => `${Math.round(v || 0)} mm` },
  { key: 'average_wind_speed', label: 'Mean Wind Velocity', icon: Wind, color: '#10b981', unit: 'km/h surface', format: (v) => `${v} km/h` },
];

const KPICards = ({ refreshTrigger }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = () => {
    setLoading(true);
    setError(null);
    getSummary()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Summary telemetry unavailable");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <section className="wp-kpi-showcase-grid">
        {KPI_CONFIG.map((cfg, i) => (
          <div key={i} className="wp-kpi-glass-card wp-kpi-loading">
            <div className="wp-kpi-card-header">
              <span className="wp-kpi-label-skeleton"></span>
              <span className="wp-kpi-icon-skeleton"></span>
            </div>
            <div className="wp-kpi-val-skeleton"></div>
            <div className="wp-kpi-sub-skeleton"></div>
          </div>
        ))}
      </section>
    );
  }

  if (error || !data) {
    return (
      <div className="wp-kpi-error-card">
        <AlertCircle size={20} className="text-warning" />
        <span>{error || "Summary telemetry unavailable"}</span>
        <button className="btn-secondary btn-sm" onClick={fetchSummary}>Retry</button>
      </div>
    );
  }

  return (
    <section className="wp-kpi-showcase-grid">
      {KPI_CONFIG.map((cfg) => {
        const Icon = cfg.icon;
        const rawVal = data[cfg.key];
        const displayVal = cfg.format(rawVal);

        return (
          <div 
            key={cfg.key} 
            className="wp-kpi-glass-card" 
            style={{ '--card-accent': cfg.color }}
          >
            <div className="wp-kpi-card-header">
              <span className="wp-kpi-card-title">{cfg.label}</span>
              <div className="wp-kpi-icon-box">
                <Icon size={18} style={{ color: cfg.color }} />
              </div>
            </div>

            <div className="wp-kpi-card-body">
              <div className="wp-kpi-main-number">{displayVal}</div>
              <div className="wp-kpi-unit-tag">{cfg.unit}</div>
            </div>

            <div className="wp-kpi-bottom-glow"></div>
          </div>
        );
      })}
    </section>
  );
};

export default KPICards;
