import React, { useState, useEffect } from 'react';
import {
  getHistoricalDailyTrends,
  getHistoricalRecords,
  getHistoricalExtremes,
  getHistorical,
  getHistoricalExportUrl,
} from '../services/api';
import HistoricalFilterBar from '../components/HistoricalFilterBar';
import { Loader2, AlertCircle, Search, Download, Database, Layers, CloudLightning, BarChart2 } from 'lucide-react';

const formatVal = (val, suffix = '', decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `${Number(val).toFixed(decimals)}${suffix}`;
};

const HistoricalDataView = ({ refreshTrigger }) => {
  // Filter states
  const [city, setCity] = useState('All');
  const [startDate, setStartDate] = useState('2026-09-11');
  const [endDate, setEndDate] = useState('2026-09-18');
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'raw' | 'extremes' | 'city'
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [dailyTrends, setDailyTrends] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [extremeRecords, setExtremeRecords] = useState([]);
  const [cityAggregates, setCityAggregates] = useState([]);

  // Loading & error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleResetFilters = () => {
    setCity('All');
    setStartDate('2026-09-11');
    setEndDate('2026-09-18');
    setSearchQuery('');
  };

  const fetchData = () => {
    setLoading(true);
    setError(null);

    Promise.allSettled([
      getHistoricalDailyTrends({ city, startDate, endDate }),
      getHistoricalRecords({ city, startDate, endDate }),
      getHistoricalExtremes(),
      getHistorical(),
    ])
      .then(([trendsRes, recordsRes, extremesRes, cityRes]) => {
        if (trendsRes.status === 'fulfilled' && trendsRes.value) {
          setDailyTrends(trendsRes.value);
        }
        if (recordsRes.status === 'fulfilled' && recordsRes.value) {
          setRawRecords(recordsRes.value);
        }
        if (extremesRes.status === 'fulfilled' && extremesRes.value) {
          setExtremeRecords(extremesRes.value);
        }
        if (cityRes.status === 'fulfilled' && cityRes.value) {
          setCityAggregates(cityRes.value);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching historical dataset tables', err);
        setError('Failed to retrieve historical dataset tables from Hive & HDFS.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [city, startDate, endDate, refreshTrigger]);

  // Filter raw records by search query
  const filteredRawRecords = rawRecords.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.city && r.city.toLowerCase().includes(q)) ||
      (r.weather_condition && r.weather_condition.toLowerCase().includes(q)) ||
      (r.timestamp && r.timestamp.toLowerCase().includes(q))
    );
  });

  const handleExportCurrent = () => {
    const typeMap = {
      daily: 'daily',
      raw: 'raw',
      extremes: 'extremes',
      city: 'city',
    };
    const exportType = typeMap[activeTab] || 'daily';
    const url = getHistoricalExportUrl(exportType, { city, startDate, endDate });
    window.open(url, '_blank');
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <div className="view-header-title-row">
          <div>
            <div className="header-badge-row">
              <span className="live-status-pill">
                <span className="live-dot pulse"></span>
                HADOOP HDFS & HIVE
              </span>
              <span className="source-label streaming">150 Raw Records • Sept 11–18, 2026</span>
            </div>
            <h2>Historical Dataset & Pipeline Explorer</h2>
            <p>
              Inspect authentic historical Big Data records stored in Hadoop HDFS &amp; queried via Apache Hive
            </p>
          </div>
          <button className="btn-export-csv" onClick={handleExportCurrent}>
            <Download size={15} /> Export Active Table (CSV)
          </button>
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

      {/* Dataset Explorer Tabs */}
      <div className="explorer-tabs-bar glass-panel">
        <button
          className={`explorer-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          <Layers size={16} /> Daily Trends (Hive HQL)
          <span className="tab-counter-badge">{dailyTrends.length}</span>
        </button>
        <button
          className={`explorer-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          <Database size={16} /> Raw Observations (HDFS)
          <span className="tab-counter-badge">{filteredRawRecords.length}</span>
        </button>
        <button
          className={`explorer-tab-btn ${activeTab === 'extremes' ? 'active' : ''}`}
          onClick={() => setActiveTab('extremes')}
        >
          <CloudLightning size={16} /> Extreme Events (Hive Query 10)
          <span className="tab-counter-badge">{extremeRecords.length}</span>
        </button>
        <button
          className={`explorer-tab-btn ${activeTab === 'city' ? 'active' : ''}`}
          onClick={() => setActiveTab('city')}
        >
          <BarChart2 size={16} /> City Aggregates (MapReduce)
          <span className="tab-counter-badge">{cityAggregates.length}</span>
        </button>
      </div>

      {loading && rawRecords.length === 0 ? (
        <div className="chart-card loading-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent)' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: '500' }}>
            Reading Dataset from HDFS and Hive Tables...
          </div>
          <p className="text-muted" style={{ fontSize: '0.84rem', marginTop: '6px' }}>
            Processing authentic records from hdfs://localhost:9000/weather/
          </p>
        </div>
      ) : error && rawRecords.length === 0 ? (
        <div className="chart-card error-card">
          <div className="empty-state error">
            <AlertCircle size={32} className="text-warning" style={{ margin: '0 auto 12px' }} />
            <h3>Unable to load dataset</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>{error}</p>
            <button className="btn-primary mt-3" onClick={fetchData}>Retry</button>
          </div>
        </div>
      ) : (
        <div className="explorer-table-card glass-panel">
          {/* TAB 1: DAILY TRENDS */}
          {activeTab === 'daily' && (
            <div>
              <div className="table-caption-bar">
                <div>
                  <h4 className="table-title">Daily Aggregated Trends by City</h4>
                  <span className="table-sub">
                    Source: Apache Hive 4.1.0 · Query: <code>11_daily_trends.hql</code>
                  </span>
                </div>
                <span className="table-row-count">{dailyTrends.length} aggregated day-city slots</span>
              </div>

              <div className="historical-table-container">
                <table className="historical-data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>City</th>
                      <th>Records</th>
                      <th>Avg Temp</th>
                      <th>Min Temp</th>
                      <th>Max Temp</th>
                      <th>Avg Humidity</th>
                      <th>Total Rainfall</th>
                      <th>Avg Wind</th>
                      <th>Peak Wind</th>
                      <th>Avg Pressure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTrends.map((r, idx) => (
                      <tr key={`${r.date}-${r.city}-${idx}`}>
                        <td className="font-mono text-cyan-400">{r.date}</td>
                        <td className="font-semibold">{r.city}</td>
                        <td>{r.records}</td>
                        <td className="font-medium">{formatVal(r.avg_temperature, '°C')}</td>
                        <td className="text-blue-400">{formatVal(r.min_temperature, '°C')}</td>
                        <td className="text-red-400">{formatVal(r.max_temperature, '°C')}</td>
                        <td>{formatVal(r.avg_humidity, '%')}</td>
                        <td className="text-cyan-300">{formatVal(r.total_rainfall, ' mm')}</td>
                        <td>{formatVal(r.avg_wind_speed, ' km/h')}</td>
                        <td className="text-amber-400">{formatVal(r.max_wind_speed, ' km/h')}</td>
                        <td>{formatVal(r.avg_pressure, ' hPa')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: RAW OBSERVATIONS */}
          {activeTab === 'raw' && (
            <div>
              <div className="table-caption-bar">
                <div className="search-box-wrapper">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    className="table-search-input"
                    placeholder="Search by city, condition, or timestamp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
                  )}
                </div>
                <span className="table-row-count">
                  Showing {filteredRawRecords.length} of {rawRecords.length} observations (HDFS raw)
                </span>
              </div>

              <div className="historical-table-container">
                <table className="historical-data-table">
                  <thead>
                    <tr>
                      <th>Timestamp (UTC)</th>
                      <th>City</th>
                      <th>Temperature</th>
                      <th>Humidity</th>
                      <th>Rainfall</th>
                      <th>Wind Speed</th>
                      <th>Pressure</th>
                      <th>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRawRecords.map((r, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-slate-300">{r.timestamp}</td>
                        <td className="font-semibold text-primary">{r.city}</td>
                        <td>{formatVal(r.temperature, '°C')}</td>
                        <td>{formatVal(r.humidity, '%')}</td>
                        <td>{formatVal(r.rainfall, ' mm')}</td>
                        <td>{formatVal(r.wind_speed, ' km/h')}</td>
                        <td>{formatVal(r.pressure, ' hPa')}</td>
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

          {/* TAB 3: EXTREME WEATHER */}
          {activeTab === 'extremes' && (
            <div>
              <div className="table-caption-bar">
                <div>
                  <h4 className="table-title">Extreme Weather Events in Historical Baseline</h4>
                  <span className="table-sub">
                    Threshold: Temperature &ge; 40°C OR Rainfall &ge; 20mm OR Wind Speed &ge; 20 km/h · Hive Query 10
                  </span>
                </div>
                <span className="table-row-count">{extremeRecords.length} extreme observations</span>
              </div>

              <div className="historical-table-container">
                <table className="historical-data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>City</th>
                      <th>Temperature</th>
                      <th>Rainfall</th>
                      <th>Wind Speed</th>
                      <th>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extremeRecords.map((r, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-slate-300">{r.timestamp}</td>
                        <td className="font-semibold">{r.city}</td>
                        <td className={r.temperature >= 40 ? 'text-red-400 font-bold' : ''}>
                          {formatVal(r.temperature, '°C')}
                        </td>
                        <td className={r.rainfall >= 20 ? 'text-cyan-400 font-bold' : ''}>
                          {formatVal(r.rainfall, ' mm')}
                        </td>
                        <td className={r.wind_speed >= 20 ? 'text-amber-400 font-bold' : ''}>
                          {formatVal(r.wind_speed, ' km/h')}
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

          {/* TAB 4: CITY AGGREGATES */}
          {activeTab === 'city' && (
            <div>
              <div className="table-caption-bar">
                <div>
                  <h4 className="table-title">Aggregated Metropolitan Climate Summary</h4>
                  <span className="table-sub">
                    Source: Hadoop MapReduce <code>CityWeatherStats</code> · Output: <code>part-r-00000</code>
                  </span>
                </div>
                <span className="table-row-count">5 Monitored Metro Hubs</span>
              </div>

              <div className="historical-table-container">
                <table className="historical-data-table">
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Records</th>
                      <th>Avg Temp</th>
                      <th>Min Temp</th>
                      <th>Max Temp</th>
                      <th>Avg Humidity</th>
                      <th>Total Rainfall</th>
                      <th>Avg Wind Speed</th>
                      <th>Avg Pressure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityAggregates.map((c, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-primary">{c.city}</td>
                        <td>{c.records}</td>
                        <td className="font-semibold">{formatVal(c.avg_temperature, '°C')}</td>
                        <td className="text-blue-400">{formatVal(c.min_temperature, '°C')}</td>
                        <td className="text-red-400">{formatVal(c.max_temperature, '°C')}</td>
                        <td>{formatVal(c.avg_humidity, '%')}</td>
                        <td className="text-cyan-400 font-medium">{formatVal(c.total_rainfall, ' mm')}</td>
                        <td>{formatVal(c.avg_wind_speed, ' km/h')}</td>
                        <td>{formatVal(c.avg_pressure, ' hPa')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricalDataView;
