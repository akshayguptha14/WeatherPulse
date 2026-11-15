import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

app_jsx = """import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import DashboardView from './views/DashboardView';
import AnalyticsView from './views/AnalyticsView';
import LiveStreamView from './views/LiveStreamView';
import HistoricalDataView from './views/HistoricalDataView';
import AlertsView from './views/AlertsView';
import SettingsView from './views/SettingsView';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState('dark');

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    document.body.className = theme === 'dark' ? 'light-theme' : '';
  };

  return (
    <BrowserRouter>
      <Layout onRefresh={handleRefresh} toggleTheme={toggleTheme} theme={theme}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView refreshTrigger={refreshTrigger} />} />
          <Route path="/analytics" element={<AnalyticsView refreshTrigger={refreshTrigger} />} />
          <Route path="/stream" element={<LiveStreamView refreshTrigger={refreshTrigger} />} />
          <Route path="/historical" element={<HistoricalDataView refreshTrigger={refreshTrigger} />} />
          <Route path="/alerts" element={<AlertsView refreshTrigger={refreshTrigger} />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
"""

layout_jsx = """import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart2, 
  Activity, 
  Clock, 
  Bell, 
  Settings, 
  RefreshCw, 
  Sun, 
  Moon,
  Menu,
  X,
  Database
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children, onRefresh, toggleTheme, theme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const handleRefreshClick = () => {
    setLastRefreshed(new Date());
    onRefresh();
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Database className="logo-icon" size={24} />
          <div className="logo-text">
            <h2>Weather & Climate</h2>
            <p>Big Data Analytics</p>
          </div>
          <button className="mobile-close" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" onClick={closeSidebar} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/analytics" onClick={closeSidebar} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BarChart2 size={20} />
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/stream" onClick={closeSidebar} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Activity size={20} />
            <span>Live Stream</span>
          </NavLink>
          <NavLink to="/historical" onClick={closeSidebar} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Clock size={20} />
            <span>Historical Data</span>
          </NavLink>
          <NavLink to="/alerts" onClick={closeSidebar} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Bell size={20} />
            <span>Alerts</span>
          </NavLink>
          <NavLink to="/settings" onClick={closeSidebar} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <p className="powered-by">Powered by</p>
          <div className="tech-stack">
            <span className="badge">Kafka</span>
            <span className="badge">Spark</span>
            <span className="badge">Hadoop</span>
            <span className="badge">Hive</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-wrapper">
        <header className="top-header">
          <div className="header-left">
            <button className="mobile-menu" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="header-titles">
              <h1>Weather & Climate Analytics</h1>
              <p>Big Data • Real-time • Smarter Decisions</p>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="live-indicator">
              <span className="dot pulse"></span> LIVE
            </div>
            <span className="last-refresh hidden-mobile">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button className="icon-btn" onClick={handleRefreshClick} title="Refresh">
              <RefreshCw size={18} />
              <span className="hidden-mobile">Refresh</span>
            </button>
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
      
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
    </div>
  );
};

export default Layout;
"""

layout_css = """/* Layout.css */
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-dark);
}

.sidebar {
  width: 260px;
  background-color: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border);
}

.logo-icon {
  color: var(--accent);
}

.logo-text h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.logo-text p {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.mobile-close {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  margin-left: auto;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: rgba(255,255,255,0.05);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: rgba(52, 152, 219, 0.15);
  color: var(--accent);
  border-left: 3px solid var(--accent);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--border);
}

.powered-by {
  margin: 0 0 10px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  font-size: 0.7rem;
  padding: 4px 8px;
  background-color: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-secondary);
  font-weight: 600;
}

/* Main content */
.main-wrapper {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-header {
  height: 70px;
  background-color: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  position: sticky;
  top: 0;
  z-index: 90;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.mobile-menu {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0;
}

.header-titles h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-titles p {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--success);
  letter-spacing: 0.5px;
  background: rgba(46, 204, 113, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(46, 204, 113, 0.2);
}

.dot {
  width: 8px;
  height: 8px;
  background-color: var(--success);
  border-radius: 50%;
}

.dot.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4); }
  70% { opacity: 0.5; box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
  100% { opacity: 1; box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
}

.last-refresh {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255,255,255,0.1);
}

.content-area {
  padding: 30px;
  flex: 1;
}

/* Mobile responsive */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .main-wrapper {
    margin-left: 0;
  }
  .mobile-menu {
    display: block;
  }
  .mobile-close {
    display: block;
  }
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 90;
    backdrop-filter: blur(2px);
  }
  .hidden-mobile {
    display: none;
  }
  .content-area {
    padding: 20px;
  }
}
"""

