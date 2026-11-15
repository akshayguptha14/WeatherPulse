import React, { useState, useEffect } from 'react';
import { 
  getQualitySummary, 
  getQualityMetrics, 
  getQualityPipeline, 
  getQualityIssues 
} from '../services/api';
import QualityKPICards from '../components/QualityKPICards';
import QualityPipelineHealth from '../components/QualityPipelineHealth';
import QualityCharts from '../components/QualityCharts';
import QualityIssueTable from '../components/QualityIssueTable';
import { 
  ShieldCheck, 
  Info, 
  RefreshCw, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

const QualityView = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState({});
  const [metrics, setMetrics] = useState({});
  const [pipeline, setPipeline] = useState({});
  const [issuesData, setIssuesData] = useState({ items: [], page: 1, total_pages: 1, total_items: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for issues table
  const [severityFilter, setSeverityFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchQualityData = () => {
    setLoading(true);
    Promise.allSettled([
      getQualitySummary(),
      getQualityMetrics(),
      getQualityPipeline(),
      getQualityIssues({ severity: severityFilter, city: cityFilter, page: currentPage, pageSize: 15 })
    ]).then(([sumRes, metRes, pipRes, issRes]) => {
      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
      }
      if (metRes.status === 'fulfilled' && metRes.value) {
        setMetrics(metRes.value);
      }
      if (pipRes.status === 'fulfilled' && pipRes.value) {
        setPipeline(pipRes.value);
      }
      if (issRes.status === 'fulfilled' && issRes.value) {
        setIssuesData(issRes.value);
      }
      setError(null);
      setLoading(false);
    }).catch(err => {
      console.error("Error fetching data quality metrics:", err);
      setError("Unable to load data quality telemetry. Please check backend services.");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchQualityData();
    const interval = setInterval(fetchQualityData, 15000);
    return () => clearInterval(interval);
  }, [refreshTrigger, severityFilter, cityFilter, currentPage]);

  return (
    <div className="view-container fade-in">
      {/* View Header */}
      <div className="view-header">
        <div className="header-badge-row">
          <span className="live-status-pill">
            <span className="live-dot pulse"></span>
            BIG DATA QUALITY ENGINE
          </span>
          <span className="source-label streaming">
            Schema Completeness • Physical Boundaries • Chronological Order • Pipeline Latency
          </span>
        </div>
        <h2>Data Quality & Pipeline Health Monitor</h2>
        <p>Continuous verification of streaming telemetry, Kafka offset integrity, and Parquet data validation</p>
      </div>

      {/* Disclaimers & Methodology Banner */}
      <div className="quality-disclaimer-banner">
        <div className="disclaimer-icon-box">
          <Info size={20} className="text-accent" />
        </div>
        <div className="disclaimer-text">
          <strong>Auditing Scope & Governance Specification:</strong>
          <p>
            The composite <strong>Data Quality Score (DQS)</strong> is an explainable, <em>project-defined experimental metric</em> computed exclusively over the <strong>latest 50 HDFS streaming observations</strong>. It reflects real-time ingestion health and is not a certified ISO industrial standard. Historical September MapReduce datasets remain strictly segregated from live November pipeline audits.
          </p>
        </div>
      </div>

      {/* 1. Quality KPI Cards */}
      <QualityKPICards summary={summary} />

      {/* 2. End-to-End Pipeline Health Visualizer */}
      <QualityPipelineHealth pipeline={pipeline} />

      {/* 3. Analytical Quality Charts */}
      <QualityCharts metrics={metrics} summary={summary} />

      {/* 4. Filterable Issue Audit Log Table */}
      <QualityIssueTable
        issuesData={issuesData}
        onPageChange={setCurrentPage}
        severityFilter={severityFilter}
        onSeverityChange={setSeverityFilter}
        cityFilter={cityFilter}
        onCityChange={setCityFilter}
      />
    </div>
  );
};

export default QualityView;
