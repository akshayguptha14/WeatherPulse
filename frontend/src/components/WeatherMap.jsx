import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Navigation,
  Maximize2,
  Minimize2,
  Layers
} from 'lucide-react';

export const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Moderate: '#eab308',
  Low: '#06b6d4',
  Normal: '#10b981'
};

// Dynamic color legends and ranges per active metric layer
export const LAYER_LEGENDS = {
  temperature: {
    title: 'Temperature Scale',
    unit: '°C',
    items: [
      { label: 'Extreme Heat (>35°C)', color: '#ef4444' },
      { label: 'Warm (28–35°C)', color: '#f97316' },
      { label: 'Mild (20–28°C)', color: '#06b6d4' },
      { label: 'Cool (10–20°C)', color: '#3b82f6' },
      { label: 'Cold (<10°C)', color: '#6366f1' }
    ]
  },
  humidity: {
    title: 'Humidity Scale',
    unit: '%',
    items: [
      { label: 'Very Humid (>80%)', color: '#1e40af' },
      { label: 'Humid (60–80%)', color: '#06b6d4' },
      { label: 'Moderate (40–60%)', color: '#10b981' },
      { label: 'Dry (<40%)', color: '#f59e0b' }
    ]
  },
  rainfall: {
    title: 'Precipitation Scale',
    unit: 'mm/h',
    items: [
      { label: 'Torrential (>10 mm)', color: '#9333ea' },
      { label: 'Moderate (4–10 mm)', color: '#2563eb' },
      { label: 'Light (0.1–4 mm)', color: '#06b6d4' },
      { label: 'None (0 mm)', color: '#10b981' }
    ]
  },
  wind_speed: {
    title: 'Wind Velocity Scale',
    unit: 'km/h',
    items: [
      { label: 'Gale (>40 km/h)', color: '#d946ef' },
      { label: 'Strong (25–40 km/h)', color: '#f97316' },
      { label: 'Moderate (15–25 km/h)', color: '#06b6d4' },
      { label: 'Light (<15 km/h)', color: '#10b981' }
    ]
  },
  pressure: {
    title: 'Barometric Pressure',
    unit: 'hPa',
    items: [
      { label: 'High (>1015 hPa)', color: '#06b6d4' },
      { label: 'Standard (1005–1015)', color: '#10b981' },
      { label: 'Low (995–1005)', color: '#f59e0b' },
      { label: 'Depression (<995 hPa)', color: '#ef4444' }
    ]
  },
  alerts: {
    title: 'Alert Severity',
    unit: 'Severity',
    items: [
      { label: 'Critical', color: '#ef4444' },
      { label: 'High', color: '#f97316' },
      { label: 'Moderate', color: '#eab308' },
      { label: 'Low', color: '#06b6d4' },
      { label: 'Normal', color: '#10b981' }
    ]
  }
};

// Calculate marker color dynamically according to the active layer scale
export const getNodeColor = (node, layer) => {
  const live = node?.live || {};
  const alertSev = node?.alert_status?.highest_severity || 'Normal';

  if (layer === 'temperature') {
    const val = live.temperature;
    if (val === null || val === undefined) return '#94a3b8';
    if (val > 35) return '#ef4444';
    if (val >= 28) return '#f97316';
    if (val >= 20) return '#06b6d4';
    if (val >= 10) return '#3b82f6';
    return '#6366f1';
  }

  if (layer === 'humidity') {
    const val = live.humidity;
    if (val === null || val === undefined) return '#94a3b8';
    if (val > 80) return '#1e40af';
    if (val >= 60) return '#06b6d4';
    if (val >= 40) return '#10b981';
    return '#f59e0b';
  }

  if (layer === 'rainfall') {
    const val = live.rainfall ?? 0;
    if (val > 10) return '#9333ea';
    if (val >= 4) return '#2563eb';
    if (val > 0.1) return '#06b6d4';
    return '#10b981';
  }

  if (layer === 'wind_speed') {
    const val = live.wind_speed;
    if (val === null || val === undefined) return '#94a3b8';
    if (val > 40) return '#d946ef';
    if (val >= 25) return '#f97316';
    if (val >= 15) return '#06b6d4';
    return '#10b981';
  }

  if (layer === 'pressure') {
    const val = live.pressure;
    if (val === null || val === undefined) return '#94a3b8';
    if (val > 1015) return '#06b6d4';
    if (val >= 1005) return '#10b981';
    if (val >= 995) return '#f59e0b';
    return '#ef4444';
  }

  // Alerts layer
  return SEVERITY_COLORS[alertSev] || '#10b981';
};

