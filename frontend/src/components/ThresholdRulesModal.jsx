import React from 'react';
import { X, Sliders, ShieldCheck, Database, Clock, Zap } from 'lucide-react';

const ThresholdRulesModal = ({ isOpen, onClose, thresholdsData }) => {
  if (!isOpen) return null;

  const rules = thresholdsData?.rules || {};
  const baselines = thresholdsData?.city_baselines || {};
  const cooldownSecs = thresholdsData?.cooldown_period_seconds || 1800;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="thresholds-modal-box glass-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Sliders size={20} className="text-primary" />
            <div>
              <h3 className="modal-title">Configured Weather Alert Rules & Scientific Baselines</h3>
              <p className="modal-subtitle">
                Deterministic, explainable big data rules with city-specific MapReduce calibrations
              </p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body scrollable">
          {/* Section 1: Engine Policy Banner */}
          <div className="policy-callout-card">
            <div className="policy-badge">
              <Clock size={16} /> Cooldown Window: <strong>{cooldownSecs / 60} Minutes</strong>
            </div>
            <div className="policy-badge">
              <Zap size={16} /> Severity Escalation: <strong>Immediate Override</strong>
            </div>
            <div className="policy-badge">
              <Database size={16} /> Baseline Source: <strong>Hadoop MapReduce (part-r-00000)</strong>
            </div>
          </div>

          {/* Section 2: Active Threshold Rules Table */}
          <div className="rules-section">
            <h4 className="section-heading">Active Alert Rule Definitions</h4>
            <div className="rules-table-container">
              <table className="rules-table">
                <thead>
                  <tr>
                    <th>Rule / Category</th>
                    <th>Metric & Unit</th>
                    <th>Low Severity</th>
                    <th>Moderate Severity</th>
                    <th>High Severity</th>
                    <th>Critical Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(rules).map((rule) => {
                    const th = rule.thresholds || {};
                    const isCoastal = rule.rule_id === 'COASTAL_HUMID_HEAT';

                    return (
                      <tr key={rule.rule_id}>
                        <td className="rule-meta-cell">
                          <strong className="rule-name">{rule.title}</strong>
                          <span className="rule-cat-pill">{rule.category}</span>
                          <p className="rule-desc">{rule.description}</p>
                        </td>
                        <td className="metric-cell">
                          <code>{rule.metric_name}</code>
                          <span className="unit-badge">{rule.metric_unit}</span>
                        </td>
                        <td>
                          {isCoastal ? (
                            <span className="th-val">≥{th.Low?.min_temp}°C &amp; ≥{th.Low?.min_hum}%</span>
                          ) : (
                            <span className="th-val">≥{th.Low} {rule.metric_unit}</span>
                          )}
                        </td>
                        <td>
                          {isCoastal ? (
                            <span className="th-val">≥{th.Moderate?.min_temp}°C &amp; ≥{th.Moderate?.min_hum}%</span>
                          ) : (
                            <span className="th-val">≥{th.Moderate} {rule.metric_unit}</span>
                          )}
                        </td>
                        <td>
                          {isCoastal ? (
                            <span className="th-val">≥{th.High?.min_temp}°C &amp; ≥{th.High?.min_hum}%</span>
                          ) : (
                            <span className="th-val text-amber-400 font-bold">≥{th.High} {rule.metric_unit}</span>
                          )}
                        </td>
                        <td>
                          {isCoastal ? (
                            <span className="th-val text-red-400 font-bold">≥{th.Critical?.min_temp}°C &amp; ≥{th.Critical?.min_hum}%</span>
                          ) : (
                            <span className="th-val text-red-400 font-bold">≥{th.Critical} {rule.metric_unit}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: City Historical Baselines Matrix */}
          <div className="baselines-section mt-4">
            <h4 className="section-heading">City-Specific Historical Baselines (MapReduce Precomputed)</h4>
            <div className="rules-table-container">
              <table className="rules-table">
                <thead>
                  <tr>
                    <th>Metropolitan City</th>
                    <th>Mean Temperature</th>
                    <th>Mean Humidity</th>
                    <th>Mean Pressure</th>
                    <th>Mean Wind Speed</th>
                    <th>Geographic / Elevation Context</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(baselines).map(([cityName, base]) => {
                    const elevations = {
                      Bengaluru: 'Deccan Plateau (~920m elevation; natural surface pressure ~913 hPa)',
                      Chennai: 'Coromandel Coast (Sea level; natural maritime humidity)',
                      Delhi: 'Indo-Gangetic Plain (~216m elevation; high continental swing)',
                      Hyderabad: 'Deccan Plateau (~542m elevation)',
                      Mumbai: 'Konkan Coast (Sea level; high maritime humidity)'
                    };

                    return (
                      <tr key={cityName}>
                        <td className="font-bold text-primary">{cityName}</td>
                        <td>{base.avg_temperature ? `${base.avg_temperature.toFixed(1)}°C` : 'N/A'}</td>
                        <td>{base.avg_humidity ? `${base.avg_humidity.toFixed(1)}%` : 'N/A'}</td>
                        <td>{base.avg_pressure ? `${base.avg_pressure.toFixed(1)} hPa` : 'N/A'}</td>
                        <td>{base.avg_wind_speed ? `${base.avg_wind_speed.toFixed(1)} km/h` : 'N/A'}</td>
                        <td className="text-muted text-xs">{elevations[cityName] || 'Standard Region'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close Threshold Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThresholdRulesModal;
