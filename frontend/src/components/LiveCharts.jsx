import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { Thermometer, Droplets, TrendingUp, BarChart2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip" style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
          {label || data.city}
        </div>
        {payload.map((entry, idx) => (
          <div key={idx} style={{ color: entry.color, fontSize: '0.85rem', marginBottom: '2px' }}>
            {entry.name}: <strong>{entry.value !== null && entry.value !== undefined ? `${entry.value} ${entry.unit || ''}` : 'N/A'}</strong>
          </div>
        ))}
        {data.weather_condition && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Condition: {data.weather_condition}
          </div>
        )}
        {data.ingest_timestamp && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
            {data.ingest_timestamp.substring(11, 19)} UTC
          </div>
        )}
      </div>
    );
  }
  return null;
};

const LiveCharts = ({ streamData = [] }) => {
  const [activeTab, setActiveTab] = useState('bars'); // 'bars' or 'timeline'

  // Extract latest reading per city for comparative bar charts
  const latestByCity = {};
  for (const row of streamData) {
    if (row.city && !latestByCity[row.city]) {
      latestByCity[row.city] = row;
    }
  }

  const targetCities = ["Bengaluru", "Delhi", "Mumbai", "Chennai", "Hyderabad"];
  const cityComparisonData = targetCities
    .map(city => latestByCity[city])
    .filter(Boolean)
    .map(item => ({
      city: item.city,
      temperature: item.temperature !== null ? Number(item.temperature) : null,
      humidity: item.humidity !== null ? Number(item.humidity) : null,
      weather_condition: item.weather_condition,
      ingest_timestamp: item.ingest_timestamp
    }));

  // Timeline data: recent streaming observations in chronological order
  const timelineData = [...streamData]
    .slice(0, 25)
    .reverse()
    .map((item, index) => {
      const timeLabel = item.ingest_timestamp 
        ? item.ingest_timestamp.substring(11, 19)
        : `#${index + 1}`;
      return {
        point: `${item.city} (${timeLabel})`,
        city: item.city,
        temperature: item.temperature !== null ? Number(item.temperature) : null,
        humidity: item.humidity !== null ? Number(item.humidity) : null,
        weather_condition: item.weather_condition,
        ingest_timestamp: item.ingest_timestamp
      };
    });

  return (
    <div className="live-charts-container">
      <div className="charts-tab-header">
        <div className="tab-title">
          <span className="live-status-pill">
            <span className="live-dot pulse"></span>
            LIVE CHARTS
          </span>
          <h3>Real-Time Climate Visualizations</h3>
        </div>
        <div className="chart-view-toggle">
          <button 
            className={`btn-toggle ${activeTab === 'bars' ? 'active' : ''}`}
            onClick={() => setActiveTab('bars')}
          >
            <BarChart2 size={15} style={{marginRight: '6px'}} />
            City Snapshot
          </button>
          <button 
            className={`btn-toggle ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <TrendingUp size={15} style={{marginRight: '6px'}} />
            Stream Progression
          </button>
        </div>
      </div>

      {cityComparisonData.length === 0 ? (
        <div className="chart-card empty-chart-card">
          <div className="empty-state">
            <Thermometer size={24} className="text-accent" style={{marginBottom: '8px'}} />
            <div>Awaiting real-time stream batches to render live charts...</div>
          </div>
        </div>
      ) : activeTab === 'bars' ? (
        <div className="live-charts-grid">
          {/* Live Temperature Bar Chart */}
          <div className="chart-card">
            <div className="card-header-flex">
              <h4>
                <Thermometer size={16} className="text-warning" style={{marginRight: '6px'}} />
                Live Temperature by City (&deg;C)
              </h4>
              <span className="source-label streaming">Kafka &rarr; Spark</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cityComparisonData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="city" tick={{ fill: 'var(--chart-text)', fontSize: 12 }} stroke="var(--chart-grid)" />
                  <YAxis unit="°C" domain={[0, 'dataMax + 5']} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} stroke="var(--chart-grid)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="temperature" name="Live Temp" fill="var(--warning)" radius={[6, 6, 0, 0]} unit="°C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="chart-footer-note">Real-time temperature observed from the most recent Open-Meteo ingestion.</p>
          </div>

          {/* Live Humidity Bar Chart */}
          <div className="chart-card">
            <div className="card-header-flex">
              <h4>
                <Droplets size={16} className="text-info" style={{marginRight: '6px'}} />
                Live Relative Humidity (%)
              </h4>
              <span className="source-label streaming">Kafka &rarr; Spark</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cityComparisonData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="city" tick={{ fill: 'var(--chart-text)', fontSize: 12 }} stroke="var(--chart-grid)" />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} stroke="var(--chart-grid)" />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="var(--accent)" strokeDasharray="4 4" label={{ value: 'High Humidity', fill: 'var(--accent)', fontSize: 10, position: 'top' }} />
                  <Bar dataKey="humidity" name="Live Humidity" fill="var(--info)" radius={[6, 6, 0, 0]} unit="%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="chart-footer-note">Current atmospheric moisture content recorded across active partitions.</p>
          </div>
        </div>
      ) : (
        /* Timeline Mode: Microbatch Stream Progression */
        <div className="chart-card">
          <div className="card-header-flex">
            <h4>
              <TrendingUp size={16} className="text-accent" style={{marginRight: '6px'}} />
              Stream Microbatch Timeline (Last 25 Events)
            </h4>
            <span className="source-label streaming">Spark Structured Streaming</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timelineData} margin={{ top: 15, right: 25, left: -5, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="point" angle={-30} textAnchor="end" interval={0} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} stroke="var(--chart-grid)" />
                <YAxis yAxisId="left" unit="°C" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} stroke="var(--chart-grid)" />
                <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} stroke="var(--chart-grid)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: 'var(--text-primary)', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="var(--warning)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} unit="°C" />
                <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="var(--info)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} unit="%" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-footer-note">Sequential chronological events committed to HDFS Parquet by Spark Structured Streaming.</p>
        </div>
      )}
    </div>
  );
};

export default LiveCharts;
