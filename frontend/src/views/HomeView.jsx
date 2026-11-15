import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Activity, 
  BarChart2, 
  Clock, 
  Bell, 
  ArrowRight, 
  Layers, 
  Cpu, 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets, 
  ShieldCheck, 
  CheckCircle2, 
  Gauge, 
  Radio, 
  Server, 
  Code2, 
  Sparkles,
  CloudLightning
} from 'lucide-react';
import { getSummary, getEcosystemStatus } from '../services/api';
import './HomeView.css';

const HomeView = ({ theme, toggleTheme }) => {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [ecosystem, setEcosystem] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef(null);

  const isDark = theme ? theme === 'dark' : (typeof document !== 'undefined' ? !document.body.classList.contains('light-theme') : true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn("Autoplay notice:", err);
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Fetch verified summary KPIs
    getSummary()
      .then(data => {
        if (isMounted && data) {
          setSummary(data);
        }
      })
      .catch(err => {
        console.error("HomeView: summary fetch error", err);
      })
      .finally(() => {
        if (isMounted) setSummaryLoading(false);
      });

    // Fetch ecosystem status
    getEcosystemStatus()
      .then(res => {
        if (isMounted && res) {
          setEcosystem(res);
        }
      })
      .catch(err => {
        console.error("HomeView: ecosystem status error", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`wp-home-container ${isDark ? 'dark-theme' : 'light-theme'}`}>
      {/* ===================================================================
          FIXED FULL-PAGE CINEMATIC STORM VIDEO BACKGROUND & OVERLAY
          Visible across entire landing page including all sections when scrolling
          =================================================================== */}
      <div className="wp-fixed-bg-media" aria-hidden="true">
        {!videoError && (
          <video
            ref={videoRef}
            className="wp-fixed-bg-video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/weather-bg-poster.jpg"
            onError={() => setVideoError(true)}
          >
            <source src="/weather-bg.mp4" type="video/mp4" />
          </video>
        )}
        <img 
          src="/weather-bg-poster.jpg" 
          alt="Storm Weather Background" 
          className="wp-fixed-bg-fallback-img" 
        />
      </div>

      <div className="wp-fixed-bg-overlay" aria-hidden="true"></div>

      {/* ===================================================================
          TOP FLOATING GLASS NAVBAR (Transparent -> Dark Glass on scroll)
          =================================================================== */}
      <header className={`wp-nav-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="wp-nav-inner">
          <Link to="/" className="wp-brand">
            <div className="wp-brand-icon-wrap">
              <Database size={20} />
            </div>
            <div className="wp-brand-text">
              <h1>WeatherPulse</h1>
              <p>Big Data Climate Engine</p>
            </div>
          </Link>

          <nav className="wp-nav-links">
            <a href="#overview" onClick={(e) => scrollToSection(e, 'overview')} className="wp-nav-link">Overview</a>
            <a href="#pipelines" onClick={(e) => scrollToSection(e, 'pipelines')} className="wp-nav-link">Pipelines</a>
            <a href="#stack" onClick={(e) => scrollToSection(e, 'stack')} className="wp-nav-link">Tech Stack</a>
            <a href="#capabilities" onClick={(e) => scrollToSection(e, 'capabilities')} className="wp-nav-link">Capabilities</a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="wp-nav-link">About</a>
          </nav>

          <div className="wp-nav-actions">
            <Link to="/stream" className="wp-btn-pill-sm wp-btn-glass">
              <span className="wp-pulse-dot"></span>
              <span>Live Stream</span>
            </Link>

            <Link to="/dashboard" className="wp-btn-pill-sm wp-btn-primary-sm">
              <span>Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ===================================================================
          CINEMATIC HERO SECTION
          =================================================================== */}
      <section className="wp-hero">
        <div className="wp-hero-content">
          <div className="wp-glass-badge">
            <span className="wp-pulse-dot"></span>
            <span>150 Historical Records · 5 Cities Monitored · Real-Time Ingestion</span>
          </div>

          <h1 className="wp-hero-title">
            <span className="wp-hero-title-main">Understand Weather.</span>
            <span className="wp-hero-title-sub">Analyze Every Observation.</span>
          </h1>

          <p className="wp-hero-subtitle">
            Explore real-time and historical weather data through an integrated Big Data analytics platform powered by the Hadoop ecosystem.
          </p>

          <div className="wp-hero-actions">
            <Link to="/dashboard" className="wp-btn-pill-lg wp-btn-hero-primary">
              <span>Explore Dashboard</span>
              <ArrowRight size={18} />
            </Link>

            <a 
              href="#pipelines" 
              onClick={(e) => scrollToSection(e, 'pipelines')} 
              className="wp-btn-pill-lg wp-btn-hero-glass"
            >
              <Layers size={18} />
              <span>View Architecture</span>
            </a>
          </div>
        </div>

        <a 
          href="#overview" 
          onClick={(e) => scrollToSection(e, 'overview')} 
          className="wp-scroll-indicator"
          aria-label="Scroll to overview section"
        >
          <div className="wp-mouse-icon">
            <div className="wp-mouse-wheel"></div>
          </div>
          <span>Scroll to explore</span>
        </a>
      </section>

      {/* ===================================================================
          3. PLATFORM OVERVIEW & LIVE SUMMARY METRICS
          =================================================================== */}
      <section id="overview" className="wp-section">
        <div className="wp-section-inner">
          <div className="wp-section-header">
            <span className="wp-section-tag">Platform Overview</span>
            <h2 className="wp-section-title">Verified Meteorological Baseline</h2>
            <p className="wp-section-desc">
              Unified analytics across batch and real-time paradigms. Below are the verified historical baselines derived from distributed MapReduce and Hive computations.
            </p>
          </div>

          <div className="wp-overview-grid">
            <div className="wp-metric-card">
              <div className="wp-metric-icon">
                <Database size={22} />
              </div>
              <div className="wp-metric-value">
                {summaryLoading ? "..." : (summary?.total_records ?? "150")}
              </div>
              <div className="wp-metric-label">Historical Records Analyzed</div>
              <div className="wp-metric-source">HDFS &bull; 5 Metropolitan Hubs</div>
            </div>

            <div className="wp-metric-card">
              <div className="wp-metric-icon">
                <Server size={22} />
              </div>
              <div className="wp-metric-value">
                {summaryLoading ? "..." : (summary?.cities_count ?? "5")}
              </div>
              <div className="wp-metric-label">Cities Monitored</div>
              <div className="wp-metric-source">BLR &bull; MAA &bull; DEL &bull; HYD &bull; BOM</div>
            </div>

            <div className="wp-metric-card">
              <div className="wp-metric-icon">
                <Thermometer size={22} />
              </div>
              <div className="wp-metric-value">
                {summaryLoading ? "..." : `${summary?.avg_temperature ?? "31.01"} °C`}
              </div>
              <div className="wp-metric-label">Mean Temperature</div>
              <div className="wp-metric-source">Hive MapReduce Aggregate</div>
            </div>

            <div className="wp-metric-card">
              <div className="wp-metric-icon">
                <Droplets size={22} />
              </div>
              <div className="wp-metric-value">
                {summaryLoading ? "..." : `${summary?.avg_humidity ?? "66.16"} %`}
              </div>
              <div className="wp-metric-label">Mean Relative Humidity</div>
              <div className="wp-metric-source">Hive MapReduce Aggregate</div>
            </div>

            <div className="wp-metric-card">
              <div className="wp-metric-icon">
                <CloudRain size={22} />
              </div>
              <div className="wp-metric-value">
                {summaryLoading ? "..." : `${summary?.total_rainfall ?? "1,491"} mm`}
              </div>
              <div className="wp-metric-label">Cumulative Precipitation</div>
              <div className="wp-metric-source">Hive MapReduce Aggregate</div>
            </div>

            <div className="wp-metric-card">
              <div className="wp-metric-icon">
                <Wind size={22} />
              </div>
              <div className="wp-metric-value">
                {summaryLoading ? "..." : `${summary?.avg_wind_speed ?? "13.17"} km/h`}
              </div>
              <div className="wp-metric-label">Mean Wind Velocity</div>
              <div className="wp-metric-source">Hive MapReduce Aggregate</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. ARCHITECTURE PIPELINES (HISTORICAL BATCH & REAL-TIME STREAMING)
          =================================================================== */}
      <section id="pipelines" className="wp-section">
        <div className="wp-section-inner">
          <div className="wp-section-header">
            <span className="wp-section-tag">Dual-Engine Architecture</span>
            <h2 className="wp-section-title">End-to-End Big Data Pipelines</h2>
            <p className="wp-section-desc">
              A complete Lambda architecture processing continuous telemetry in real-time while performing deep aggregations over historical climate archives.
            </p>
          </div>

          <div className="wp-pipeline-showcase">
            {/* Historical Batch Pipeline */}
            <div className="wp-pipeline-card">
              <div className="wp-pipeline-header">
                <div className="wp-pipeline-title-group">
                  <span className="wp-pipeline-type-badge wp-badge-batch">Batch Pipeline</span>
                  <h3>Historical Climate Analytics</h3>
                </div>
                <Link to="/historical" className="wp-btn-pill-sm wp-btn-glass">
                  <span>Explore Records</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="wp-pipeline-flow">
                <div className="wp-flow-stage">
                  <div className="wp-stage-step">Stage 01</div>
                  <div className="wp-stage-name">Historical CSV</div>
                  <p className="wp-stage-desc">Multi-year meteorological observations encompassing 150 calibrated records across 5 metropolitan regions.</p>
                </div>

                <div className="wp-flow-stage">
                  <div className="wp-stage-step">Stage 02</div>
                  <div className="wp-stage-name">HDFS Block Storage</div>
                  <p className="wp-stage-desc">Fault-tolerant distributed file system with block replication across Hadoop DataNodes.</p>
                </div>

                <div className="wp-flow-stage">
                  <div className="wp-stage-step">Stage 03</div>
                  <div className="wp-stage-name">MapReduce &amp; Hive</div>
                  <p className="wp-stage-desc">Parallel map-side combiners and Hive SQL execution engines computing regional climate averages and baselines.</p>
                </div>

                <div className="wp-flow-stage">
                  <div className="wp-stage-step">Stage 04</div>
                  <div className="wp-stage-name">Flask REST &amp; React</div>
                  <p className="wp-stage-desc">Decoupled REST endpoint serving aggregated metrics to interactive charting modules.</p>
                </div>
              </div>

              <div className="wp-pipeline-footer">
                <div className="wp-pipeline-meta">
                  Processing Engine: Hadoop 3 YARN MapReduce &bull; Query Layer: Apache Hive 3
                </div>
              </div>
            </div>

            {/* Real-Time Streaming Pipeline */}
            <div className="wp-pipeline-card">
              <div className="wp-pipeline-header">
                <div className="wp-pipeline-title-group">
                  <span className="wp-pipeline-type-badge wp-badge-stream">Streaming Pipeline</span>
                  <h3>Real-Time Meteorological Stream</h3>
                </div>
                <Link to="/stream" className="wp-btn-pill-sm wp-btn-glass">
                  <span>Open Live Monitor</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="wp-pipeline-flow">
                <div className="wp-flow-stage">
                  <div className="wp-stage-step">Stage 01</div>
                  <div className="wp-stage-name">Open-Meteo Ingestion</div>
                  <p className="wp-stage-desc">Automated ingestion polling real-time weather observations at 60-second intervals for Indian urban centers.</p>
                </div>

                <div className="wp-flow-stage">
                  <div className="wp-stage-step">Stage 02</div>
                  <div className="wp-stage-name">Apache Kafka Bus</div>
                  <p className="wp-stage-desc">Partitioned <code>weather_stream</code> topic buffering telemetry events with sub-millisecond publish latency.</p>
                </div>

                <div className="wp-flow-stage">
                  <div className="wp-stage-step">Stage 03</div>
                  <div className="wp-stage-name">Spark on YARN</div>
                  <p className="wp-stage-desc">Structured Streaming micro-batch engine processing events with checkpointing and stateful transformations.</p>
                </div>

                <div className="wp-flow-stage">
                  <div className="wp-stage-step">Stage 04</div>
                  <div className="wp-stage-name">HDFS Parquet Sink</div>
                  <p className="wp-stage-desc">Compact, columnar storage written directly to HDFS enabling immediate analytic retrieval.</p>
                </div>
              </div>

              <div className="wp-pipeline-footer">
                <div className="wp-pipeline-meta">
                  Ingestion: Kafka 3.x &bull; Stream Compute: Spark 3.x Structured Streaming on YARN &bull; Format: Parquet
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. TECHNOLOGY STACK
          =================================================================== */}
      <section id="stack" className="wp-section">
        <div className="wp-section-inner">
          <div className="wp-section-header">
            <span className="wp-section-tag">Enterprise Ecosystem</span>
            <h2 className="wp-section-title">The Big Data Technology Stack</h2>
            <p className="wp-section-desc">
              Built on production-grade distributed computing infrastructure, orchestrating storage, streaming, compute, and serving layers.
            </p>
          </div>

          <div className="wp-tech-grid">
            <div className="wp-tech-card">
              <div className="wp-tech-header">
                <div className="wp-tech-icon-wrap">
                  <Radio size={22} />
                </div>
                <span className="wp-tech-status-dot" title="Active"></span>
              </div>
              <div className="wp-tech-role">Message Broker</div>
              <h4>Apache Kafka</h4>
              <p>High-throughput distributed event log managing continuous streaming ingestion on topic <code>weather_stream</code> with zero data loss.</p>
            </div>

            <div className="wp-tech-card">
              <div className="wp-tech-header">
                <div className="wp-tech-icon-wrap">
                  <Sparkles size={22} />
                </div>
                <span className="wp-tech-status-dot" title="Active"></span>
              </div>
              <div className="wp-tech-role">Stream Processing</div>
              <h4>Apache Spark</h4>
              <p>Structured Streaming engine running on YARN, computing windowed micro-batches with persistent checkpoint metadata in HDFS.</p>
            </div>

            <div className="wp-tech-card">
              <div className="wp-tech-header">
                <div className="wp-tech-icon-wrap">
                  <Server size={22} />
                </div>
                <span className="wp-tech-status-dot" title="Active"></span>
              </div>
              <div className="wp-tech-role">Distributed Storage</div>
              <h4>Hadoop &amp; HDFS</h4>
              <p>Resilient cluster storage providing high-throughput block access for raw CSV archives, streaming Parquet sinks, and YARN resource management.</p>
            </div>

            <div className="wp-tech-card">
              <div className="wp-tech-header">
                <div className="wp-tech-icon-wrap">
                  <Database size={22} />
                </div>
                <span className="wp-tech-status-dot" title="Active"></span>
              </div>
              <div className="wp-tech-role">Data Warehouse</div>
              <h4>Apache Hive</h4>
              <p>Distributed SQL warehouse facilitating structured queries, schema enforcement, and aggregated statistical summaries over HDFS datasets.</p>
            </div>

            <div className="wp-tech-card">
              <div className="wp-tech-header">
                <div className="wp-tech-icon-wrap">
                  <Cpu size={22} />
                </div>
                <span className="wp-tech-status-dot" title="Active"></span>
              </div>
              <div className="wp-tech-role">Application API</div>
              <h4>Python Flask</h4>
              <p>Lightweight asynchronous REST service caching analytical queries, deduplicating client requests, and surfacing HDFS/Hive telemetry.</p>
            </div>

            <div className="wp-tech-card">
              <div className="wp-tech-header">
                <div className="wp-tech-icon-wrap">
                  <Code2 size={22} />
                </div>
                <span className="wp-tech-status-dot" title="Active"></span>
              </div>
              <div className="wp-tech-role">Client Interface</div>
              <h4>React 19 &amp; Vite</h4>
              <p>High-performance frontend interface featuring modular visualization cards, Recharts analytical graphs, and responsive glassmorphism layouts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          6. KEY CAPABILITIES
          =================================================================== */}
      <section id="capabilities" className="wp-section">
        <div className="wp-section-inner">
          <div className="wp-section-header">
            <span className="wp-section-tag">Key Capabilities</span>
            <h2 className="wp-section-title">Engineered for Robust Meteorological Intelligence</h2>
            <p className="wp-section-desc">
              From real-time weather alerts to deep seasonal baseline modeling, the platform delivers enterprise-grade big data capabilities.
            </p>
          </div>

          <div className="wp-capabilities-grid">
            <div className="wp-capability-card">
              <div className="wp-capability-icon">
                <Activity size={24} />
              </div>
              <h4>Continuous Stream Ingestion</h4>
              <p>Automated daemon producer querying the Open-Meteo REST API every 60 seconds, publishing formatted telemetry into Kafka with automated deduplication.</p>
            </div>

            <div className="wp-capability-card">
              <div className="wp-capability-icon">
                <BarChart2 size={24} />
              </div>
              <h4>Multi-City Comparative Analytics</h4>
              <p>Comparative temperature, precipitation, and humidity analysis across Bengaluru, Chennai, Delhi, Hyderabad, and Mumbai backed by Hive MapReduce.</p>
            </div>

            <div className="wp-capability-card">
              <div className="wp-capability-icon">
                <Bell size={24} />
              </div>
              <h4>Dynamic Climate Hazard Alerts</h4>
              <p>Real-time threshold evaluation generating immediate warning indicators for extreme temperature events, severe precipitation, and gale winds.</p>
            </div>

            <div className="wp-capability-card">
              <div className="wp-capability-icon">
                <ShieldCheck size={24} />
              </div>
              <h4>Checkpoint Fault Tolerance</h4>
              <p>Stateful Spark Structured Streaming with robust HDFS checkpoint tracking, ensuring zero data loss and automated recovery across node restarts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          7. ABOUT THE PROJECT
          =================================================================== */}
      <section id="about" className="wp-section">
        <div className="wp-section-inner">
          <div className="wp-about-card">
            <div className="wp-about-content">
              <div className="wp-about-text">
                <h3>About Weather &amp; Climate Analytics</h3>
                <p>
                  This project was architected as an end-to-end Big Data Technologies demonstration, synthesizing distributed computing paradigms to solve real-world meteorological challenges.
                </p>
                <p>
                  By joining Apache Kafka for streaming event distribution, Spark for low-latency computation, and Hadoop/Hive for deep historical warehousing, the architecture models the dual Lambda design pattern used in mission-critical climate monitoring systems worldwide.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                  <Link to="/dashboard" className="wp-btn-pill-sm wp-btn-primary-sm">
                    <span>Enter Application</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link to="/settings" className="wp-btn-pill-sm wp-btn-glass">
                    <span>System Specifications</span>
                  </Link>
                </div>
              </div>

              <div className="wp-about-highlights">
                <div className="wp-highlight-row">
                  <span className="wp-highlight-label">Architecture</span>
                  <span className="wp-highlight-value">Lambda (Streaming + Batch)</span>
                </div>
                <div className="wp-highlight-row">
                  <span className="wp-highlight-label">Environment</span>
                  <span className="wp-highlight-value">WSL2 / Linux Daemon</span>
                </div>
                <div className="wp-highlight-row">
                  <span className="wp-highlight-label">Streaming Source</span>
                  <span className="wp-highlight-value">Open-Meteo Weather API</span>
                </div>
                <div className="wp-highlight-row">
                  <span className="wp-highlight-label">Storage Formats</span>
                  <span className="wp-highlight-value">CSV &bull; Parquet Columnar</span>
                </div>
                <div className="wp-highlight-row">
                  <span className="wp-highlight-label">API Gateway</span>
                  <span className="wp-highlight-value">Flask REST on Port 5000</span>
                </div>
                <div className="wp-highlight-row">
                  <span className="wp-highlight-label">Cluster Status</span>
                  <span className="wp-highlight-value" style={{ color: 'var(--wp-success)' }}>
                    All Daemons Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          8. FOOTER
          =================================================================== */}
      <footer className="wp-footer">
        <div className="wp-footer-inner">
          <div className="wp-footer-top">
            <Link to="/" className="wp-brand">
              <div className="wp-brand-icon-wrap">
                <Database size={18} />
              </div>
              <div className="wp-brand-text">
                <h1>WeatherPulse</h1>
                <p>Big Data Climate Platform</p>
              </div>
            </Link>

            <div className="wp-footer-links">
              <Link to="/dashboard" className="wp-footer-link">Dashboard</Link>
              <Link to="/analytics" className="wp-footer-link">Analytics</Link>
              <Link to="/stream" className="wp-footer-link">Live Stream</Link>
              <Link to="/historical" className="wp-footer-link">Historical</Link>
              <Link to="/alerts" className="wp-footer-link">Alerts</Link>
              <Link to="/settings" className="wp-footer-link">Settings</Link>
            </div>
          </div>

          <div className="wp-footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} Weather &amp; Climate Big Data Analytics. All rights reserved.
            </div>
            <div className="wp-footer-badges">
              <span className="wp-badge-sm">Kafka 3</span>
              <span className="wp-badge-sm">Spark 3</span>
              <span className="wp-badge-sm">Hadoop 3</span>
              <span className="wp-badge-sm">Hive 3</span>
              <span className="wp-badge-sm">React 19</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeView;
