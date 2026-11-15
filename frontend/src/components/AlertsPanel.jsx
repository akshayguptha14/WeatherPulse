import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, Check, Clock, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { acknowledgeAlert } from '../services/api';

const severityIcons = {
  Critical: <ShieldAlert size={20} className="text-red-400" />,
  High: <AlertTriangle size={20} className="text-amber-400" />,
  Moderate: <Info size={20} className="text-yellow-300" />,
  Low: <CheckCircle2 size={20} className="text-sky-400" />,
};

const AlertsPanel = ({ alerts = [], onAlertAcknowledged }) => {
  const [expandedProvenance, setExpandedProvenance] = useState({});
  const [ackNote, setAckNote] = useState({});
  const [ackingId, setAckingId] = useState(null);

  const toggleProvenance = (id) => {
    setExpandedProvenance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAcknowledge = async (id) => {
    setAckingId(id);
    try {
      const note = ackNote[id] || 'Acknowledged by operator';
      const updated = await acknowledgeAlert(id, note);
      if (updated && onAlertAcknowledged) {
        onAlertAcknowledged(id, updated.alert);
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAckingId(null);
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="alerts-empty-state-panel glass-panel">
        <div className="empty-check-icon">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h4 className="empty-title">All Weather Parameters Within Configured Thresholds</h4>
        <p className="empty-desc">
          No active anomaly or hazard alerts detected across the streaming pipeline for the active filter scope.
        </p>
      </div>
    );
  }

  return (
    <div className="alerts-feed-container">
      {alerts.map((alert) => {
        const isExpanded = !!expandedProvenance[alert.id];
        const isAcked = alert.status === 'ACKNOWLEDGED';
        const sevClass = (alert.severity || 'low').toLowerCase();

        return (
          <div
            key={alert.id}
            className={`alert-card-item glass-panel sev-${sevClass} ${isAcked ? 'acked' : ''}`}
          >
            {/* Top Row: Severity Tag, City, Rule Title, Status */}
            <div className="alert-card-top">
              <div className="alert-type-group">
                <span className={`sev-badge-pill sev-${sevClass}`}>
                  {severityIcons[alert.severity] || <Info size={16} />}
                  <span className="sev-text">{alert.severity}</span>
                </span>
                <span className="alert-city-tag">📍 {alert.city}</span>
                <span className="alert-rule-title">{alert.title}</span>
              </div>

              <div className="alert-top-actions">
                <span className={`status-pill ${isAcked ? 'status-acked' : 'status-active'}`}>
                  {isAcked ? '✓ ACKNOWLEDGED' : '● ACTIVE'}
                </span>
                <span className="alert-time-meta">
                  <Clock size={12} />
                  {alert.alert_timestamp ? alert.alert_timestamp.split('.')[0].replace('T', ' ') : 'Just now'}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <p className="alert-message-text">{alert.message}</p>

            {/* Metrics Breakdown Bar */}
            <div className="alert-metrics-strip">
              <div className="metric-cell">
                <span className="metric-lbl">Measured Observation:</span>
                <span className="metric-val text-primary font-bold">
                  {typeof alert.metric_value === 'number'
                    ? `${alert.metric_value.toFixed(1)} ${alert.metric_unit || ''}`
                    : alert.metric_value}
                </span>
              </div>

              <div className="metric-cell">
                <span className="metric-lbl">Trigger Threshold:</span>
                <span className="metric-val text-amber-400 font-semibold">
                  {typeof alert.threshold_value === 'number'
                    ? `${alert.threshold_value} ${alert.metric_unit || ''}`
                    : alert.threshold_value}
                </span>
              </div>

              {alert.baseline_value !== null && alert.baseline_value !== undefined && (
                <div className="metric-cell">
                  <span className="metric-lbl">Historical MapReduce Mean:</span>
                  <span className="metric-val text-muted">
                    {typeof alert.baseline_value === 'number'
                      ? `${alert.baseline_value.toFixed(1)} ${alert.metric_unit || ''}`
                      : alert.baseline_value}
                  </span>
                </div>
              )}
            </div>

            {/* Acknowledged note if already acked */}
            {isAcked && alert.acknowledged_note && (
              <div className="acked-info-note">
                <Check size={14} className="text-emerald-400" />
                <span>
                  Acknowledged: <em>"{alert.acknowledged_note}"</em>
                  {alert.acknowledged_at && ` at ${alert.acknowledged_at.split('.')[0].replace('T', ' ')}`}
                </span>
              </div>
            )}

            {/* Footer with Provenance Drawer Toggle & Ack Action */}
            <div className="alert-card-footer">
              <button
                className="btn-toggle-provenance"
                onClick={() => toggleProvenance(alert.id)}
              >
                <Database size={13} />
                <span>Pipeline Provenance</span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {!isAcked && (
                <div className="ack-action-group">
                  <input
                    type="text"
                    className="ack-note-input"
                    placeholder="Optional acknowledgement note..."
                    value={ackNote[alert.id] || ''}
                    onChange={(e) => setAckNote({ ...ackNote, [alert.id]: e.target.value })}
                  />
                  <button
                    className="btn-ack-alert"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={ackingId === alert.id}
                  >
                    {ackingId === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                  </button>
                </div>
              )}
            </div>

            {/* Expandable Provenance Details Drawer */}
            {isExpanded && (
              <div className="provenance-drawer fade-in">
                <div className="provenance-grid">
                  <div className="prov-item">
                    <span className="prov-lbl">Observation Source TS:</span>
                    <code className="prov-val">{alert.source_timestamp || 'N/A'}</code>
                  </div>
                  <div className="prov-item">
                    <span className="prov-lbl">Kafka Ingestion TS:</span>
                    <code className="prov-val">{alert.ingest_timestamp || 'N/A'}</code>
                  </div>
                  <div className="prov-item">
                    <span className="prov-lbl">Spark Processing TS:</span>
                    <code className="prov-val">{alert.spark_processing_timestamp || 'N/A'}</code>
                  </div>
                  <div className="prov-item">
                    <span className="prov-lbl">Rule Engine Evaluated:</span>
                    <code className="prov-val">{alert.alert_timestamp || 'N/A'}</code>
                  </div>
                </div>

                <div className="provenance-pipeline-flow">
                  <span className="prov-step">📡 Open-Meteo v2</span>
                  <span className="prov-arrow">➔</span>
                  <span className="prov-step">📨 Kafka (weather_stream)</span>
                  <span className="prov-arrow">➔</span>
                  <span className="prov-step">⚡ PySpark Streaming (YARN)</span>
                  <span className="prov-arrow">➔</span>
                  <span className="prov-step">💾 HDFS Parquet (/weather/streaming/raw)</span>
                  <span className="prov-arrow">➔</span>
                  <span className="prov-step highlight">🛡️ Alert Rule Engine</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AlertsPanel;
