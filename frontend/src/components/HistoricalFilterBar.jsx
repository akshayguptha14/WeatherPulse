import React, { useState, useEffect, useRef } from 'react';
import { getHistoricalExportUrl } from '../services/api';

const CITIES = ['All', 'Bengaluru', 'Chennai', 'Delhi', 'Hyderabad', 'Mumbai'];
const MIN_DATE = '2026-09-11';
const MAX_DATE = '2026-09-18';

const HistoricalFilterBar = ({
  city,
  setCity,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onReset,
  recordCount = null,
  activeTab = 'daily'
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setExportMenuOpen(false);
      }
    };

    if (exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [exportMenuOpen]);

  const handleExport = (type) => {
    const url = getHistoricalExportUrl(type, { city, startDate, endDate });
    window.open(url, '_blank');
    setExportMenuOpen(false);
  };

  return (
    <div className="historical-filter-bar glass-panel">
      <div className="filter-controls-group">
        {/* City Filter */}
        <div className="filter-field">
          <label htmlFor="city-select" className="filter-label">
            <span className="filter-icon">📍</span> City
          </label>
          <select
            id="city-select"
            className="filter-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Filter by City"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All 5 Monitored Cities' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="filter-field">
          <label htmlFor="start-date" className="filter-label">
            <span className="filter-icon">📅</span> From
          </label>
          <input
            id="start-date"
            type="date"
            className="filter-date-input"
            min={MIN_DATE}
            max={endDate || MAX_DATE}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start Date"
          />
        </div>

        {/* End Date */}
        <div className="filter-field">
          <label htmlFor="end-date" className="filter-label">
            <span className="filter-icon">📅</span> To
          </label>
          <input
            id="end-date"
            type="date"
            className="filter-date-input"
            min={startDate || MIN_DATE}
            max={MAX_DATE}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End Date"
          />
        </div>

        {/* Reset Filter Button */}
        <button
          type="button"
          className="btn-filter-reset"
          onClick={onReset}
          title="Reset date and city filters to full 8-day dataset"
        >
          Reset Filters
        </button>
      </div>

      <div className="filter-actions-group">
        {/* Active Dataset Scope Badge */}
        <div className="dataset-scope-badge">
          <span className="scope-dot"></span>
          <span className="scope-text">
            HDFS Window: <strong>Sep 11–18, 2026</strong> (8 Days)
            {recordCount !== null && ` · ${recordCount} Records`}
          </span>
        </div>

        {/* Export CSV Dropdown */}
        <div className="export-dropdown-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="btn-export-csv"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            aria-haspopup="true"
            aria-expanded={exportMenuOpen}
            title="Download authentic analytical CSV reports"
          >
            <span className="btn-icon">📥</span> Export CSV <span className="caret">▾</span>
          </button>

          {exportMenuOpen && (
            <div className="export-menu shadow-lg fade-in" role="menu">
              <div className="export-menu-header">Download Analytical Reports</div>
              <button
                type="button"
                className="export-menu-item"
                role="menuitem"
                onClick={() => handleExport('daily')}
              >
                <span className="export-item-icon">📊</span>
                <span className="export-item-text">Daily Aggregations (Hive)</span>
              </button>
              <button
                type="button"
                className="export-menu-item"
                role="menuitem"
                onClick={() => handleExport('raw')}
              >
                <span className="export-item-icon">📋</span>
                <span className="export-item-text">Filtered Raw Observations (HDFS)</span>
              </button>
              <button
                type="button"
                className="export-menu-item"
                role="menuitem"
                onClick={() => handleExport('city')}
              >
                <span className="export-item-icon">🏢</span>
                <span className="export-item-text">City Overall Stats (MapReduce)</span>
              </button>
              <button
                type="button"
                className="export-menu-item"
                role="menuitem"
                onClick={() => handleExport('extremes')}
              >
                <span className="export-item-icon">⚠️</span>
                <span className="export-item-text">Extreme Weather Records</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalFilterBar;
