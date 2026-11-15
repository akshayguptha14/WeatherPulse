import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  Gauge, 
  ShieldAlert, 
  Layers, 
  RefreshCw 
} from 'lucide-react';

const METRIC_LAYERS = [
  { id: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, color: '#f59e0b' },
  { id: 'humidity', label: 'Humidity', unit: '%', icon: Droplets, color: '#06b6d4' },
  { id: 'rainfall', label: 'Rainfall Rate', unit: 'mm/h', icon: CloudRain, color: '#3b82f6' },
  { id: 'wind_speed', label: 'Wind Velocity', unit: 'km/h', icon: Wind, color: '#10b981' },
  { id: 'pressure', label: 'Surface Pressure', unit: 'hPa', icon: Gauge, color: '#a855f7' },
  { id: 'alerts', label: 'Alert Severity', unit: '', icon: ShieldAlert, color: '#ef4444' }
];

const MapLayerControls = ({ 
  activeLayer, 
  onSelectLayer, 
  selectedCity, 
  onSelectCity, 
  cities = [], 
  onRefresh, 
  loading 
}) => {
  return (
    <div className="map-layer-controls-card">
      <div className="map-layer-header">
        <div className="map-layer-title">
          <Layers size={18} className="text-accent" />
          <span>Metric Layer Overlay:</span>
        </div>
        <div className="layer-pills-row">
          {METRIC_LAYERS.map(layer => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                className={`layer-pill-btn ${isActive ? 'active' : ''}`}
                style={isActive ? { borderColor: layer.color, backgroundColor: `${layer.color}15` } : {}}
                onClick={() => onSelectLayer(layer.id)}
              >
                <Icon size={14} style={{ color: isActive ? layer.color : 'var(--text-muted)' }} />
                <span>{layer.label}</span>
                {layer.unit && <span className="layer-unit">({layer.unit})</span>}
              </button>
            );
          })}
        </div>
        <button 
          className="map-refresh-btn" 
          onClick={onRefresh} 
          disabled={loading}
          title="Refresh live map telemetry"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* City Jump Pills */}
      <div className="map-city-jump-row">
        <span className="jump-label">Jump to City:</span>
        <button
          className={`city-jump-chip ${!selectedCity ? 'active' : ''}`}
          onClick={() => onSelectCity(null)}
        >
          India (All 5 Cities)
        </button>
        {cities.map(c => {
          const isSelected = selectedCity?.city === c.city;
          const sev = c.alert_status?.highest_severity || 'Normal';
          return (
            <button
              key={c.city}
              className={`city-jump-chip ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectCity(c)}
            >
              <span className={`city-jump-dot sev-${sev.toLowerCase()}`}></span>
              <span>{c.city}</span>
              {c.live?.temperature !== null && (
                <span className="city-jump-temp">{c.live.temperature}°C</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MapLayerControls;
