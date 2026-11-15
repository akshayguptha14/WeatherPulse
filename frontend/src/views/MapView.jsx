import React, { useState, useEffect, useRef } from 'react';
import { getMapCities } from '../services/api';
import WeatherMap from '../components/WeatherMap';
import MapLayerControls from '../components/MapLayerControls';
import MapCityDetailCard from '../components/MapCityDetailCard';
import GlobalWeatherSearch from '../components/GlobalWeatherSearch';
import { fetchCurrentWeather } from '../services/openMeteoService';
import { 
  Compass, 
  MapPin, 
  ShieldAlert, 
  Thermometer, 
  Layers, 
  Clock, 
  Loader2, 
  AlertCircle,
  Database,
  Radio,
  Maximize2,
  Minimize2
} from 'lucide-react';

const MapView = ({ refreshTrigger }) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLayer, setActiveLayer] = useState('temperature');
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [loadingSearchedWeather, setLoadingSearchedWeather] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapStageRef = useRef(null);

  const fetchMapData = (forceFresh = false) => {
    setLoading(true);
    getMapCities(forceFresh)
      .then(res => {
        if (res && res.cities) {
          setMapData(res);
          // If a city was previously selected, update its reference with newest live telemetry
          if (selectedCity && !selectedCity.isGlobalSearch) {
            const updated = res.cities.find(c => c.city === selectedCity.city);
            if (updated) setSelectedCity(updated);
          }
        }
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching map telemetry:", err);
        setError("Unable to load map data. Please check backend connection.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(() => {
      fetchMapData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  // Fullscreen escape key & window event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const cities = mapData?.cities || [];

  // Computed summary metrics
  const totalCities = cities.length;
  const activeAlertsCount = cities.reduce((acc, c) => acc + (c.alert_status?.active_alert_count || 0), 0);
  
  // Find highest severity across all monitored cities
  const severityRank = { 'Critical': 4, 'High': 3, 'Moderate': 2, 'Low': 1, 'Normal': 0 };
  let highestOverallSev = 'Normal';
  cities.forEach(c => {
    const s = c.alert_status?.highest_severity || 'Normal';
    if (severityRank[s] > severityRank[highestOverallSev]) {
      highestOverallSev = s;
    }
  });

  // Calculate live average temperature across the 5 monitored cities
  const validTemps = cities.map(c => c.live?.temperature).filter(t => t !== null && t !== undefined);
  const avgTemp = validTemps.length > 0 
    ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1)
    : 'N/A';

  const handleSelectGlobalLocation = async (loc) => {
    setLoadingSearchedWeather(true);
    setSearchError(null);
    try {
      const weatherNode = await fetchCurrentWeather(loc.latitude, loc.longitude, loc);
      setSearchedLocation(weatherNode);
      setSelectedCity(weatherNode);
    } catch (err) {
      console.error("Failed to fetch weather for searched location:", err);
      setSearchError("Unable to fetch weather for selected location. Please try again.");
    } finally {
      setLoadingSearchedWeather(false);
    }
  };

  const handleResetToIndia = () => {
    setSearchedLocation(null);
    setSelectedCity(null);
    setSearchError(null);
  };

  const handleSelectCity = (c) => {
    if (!c) {
      handleResetToIndia();
    } else {
      setSelectedCity(c);
    }
  };

  return (
    <div className="view-container fade-in">
      {/* View Header with Clear Continuous vs On-Demand Differentiation */}
      <div className="view-header">
        <div className="header-badge-row">
          <span className="live-status-pill">
            <span className="live-dot pulse"></span>
            KAFKA & SPARK STREAMING
          </span>
          <span className="source-label streaming">
            Continuous Big Data Pipeline (5 Metropolises: Bengaluru, Chennai, Delhi, Hyderabad, Mumbai) • OpenStreetMap Engine
          </span>
          {searchedLocation && (
            <span className="source-label on-demand" style={{ background: 'rgba(6, 182, 212, 0.16)', borderColor: 'rgba(56, 189, 248, 0.40)', color: '#38bdf8' }}>
              On-Demand Global Telemetry (Open-Meteo)
            </span>
          )}
        </div>
        <h2>Interactive Weather Map</h2>
        <p>Full-width spatial visualization with metric-scaled markers, dynamic layer scales, and distinct continuous vs. on-demand telemetry</p>
      </div>

      {/* Top Telemetry KPI Bar */}
      <div className="map-kpi-summary-bar">
        <div className="map-kpi-pill" title="5 Core Metropolises continuously streamed via Apache Kafka & Spark">
          <MapPin size={15} className="text-accent" />
          <span className="kpi-title">Monitored Cities:</span>
          <span className="kpi-val font-mono">{totalCities} / 5 Active (Kafka/Spark)</span>
        </div>
        <div className="map-kpi-pill" title="Real-time arithmetic mean of the 5 continuously monitored Indian metropolises">
          <Thermometer size={15} className="text-warning" />
          <span className="kpi-title">National Mean Temp (5 Cities):</span>
          <span className="kpi-val font-mono">{avgTemp !== 'N/A' ? `${avgTemp}°C` : 'N/A'}</span>
        </div>
        <div className="map-kpi-pill" title="Highest active warning among the 5 monitored metropolises">
          <ShieldAlert size={15} className={`sev-${highestOverallSev.toLowerCase()}`} />
          <span className="kpi-title">Highest Active Alert:</span>
          <span className={`kpi-val severity-tag sev-${highestOverallSev.toLowerCase()}`}>
            {highestOverallSev.toUpperCase()}
          </span>
        </div>
        <div className="map-kpi-pill" title="Authentic sync timestamp of last Kafka & Spark Streaming ingestion batch">
          <Clock size={15} className="text-muted" />
          <span className="kpi-title">Pipeline Ingest Sync:</span>
          <span className="kpi-val font-mono">
            {mapData?.timestamp ? new Date(mapData.timestamp).toLocaleTimeString() : 'Syncing...'}
          </span>
        </div>
      </div>

      {/* Worldwide Weather Search (Open-Meteo Geocoding & Observation) */}
      <GlobalWeatherSearch
        onSelectLocation={handleSelectGlobalLocation}
        onResetToIndia={handleResetToIndia}
        currentSearchedLocation={searchedLocation}
        isLoadingWeather={loadingSearchedWeather}
      />

      {/* Floating Layer Controls & Quick Navigation */}
      <MapLayerControls
        activeLayer={activeLayer}
        onSelectLayer={setActiveLayer}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        cities={cities}
        onRefresh={() => fetchMapData(true)}
        loading={loading}
      />

      {/* Main Full-Width Map Stage with Fullscreen Support and Floating Detail Drawer */}
      {error ? (
        <div className="chart-card error-card">
          <div className="empty-state error">
            <AlertCircle size={28} className="text-warning" style={{ margin: '0 auto 10px' }} />
            <h3>Unable to load map data</h3>
            <p className="text-muted">{error}</p>
            <button className="btn-primary mt-3" onClick={() => fetchMapData(true)}>Retry Connection</button>
          </div>
        </div>
      ) : (
        <div 
          className={`fullwidth-map-stage ${isFullscreen ? 'is-fullscreen' : ''}`}
          ref={mapStageRef}
        >
          {/* Fullscreen Embedded Layer Bar (Visible when in Fullscreen mode for frictionless control) */}
          {isFullscreen && (
            <div className="fullscreen-embedded-controls fade-in">
              <MapLayerControls
                activeLayer={activeLayer}
                onSelectLayer={setActiveLayer}
                selectedCity={selectedCity}
                onSelectCity={handleSelectCity}
                cities={cities}
                onRefresh={() => fetchMapData(true)}
                loading={loading}
              />
            </div>
          )}

          {/* 100% Width Interactive Leaflet Canvas */}
          <WeatherMap
            cities={cities}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            activeLayer={activeLayer}
            searchedLocation={searchedLocation}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />

          {/* Floating Glass Slide-Over City Detail Drawer (renders only when city is selected) */}
          {selectedCity && (
            <div className="floating-city-drawer-wrapper fade-in">
              <MapCityDetailCard
                cityNode={selectedCity}
                onClose={() => setSelectedCity(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapView;