dashboard_view = """import React from 'react';
import EcosystemStatus from '../components/EcosystemStatus';
import KPICards from '../components/KPICards';
import TemperatureChart from '../components/TemperatureChart';
import RainfallChart from '../components/RainfallChart';
import HumidityChart from '../components/HumidityChart';
import PipelineVisualizer from '../components/PipelineVisualizer';

const DashboardView = ({ refreshTrigger }) => {
  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h2>Dashboard Overview</h2>
        <p>Real-time ecosystem status and key metrics</p>
      </div>

      <PipelineVisualizer />
      
      <EcosystemStatus refreshTrigger={refreshTrigger} />
      
      <KPICards refreshTrigger={refreshTrigger} />
      
      <div className="dashboard-charts-grid">
        <TemperatureChart refreshTrigger={refreshTrigger} />
        <RainfallChart refreshTrigger={refreshTrigger} />
        <HumidityChart refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default DashboardView;
"""

pipeline_visualizer = """import React from 'react';
import { FileText, Database, Server, HardDrive, Layers, Activity, LayoutDashboard, ArrowRight } from 'lucide-react';
import './PipelineVisualizer.css';

const PipelineVisualizer = () => {
  const nodes = [
    { id: 1, name: 'CSV', label: 'Weather Data', icon: <FileText size={20} /> },
    { id: 2, name: 'Kafka', label: 'Ingestion', icon: <Activity size={20} /> },
    { id: 3, name: 'Spark', label: 'Streaming', icon: <Server size={20} /> },
    { id: 4, name: 'HDFS', label: 'Storage', icon: <HardDrive size={20} /> },
    { id: 5, name: 'Hive', label: 'Analytics', icon: <Database size={20} /> },
    { id: 6, name: 'Flask', label: 'API', icon: <Layers size={20} /> },
    { id: 7, name: 'React', label: 'Dashboard', icon: <LayoutDashboard size={20} /> }
  ];

  return (
    <div className="pipeline-card">
      <h3 className="section-title">Data Pipeline Architecture</h3>
      <div className="pipeline-container">
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <div className="pipeline-node">
              <div className="node-icon-wrapper">{node.icon}</div>
              <div className="node-details">
                <span className="node-name">{node.name}</span>
                <span className="node-label">{node.label}</span>
              </div>
            </div>
            {index < nodes.length - 1 && (
              <div className="pipeline-arrow">
                <ArrowRight size={16} className="arrow-icon" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PipelineVisualizer;
"""

pipeline_css = """
.pipeline-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.section-title {
  margin: 0 0 20px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.pipeline-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow-x: auto;
  padding: 10px 0 20px;
}

.pipeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
  text-align: center;
  position: relative;
  z-index: 2;
}

.node-icon-wrapper {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(155, 89, 182, 0.2));
  border: 1px solid rgba(52, 152, 219, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  margin-bottom: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: transform 0.3s, box-shadow 0.3s;
}

.pipeline-node:hover .node-icon-wrapper {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(52, 152, 219, 0.3);
  border-color: var(--accent);
}

.node-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.node-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pipeline-arrow {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--border);
  min-width: 20px;
}

.arrow-icon {
  color: var(--accent);
  opacity: 0.6;
}

@media (max-width: 1024px) {
  .pipeline-container {
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
  }
  .pipeline-arrow {
    display: none;
  }
  .pipeline-node {
    margin-bottom: 15px;
    flex: 1 1 20%;
  }
}
"""

