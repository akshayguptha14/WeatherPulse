import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RainfallChart = ({ data }) => {
  return (
    <div className="chart-card">
      <h3>Total Rainfall Comparison <span className="source-label">Hive/HDFS</span></h3>
      {!data || data.length === 0 ? (
        <div className="empty-state">No rainfall data available.</div>
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="city" tick={{fill: 'var(--chart-text)'}} stroke="var(--chart-grid)" />
              <YAxis tick={{fill: 'var(--chart-text)'}} stroke="var(--chart-grid)" />
              <Tooltip cursor={{fill: 'var(--faint-bg)'}} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
              <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
              <Bar dataKey="total_rainfall" fill="var(--accent)" name="Total Rainfall (mm)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RainfallChart;
