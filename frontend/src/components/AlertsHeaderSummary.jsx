import React from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, Sliders, RefreshCw, Layers } from 'lucide-react';

const AlertsHeaderSummary = ({ summary = {}, onOpenThresholds, onRefresh, loading }) => {
  const bySev = summary.by_severity || { Critical: 0, High: 0, Moderate: 0, Low: 0 };
  const totalActive = summary.total_active || 0;
  const engine = summary.engine_status || {};

  return (
    <div className="alerts-header-summary-container">
      {/* KPI Cards Row */}
      <div className="alerts-kpi-grid">
        {/* Total Active Alerts */}
        <div className="alert-kpi-card glass-panel kpi-total">
          <div className="kpi-icon-box total">
            <Layers size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Active Alerts</span>
            <div className="kpi-val-row">
              <span className="kpi-val">{totalActive}</span>
              <span className="kpi-subtext">Live Stream</span>
            </div>
          </div>
        </div>

        {/* Critical */}
        <div className="alert-kpi-card glass-panel kpi-critical">
          <div className="kpi-icon-box critical">
            <ShieldAlert size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Critical</span>
            <div className="kpi-val-row">
              <span className="kpi-val text-red-400">{bySev.Critical || 0}</span>
              <span className="kpi-subtext">Immediate Hazard</span>
            </div>
          </div>
        </div>

        {/* High */}
        <div className="alert-kpi-card glass-panel kpi-high">
          <div className="kpi-icon-box high">
            <AlertTriangle size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">High Warning</span>
            <div className="kpi-val-row">
              <span className="kpi-val text-amber-400">{bySev.High || 0}</span>
              <span className="kpi-subtext">Significant Anomaly</span>
            </div>
          </div>
        </div>

        {/* Moderate */}
        <div className="alert-kpi-card glass-panel kpi-moderate">
          <div className="kpi-icon-box moderate">
            <Info size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Moderate</span>
            <div className="kpi-val-row">
              <span className="kpi-val text-yellow-300">{bySev.Moderate || 0}</span>
              <span className="kpi-subtext">Seasonal Shift</span>
            </div>
          </div>
        </div>

        {/* Low / Notice */}
        <div className="alert-kpi-card glass-panel kpi-low">
          <div className="kpi-icon-box low">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Low / Notice</span>
            <div className="kpi-val-row">
              <span className="kpi-val text-sky-400">{bySev.Low || 0}</span>
              <span className="kpi-subtext">Informational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Engine Status & Action Bar */}
      <div className="engine-status-bar glass-panel">
        <div className="engine-status-left">
          <div className="engine-pulse-badge">
            <span className="pulse-dot"></span>
            <span className="engine-status-text">
              Rule Engine: <strong>{engine.status || 'RUNNING'}</strong>
            </span>
          </div>
          <span className="engine-meta-item">
            Evaluations: <strong>{engine.evaluations_count || 0}</strong>
          </span>
          <span className="engine-meta-item">
            Cooldown: <strong>30m Active</strong>
          </span>
          {engine.watermark && (
            <span className="engine-meta-item watermark">
              Watermark: <code>{engine.watermark.split('.')[0].replace('T', ' ')}</code>
            </span>
          )}
        </div>

        <div className="engine-status-right">
          <button
            className="btn-thresholds-modal"
            onClick={onOpenThresholds}
            title="Inspect all configured threshold definitions, city baselines, and scientific formulas"
          >
            <Sliders size={15} /> Threshold Definitions
          </button>
          <button
            className="btn-refresh-alerts"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh active alerts"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertsHeaderSummary;
