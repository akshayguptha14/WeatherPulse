import React from 'react';
import { 
  X, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  Gauge, 
  Cloud, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Layers, 
  Database,
  ArrowRight,
  Info,
  Landmark
} from 'lucide-react';

const MapCityDetailCard = ({ cityNode, onClose }) => {
  if (!cityNode) return null;

  const {
    city,
    state,
    country,
    coordinates,
    elevation_meters,
    climate_zone,
    isGlobalSearch = false,
    isIndianState = false,
    location_type = 'State',
    representative_city = null,
    representative_weather_label = null,
    live = {},
    baseline = {},
    variance = {},
    alert_status = {},
    provenance = {}
  } = cityNode;

  const highestSev = alert_status.highest_severity || 'Normal';
  const hasAlerts = (alert_status.active_alert_count || 0) > 0;

  return (
    <div className="city-detail-drawer fade-in">
      {/* Header */}
      <div className="drawer-header">
        <div className="drawer-title-col">
          {isIndianState ? (
            <div className="drawer-badge-row">
              <span className="city-badge live-pill" style={{ background: 'rgba(6, 182, 212, 0.20)', borderColor: 'rgba(56, 189, 248, 0.50)', color: '#38bdf8' }}>
                <span className="live-dot pulse" style={{ backgroundColor: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }}></span> REPRESENTATIVE OBSERVATION
              </span>
              <span className="severity-badge" style={{ background: 'rgba(234, 179, 8, 0.18)', borderColor: 'rgba(234, 179, 8, 0.45)', color: '#facc15' }}>
                {location_type ? location_type.toUpperCase() : 'STATE'}
              </span>
              <span className="severity-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.35)', color: '#c084fc' }}>
                ON-DEMAND TELEMETRY
              </span>
            </div>
          ) : isGlobalSearch ? (
            <div className="drawer-badge-row">
              <span className="city-badge live-pill" style={{ background: 'rgba(6, 182, 212, 0.18)', borderColor: 'rgba(56, 189, 248, 0.45)', color: '#38bdf8' }}>
                <span className="live-dot pulse" style={{ backgroundColor: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }}></span> ON-DEMAND OBSERVATION
              </span>
              <span className="severity-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.35)', color: '#c084fc' }}>
                GLOBAL TELEMETRY
              </span>
            </div>
          ) : (
            <div className="drawer-badge-row">
              <span className="city-badge live-pill" style={{ background: 'rgba(16, 185, 129, 0.18)', borderColor: 'rgba(16, 185, 129, 0.45)', color: '#34d399' }}>
                <span className="live-dot pulse"></span> KAFKA & SPARK STREAMING (CONTINUOUS)
              </span>
              <span className={`severity-badge sev-${highestSev.toLowerCase()}`}>
                {highestSev.toUpperCase()} ALERT
              </span>
              <span className="severity-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' }}>
                MONITORED METROPOLIS
              </span>
            </div>
          )}
          <h2>{city}</h2>
          <p className="city-subtitle">
            <MapPin size={14} className="text-accent" />
            {isIndianState ? (
              <span>India • Representative Weather Location: <strong style={{ color: '#ffffff' }}>{representative_city}, {city}</strong> • Elevation: {elevation_meters}m</span>
            ) : (
              <span>{state}{country ? `, ${country}` : ''} • Elevation: {elevation_meters}m • {climate_zone}</span>
            )}
          </p>
        </div>
        <button className="drawer-close-btn" onClick={onClose} title="Close Panel">
          <X size={20} />
        </button>
      </div>

      {/* State Representative Weather Notification Banner */}
      {isIndianState && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: 'rgba(56, 189, 248, 0.10)',
          border: '1px solid rgba(56, 189, 248, 0.28)',
          borderRadius: '12px',
          padding: '10px 14px',
          margin: '0 0 16px 0',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        }}>
          <Info size={16} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: '1.45' }}>
            <div style={{ color: '#ffffff', fontWeight: '600', marginBottom: '2px' }}>
              {representative_weather_label || `Representative Weather — ${representative_city}`}
            </div>
            <span>
              Real-time weather for the state of <strong>{city}</strong> is observed live at regional capital / meteorological hub <strong>{representative_city}</strong> ({coordinates.lat.toFixed(2)}°N, {coordinates.lon.toFixed(2)}°E). State-wide spatial averaging is not applied to preserve authentic sensor telemetry integrity.
            </span>
          </div>
        </div>
      )}

      {/* Primary Weather Grid */}
      <div className="drawer-section">
        <h4 className="drawer-section-title">
          {isIndianState 
            ? `Current Meteorological Observations (${representative_weather_label || `Representative Weather — ${representative_city}`})`
            : 'Current Meteorological Observations'}
        </h4>
        <div className="drawer-metrics-grid">
          {/* Temperature */}
          <div className="drawer-metric-card">
            <div className="metric-icon-row">
              <Thermometer size={18} className="text-warning" />
              <span className="metric-label">Temperature</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-val">
                {live.temperature !== null && live.temperature !== undefined ? `${live.temperature}°C` : 'N/A'}
              </span>
              {!isGlobalSearch && variance.temperature_difference !== null && (
                <span className={`variance-pill ${variance.temperature_difference >= 0 ? 'pos' : 'neg'}`}>
                  {variance.temperature_difference >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {variance.temperature_difference >= 0 ? `+${variance.temperature_difference}` : variance.temperature_difference}°C
                </span>
              )}
            </div>
            <span className="metric-subtext">
              {isIndianState
                ? (live.apparent_temperature !== null && live.apparent_temperature !== undefined ? `Feels like: ${live.apparent_temperature}°C (${representative_city})` : 'Live Satellite/Sensor')
                : isGlobalSearch 
                  ? (live.apparent_temperature !== null && live.apparent_temperature !== undefined ? `Feels like: ${live.apparent_temperature}°C` : 'Live Satellite/Sensor')
                  : `Hist. Avg: ${baseline.avg_temperature ? `${baseline.avg_temperature}°C` : 'N/A'}`}
            </span>
          </div>

          {/* Humidity */}
          <div className="drawer-metric-card">
            <div className="metric-icon-row">
              <Droplets size={18} className="text-info" />
              <span className="metric-label">Relative Humidity</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-val">
                {live.humidity !== null && live.humidity !== undefined ? `${live.humidity}%` : 'N/A'}
              </span>
              {!isGlobalSearch && variance.humidity_difference !== null && (
                <span className={`variance-pill ${variance.humidity_difference >= 0 ? 'pos' : 'neg'}`}>
                  {variance.humidity_difference >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {variance.humidity_difference >= 0 ? `+${variance.humidity_difference}` : variance.humidity_difference}%
                </span>
              )}
            </div>
            <span className="metric-subtext">
              {!isGlobalSearch && baseline.avg_humidity ? `Hist. Avg: ${baseline.avg_humidity}%` : 'Atmospheric moisture level'}
            </span>
          </div>

          {/* Precipitation / Rainfall */}
          <div className="drawer-metric-card">
            <div className="metric-icon-row">
              <CloudRain size={18} className="text-accent" />
              <span className="metric-label">Precipitation & Rain</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-val">
                {live.rainfall !== null && live.rainfall !== undefined ? `${live.rainfall} mm` : '0.0 mm'}
              </span>
            </div>
            <span className="metric-subtext">
              {live.precipitation ? `Precip rate: ${live.precipitation} mm/h` : 'No current rain reported'}
            </span>
          </div>

          {/* Wind Speed & Direction */}
          <div className="drawer-metric-card">
            <div className="metric-icon-row">
              <Wind size={18} className="text-success" />
              <span className="metric-label">Wind Velocity</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-val">
                {live.wind_speed !== null && live.wind_speed !== undefined ? `${live.wind_speed} km/h` : 'N/A'}
              </span>
            </div>
            <span className="metric-subtext">
              {live.wind_direction !== null && live.wind_direction !== undefined ? `Bearing: ${live.wind_direction}°` : 'Calm breeze'}
            </span>
          </div>

          {/* Surface Atmospheric Pressure */}
          <div className="drawer-metric-card">
            <div className="metric-icon-row">
              <Gauge size={18} className="text-purple" />
              <span className="metric-label">Surface Pressure</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-val">
                {live.pressure !== null && live.pressure !== undefined ? `${Math.round(live.pressure)} hPa` : 'N/A'}
              </span>
              {!isGlobalSearch && variance.pressure_difference !== null && (
                <span className={`variance-pill ${variance.pressure_difference >= 0 ? 'pos' : 'neg'}`}>
                  {variance.pressure_difference >= 0 ? `+${variance.pressure_difference}` : variance.pressure_difference} hPa
                </span>
              )}
            </div>
            <span className="metric-subtext">
              Elevation adjusted barometric
            </span>
          </div>

          {/* Current Weather Condition */}
          <div className="drawer-metric-card">
            <div className="metric-icon-row">
              <Cloud size={18} className="text-info" />
              <span className="metric-label">Sky Condition</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-big-val" style={{ fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {live.weather_condition || 'Observation'}
              </span>
            </div>
            <span className="metric-subtext">
              WMO Weather Code: {live.weather_code ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Historical Baseline Comparison (Internal Monitored Cities Only) */}
      {!isGlobalSearch && (
        <div className="drawer-section">
          <h4 className="drawer-section-title">Big Data Climate Baselines (Hive & MapReduce)</h4>
          <div className="drawer-baseline-table">
            <div className="baseline-row header">
              <span>Metric</span>
              <span>Observed Live</span>
              <span>10-Yr Historical Baseline</span>
              <span>Variance</span>
            </div>
            <div className="baseline-row">
              <span className="metric-name">Temperature</span>
              <span className="val-live font-mono">{live.temperature !== null ? `${live.temperature}°C` : 'N/A'}</span>
              <span className="val-base font-mono">{baseline.avg_temperature ? `${baseline.avg_temperature}°C` : 'N/A'}</span>
              <span className={`val-var font-mono ${variance.temperature_difference >= 0 ? 'pos' : 'neg'}`}>
                {variance.temperature_difference !== null ? `${variance.temperature_difference >= 0 ? '+' : ''}${variance.temperature_difference}°C` : 'N/A'}
              </span>
            </div>
            <div className="baseline-row">
              <span className="metric-name">Humidity</span>
              <span className="val-live font-mono">{live.humidity !== null ? `${live.humidity}%` : 'N/A'}</span>
              <span className="val-base font-mono">{baseline.avg_humidity ? `${baseline.avg_humidity}%` : 'N/A'}</span>
              <span className={`val-var font-mono ${variance.humidity_difference >= 0 ? 'pos' : 'neg'}`}>
                {variance.humidity_difference !== null ? `${variance.humidity_difference >= 0 ? '+' : ''}${variance.humidity_difference}%` : 'N/A'}
              </span>
            </div>
            <div className="baseline-row">
              <span className="metric-name">Pressure</span>
              <span className="val-live font-mono">{live.pressure ? `${Math.round(live.pressure)} hPa` : 'N/A'}</span>
              <span className="val-base font-mono">{baseline.nominal_surface_pressure ? `${baseline.nominal_surface_pressure} hPa` : 'N/A'}</span>
              <span className={`val-var font-mono ${variance.pressure_difference >= 0 ? 'pos' : 'neg'}`}>
                {variance.pressure_difference !== null ? `${variance.pressure_difference >= 0 ? '+' : ''}${variance.pressure_difference} hPa` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Meteorological Alerts */}
      <div className="drawer-section">
        <h4 className="drawer-section-title">Active Meteorological Warnings</h4>
        {hasAlerts ? (
          <div className="drawer-alerts-list">
            {alert_status.alerts.map((al, idx) => (
              <div key={idx} className={`drawer-alert-item sev-${(al.severity || 'low').toLowerCase()}`}>
                <div className="alert-item-header">
                  <ShieldAlert size={16} />
                  <span className="alert-type">{al.alert_type || 'Weather Advisory'}</span>
                  <span className="alert-sev-tag font-mono">{(al.severity || 'LOW').toUpperCase()}</span>
                </div>
                <p className="alert-msg">{al.message}</p>
                <div className="alert-timestamp">
                  <Clock size={12} />
                  <span>{al.timestamp ? new Date(al.timestamp).toLocaleTimeString() : 'Active'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="drawer-empty-alerts">
            <ShieldAlert size={20} className="text-success" />
            <span>
              {isIndianState
                ? `Representative observations for ${city} (at ${representative_city}) show normal meteorological values.`
                : isGlobalSearch
                  ? `Live observations for ${city} show normal atmospheric parameters.`
                  : `All monitored parameters within safe historical bounds for ${city}.`}
            </span>
          </div>
        )}
      </div>

      {/* Pipeline Provenance Audit */}
      <div className="drawer-section">
        <h4 className="drawer-section-title">Real-Time Ingestion Provenance</h4>
        {isIndianState ? (
          <div className="drawer-provenance-box">
            <div className="prov-row">
              <span className="prov-label">Entity Category:</span>
              <span className="prov-val font-mono" style={{ color: '#facc15' }}>Indian {location_type || 'State'}</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Representative Station:</span>
              <span className="prov-val font-mono">{representative_city}, {city} ({coordinates.lat.toFixed(4)}°N, {coordinates.lon.toFixed(4)}°E)</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Observation Source:</span>
              <span className="prov-val font-mono">Open-Meteo Current Forecast API</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Observed Timestamp:</span>
              <span className="prov-val font-mono">{live.source_timestamp || 'Live API Response'}</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Storage Integrity:</span>
              <span className="prov-val font-mono" style={{ color: '#38bdf8' }}>Decoupled from Kafka/HDFS (On-demand live query)</span>
            </div>
            <div className="prov-transport-flow">
              <span className="flow-step">Open-Meteo API</span>
              <ArrowRight size={12} className="text-muted" />
              <span className="flow-step">Representative Query ({representative_city})</span>
              <ArrowRight size={12} className="text-muted" />
              <span className="flow-step">Liquid Glass Drawer</span>
            </div>
          </div>
        ) : isGlobalSearch ? (
          <div className="drawer-provenance-box">
            <div className="prov-row">
              <span className="prov-label">Coordinates:</span>
              <span className="prov-val font-mono">{coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Observation Source:</span>
              <span className="prov-val font-mono">Open-Meteo On-Demand Weather API</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Observed Timestamp:</span>
              <span className="prov-val font-mono">{live.source_timestamp || 'Live API Response'}</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Storage Integrity:</span>
              <span className="prov-val font-mono" style={{ color: '#38bdf8' }}>Decoupled from Kafka/HDFS (Not persisted)</span>
            </div>
            <div className="prov-transport-flow">
              <span className="flow-step">Open-Meteo API</span>
              <ArrowRight size={12} className="text-muted" />
              <span className="flow-step">Direct Client Query</span>
              <ArrowRight size={12} className="text-muted" />
              <span className="flow-step">Liquid Glass UI</span>
            </div>
          </div>
        ) : (
          <div className="drawer-provenance-box">
            <div className="prov-row">
              <span className="prov-label">Coordinates:</span>
              <span className="prov-val font-mono">{coordinates.lat.toFixed(4)}°N, {coordinates.lon.toFixed(4)}°E</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Pipeline Ingestion:</span>
              <span className="prov-val font-mono" style={{ color: '#34d399' }}>Kafka & Spark Streaming (5 Metropolises)</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Source Observed:</span>
              <span className="prov-val font-mono">{live.source_timestamp || 'N/A'}</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Kafka Ingested:</span>
              <span className="prov-val font-mono">{live.ingest_timestamp || 'N/A'}</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Spark Processing:</span>
              <span className="prov-val font-mono">{live.spark_processing_timestamp || 'N/A'}</span>
            </div>
            <div className="prov-row">
              <span className="prov-label">Storage Integrity:</span>
              <span className="prov-val font-mono" style={{ color: '#38bdf8' }}>Persisted in Big Data Lakehouse (HDFS / Hive)</span>
            </div>
            <div className="prov-transport-flow">
              <span className="flow-step">Open-Meteo</span>
              <ArrowRight size={12} className="text-muted" />
              <span className="flow-step">Kafka: weather_stream</span>
              <ArrowRight size={12} className="text-muted" />
              <span className="flow-step">Spark Streaming</span>
              <ArrowRight size={12} className="text-muted" />
              <span className="flow-step">HDFS Parquet</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapCityDetailCard;
