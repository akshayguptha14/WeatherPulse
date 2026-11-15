import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { BarChart3, PieChart, Layers } from 'lucide-react';

const QualityCharts = ({ metrics = {}, summary = {} }) => {
  const cityCompleteness = metrics.city_completeness || {};
  const penalties = summary.penalties || {};
  const fieldMissing = metrics.field_missing_counts || {};

  // Data for Chart 1: City Completeness
  const completenessData = Object.entries(cityCompleteness).map(([city, data]) => ({
    city,
    completeness: data.completeness_percentage || 0,
    received: data.received_observations || 0,
    expected: data.expected_observations || 0
  }));

  // Data for Chart 2: Penalty Deductions
  const penaltyData = [
    { name: 'Missing', value: penalties.missing || 0, color: '#f59e0b' },
    { name: 'Duplicates', value: penalties.duplicates || 0, color: '#3b82f6' },
    { name: 'Range', value: penalties.invalid || 0, color: '#ef4444' },
    { name: 'Timestamp', value: penalties.timestamp || 0, color: '#a855f7' },
    { name: 'Completeness', value: penalties.completeness || 0, color: '#06b6d4' },
    { name: 'Freshness', value: penalties.freshness || 0, color: '#ec4899' }
  ];

  // Data for Chart 3: Field-level missing counts
  const fieldData = Object.entries(fieldMissing).map(([field, count]) => ({
    field: field.replace('_', ' '),
    count
  }));

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-val font-mono">{`${payload[0].name || 'Value'}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="quality-charts-grid">
      {/* 1. City-Wise Completeness Ratio */}
      <div className="chart-card">
        <div className="card-header-row">
          <div>
            <h3>City-Wise Data Completeness</h3>
            <p className="card-subtitle">Expected vs received observations over sliding audit sample</p>
          </div>
          <BarChart3 size={18} className="text-accent" />
        </div>
        <div className="chart-container" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completenessData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="city" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" tickLine={false} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="custom-chart-tooltip">
                        <p className="tooltip-label">{d.city}</p>
                        <p className="tooltip-val font-mono">Completeness: {d.completeness}%</p>
                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Received: {d.received} / {d.expected} cycles</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="completeness" name="Completeness %" radius={[4, 4, 0, 0]}>
                {completenessData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.completeness >= 90 ? '#10b981' : entry.completeness >= 60 ? '#f59e0b' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. DQS Penalty Deduction Breakdown */}
      <div className="chart-card">
        <div className="card-header-row">
          <div>
            <h3>DQS Penalty Attribution</h3>
            <p className="card-subtitle">Points deducted from base score (100.0) by quality dimension</p>
          </div>
          <PieChart size={18} className="text-warning" />
        </div>
        <div className="chart-container" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={penaltyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} unit=" pts" tickLine={false} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="custom-chart-tooltip">
                        <p className="tooltip-label">{d.name} Penalty</p>
                        <p className="tooltip-val font-mono" style={{ color: d.color }}>-{d.value} points</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" name="Deducted Points" radius={[4, 4, 0, 0]}>
                {penaltyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default QualityCharts;