analytics_view = """import React from 'react';
import TemperatureChart from '../components/TemperatureChart';
import RainfallChart from '../components/RainfallChart';
import HumidityChart from '../components/HumidityChart';
import WindAnalysis from '../components/WindAnalysis';

const AnalyticsView = ({ refreshTrigger }) => {
  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h2>Analytics Center</h2>
        <p>In-depth visualization of climate data via Hive MapReduce</p>
      </div>

      <div className="analytics-grid">
        <TemperatureChart refreshTrigger={refreshTrigger} />
        <RainfallChart refreshTrigger={refreshTrigger} />
        <HumidityChart refreshTrigger={refreshTrigger} />
        <WindAnalysis refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default AnalyticsView;
"""

livestream_view = """import React from 'react';
import StreamingTable from '../components/StreamingTable';
import EcosystemStatus from '../components/EcosystemStatus';

const LiveStreamView = ({ refreshTrigger }) => {
  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h2>Live Stream Monitor</h2>
        <p>Kafka &rarr; Spark Structured Streaming &rarr; HDFS Parquet</p>
      </div>

      <div className="stream-layout">
        <div className="stream-main">
          <StreamingTable refreshTrigger={refreshTrigger} />
        </div>
        <div className="stream-sidebar">
          <div className="info-card">
            <h3>Streaming Pipeline</h3>
            <p className="text-muted">Real-time micro-batches processed by Spark and appended to Parquet storage.</p>
          </div>
          <EcosystemStatus refreshTrigger={refreshTrigger} minimal={true} />
        </div>
      </div>
    </div>
  );
};

export default LiveStreamView;
"""

historical_view = """import React from 'react';
import HistoricalAnalysis from '../components/HistoricalAnalysis';

const HistoricalDataView = ({ refreshTrigger }) => {
  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h2>Historical Climate Analysis</h2>
        <p>Source: MapReduce &rarr; Hive &rarr; Flask</p>
      </div>

      <HistoricalAnalysis refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default HistoricalDataView;
"""

alerts_view = """import React from 'react';
import AlertsPanel from '../components/AlertsPanel';

const AlertsView = ({ refreshTrigger }) => {
  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h2>System Alerts</h2>
        <p>Data-derived anomaly detection and thresholds</p>
      </div>

      <div className="alerts-layout">
        <AlertsPanel refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default AlertsView;
"""

settings_view = """import React from 'react';
import { Settings, Monitor, Database, Shield, Zap } from 'lucide-react';

const SettingsView = () => {
  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h2>Settings & System Info</h2>
        <p>Application configuration and architecture details</p>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="card-heading">
            <Monitor size={20} className="heading-icon" />
            <h3>Appearance</h3>
          </div>
          <div className="settings-content">
            <p className="text-muted">Theme is controlled via the header toggle icon.</p>
            <div className="setting-row">
              <span>Theme</span>
              <span className="badge">Dark / Light toggle</span>
            </div>
            <div className="setting-row">
              <span>Auto Refresh</span>
              <span className="badge">Manual via Header</span>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-heading">
            <Database size={20} className="heading-icon" />
            <h3>System Information</h3>
          </div>
          <div className="settings-content">
            <div className="setting-row">
              <span>Frontend</span>
              <span className="text-value">React 19 + Vite</span>
            </div>
            <div className="setting-row">
              <span>Backend</span>
              <span className="text-value">Python Flask REST API</span>
            </div>
            <div className="setting-row">
              <span>Streaming</span>
              <span className="text-value">Apache Kafka + Spark</span>
            </div>
            <div className="setting-row">
              <span>Storage</span>
              <span className="text-value">Hadoop HDFS</span>
            </div>
            <div className="setting-row">
              <span>Analytics</span>
              <span className="text-value">Hive + MapReduce</span>
            </div>
            <div className="setting-row">
              <span>Resource Manager</span>
              <span className="text-value">YARN</span>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-heading">
            <Zap size={20} className="heading-icon" />
            <h3>API Configuration</h3>
          </div>
          <div className="settings-content">
            <div className="setting-row">
              <span>API Base URL</span>
              <code className="code-block">http://localhost:5000</code>
            </div>
            <div className="setting-row">
              <span>API Timeout</span>
              <code className="code-block">300000 ms (5 mins)</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
"""

