import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ShieldCheck 
} from 'lucide-react';

const CITIES = ['All', 'Bengaluru', 'Chennai', 'Delhi', 'Hyderabad', 'Mumbai'];
const SEVERITIES = ['All', 'Critical', 'High', 'Moderate', 'Low'];

const QualityIssueTable = ({ 
  issuesData = { items: [], page: 1, total_pages: 1, total_items: 0 },
  onPageChange,
  severityFilter,
  onSeverityChange,
  cityFilter,
  onCityChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { items = [], page = 1, total_pages = 1, total_items = 0 } = issuesData;

  const filteredItems = items.filter(iss => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      iss.city?.toLowerCase().includes(q) ||
      iss.rule?.toLowerCase().includes(q) ||
      iss.field?.toLowerCase().includes(q) ||
      iss.message?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="chart-card quality-issues-card">
      <div className="card-header-row">
        <div>
          <h3>Data Quality Audit & Issue Log</h3>
          <p className="card-subtitle">Real-time discrepancy detection, physical bound violations, and transport anomalies</p>
        </div>
        <div className="table-count-badge">
          {total_items} Issue{total_items !== 1 ? 's' : ''} Logged
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="issue-filter-toolbar">
        <div className="filter-group">
          <label>City:</label>
          <select 
            value={cityFilter} 
            onChange={(e) => onCityChange(e.target.value)}
            className="filter-select"
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label>Severity:</label>
          <select 
            value={severityFilter} 
            onChange={(e) => onSeverityChange(e.target.value)}
            className="filter-select"
          >
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter-search-box">
          <Search size={15} className="text-muted search-icon" />
          <input
            type="text"
            placeholder="Search field, rule, message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Table Content */}
      {filteredItems.length === 0 ? (
        <div className="empty-state-clean">
          <CheckCircle2 size={36} className="text-success" />
          <h4>Zero Data Quality Violations Detected</h4>
          <p className="text-muted">
            All audited streaming observations strictly adhere to meteorological physical bounds, 
            chronological UTC order, and schema constraints.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="quality-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Severity</th>
                <th>Rule ID</th>
                <th>City</th>
                <th>Field</th>
                <th>Observed vs Allowed</th>
                <th>Diagnostic Explanation</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} className={`quality-row sev-${item.severity?.toLowerCase()}`}>
                  <td className="font-mono" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
                  </td>
                  <td>
                    <span className={`severity-badge sev-${item.severity?.toLowerCase()}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td>
                    <span className="rule-badge">{item.rule}</span>
                  </td>
                  <td><strong>{item.city}</strong></td>
                  <td><code className="field-tag">{item.field}</code></td>
                  <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                    <span className="text-warning">{String(item.observed_value)}</span>
                    <span className="text-muted"> / {item.allowed_range}</span>
                  </td>
                  <td className="msg-cell">{item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {total_pages > 1 && (
        <div className="table-pagination-bar">
          <span className="pagination-info">
            Page {page} of {total_pages} ({total_items} total issues)
          </span>
          <div className="pagination-buttons">
            <button 
              className="page-btn" 
              onClick={() => onPageChange(page - 1)} 
              disabled={page <= 1}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button 
              className="page-btn" 
              onClick={() => onPageChange(page + 1)} 
              disabled={page >= total_pages}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityIssueTable;
