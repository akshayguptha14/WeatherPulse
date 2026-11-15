import React, { useState, useEffect } from 'react';
import { Settings, Monitor, Database, Shield, Zap, Server, HardDrive, RefreshCw } from 'lucide-react';
import { getEcosystemStatus, getBackendStatus } from '../services/api';

const SettingsView = () => {
  const [eco, setEco] = useState(null);
  const [backend, setBackend] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClusterInfo = async () => {
    try {
      const [ecoData, backendData] = await Promise.allSettled([
        getEcosystemStatus(),
        getBackendStatus()
      ]);
      if (ecoData.status === 'fulfilled') setEco(ecoData.value);
      if (backendData.status === 'fulfilled') setBackend(backendData.value);
    } catch (err) {
      console.error('Failed to load settings telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusterInfo();
  }, []);

  return (
    <div className="view-container fade-in">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="header-badge-row">
            <span className="live-status-pill">
              <span className="live-dot pulse"></span>
              SYSTEM CONFIGURATION
            </span>
            <span className="source-label streaming">Cluster Limits • Daemons • Architecture</span>
          </div>
          <h2>Settings & System Telemetry</h2>
          <p>Application architecture, cluster resource limits, and live service configuration</p>
        </div>
        <button
          className="btn-secondary btn-sm"
          onClick={() => { setLoading(true); fetchClusterInfo(); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Status
        </button>
      </div>

      <div className="settings-grid">
        {/* Card 1: Appearance & UI Preferences */}
        <div className="settings-card">
          <div className="card-heading">
            <Monitor size={20} className="heading-icon" />
            <h3>Appearance & Preferences</h3>
          </div>
          <div className="settings-content">
            <p className="text-muted">WeatherPulse visual layout and dark cinematic meteorological theme.</p>
            <div className="setting-row">
              <span>Theme Mode</span>
              <span className="badge">Cinematic Dark</span>
            </div>
            <div className="setting-row">
              <span>Telemetry Auto-Polling</span>
              <span className="badge">15s Interval</span>
            </div>
            <div className="setting-row">
              <span>Streaming Animation</span>
              <span className="badge">Hardware Accelerated</span>
            </div>
          </div>
        </div>

        {/* Card 2: Live Big Data Cluster Telemetry */}
        <div className="settings-card">
          <div className="card-heading">
            <Database size={20} className="heading-icon" />
            <h3>Live Cluster Telemetry</h3>
          </div>
          <div className="settings-content">
            <div className="setting-row">
              <span>Frontend Stack</span>
              <span className="text-value">React 19 + Vite 8</span>
            </div>
            <div className="setting-row">
              <span>Flask REST API</span>
              <span className="text-value">
                {backend ? `Online (PID: ${backend.pid})` : 'Python Flask'}
              </span>
            </div>
            <div className="setting-row">
              <span>HDFS Distributed Storage</span>
              <span className="text-value">
                {eco?.hdfs?.metrics?.used_storage_formatted
                  ? `${eco.hdfs.metrics.used_storage_formatted} / ${eco.hdfs.metrics.total_storage_formatted}`
                  : 'Hadoop HDFS (1.0 TB)'}
              </span>
            </div>
            <div className="setting-row">
              <span>YARN Resource Manager</span>
              <span className="text-value">
                {eco?.yarn?.metrics?.allocated_mb !== undefined
                  ? `${eco.yarn.metrics.allocated_mb} / ${eco.yarn.metrics.total_mb} MB RAM (${eco.yarn.metrics.memory_used_percent}%)`
                  : 'YARN (8.0 GB RAM)'}
              </span>
            </div>
            <div className="setting-row">
              <span>Kafka Message Stream</span>
              <span className="text-value">
                {eco?.kafka?.metrics?.total_messages !== undefined
                  ? `${eco.kafka.metrics.total_messages.toLocaleString()} msgs (3 Partitions)`
                  : 'Apache Kafka :9092'}
              </span>
            </div>
            <div className="setting-row">
              <span>Spark Streaming Engine</span>
              <span className="text-value">
                {eco?.spark?.metrics?.name
                  ? `${eco.spark.metrics.name} (${eco.spark.metrics.elapsed_time || 'Running'})`
                  : 'Spark on YARN'}
              </span>
            </div>
            <div className="setting-row">
              <span>Hive Data Warehouse</span>
              <span className="text-value">
                {eco?.hive?.metrics?.pid
                  ? `HiveServer2 (PID: ${eco.hive.metrics.pid})`
                  : 'Apache Hive :10000'}
              </span>
            </div>
            <div className="setting-row">
              <span>MapReduce Batch Engine</span>
              <span className="text-value">
                {eco?.mapreduce?.metrics?.has_success_marker
                  ? 'Phase 3 Output Verified'
                  : 'Hadoop MapReduce v2'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Network & API Configuration */}
        <div className="settings-card">
          <div className="card-heading">
            <Zap size={20} className="heading-icon" />
            <h3>API & Web Dashboards</h3>
          </div>
          <div className="settings-content">
            <div className="setting-row">
              <span>Backend Endpoint</span>
              <code className="code-block">http://localhost:5000</code>
            </div>
            <div className="setting-row">
              <span>HDFS NameNode UI</span>
              <a
                href="http://localhost:9870"
                target="_blank"
                rel="noopener noreferrer"
                className="code-block"
                style={{ textDecoration: 'none', color: '#38bdf8' }}
              >
                :9870 NameNode Web UI ↗
              </a>
            </div>
            <div className="setting-row">
              <span>YARN ResourceManager UI</span>
              <a
                href="http://localhost:8088"
                target="_blank"
                rel="noopener noreferrer"
                className="code-block"
                style={{ textDecoration: 'none', color: '#38bdf8' }}
              >
                :8088 YARN Web UI ↗
              </a>
            </div>
            <div className="setting-row">
              <span>Ecosystem Cache TTL</span>
              <code className="code-block">20.0 seconds (In-Memory)</code>
            </div>
            <div className="setting-row">
              <span>API Inactivity Timeout</span>
              <code className="code-block">600,000 ms (10 mins)</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;