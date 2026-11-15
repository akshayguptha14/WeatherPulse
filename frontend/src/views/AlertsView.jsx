import React, { useState, useEffect } from 'react';
import {
  getAlerts,
  getAlertsSummary,
  getAlertThresholds,
  getAlertsHistory,
  getHistoricalExtremes
} from '../services/api';
import AlertsHeaderSummary from '../components/AlertsHeaderSummary';
import AlertFilterToolbar from '../components/AlertFilterToolbar';
import AlertsPanel from '../components/AlertsPanel';
import ThresholdRulesModal from '../components/ThresholdRulesModal';
import { Loader2, AlertCircle, Clock, ShieldAlert, History, Database, Layers } from 'lucide-react';

const AlertsView = ({ refreshTrigger }) => {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'history' | 'extremes'

  // Filter States
  const [city, setCity] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertSummary, setAlertSummary] = useState({});
  const [thresholdsData, setThresholdsData] = useState(null);
  const [historyData, setHistoryData] = useState({ items: [], page: 1, total_pages: 1, total_items: 0 });
  const [historicalExtremes, setHistoricalExtremes] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  const handleResetFilters = () => {
    setCity('All');
    setSeverity('All');
    setCategory('All');
    setSearchQuery('');
  };

  const fetchAlertsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [alertsRes, summaryRes, thresholdsRes, extremesRes, histRes] = await Promise.allSettled([
        getAlerts({ city, severity }),
        getAlertsSummary(),
        getAlertThresholds(),
        getHistoricalExtremes(),
        getAlertsHistory({ city, severity, page: 1, pageSize: 25 })
      ]);

      if (alertsRes.status === 'fulfilled' && alertsRes.value) {
        setActiveAlerts(alertsRes.value);
      }
      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setAlertSummary(summaryRes.value);
      }
      if (thresholdsRes.status === 'fulfilled' && thresholdsRes.value) {
        setThresholdsData(thresholdsRes.value);
      }
      if (extremesRes.status === 'fulfilled' && extremesRes.value) {
        setHistoricalExtremes(extremesRes.value);
      }
      if (histRes.status === 'fulfilled' && histRes.value) {
        setHistoryData(histRes.value);
      }
    } catch (err) {
      console.error('Failed to load alert telemetry:', err);
      setError('Unable to load alert telemetry from backend engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
    const interval = setInterval(fetchAlertsData, 15000); // 15s polling aligned with engine
    return () => clearInterval(interval);
  }, [city, severity, refreshTrigger]);

  const handleAlertAcknowledged = (alertId, updatedAlert) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, ...updatedAlert } : a))
    );
    // Refresh summary counts
    getAlertsSummary().then((res) => {
      if (res) setAlertSummary(res);
    }).catch(() => {});
  };

  // Client-side category and search filtering
  const filteredActiveAlerts = activeAlerts.filter((a) => {
    if (category !== 'All' && a.category !== category) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = a.message && a.message.toLowerCase().includes(q);
      const matchTitle = a.title && a.title.toLowerCase().includes(q);
      const matchCity = a.city && a.city.toLowerCase().includes(q);
      const matchRule = a.rule_id && a.rule_id.toLowerCase().includes(q);
      if (!matchMsg && !matchTitle && !matchCity && !matchRule) return false;
    }
    return true;
  });

  return (
    <div className="view-container fade-in">
      {/* View Header */}
      <div className="view-header">
        <div className="view-header-title-row">
          <div>
            <div className="header-badge-row">
              <span className="live-status-pill">
                <span className="live-dot pulse"></span>
                METEOROLOGICAL RULES ENGINE
              </span>
              <span className="source-label streaming">15s Evaluation Cycle • Multi-tier Thresholds</span>
            </div>
            <h2>Intelligent Weather Alert Center</h2>
            <p>
              Rule-based telemetry engine evaluating live Kafka/Spark streams against MapReduce historical baselines
            </p>
          </div>

          <div className="view-mode-tabs">
            <button
              className={`view-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
              onClick={() => setActiveTab('live')}
            >
              <ShieldAlert size={15} /> Active Stream Alerts ({filteredActiveAlerts.length})
            </button>
            <button
              className={`view-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={15} /> Alert History Log
            </button>
            <button
              className={`view-tab-btn ${activeTab === 'extremes' ? 'active' : ''}`}
              onClick={() => setActiveTab('extremes')}
            >
              <Database size={15} /> Historical Extremes (Hive)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards & Engine Status */}
      <AlertsHeaderSummary
        summary={alertSummary}
        onOpenThresholds={() => setIsThresholdModalOpen(true)}
        onRefresh={fetchAlertsData}
        loading={loading}
      />

      {/* Filter Toolbar (applied to live and history views) */}
      <AlertFilterToolbar
        city={city}
        setCity={setCity}
        severity={severity}
        setSeverity={setSeverity}
        category={category}
        setCategory={setCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onReset={handleResetFilters}
        totalMatching={filteredActiveAlerts.length}
      />

      {/* Main Tab Content */}
      {loading && activeAlerts.length === 0 ? (
        <div className="chart-card loading-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent)' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: '500' }}>Evaluating Stream Partitions...</div>
          <p className="text-muted" style={{ fontSize: '0.84rem', marginTop: '6px' }}>
            Auditing observations from Kafka topic weather_stream against threshold matrix
          </p>
        </div>
      ) : error && activeAlerts.length === 0 ? (
        <div className="chart-card error-card">
          <div className="empty-state error">
            <AlertCircle size={32} className="text-warning" style={{ margin: '0 auto 12px' }} />
            <h3>Unable to load alerts</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>{error}</p>
            <button className="btn-primary mt-3" onClick={fetchAlertsData}>Retry Evaluation</button>
          </div>
        </div>
      ) : (
        <div className="alerts-content-space">
          {/* TAB 1: LIVE ACTIVE ALERTS */}
          {activeTab === 'live' && (
            <AlertsPanel
              alerts={filteredActiveAlerts}
              onAlertAcknowledged={handleAlertAcknowledged}
            />
          )}

          {/* TAB 2: ALERT HISTORY LOG */}
          {activeTab === 'history' && (
            <div className="alert-history-card glass-panel">
              <div className="table-caption-bar">
                <div>
                  <h4 className="table-title">Audit Log of Evaluated Alert Events</h4>
                  <span className="table-sub">
                    Chronological record of generated alerts with 30-min cooldown and escalation audit trails
                  </span>
                </div>
                <span className="table-row-count">{historyData.total_items || 0} Total Events Logged</span>
              </div>

              {historyData.items && historyData.items.length > 0 ? (
                <div className="historical-table-container">
                  <table className="historical-data-table">
                    <thead>
                      <tr>
                        <th>Alert ID</th>
                        <th>Severity</th>
                        <th>City</th>
                        <th>Rule / Category</th>
                        <th>Measured Metric</th>
                        <th>Trigger Threshold</th>
                        <th>Trigger Timestamp</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.items.map((item) => (
                        <tr key={item.id}>
                          <td className="font-mono text-xs text-cyan-400">{item.id.slice(0, 16)}...</td>
                          <td>
                            <span className={`sev-badge-pill sev-${(item.severity || '').toLowerCase()} text-xs`}>
                              {item.severity}
                            </span>
                          </td>
                          <td className="font-semibold">{item.city}</td>
                          <td>
                            <strong>{item.title}</strong>
                            <div className="text-xs text-muted">{item.category}</div>
                          </td>
                          <td className="font-mono">
                            {typeof item.metric_value === 'number'
                              ? `${item.metric_value.toFixed(1)} ${item.metric_unit || ''}`
                              : item.metric_value}
                          </td>
                          <td className="text-amber-400 text-xs">
                            {typeof item.threshold_value === 'number'
                              ? `${item.threshold_value} ${item.metric_unit || ''}`
                              : item.threshold_value}
                          </td>
                          <td className="text-xs text-muted">
                            {item.alert_timestamp ? item.alert_timestamp.split('.')[0].replace('T', ' ') : 'N/A'}
                          </td>
                          <td>
                            <span className={`status-pill ${item.status === 'ACKNOWLEDGED' ? 'status-acked' : 'status-active'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state p-8 text-center text-muted">
                  No historical alert records currently logged in storage.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORICAL EXTREME WEATHER (HIVE QUERY 10) */}
          {activeTab === 'extremes' && (
            <div className="alert-history-card glass-panel">
              <div className="table-caption-bar">
                <div>
                  <h4 className="table-title">Historical Baseline Extreme Records (Hadoop Hive)</h4>
                  <span className="table-sub">
                    Source: Apache Hive MapReduce Query <code>10_extreme_weather.hql</code> on Sep 11–18, 2026 Dataset (Strictly separated from live streaming stream)
                  </span>
                </div>
                <span className="table-row-count">{historicalExtremes.length} Extreme Historical Observations</span>
              </div>

              <div className="historical-table-container">
                <table className="historical-data-table">
                  <thead>
                    <tr>
                      <th>Timestamp (UTC)</th>
                      <th>City</th>
                      <th>Temperature</th>
                      <th>Rainfall</th>
                      <th>Wind Speed</th>
                      <th>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalExtremes.map((r, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-slate-300">{r.timestamp}</td>
                        <td className="font-semibold">{r.city}</td>
                        <td className={r.temperature >= 40 ? 'text-red-400 font-bold' : ''}>
                          {r.temperature !== null ? `${r.temperature.toFixed(1)}°C` : 'N/A'}
                        </td>
                        <td className={r.rainfall >= 20 ? 'text-cyan-400 font-bold' : ''}>
                          {r.rainfall !== null ? `${r.rainfall.toFixed(1)} mm` : 'N/A'}
                        </td>
                        <td className={r.wind_speed >= 20 ? 'text-amber-400 font-bold' : ''}>
                          {r.wind_speed !== null ? `${r.wind_speed.toFixed(1)} km/h` : 'N/A'}
                        </td>
                        <td>
                          <span className={`condition-pill condition-${(r.weather_condition || '').toLowerCase()}`}>
                            {r.weather_condition || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Threshold Definitions & Scientific Baselines Modal */}
      <ThresholdRulesModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholdsData={thresholdsData}
      />
    </div>
  );
};

export default AlertsView;
