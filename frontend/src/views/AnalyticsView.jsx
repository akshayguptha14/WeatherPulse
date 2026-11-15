import React, { useState, useEffect } from 'react';
import {
  getCities,
  getHistoricalDailyTrends,
  getHistoricalRecords,
  getHistoricalConditions,
  getRecentStream,
} from '../services/api';
import HistoricalFilterBar from '../components/HistoricalFilterBar';
import HistoricalStatsSummary from '../components/HistoricalStatsSummary';
import HistoricalTrendCharts from '../components/HistoricalTrendCharts';
import HistoricalComparisonWidget from '../components/HistoricalComparisonWidget';
import LiveVsHistoricalCard from '../components/LiveVsHistoricalCard';
import TemperatureChart from '../components/TemperatureChart';
import RainfallChart from '../components/RainfallChart';
import HumidityChart from '../components/HumidityChart';
import WindAnalysis from '../components/WindAnalysis';
import { Loader2, AlertCircle } from 'lucide-react';

const AnalyticsView = ({ refreshTrigger }) => {
  // Filter states
  const [city, setCity] = useState('All');
  const [startDate, setStartDate] = useState('2026-09-11');
  const [endDate, setEndDate] = useState('2026-09-18');
  const [activeTab, setActiveTab] = useState('trends'); // 'trends' | 'comparison' | 'legacy_charts'

  // Data states
  const [cityStats, setCityStats] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [liveRecords, setLiveRecords] = useState([]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleResetFilters = () => {
    setCity('All');
    setStartDate('2026-09-11');
    setEndDate('2026-09-18');
  };

  const fetchAnalyticsData = () => {
    setLoading(true);
    setError(null);

    Promise.allSettled([
      getCities(),
      getHistoricalDailyTrends({ city, startDate, endDate }),
      getHistoricalRecords({ city, startDate, endDate }),
      getHistoricalConditions(),
      getRecentStream(),
    ])
      .then(([citiesRes, trendsRes, recordsRes, condRes, streamRes]) => {
        if (citiesRes.status === 'fulfilled' && citiesRes.value) {
          setCityStats(citiesRes.value);
        }
        if (trendsRes.status === 'fulfilled' && trendsRes.value) {
          setDailyTrends(trendsRes.value);
        }
        if (recordsRes.status === 'fulfilled' && recordsRes.value) {
          setRawRecords(recordsRes.value);
        }
        if (condRes.status === 'fulfilled' && condRes.value) {
          setConditions(condRes.value);
        }
        if (streamRes.status === 'fulfilled' && streamRes.value) {
          setLiveRecords(streamRes.value);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load analytics suite', err);
        setError('Failed to fetch historical analytics data from Hive/HDFS.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [city, startDate, endDate, refreshTrigger]);

  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <div className="view-header-title-row">
          <div>
            <div className="header-badge-row">
              <span className="live-status-pill">
                <span className="live-dot pulse"></span>
                DISTRIBUTED ANALYTICS
              </span>
              <span className="source-label streaming">MapReduce Baselines • Hive Daily Trends</span>
            </div>
            <h2>Historical Climate Analytics & Trends</h2>
            <p>
              Distributed Big Data Intelligence powered by Hadoop HDFS, Hive MapReduce, and Spark
            </p>
          </div>
          <div className="view-mode-tabs">
            <button
              className={`view-tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
              onClick={() => setActiveTab('trends')}
            >
              📈 Time Trends & KPIs
            </button>
            <button
              className={`view-tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              🏢 City Comparative Analysis
            </button>
            <button
              className={`view-tab-btn ${activeTab === 'legacy_charts' ? 'active' : ''}`}
              onClick={() => setActiveTab('legacy_charts')}
            >
              📊 Core MapReduce Visuals
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <HistoricalFilterBar
        city={city}
        setCity={setCity}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onReset={handleResetFilters}
        recordCount={rawRecords.length}
        activeTab={activeTab}
      />

      {loading && rawRecords.length === 0 ? (
        <div className="chart-card loading-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent)' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: '500' }}>
            Executing Hadoop MapReduce & Hive Queries...
          </div>
          <p className="text-muted" style={{ fontSize: '0.84rem', marginTop: '6px' }}>
            Fetching authentic historical datasets from HDFS storage
          </p>
        </div>
      ) : error && rawRecords.length === 0 ? (
        <div className="chart-card error-card">
          <div className="empty-state error">
            <AlertCircle size={32} className="text-warning" style={{ margin: '0 auto 12px' }} />
            <h3>Unable to load analytics suite</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>{error}</p>
            <button className="btn-primary mt-3" onClick={fetchAnalyticsData}>Retry</button>
          </div>
        </div>
      ) : (
        <div className="analytics-content-space">
          {/* Real-Time vs Historical Benchmark Card */}
          <LiveVsHistoricalCard
            liveRecords={liveRecords}
            cityStats={cityStats}
            selectedCity={city}
          />

          {/* Tab 1: Time Trends & Multi-Metric KPIs */}
          {activeTab === 'trends' && (
            <>
              {/* Comprehensive KPI Metric Cards & Condition Distribution */}
              <HistoricalStatsSummary
                records={rawRecords}
                conditions={conditions}
                dailyTrends={dailyTrends}
              />

              {/* Time Series Trend Charts */}
              <HistoricalTrendCharts
                dailyTrends={dailyTrends}
                selectedCity={city}
              />
            </>
          )}

          {/* Tab 2: City Comparative Analysis */}
          {activeTab === 'comparison' && (
            <HistoricalComparisonWidget cityStats={cityStats} />
          )}

          {/* Tab 3: Core MapReduce Visuals */}
          {activeTab === 'legacy_charts' && (
            <div className="analytics-grid">
              <TemperatureChart data={cityStats} />
              <RainfallChart data={cityStats} />
              <HumidityChart data={cityStats} />
              <WindAnalysis data={cityStats} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
