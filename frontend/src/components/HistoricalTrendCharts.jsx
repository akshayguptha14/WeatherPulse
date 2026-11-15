import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

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

const HistoricalTrendCharts = ({ dailyTrends = [], selectedCity = 'All' }) => {
  // Aggregate data by date if selectedCity === 'All', or use city's daily values
  const chartData = React.useMemo(() => {
    if (!dailyTrends || dailyTrends.length === 0) return [];

    if (selectedCity !== 'All') {
      return dailyTrends
        .filter((d) => d.city === selectedCity)
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // When All is selected, group and average across cities for each date
    const grouped = {};
    dailyTrends.forEach((row) => {
      const d = row.date;
      if (!grouped[d]) {
        grouped[d] = {
          date: d,
          tempSum: 0,
          tempCount: 0,
          minTemps: [],
          maxTemps: [],
          humSum: 0,
          humCount: 0,
          rainSum: 0,
          windSum: 0,
          windCount: 0,
          maxWindList: [],
          presSum: 0,
          presCount: 0,
        };
      }
      if (row.avg_temperature !== null) {
        grouped[d].tempSum += row.avg_temperature;
        grouped[d].tempCount += 1;
      }
      if (row.min_temperature !== null) grouped[d].minTemps.push(row.min_temperature);
      if (row.max_temperature !== null) grouped[d].maxTemps.push(row.max_temperature);
      if (row.avg_humidity !== null) {
        grouped[d].humSum += row.avg_humidity;
        grouped[d].humCount += 1;
      }
      if (row.total_rainfall !== null) grouped[d].rainSum += row.total_rainfall;
      if (row.avg_wind_speed !== null) {
        grouped[d].windSum += row.avg_wind_speed;
        grouped[d].windCount += 1;
      }
      if (row.max_wind_speed !== null) grouped[d].maxWindList.push(row.max_wind_speed);
      if (row.avg_pressure !== null) {
        grouped[d].presSum += row.avg_pressure;
        grouped[d].presCount += 1;
      }
    });

    return Object.values(grouped)
      .map((g) => ({
        date: g.date,
        avg_temperature: g.tempCount ? Number((g.tempSum / g.tempCount).toFixed(1)) : null,
        min_temperature: g.minTemps.length ? Math.min(...g.minTemps) : null,
        max_temperature: g.maxTemps.length ? Math.max(...g.maxTemps) : null,
        avg_humidity: g.humCount ? Number((g.humSum / g.humCount).toFixed(1)) : null,
        total_rainfall: Number(g.rainSum.toFixed(2)),
        avg_wind_speed: g.windCount ? Number((g.windSum / g.windCount).toFixed(1)) : null,
        max_wind_speed: g.maxWindList.length ? Math.max(...g.maxWindList) : null,
        avg_pressure: g.presCount ? Number((g.presSum / g.presCount).toFixed(1)) : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyTrends, selectedCity]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="historical-trends-container empty-state glass-panel">
        <p>No historical trend observations found for the specified filters.</p>
      </div>
    );
  }

  return (
    <div className="historical-trends-container">
      {/* Chart 1: Daily Temperature Trajectory */}
      <div className="trend-chart-card glass-panel">
        <div className="chart-header">
          <div className="chart-title-group">
            <h3 className="chart-title">Daily Temperature Trajectory (°C)</h3>
            <span className="chart-subtitle">
              {selectedCity === 'All' ? 'Cross-City Average & Boundary Range' : `Daily Range for ${selectedCity}`} · Hive Aggregated
            </span>
          </div>
          <span className="chart-badge">HQL Daily Aggregation</span>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" unit="°C" domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="max_temperature"
                name="Max Temp"
                unit="°C"
                stroke="#f87171"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="avg_temperature"
                name="Avg Temp"
                unit="°C"
                stroke="#fbbf24"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="min_temperature"
                name="Min Temp"
                unit="°C"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Rainfall & Humidity Progression */}
      <div className="trend-chart-card glass-panel">
        <div className="chart-header">
          <div className="chart-title-group">
            <h3 className="chart-title">Precipitation & Humidity Dynamics</h3>
            <span className="chart-subtitle">
              Total Daily Rainfall (mm) vs Relative Humidity (%) · Dual-Axis Progression
            </span>
          </div>
          <span className="chart-badge">HQL Aggregation</span>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
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
                name="Rainfall"
                unit="mm"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                yAxisId="hum"
                type="monotone"
                dataKey="avg_humidity"
                name="Humidity"
                unit="%"
                stroke="#34d399"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Wind & Atmospheric Pressure Dynamics */}
      <div className="trend-chart-card glass-panel">
        <div className="chart-header">
          <div className="chart-title-group">
            <h3 className="chart-title">Wind Speed & Barometric Pressure</h3>
            <span className="chart-subtitle">
              Mean/Max Wind Velocity (km/h) with Sea-Level Pressure (hPa)
            </span>
          </div>
          <span className="chart-badge">Atmospheric Metrics</span>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="wind"
                orientation="left"
                stroke="#a78bfa"
                unit=" km/h"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="press"
                orientation="right"
                stroke="#f472b6"
                unit=" hPa"
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Bar
                yAxisId="wind"
                dataKey="max_wind_speed"
                name="Peak Wind"
                unit="km/h"
                fill="#818cf8"
                opacity={0.6}
                maxBarSize={30}
              />
              <Line
                yAxisId="wind"
                type="monotone"
                dataKey="avg_wind_speed"
                name="Avg Wind"
                unit="km/h"
                stroke="#c084fc"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="press"
                type="monotone"
                dataKey="avg_pressure"
                name="Avg Pressure"
                unit="hPa"
                stroke="#f472b6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HistoricalTrendCharts;
