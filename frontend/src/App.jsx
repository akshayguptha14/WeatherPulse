import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layout/Layout';
import HomeView from './views/HomeView';
import DashboardView from './views/DashboardView';
import AnalyticsView from './views/AnalyticsView';
import LiveStreamView from './views/LiveStreamView';
import HistoricalDataView from './views/HistoricalDataView';
import AlertsView from './views/AlertsView';
import MapView from './views/MapView';
import QualityView from './views/QualityView';
import SettingsView from './views/SettingsView';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    const initial = saved || 'dark';
    if (typeof document !== 'undefined') {
      document.body.className = initial === 'light' ? 'light-theme' : 'dark-theme';
    }
    return initial;
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (typeof document !== 'undefined') {
      document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    }
  }, [theme]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      if (typeof document !== 'undefined') {
        document.body.className = next === 'light' ? 'light-theme' : 'dark-theme';
      }
      return next;
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Full-width standalone WeatherPulse-inspired Home landing page */}
        <Route 
          path="/" 
          element={<HomeView theme={theme} toggleTheme={toggleTheme} />} 
        />

        {/* Dashboard application views wrapped in persistent Layout shell with sidebar */}
        <Route 
          element={
            <Layout onRefresh={handleRefresh} toggleTheme={toggleTheme} theme={theme} />
          }
        >
          <Route path="/dashboard" element={<DashboardView refreshTrigger={refreshTrigger} />} />
          <Route path="/analytics" element={<AnalyticsView refreshTrigger={refreshTrigger} />} />
          <Route path="/stream" element={<LiveStreamView refreshTrigger={refreshTrigger} />} />
          <Route path="/historical" element={<HistoricalDataView refreshTrigger={refreshTrigger} />} />
          <Route path="/alerts" element={<AlertsView refreshTrigger={refreshTrigger} />} />
          <Route path="/map" element={<MapView refreshTrigger={refreshTrigger} />} />
          <Route path="/quality" element={<QualityView refreshTrigger={refreshTrigger} />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