app_css = """/* App.css Redesign */
:root {
  --bg-dark: #0f1115;
  --bg-card: #161920;
  --bg-card-hover: #1c2028;
  --text-primary: #f0f2f5;
  --text-secondary: #94a3b8;
  --accent: #3b82f6;
  --accent-glow: rgba(59, 130, 246, 0.4);
  --border: #2e3342;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #8b5cf6;
}

body.light-theme {
  --bg-dark: #f8fafc;
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border: #e2e8f0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

.view-container {
  max-width: 1400px;
  margin: 0 auto;
}

.fade-in {
  animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.view-header {
  margin-bottom: 24px;
}

.view-header h2 {
  margin: 0 0 6px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.view-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Card Styling for components */
.ecosystem-section, .chart-card, .historical-card, .streaming-card, .alerts-card, .settings-card, .info-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transition: border-color 0.3s;
}

.chart-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.source-label {
  font-size: 0.65rem;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid var(--border);
}

.source-label.streaming {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent);
  border-color: rgba(59, 130, 246, 0.3);
}

/* Grid Layouts */
.dashboard-charts-grid, .analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.stream-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

@media (max-width: 1024px) {
  .dashboard-charts-grid, .analytics-grid, .stream-layout {
    grid-template-columns: 1fr;
  }
}

/* Typography & Helpers */
.text-muted {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.code-block {
  background: rgba(0,0,0,0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--accent);
  border: 1px solid var(--border);
}

/* Settings Components */
.card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.card-heading h3 {
  margin: 0;
}

.heading-icon {
  color: var(--accent);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}

.setting-row:last-child {
  border-bottom: none;
}

.text-value {
  font-weight: 500;
  color: var(--text-primary);
}

/* Tables Redesign */
.table-responsive {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  background: var(--bg-card);
}

.data-table th, .data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  background: rgba(0,0,0,0.1);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.data-table tbody tr {
  transition: background 0.2s;
}

.data-table tbody tr:hover {
  background: var(--bg-card-hover);
}

/* Empty & Loading States */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  background: rgba(0,0,0,0.05);
  border-radius: 8px;
  border: 1px dashed var(--border);
  font-size: 0.9rem;
}

/* KPI Cards Override */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.kpi-card {
  background: linear-gradient(145deg, var(--bg-card), rgba(0,0,0,0.2));
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0.5;
}

.kpi-card h4 {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-val {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

/* Ecosystem Status Override */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.status-card {
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border);
  transition: transform 0.2s, box-shadow 0.2s;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
}

.status-card.status-ok {
  border-top: 3px solid var(--success);
}

.status-card.status-error {
  border-top: 3px solid var(--danger);
}

.status-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
}

.status-indicator.running {
  background-color: var(--success);
  box-shadow: 0 0 10px var(--success);
}

/* Alerts Override */
.alert-item {
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--bg-card-hover);
  border-left: 4px solid var(--border);
  border-right: 1px solid var(--border);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.alert-item.danger {
  border-left-color: var(--danger);
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%);
}

.alert-item.warning {
  border-left-color: var(--warning);
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%);
}

.alerts-list {
  max-height: 600px;
}

.time-col {
  color: var(--accent);
}
"""

write_file('frontend/src/App.jsx', app_jsx)
write_file('frontend/src/layout/Layout.jsx', layout_jsx)
write_file('frontend/src/layout/Layout.css', layout_css)
write_file('frontend/src/views/DashboardView.jsx', dashboard_view)
write_file('frontend/src/components/PipelineVisualizer.jsx', pipeline_visualizer)
write_file('frontend/src/components/PipelineVisualizer.css', pipeline_css)
write_file('frontend/src/views/AnalyticsView.jsx', analytics_view)
write_file('frontend/src/views/LiveStreamView.jsx', livestream_view)
write_file('frontend/src/views/HistoricalDataView.jsx', historical_view)
write_file('frontend/src/views/AlertsView.jsx', alerts_view)
write_file('frontend/src/views/SettingsView.jsx', settings_view)
write_file('frontend/src/App.css', app_css)

print("Files generated successfully.")
