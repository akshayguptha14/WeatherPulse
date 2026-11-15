import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const formatNum = (val, suffix = '', decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `${Number(val).toFixed(decimals)}${suffix}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip glass-panel shadow-lg">
        <p className="tooltip-date font-semibold">{label}</p>
        <div className="tooltip-divider"></div>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="tooltip-item" style={{ color: entry.color }}>
            <span className="tooltip-item-name">{entry.name}: </span>
            <span className="tooltip-item-val font-bold">
              {entry.value !== null && entry.value !== undefined
                ? `${entry.value} ${entry.unit || ''}`
                : 'N/A'}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const HistoricalComparisonWidget = ({ cityStats = [] }) => {
  if (!cityStats || cityStats.length === 0) {
    return (
      <div className="comparison-widget-empty glass-panel">
        <p>Awaiting MapReduce city aggregate data...</p>
      </div>
    );
  }

  // Sort cities alphabetically for consistent presentation
  const sortedStats = [...cityStats].sort((a, b) => a.city.localeCompare(b.city));

  return (
    <div className="historical-comparison-container">
      {/* Chart 1: City Temperature Spectrum (Min, Avg, Max) */}
      <div className="comparison-card glass-panel">
        <div className="comparison-header">
          <div>
            <h3 className="comparison-title">City Temperature Profiles (Hadoop MapReduce)</h3>
            <span className="comparison-subtitle">
              Minimum, Average, and Maximum Temperatures Across All 5 Cities
            </span>
          </div>
          <span className="source-tag">MapReduce part-r-00000</span>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={sortedStats}
              margin={{ top: 15, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="city" stroke="#94a3b8" tick={{ fontSize: 13 }} />
              <YAxis stroke="#94a3b8" unit="°C" domain={[0, 50]} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Bar
                dataKey="min_temperature"
                name="Min Temp"
                unit="°C"
                fill="#60a5fa"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="avg_temperature"
                name="Avg Temp"
                unit="°C"
                fill="#fbbf24"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="max_temperature"
                name="Max Temp"
                unit="°C"
                fill="#f87171"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Rainfall & Humidity Breakdown */}
      <div className="comparison-card glass-panel">
        <div className="comparison-header">
          <div>
            <h3 className="comparison-title">Moisture & Rainfall Accumulation</h3>
            <span className="comparison-subtitle">
              Cumulative Rainfall (mm) & Average Humidity (%) per Metropolitan Center
            </span>
          </div>
          <span className="source-tag">MapReduce & Hive</span>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={sortedStats}
              margin={{ top: 15, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="city" stroke="#94a3b8" tick={{ fontSize: 13 }} />
              <YAxis
                yAxisId="rain"
                orientation="left"
                stroke="#38bdf8"
                unit=" mm"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="hum"
                orientation="right"
                stroke="#34d399"
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Bar
                yAxisId="rain"
                dataKey="total_rainfall"
                name="Total Rainfall"
                unit="mm"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="hum"
                dataKey="avg_humidity"
                name="Avg Humidity"
                unit="%"
                fill="#34d399"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparative Ranking Grid */}
      <div className="comparison-table-card glass-panel">
        <div className="table-header-group">
          <h3 className="comparison-title">Multi-Metric City Aggregation Summary</h3>
          <span className="comparison-subtitle">
            Authentic batch outputs precomputed by Hadoop MapReduce job on HDFS dataset
          </span>
        </div>

        <div className="historical-table-container">
          <table className="historical-data-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Avg Temp</th>
                <th>Min / Max Temp</th>
                <th>Avg Humidity</th>
                <th>Total Rainfall</th>
                <th>Avg Wind Speed</th>
                <th>Peak Wind</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((c) => (
                <tr key={c.city}>
                  <td className="font-semibold text-primary">{c.city}</td>
                  <td>{formatNum(c.avg_temperature, '°C')}</td>
                  <td>
                    <span className="text-blue-400">{formatNum(c.min_temperature, '°C')}</span>
                    {' / '}
                    <span className="text-red-400">{formatNum(c.max_temperature, '°C')}</span>
                  </td>
                  <td>{formatNum(c.avg_humidity, '%')}</td>
                  <td className="font-medium text-cyan-400">{formatNum(c.total_rainfall, ' mm')}</td>
                  <td>{formatNum(c.avg_wind_speed, ' km/h')}</td>
                  <td className="text-amber-400">{formatNum(c.max_wind_speed, ' km/h')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoricalComparisonWidget;
