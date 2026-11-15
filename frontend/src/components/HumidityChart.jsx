import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HumidityChart = ({ data }) => {
  return (
    <div className="chart-card">
      <h3>Average Humidity by City <span className="source-label">Hive/HDFS</span></h3>
      {!data || data.length === 0 ? (
        <div className="empty-state">No humidity data available.</div>
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 15, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tick={{fill: 'var(--chart-text)'}} stroke="var(--chart-grid)" />
              <YAxis dataKey="city" type="category" width={85} tick={{fill: 'var(--chart-text)', fontSize: 13}} stroke="var(--chart-grid)" />
              <Tooltip cursor={{fill: 'var(--faint-bg)'}} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
              <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
              <Bar dataKey="avg_humidity" fill="var(--info)" name="Avg Humidity (%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default HumidityChart;
