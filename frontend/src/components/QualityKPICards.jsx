import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileCheck, 
  Copy, 
  Gauge, 
  Zap,
  Info
} from 'lucide-react';

const QualityKPICards = ({ summary = {} }) => {
  const {
    dqs_score = 100.0,
    quality_grade = 'A+',
    grade_label = 'Optimal Enterprise Quality',
    audit_scope = 'Latest 50 Observations',
    total_records_audited = 0,
    missing_cells_count = 0,
    missing_rate_percentage = 0.0,
    duplicate_observations_count = 0,
    duplicate_ingestions_count = 0,
    invalid_measurements_count = 0,
    timestamp_anomalies_count = 0,
    average_completeness_percentage = 100.0,
    stream_freshness_seconds = null,
    stream_freshness_status = 'Optimal (Real-time)',
    penalties = {}
  } = summary;

  // Grade badge color helper
  const getGradeClass = (grade) => {
    switch (grade) {
      case 'A+': return 'grade-a-plus';
      case 'A': return 'grade-a';
      case 'B': return 'grade-b';
      case 'C': return 'grade-c';
      default: return 'grade-d';
    }
  };

  return (
    <div className="quality-kpi-grid">
      {/* 1. Composite Data Quality Score Card */}
      <div className="quality-kpi-card card-primary-dqs">
        <div className="kpi-top-row">
          <div className="kpi-icon-box dqs-icon">
            <ShieldCheck size={22} />
          </div>
          <span className={`kpi-grade-badge ${getGradeClass(quality_grade)}`}>
            GRADE {quality_grade}
          </span>
        </div>
        <div className="kpi-score-display">
          <span className="dqs-big-number">{dqs_score.toFixed(1)}</span>
          <span className="dqs-scale">/ 100</span>
        </div>
        <div className="kpi-grade-label">{grade_label}</div>
        <div className="kpi-scope-tag">
          <Info size={12} />
          <span>Scope: {audit_scope}</span>
        </div>
        <div className="kpi-disclaimer-note">
          Project-defined experimental index based on HDFS sample rules.
        </div>
      </div>

      {/* 2. Schema Completeness & Missing Fields */}
      <div className="quality-kpi-card">
        <div className="kpi-top-row">
          <div className="kpi-icon-box completeness-icon">
            <FileCheck size={20} className="text-accent" />
          </div>
          <span className="kpi-mini-pill ok">
            {average_completeness_percentage}% COMPLETE
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">{total_records_audited}</span>
          <span className="kpi-sub-unit">Records Audited</span>
        </div>
        <div className="kpi-detail-list">
          <div className="kpi-detail-item">
            <span>Missing Cells:</span>
            <span className={`font-mono ${missing_cells_count > 0 ? 'text-warning' : 'text-success'}`}>
              {missing_cells_count} ({missing_rate_percentage}%)
            </span>
          </div>
          <div className="kpi-detail-item">
            <span>Missing Penalty:</span>
            <span className="font-mono text-muted">-{penalties.missing || 0} pts</span>
          </div>
        </div>
      </div>

      {/* 3. Validation Integrity & Duplication */}
      <div className="quality-kpi-card">
        <div className="kpi-top-row">
          <div className="kpi-icon-box bounds-icon">
            <CheckCircle2 size={20} className="text-success" />
          </div>
          <span className={`kpi-mini-pill ${(invalid_measurements_count > 0 || duplicate_observations_count > 0) ? 'warn' : 'ok'}`}>
            {invalid_measurements_count === 0 ? 'ALL METRICS VALID' : `${invalid_measurements_count} RANGE VIOLATIONS`}
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">{duplicate_observations_count + duplicate_ingestions_count}</span>
          <span className="kpi-sub-unit">Total Duplicates</span>
        </div>
        <div className="kpi-detail-list">
          <div className="kpi-detail-item">
            <span>Obs vs Ingest Dups:</span>
            <span className="font-mono text-muted">{duplicate_observations_count} obs / {duplicate_ingestions_count} ing</span>
          </div>
          <div className="kpi-detail-item">
            <span>Timestamp Anomalies:</span>
            <span className={`font-mono ${timestamp_anomalies_count > 0 ? 'text-warning' : 'text-muted'}`}>
              {timestamp_anomalies_count}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Stream Freshness & Latency */}
      <div className="quality-kpi-card">
        <div className="kpi-top-row">
          <div className="kpi-icon-box freshness-icon">
            <Clock size={20} className="text-warning" />
          </div>
          <span className={`kpi-mini-pill ${stream_freshness_seconds !== null && stream_freshness_seconds <= 90 ? 'ok' : 'warn'}`}>
            {stream_freshness_status}
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">
            {stream_freshness_seconds !== null ? `${Math.round(stream_freshness_seconds)}s` : 'N/A'}
          </span>
          <span className="kpi-sub-unit">Latest Ingestion Age</span>
        </div>
        <div className="kpi-detail-list">
          <div className="kpi-detail-item">
            <span>Stream Status:</span>
            <span className="font-mono text-success">Active & Continuous</span>
          </div>
          <div className="kpi-detail-item">
            <span>Freshness Penalty:</span>
            <span className="font-mono text-muted">-{penalties.freshness || 0} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityKPICards;
