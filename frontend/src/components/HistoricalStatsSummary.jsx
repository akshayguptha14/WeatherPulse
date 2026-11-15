import React from 'react';

const formatNum = (val, suffix = '', decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `${Number(val).toFixed(decimals)}${suffix}`;
};

const HistoricalStatsSummary = ({ records = [], conditions = [], dailyTrends = [] }) => {
  // Compute authentic summary metrics across the current filtered historical records
  const stats = React.useMemo(() => {
    if (!records || records.length === 0) {
      return {
        count: 0,
        temp: { min: null, max: null, avg: null },
        humidity: { min: null, max: null, avg: null },
        rainfall: { total: null, max: null, avg: null },
        wind: { min: null, max: null, avg: null },
        pressure: { min: null, max: null, avg: null },
      };
    }

    const validTemps = records.map(r => r.temperature).filter(v => v !== null && !isNaN(v));
    const validHum = records.map(r => r.humidity).filter(v => v !== null && !isNaN(v));
    const validRain = records.map(r => r.rainfall).filter(v => v !== null && !isNaN(v));
    const validWind = records.map(r => r.wind_speed).filter(v => v !== null && !isNaN(v));
    const validPres = records.map(r => r.pressure).filter(v => v !== null && !isNaN(v));

    const calcMin = (arr) => arr.length ? Math.min(...arr) : null;
    const calcMax = (arr) => arr.length ? Math.max(...arr) : null;
    const calcAvg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const calcSum = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) : null;

    return {
      count: records.length,
      temp: { min: calcMin(validTemps), max: calcMax(validTemps), avg: calcAvg(validTemps) },
      humidity: { min: calcMin(validHum), max: calcMax(validHum), avg: calcAvg(validHum) },
      rainfall: { total: calcSum(validRain), max: calcMax(validRain), avg: calcAvg(validRain) },
      wind: { min: calcMin(validWind), max: calcMax(validWind), avg: calcAvg(validWind) },
      pressure: { min: calcMin(validPres), max: calcMax(validPres), avg: calcAvg(validPres) },
    };
  }, [records]);

  // Total condition records
  const totalConditions = conditions.reduce((acc, c) => acc + (c.count || 0), 0);

  return (
    <div className="historical-stats-summary-section">
      <div className="stats-kpi-grid">
        {/* Temperature KPI Card */}
        <div className="kpi-metric-card glass-panel kpi-temp">
          <div className="kpi-header">
            <span className="kpi-icon">🌡️</span>
            <span className="kpi-title">Temperature Extremes</span>
          </div>
          <div className="kpi-main-val">
            <span className="val-large">{formatNum(stats.temp.avg, '°C')}</span>
            <span className="val-sublabel">Mean Across Scope</span>
          </div>
          <div className="kpi-sub-metrics">
            <div className="sub-metric">
              <span className="sub-label">Min</span>
              <span className="sub-val min-val">{formatNum(stats.temp.min, '°C')}</span>
            </div>
            <div className="sub-metric">
              <span className="sub-label">Max</span>
              <span className="sub-val max-val">{formatNum(stats.temp.max, '°C')}</span>
            </div>
            <div className="sub-metric">
              <span className="sub-label">Spread</span>
              <span className="sub-val">
                {stats.temp.max !== null && stats.temp.min !== null
                  ? `${(stats.temp.max - stats.temp.min).toFixed(1)}°C`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Humidity KPI Card */}
        <div className="kpi-metric-card glass-panel kpi-humidity">
          <div className="kpi-header">
            <span className="kpi-icon">💧</span>
            <span className="kpi-title">Relative Humidity</span>
          </div>
          <div className="kpi-main-val">
            <span className="val-large">{formatNum(stats.humidity.avg, '%')}</span>
            <span className="val-sublabel">Average Level</span>
          </div>
          <div className="kpi-sub-metrics">
            <div className="sub-metric">
              <span className="sub-label">Min</span>
              <span className="sub-val">{formatNum(stats.humidity.min, '%')}</span>
            </div>
            <div className="sub-metric">
              <span className="sub-label">Max</span>
              <span className="sub-val">{formatNum(stats.humidity.max, '%')}</span>
            </div>
            <div className="sub-metric">
              <span className="sub-label">Records</span>
              <span className="sub-val">{stats.count}</span>
            </div>
          </div>
        </div>

        {/* Rainfall KPI Card */}
        <div className="kpi-metric-card glass-panel kpi-rain">
          <div className="kpi-header">
            <span className="kpi-icon">🌧️</span>
            <span className="kpi-title">Precipitation Total</span>
          </div>
          <div className="kpi-main-val">
            <span className="val-large">{formatNum(stats.rainfall.total, ' mm')}</span>
            <span className="val-sublabel">Cumulative Rainfall</span>
          </div>
          <div className="kpi-sub-metrics">
            <div className="sub-metric">
              <span className="sub-label">Daily Avg</span>
              <span className="sub-val">{formatNum(stats.rainfall.avg, ' mm')}</span>
            </div>
            <div className="sub-metric">
              <span className="sub-label">Peak Event</span>
              <span className="sub-val max-val">{formatNum(stats.rainfall.max, ' mm')}</span>
            </div>
            <div className="sub-metric">
              <span className="sub-label">Rain Days</span>
              <span className="sub-val">
                {records.filter(r => (r.rainfall || 0) > 0.1).length}
              </span>
            </div>
          </div>
        </div>

        {/* Wind & Pressure KPI Card */}
        <div className="kpi-metric-card glass-panel kpi-wind">
          <div className="kpi-header">
            <span className="kpi-icon">💨</span>
            <span className="kpi-title">Wind & Pressure</span>
          </div>
          <div className="kpi-main-val">
            <span className="val-large">{formatNum(stats.wind.avg, ' km/h')}</span>
            <span className="val-sublabel">Mean Wind Speed</span>
          </div>
          <div className="kpi-sub-metrics">
            <div className="sub-metric">
              <span className="sub-label">Peak Wind</span>
              <span className="sub-val max-val">{formatNum(stats.wind.max, ' km/h')}</span>
            </div>
            <div className="sub-metric">
              <span className="sub-label">Mean Pressure</span>
              <span className="sub-val">{formatNum(stats.pressure.avg, ' hPa', 1)}</span>
            </div>
            <div className="sub-metric">
              <span className="sub-label">Min Press.</span>
              <span className="sub-val">{formatNum(stats.pressure.min, ' hPa', 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions Distribution Bar */}
      {conditions && conditions.length > 0 && (
        <div className="conditions-distribution-card glass-panel">
          <div className="distribution-header">
            <div className="dist-title-box">
              <span className="dist-icon">🌤️</span>
              <span className="dist-title">Weather Condition Distribution (Hive Aggregate)</span>
            </div>
            <span className="dist-subtitle">
              Total Observations: <strong>{totalConditions || stats.count}</strong> records
            </span>
          </div>

          <div className="conditions-progress-bar">
            {conditions.map((c, idx) => {
              const pct = totalConditions > 0 ? ((c.count / totalConditions) * 100).toFixed(1) : 0;
              const colorClasses = {
                Clear: 'condition-clear',
                Cloudy: 'condition-cloudy',
                Rainy: 'condition-rainy',
                Sunny: 'condition-sunny',
                Thunderstorm: 'condition-thunder',
              };
              const colorClass = colorClasses[c.weather_condition] || 'condition-default';
              return (
                <div
                  key={c.weather_condition || idx}
                  className={`progress-segment ${colorClass}`}
                  style={{ width: `${pct}%` }}
                  title={`${c.weather_condition}: ${c.count} records (${pct}%)`}
                ></div>
              );
            })}
          </div>

          <div className="conditions-legend">
            {conditions.map((c, idx) => {
              const pct = totalConditions > 0 ? ((c.count / totalConditions) * 100).toFixed(1) : 0;
              return (
                <div key={c.weather_condition || idx} className="legend-item">
                  <span className={`legend-dot condition-${(c.weather_condition || '').toLowerCase()}`}></span>
                  <span className="legend-label">{c.weather_condition}</span>
                  <span className="legend-count">{c.count}</span>
                  <span className="legend-pct">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalStatsSummary;
