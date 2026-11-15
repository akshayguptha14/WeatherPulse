import React from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';

const CITIES = ['All', 'Bengaluru', 'Chennai', 'Delhi', 'Hyderabad', 'Mumbai'];
const SEVERITIES = ['All', 'Critical', 'High', 'Moderate', 'Low'];
const CATEGORIES = ['All', 'Temperature', 'Anomaly', 'Precipitation', 'Wind', 'Contextual', 'Barometric'];

const AlertFilterToolbar = ({
  city,
  setCity,
  severity,
  setSeverity,
  category,
  setCategory,
  searchQuery,
  setSearchQuery,
  onReset,
  totalMatching = 0
}) => {
  return (
    <div className="alert-filter-toolbar glass-panel">
      <div className="filter-row-primary">
        {/* City Filter */}
        <div className="filter-item">
          <label className="filter-lbl">
            <span className="lbl-icon">📍</span> City
          </label>
          <select
            className="filter-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All 5 Monitored Cities' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Chips */}
        <div className="filter-item severity-chips-group">
          <label className="filter-lbl">
            <Filter size={13} /> Severity
          </label>
          <div className="severity-chips">
            {SEVERITIES.map((sev) => {
              const active = severity === sev;
              const sevClass = sev.toLowerCase();
              return (
                <button
                  key={sev}
                  type="button"
                  className={`sev-chip chip-${sevClass} ${active ? 'active' : ''}`}
                  onClick={() => setSeverity(sev)}
                >
                  {sev}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="filter-item">
          <label className="filter-lbl">Category</label>
          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="filter-item search-item">
          <label className="filter-lbl">Search</label>
          <div className="search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="alert-search-input"
              placeholder="Filter by keyword, threshold, or metric..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-x" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
        </div>

        {/* Reset */}
        <div className="filter-item reset-item">
          <button
            className="btn-filter-reset"
            onClick={onReset}
            title="Reset all alert filters to default"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="filter-row-secondary">
        <span className="results-counter">
          Showing <strong>{totalMatching}</strong> active alert{totalMatching === 1 ? '' : 's'} matching current criteria
        </span>
      </div>
    </div>
  );
};

export default AlertFilterToolbar;
