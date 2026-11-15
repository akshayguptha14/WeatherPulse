import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TemperatureChart = ({ data }) => {
  return (
    <div className="chart-card">
      <h3>Average Temperature by City <span className="source-label">Hive/HDFS</span></h3>
      {!data || data.length === 0 ? (
        <div className="empty-state">No temperature data available.</div>
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="city" tick={{fill: 'var(--chart-text)'}} stroke="var(--chart-grid)" />
              <YAxis tick={{fill: 'var(--chart-text)'}} stroke="var(--chart-grid)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
              <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
              <Line type="monotone" dataKey="avg_temperature" stroke="#ff7300" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Avg Temperature (&deg;C)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TemperatureChart;