const WeatherMap = ({ 
  cities = [], 
  selectedCity, 
  onSelectCity, 
  activeLayer = 'temperature',
  searchedLocation = null,
  isFullscreen = false,
  onToggleFullscreen = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const searchedMarkerRef = useRef(null);
  const [tileError, setTileError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Helper to format marker label based on active layer
  const getMarkerLabel = (node, layer) => {
    const live = node.live || {};
    switch (layer) {
      case 'temperature':
        return live.temperature !== null ? `${Math.round(live.temperature)}°` : 'N/A';
      case 'humidity':
        return live.humidity !== null ? `${Math.round(live.humidity)}%` : 'N/A';
      case 'rainfall':
        return live.rainfall !== null ? `${live.rainfall}m` : '0';
      case 'wind_speed':
        return live.wind_speed !== null ? `${Math.round(live.wind_speed)}k` : 'N/A';
      case 'pressure':
        return live.pressure !== null ? `${Math.round(live.pressure)}` : 'N/A';
      case 'alerts':
        return (node.alert_status?.highest_severity || 'OK').substring(0, 4).toUpperCase();
      default:
        return live.temperature !== null ? `${Math.round(live.temperature)}°` : 'N/A';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [21.5, 78.9],
      zoom: 5,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true
    });

    // Custom dark zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Official OpenStreetMap raster tile layer
    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      crossOrigin: true
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);
    mapInstanceRef.current = map;
    setMapReady(true);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate Leaflet map size when fullscreen toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const t1 = setTimeout(() => map.invalidateSize(), 60);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isFullscreen]);

  // Update Markers when cities, selectedCity, or activeLayer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !cities || cities.length === 0) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    cities.forEach(node => {
      const { city, coordinates, alert_status, live } = node;
      if (!coordinates?.lat || !coordinates?.lon) return;

      const severity = alert_status?.highest_severity || 'Normal';
      // Dynamically color marker using activeLayer metric scale!
      const markerColor = getNodeColor(node, activeLayer);
      const isSelected = selectedCity?.city === city;
      const displayVal = getMarkerLabel(node, activeLayer);

      const htmlContent = `
        <div class="custom-map-marker ${isSelected ? 'selected' : ''}" style="--marker-color: ${markerColor}">
          <div class="marker-pulse-ring" style="border-color: ${markerColor};"></div>
          <div class="marker-core-badge" style="border-color: ${markerColor}; box-shadow: 0 4px 14px rgba(0,0,0,0.6), 0 0 12px ${markerColor};">
            <span class="marker-city-tag">${city.substring(0, 3).toUpperCase()}</span>
            <span class="marker-metric-val">${displayVal}</span>
          </div>
          <div class="marker-stem" style="background: ${markerColor};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-div-icon',
        html: htmlContent,
        iconSize: [44, 44],
        iconAnchor: [22, 42],
        popupAnchor: [0, -42]
      });

      const marker = L.marker([coordinates.lat, coordinates.lon], { icon: customIcon });

      marker.on('click', () => {
        onSelectCity(node);
      });

      const tooltipContent = `
        <div class="map-marker-tooltip">
          <strong>${city}</strong> • ${live?.weather_condition || 'Unknown'}<br/>
          <span>Active Layer (${activeLayer.toUpperCase()}): <strong>${displayVal}</strong></span><br/>
          <span>Temp: ${live?.temperature !== null ? live.temperature + '°C' : 'N/A'}</span> • 
          <span style="color: ${SEVERITY_COLORS[severity] || '#10b981'}; font-weight: 600;">${severity} Alert</span>
        </div>
      `;
      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -38],
        className: 'custom-map-tooltip'
      });

      marker.addTo(map);
      markersRef.current[city] = marker;
    });
  }, [cities, selectedCity, activeLayer]);

  // Render or update distinct marker for Global Searched Location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (searchedMarkerRef.current) {
      searchedMarkerRef.current.remove();
      searchedMarkerRef.current = null;
    }

    if (!searchedLocation?.coordinates?.lat || !searchedLocation?.coordinates?.lon) return;

    const { city, coordinates, live, country, isIndianState, location_type, representative_city } = searchedLocation;
    const isSelected = selectedCity?.city === city && selectedCity?.isGlobalSearch;
    const displayVal = live?.temperature !== null && live?.temperature !== undefined 
      ? `${Math.round(live.temperature)}°` 
      : 'N/A';
    const markerTag = isIndianState ? (location_type === 'Union Territory' ? 'UT' : 'STATE') : 'SRCH';
    const searchedColor = isIndianState ? '#38bdf8' : '#38bdf8';

    const htmlContent = `
      <div class="custom-map-marker is-searched ${isSelected ? 'selected' : ''}" style="--marker-color: ${searchedColor};">
        <div class="marker-pulse-ring searched-pulse"></div>
        <div class="marker-core-badge searched-core">
          <span class="marker-city-tag">${markerTag}</span>
          <span class="marker-metric-val">${displayVal}</span>
        </div>
        <div class="marker-stem searched-stem"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-leaflet-div-icon',
      html: htmlContent,
      iconSize: [46, 46],
      iconAnchor: [23, 44],
      popupAnchor: [0, -44]
    });

    const marker = L.marker([coordinates.lat, coordinates.lon], { 
      icon: customIcon,
      zIndexOffset: 1000
    });

    marker.on('click', () => {
      onSelectCity(searchedLocation);
    });

    const tooltipContent = isIndianState ? `
      <div class="map-marker-tooltip searched-tooltip">
        <strong>${city}</strong> (${location_type || 'State'} • India)<br/>
        <span style="color: #93c5fd; font-size: 0.72rem;">Representative: ${representative_city || city}</span><br/>
        <span>Temp: ${live?.temperature !== null && live?.temperature !== undefined ? live.temperature + '°C' : 'N/A'}</span> • 
        <span>${live?.weather_condition || 'Observation'}</span><br/>
        <span style="color: #38bdf8; font-size: 0.68rem; font-weight: 600;">Representative On-Demand Weather</span>
      </div>
    ` : `
      <div class="map-marker-tooltip searched-tooltip">
        <strong>${city}</strong>${country ? `, ${country}` : ''}<br/>
        <span>Temp: ${live?.temperature !== null && live?.temperature !== undefined ? live.temperature + '°C' : 'N/A'}</span> • 
        <span>${live?.weather_condition || 'Observation'}</span><br/>
        <span style="color: #38bdf8; font-size: 0.68rem; font-weight: 600;">Global On-Demand Weather</span>
      </div>
    `;
    marker.bindTooltip(tooltipContent, {
      direction: 'top',
      offset: [0, -40],
      className: 'custom-map-tooltip searched-map-tooltip'
    });

    marker.addTo(map);
    searchedMarkerRef.current = marker;

    return () => {
      if (searchedMarkerRef.current) {
        searchedMarkerRef.current.remove();
        searchedMarkerRef.current = null;
      }
    };
  }, [searchedLocation, selectedCity, activeLayer]);

  // Center on selected city or global searched location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (searchedLocation?.coordinates) {
      map.flyTo([searchedLocation.coordinates.lat, searchedLocation.coordinates.lon], 8, {
        duration: 1.4,
        easeLinearity: 0.25
      });
    } else if (selectedCity?.coordinates) {
      map.flyTo([selectedCity.coordinates.lat, selectedCity.coordinates.lon], 7, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    } else {
      map.flyTo([21.5, 78.9], 5, {
        duration: 1.0
      });
    }
  }, [searchedLocation, selectedCity]);

  // Current dynamic legend config
  const currentLegend = LAYER_LEGENDS[activeLayer] || LAYER_LEGENDS.temperature;

  return (
    <div className={`weather-map-wrapper ${isFullscreen ? 'fullscreen-map' : ''}`}>
      {/* Fallback notification if tile server blocked */}
      {tileError && (
        <div className="map-fallback-banner">
          <AlertTriangle size={15} className="text-warning" />
          <span>External map tiles experiencing latency. Visual geographic vector fallback active.</span>
        </div>
      )}

      {/* Fullscreen Map Toggle Floating Button */}
      {onToggleFullscreen && (
        <button
          type="button"
          className="map-fullscreen-floating-btn"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Full-Screen Map (Esc)' : 'Expand Full-Screen Map'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span className="fullscreen-btn-text">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
      )}

      {/* Primary Leaflet Container */}
      <div ref={mapContainerRef} className="leaflet-map-root" />

      {/* Dynamic Map Overlay Legend */}
      <div className="map-legend-card fade-in">
        <div className="legend-title-row">
          <span className="legend-title">{currentLegend.title}</span>
          <span className="legend-unit-tag">{currentLegend.unit}</span>
        </div>
        <div className="legend-items-col">
          {currentLegend.items.map((item, idx) => (
            <div key={idx} className="legend-item-row">
              <span 
                className="legend-dot" 
                style={{ 
                  backgroundColor: item.color, 
                  boxShadow: `0 0 8px ${item.color}` 
                }} 
              />
              <span className="legend-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherMap;
