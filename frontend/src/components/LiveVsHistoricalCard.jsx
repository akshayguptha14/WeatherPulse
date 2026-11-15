import React from 'react';

const formatNum = (val, suffix = '', decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `${Number(val).toFixed(decimals)}${suffix}`;
};

const formatVariance = (liveVal, histVal, unit = '°C') => {
  if (liveVal === null || liveVal === undefined || histVal === null || histVal === undefined) {
    return { text: 'N/A', cls: 'variance-neutral' };
  }
  const diff = Number(liveVal) - Number(histVal);
  const sign = diff > 0 ? '+' : '';
  const text = `${sign}${diff.toFixed(1)}${unit}`;
  const cls = diff > 0 ? 'variance-positive' : diff < 0 ? 'variance-negative' : 'variance-neutral';
  return { text, cls, diff };
};

const LiveVsHistoricalCard = ({ liveRecords = [], cityStats = [], selectedCity = 'All' }) => {
  // Filter for cities to display
  const targetCities = selectedCity === 'All'
    ? ['Bengaluru', 'Chennai', 'Delhi', 'Hyderabad', 'Mumbai']
    : [selectedCity];

  // Map latest live record per city
  const latestLiveByCity = React.useMemo(() => {
    const map = {};
    if (liveRecords && liveRecords.length > 0) {
      liveRecords.forEach((rec) => {
        if (!map[rec.city] || new Date(rec.timestamp) > new Date(map[rec.city].timestamp)) {
          map[rec.city] = rec;
        }
      });
    }
    return map;
  }, [liveRecords]);

  // Map historical stats by city
  const histByCity = React.useMemo(() => {
    const map = {};
    if (cityStats && cityStats.length > 0) {
      cityStats.forEach((c) => {
        map[c.city] = c;
      });
    }
    return map;
  }, [cityStats]);

  return (
    <div className="live-vs-historical-container glass-panel">
      <div className="card-header-bar">
        <div>
          <h3 className="section-title">
            <span className="title-icon">⚡</span> Real-Time vs Historical Benchmark
          </h3>
          <span className="section-subtitle">
            Live Streaming Stream vs Batch Historical Means (Sep 11–18 Baseline)
          </span>
        </div>
        <div className="variance-legend-badge">
          Variance Formula: <strong>Live Value − Historical Mean</strong>
        </div>
      </div>

      <div className="city-comparison-cards-grid">
        {targetCities.map((cityName) => {
          const live = latestLiveByCity[cityName] || null;
          const hist = histByCity[cityName] || null;

          const tempVariance = formatVariance(
            live ? live.temperature : null,
            hist ? hist.avg_temperature : null,
            '°C'
          );

          const humVariance = formatVariance(
            live ? live.humidity : null,
            hist ? hist.avg_humidity : null,
            '%'
          );

          const windVariance = formatVariance(
            live ? live.wind_speed : null,
            hist ? hist.avg_wind_speed : null,
            ' km/h'
          );

          return (
            <div key={cityName} className="city-vs-card glass-panel">
              <div className="city-card-header">
                <span className="city-name">{cityName}</span>
                {live ? (
                  <span className="live-tag pulse">● LIVE</span>
                ) : (
                  <span className="live-tag tag-offline">Awaiting Ingest</span>
                )}
              </div>

              {/* Temperature Delta Row */}
              <div className="metric-delta-row">
                <div className="metric-col">
                  <span className="metric-meta-label">Live Ingest</span>
                  <span className="metric-val text-primary">
                    {live ? formatNum(live.temperature, '°C') : 'N/A'}
                  </span>
                  <span className="metric-condition">
                    {live?.weather_condition || 'N/A'}
                  </span>
                </div>

                <div className="delta-center-col">
                  <span className="delta-label">Variance</span>
                  <span className={`delta-badge ${tempVariance.cls}`}>
                    {tempVariance.text}
                  </span>
                </div>

                <div className="metric-col text-right">
                  <span className="metric-meta-label">Hist Avg</span>
                  <span className="metric-val text-muted">
                    {hist ? formatNum(hist.avg_temperature, '°C') : 'N/A'}
                  </span>
                  <span className="metric-sub-range">
                    Range: {hist ? `${formatNum(hist.min_temperature)}–${formatNum(hist.max_temperature)}°C` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="metric-divider"></div>

              {/* Secondary Comparison Rows */}
              <div className="secondary-metrics-grid">
                {/* Humidity */}
                <div className="sec-metric-item">
                  <span className="sec-label">Humidity</span>
                  <div className="sec-vals">
                    <span className="sec-live">{live ? formatNum(live.humidity, '%') : 'N/A'}</span>
                    <span className="sec-sep">vs</span>
                    <span className="sec-hist">{hist ? formatNum(hist.avg_humidity, '%') : 'N/A'}</span>
                    <span className={`sec-delta ${humVariance.cls}`}>({humVariance.text})</span>
                  </div>
                </div>

                {/* Wind Speed */}
                <div className="sec-metric-item">
                  <span className="sec-label">Wind Speed</span>
                  <div className="sec-vals">
                    <span className="sec-live">{live ? formatNum(live.wind_speed, ' km/h') : 'N/A'}</span>
                    <span className="sec-sep">vs</span>
                    <span className="sec-hist">{hist ? formatNum(hist.avg_wind_speed, ' km/h') : 'N/A'}</span>
                    <span className={`sec-delta ${windVariance.cls}`}>({windVariance.text})</span>
                  </div>
                </div>
              </div>

              {/* Live Ingest Timestamp Footer */}
              <div className="card-footer-timestamp">
                <span>Ingest: </span>
                <strong>
                  {live?.ingest_timestamp
                    ? new Date(live.ingest_timestamp).toLocaleTimeString()
                    : 'N/A'}
                </strong>
                {live?.spark_processing_timestamp && (
                  <span className="ml-2">
                    · Spark: {new Date(live.spark_processing_timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveVsHistoricalCard;
