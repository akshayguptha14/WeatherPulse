import React from 'react';
import { 
  ArrowUpDown, 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge, 
  CloudRain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  Info
} from 'lucide-react';

const LiveCityComparison = ({ liveData = {}, historicalData = [] }) => {
  const targetCities = ["Bengaluru", "Delhi", "Mumbai", "Chennai", "Hyderabad"];

  // Index historical data by city for fast O(1) lookup
  const histByCity = {};
  for (const item of historicalData) {
    if (item.city) {
      histByCity[item.city] = item;
    }
  }

  // Calculate city extrema (min/max) using strictly verified values
  let warmestCity = null;
  let coolestCity = null;
  let mostHumidCity = null;
  let windiestCity = null;

  for (const city of targetCities) {
    const live = liveData[city];
    if (!live) continue;

    if (live.temperature !== null && live.temperature !== undefined) {
      const t = Number(live.temperature);
      if (!warmestCity || t > warmestCity.temp) warmestCity = { city, temp: t };
      if (!coolestCity || t < coolestCity.temp) coolestCity = { city, temp: t };
    }

    if (live.humidity !== null && live.humidity !== undefined) {
      const h = Number(live.humidity);
      if (!mostHumidCity || h > mostHumidCity.hum) mostHumidCity = { city, hum: h };
    }

    if (live.wind_speed !== null && live.wind_speed !== undefined) {
      const w = Number(live.wind_speed);
      if (!windiestCity || w > windiestCity.wind) windiestCity = { city, wind: w };
    }
  }

  return (
    <div className="city-comparison-container">
      {/* Extrema Highlights Bar */}
      <div className="extrema-grid">
        <div className="extrema-card">
          <div className="extrema-icon warm"><Thermometer size={18} /></div>
          <div className="extrema-content">
            <span className="extrema-label">Warmest City (Live)</span>
            <strong className="extrema-value">
              {warmestCity ? `${warmestCity.city} (${warmestCity.temp}°C)` : 'N/A'}
            </strong>
          </div>
        </div>

        <div className="extrema-card">
          <div className="extrema-icon cool"><Thermometer size={18} /></div>
          <div className="extrema-content">
            <span className="extrema-label">Coolest City (Live)</span>
            <strong className="extrema-value">
              {coolestCity ? `${coolestCity.city} (${coolestCity.temp}°C)` : 'N/A'}
            </strong>
          </div>
        </div>

        <div className="extrema-card">
          <div className="extrema-icon humid"><Droplets size={18} /></div>
          <div className="extrema-content">
            <span className="extrema-label">Highest Humidity (Live)</span>
            <strong className="extrema-value">
              {mostHumidCity ? `${mostHumidCity.city} (${mostHumidCity.hum}%)` : 'N/A'}
            </strong>
          </div>
        </div>

        <div className="extrema-card">
          <div className="extrema-icon wind"><Wind size={18} /></div>
          <div className="extrema-content">
            <span className="extrema-label">Peak Wind (Live)</span>
            <strong className="extrema-value">
              {windiestCity ? `${windiestCity.city} (${windiestCity.wind} km/h)` : 'N/A'}
            </strong>
          </div>
        </div>
      </div>

      {/* City-by-City Comparative Matrix */}
      <div className="comparison-table-card info-card">
        <div className="card-header-flex">
          <div>
            <h3 style={{ margin: '0 0 4px 0' }}>City-Wise Comparative Matrix</h3>
            <p className="text-secondary" style={{ fontSize: '0.82rem', margin: 0 }}>
              Direct comparison between real-time Kafka streaming readings and historical batch analytics.
            </p>
          </div>
          <div className="pipeline-legend">
            <span className="legend-tag live-tag">⚡ Live Ingestion</span>
            <span className="legend-tag hist-tag">🏛️ Historical Baseline</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table comparison-matrix-table">
            <thead>
              <tr>
                <th className="sticky-col">City</th>
                <th>Condition</th>
                <th>
                  <div className="th-with-badge">
                    <span>Live Temp</span>
                    <span className="source-mini-badge live">Live</span>
                  </div>
                </th>
                <th>
                  <div className="th-with-badge">
                    <span>Hist Avg Temp</span>
                    <span className="source-mini-badge hist">Hist</span>
                  </div>
                </th>
                <th title="Calculated as: Live Temperature minus Historical Average">
                  <div className="th-with-badge">
                    <span>Temp Variance*</span>
                    <Info size={12} style={{marginLeft: '3px', opacity: 0.7}} />
                  </div>
                </th>
                <th>
                  <div className="th-with-badge">
                    <span>Live Humidity</span>
                    <span className="source-mini-badge live">Live</span>
                  </div>
                </th>
                <th>
                  <div className="th-with-badge">
                    <span>Hist Avg Humidity</span>
                    <span className="source-mini-badge hist">Hist</span>
                  </div>
                </th>
                <th>Rainfall</th>
                <th>Wind Speed</th>
                <th>Pressure</th>
              </tr>
            </thead>
            <tbody>
              {targetCities.map(city => {
                const live = liveData[city] || {};
                const hist = histByCity[city] || {};

                const liveTemp = live.temperature !== null && live.temperature !== undefined ? Number(live.temperature) : null;
                const histTemp = hist.avg_temperature !== null && hist.avg_temperature !== undefined ? Number(hist.avg_temperature) : null;
                
                // Strictly defined: Live Temperature minus Historical Average
                const variance = (liveTemp !== null && histTemp !== null)
                  ? Math.round((liveTemp - histTemp) * 10) / 10
                  : null;

                const liveHum = live.humidity !== null && live.humidity !== undefined ? Number(live.humidity) : null;
                const histHum = hist.avg_humidity !== null && hist.avg_humidity !== undefined ? Number(hist.avg_humidity) : null;

                return (
                  <tr key={city}>
                    <td className="sticky-col">
                      <strong>{city}</strong>
                    </td>
                    <td>
                      <span className="condition-pill">
                        {live.weather_condition || 'N/A'}
                      </span>
                    </td>
                    <td className="live-cell">
                      {liveTemp !== null ? <strong>{liveTemp}&deg;C</strong> : <span className="text-muted">N/A</span>}
                    </td>
                    <td className="hist-cell">
                      {histTemp !== null ? `${histTemp}°C` : <span className="text-muted">N/A</span>}
                    </td>
                    <td>
                      {variance !== null ? (
                        <span className={`variance-pill ${variance > 0 ? 'var-warmer' : variance < 0 ? 'var-cooler' : 'var-neutral'}`}>
                          {variance > 0 ? <TrendingUp size={12} /> : variance < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                          <span>{variance > 0 ? `+${variance}` : variance}&deg;C</span>
                        </span>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="live-cell">
                      {liveHum !== null ? <strong>{liveHum}%</strong> : <span className="text-muted">N/A</span>}
                    </td>
                    <td className="hist-cell">
                      {histHum !== null ? `${histHum}%` : <span className="text-muted">N/A</span>}
                    </td>
                    <td>
                      {live.rainfall !== null && live.rainfall !== undefined ? `${live.rainfall} mm` : <span className="text-muted">N/A</span>}
                    </td>
                    <td>
                      {live.wind_speed !== null && live.wind_speed !== undefined ? `${live.wind_speed} km/h` : <span className="text-muted">N/A</span>}
                    </td>
                    <td>
                      {live.pressure !== null && live.pressure !== undefined ? `${live.pressure} hPa` : <span className="text-muted">N/A</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-caption-note">
          * <strong>Temperature Variance</strong> is calculated strictly as <code>Live Temperature − Historical Average</code>. Historical averages are computed across 150 MapReduce batch records.
        </div>
      </div>
    </div>
  );
};

export default LiveCityComparison;
