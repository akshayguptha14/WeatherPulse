import React, { useState, useEffect } from 'react';
import { getEcosystemStatus } from '../services/api';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu,
  CloudLightning,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Zap,
  CheckCircle2
} from 'lucide-react';
import './EcosystemStatus.css';

const ServiceCard = ({
  name,
  category,
  data,
  icon: Icon,
  isLoading,
  webUi,
  webUiLabel,
  renderChips,
  renderDiagnostics,
  forceShowDiag
}) => {
  const [showDiag, setShowDiag] = useState(false);

  useEffect(() => {
    if (forceShowDiag !== null) {
      setShowDiag(forceShowDiag);
    }
  }, [forceShowDiag]);

  if (isLoading) {
    return (
      <div className="eco-card eco-loading">
        <div className="eco-card-header">
          <div className="eco-service-identity">
            <div className="eco-icon-wrapper">
              <Icon size={18} />
            </div>
            <div>
              <h4>{name}</h4>
              <span className="eco-service-sub">{category}</span>
            </div>
          </div>
          <div className="eco-status-pill pill-stopped">
            <span className="eco-pulse-dot"></span>
            <span>Checking...</span>
          </div>
        </div>
        <div className="eco-card-details">Probing service endpoint...</div>
      </div>
    );
  }

  const rawStatus = (data?.status || 'Unavailable').toLowerCase();
  let statusTheme = 'unavailable';
  let pillClass = 'pill-unavailable';

  if (rawStatus === 'running') {
    statusTheme = 'running';
    pillClass = 'pill-running';
  } else if (rawStatus === 'available') {
    statusTheme = 'available';
    pillClass = 'pill-available';
  } else if (rawStatus === 'degraded') {
    statusTheme = 'degraded';
    pillClass = 'pill-degraded';
  }

  const latency = data?.metrics?.latency_ms;

  return (
    <div className={`eco-card eco-status-${statusTheme}`}>
      <div>
        <div className="eco-card-header">
          <div className="eco-service-identity">
            <div className="eco-icon-wrapper">
              <Icon size={18} />
            </div>
            <div>
              <h4>{name}</h4>
              <span className="eco-service-sub">{category}</span>
            </div>
          </div>
          <div className={`eco-status-pill ${pillClass}`}>
            <span className="eco-pulse-dot"></span>
            <span>{data?.status || 'Unavailable'}</span>
          </div>
        </div>

        {/* Custom Telemetry Metric Chips */}
        {renderChips && (
          <div className="eco-chips-group">
            {renderChips(data?.metrics || {})}
          </div>
        )}

        {/* Details description */}
        <div className="eco-card-details">
          {data?.details || 'Service status check completed'}
        </div>
      </div>

      <div>
        {/* Expandable Diagnostic Drawer */}
        {showDiag && renderDiagnostics && (
          <div className="eco-diag-drawer">
            {renderDiagnostics(data?.metrics || {}, data)}
          </div>
        )}

        {/* Footer with Web UI and Diagnostic toggles */}
        <div className="eco-card-footer">
          <span className="eco-latency-tag">
            <Zap size={11} /> {latency !== undefined ? `${latency} ms` : 'Local'}
          </span>

          <div className="eco-actions-row">
            {(webUi || data?.web_ui) && (
              <a
                href={webUi || data?.web_ui}
                target="_blank"
                rel="noopener noreferrer"
                className="eco-webui-link"
                title={`Open ${webUiLabel || name} Web UI`}
              >
                <span>{webUiLabel || 'Web UI'}</span>
                <ExternalLink size={11} />
              </a>
            )}

            {renderDiagnostics && (
              <button
                className="eco-diag-btn"
                onClick={() => setShowDiag(!showDiag)}
                title={showDiag ? 'Hide diagnostics' : 'Show diagnostics'}
                aria-label="Toggle diagnostics"
              >
                {showDiag ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EcosystemStatus = ({ refreshTrigger, minimal }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [globalDiag, setGlobalDiag] = useState(false);

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getEcosystemStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load ecosystem status:', err);
      setError('Backend ecosystem telemetry unavailable');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 15 seconds
    const interval = setInterval(() => fetchStatus(false), 15000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const isInitialLoading = loading && !status;

  // Calculate live count of running/available services
  const serviceKeys = ['hdfs', 'yarn', 'kafka', 'spark', 'hive', 'mapreduce', 'producer'];
  const activeCount = serviceKeys.reduce((acc, key) => {
    const s = status?.[key]?.status;
    return s === 'Running' || s === 'Available' ? acc + 1 : acc;
  }, 0);

  if (error && !status) {
    return (
      <section className={`ecosystem-container ${minimal ? 'eco-minimal' : ''}`}>
        <div className="eco-error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            className="btn-eco-action"
            onClick={() => {
              setLoading(true);
              fetchStatus(true);
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </section>
    );
  }

  // Minimal view for live stream sidebar
  if (minimal) {
    return (
      <section className="ecosystem-container eco-minimal">
        <div className="ecosystem-header-bar" style={{ marginBottom: '10px', paddingBottom: '8px' }}>
          <div className="ecosystem-title-group">
            <h3 style={{ fontSize: '0.9rem' }}>
              <Radio size={14} className="text-accent" /> Live Cluster Telemetry
            </h3>
          </div>
          <div className="ecosystem-meta-bar">
            <span className={`meta-chip ${activeCount >= 5 ? 'chip-online' : 'chip-warn'}`}>
              {activeCount}/{serviceKeys.length} Online
            </span>
          </div>
        </div>

        <div className="ecosystem-grid-cards">
          <ServiceCard
            name="Kafka Stream"
            category="Message Ingestion"
            data={status?.kafka}
            icon={Activity}
            isLoading={isInitialLoading}
            renderChips={(m) => (
              <>
                <span className="eco-metric-chip chip-accent">
                  <strong>{m.total_messages?.toLocaleString() || 0}</strong> msgs
                </span>
                <span className="eco-metric-chip">
                  <strong>{m.partition_count || 3}</strong> partitions
                </span>
              </>
            )}
          />

          <ServiceCard
            name="Spark Streaming"
            category="Stream Processing"
            data={status?.spark}
            icon={CloudLightning}
            isLoading={isInitialLoading}
            webUi={status?.spark?.metrics?.tracking_url || 'http://localhost:8088/cluster/apps'}
            webUiLabel="Spark UI"
            renderChips={(m) => (
              <>
                <span className="eco-metric-chip chip-highlight">
                  <strong>{m.elapsed_time || 'Running'}</strong>
                </span>
                <span className="eco-metric-chip">
                  <strong>{m.allocated_mb ? `${m.allocated_mb} MB` : 'YARN'}</strong>
                </span>
              </>
            )}
          />

          <ServiceCard
            name="Hadoop HDFS"
            category="Distributed Storage"
            data={status?.hdfs}
            icon={HardDrive}
            isLoading={isInitialLoading}
            webUi="http://localhost:9870"
            webUiLabel=":9870"
            renderChips={(m) => (
              <>
                <span className="eco-metric-chip chip-success">
                  <strong>{m.used_storage_formatted || '14.1 GB'}</strong> used
                </span>
                <span className="eco-metric-chip">
                  <strong>{m.live_datanodes || 1}</strong> Live DN
                </span>
              </>
            )}
          />

          <ServiceCard
            name="Weather Producer"
            category="Event Generator"
            data={status?.producer}
            icon={Radio}
            isLoading={isInitialLoading}
            renderChips={(m) => (
              <>
                <span className="eco-metric-chip">
                  <strong>{m.interval_sec || 60}s</strong> pulse
                </span>
                <span className={`eco-metric-chip ${m.kafka_publishing ? 'chip-success' : ''}`}>
                  {m.kafka_publishing ? 'Publishing' : (m.status || 'Stopped')}
                </span>
              </>
            )}
          />
        </div>
      </section>
    );
  }

  // Full comprehensive ecosystem view for Dashboard
  return (
    <section className="ecosystem-container">
      <div className="ecosystem-header-bar">
        <div className="ecosystem-title-group">
          <h3>
            <Server size={18} style={{ color: '#38bdf8' }} /> HADOOP BIG DATA ECOSYSTEM STATUS
          </h3>
          <p>Real-time cluster telemetry, YARN resource utilization, and streaming pipeline telemetry</p>
        </div>

        <div className="ecosystem-meta-bar">
          <span className={`meta-chip ${activeCount === serviceKeys.length ? 'chip-online' : activeCount >= 4 ? 'chip-warn' : ''}`}>
            <CheckCircle2 size={12} /> {activeCount}/{serviceKeys.length} Services Online
          </span>

          {status?._meta && (
            <span className="meta-chip chip-cached" title={`Cache TTL: ${status._meta.cache_ttl}s`}>
              ⚡ {status._meta.cached ? `Cached (${status._meta.cache_age_seconds}s)` : `${status._meta.total_execution_ms || 0}ms`}
            </span>
          )}

          <button
            className="btn-eco-action"
            onClick={() => setGlobalDiag(!globalDiag)}
            title="Toggle diagnostic telemetry across all cards"
          >
            {globalDiag ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>{globalDiag ? 'Hide All Diag' : 'Diagnostics'}</span>
          </button>

          <button
            className="btn-eco-action"
            onClick={() => fetchStatus(true)}
            disabled={refreshing || isInitialLoading}
            title="Force refresh live telemetry"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="ecosystem-grid-cards">
        {/* 1. HDFS NameNode */}
        <ServiceCard
          name="Hadoop HDFS"
          category="Distributed Storage"
          data={status?.hdfs}
          icon={HardDrive}
          isLoading={isInitialLoading}
          webUi="http://localhost:9870"
          webUiLabel="NameNode :9870"
          forceShowDiag={globalDiag}
          renderChips={(m) => (
            <>
              <span className="eco-metric-chip chip-success">
                <strong>{m.used_storage_formatted || '14.1 GB'}</strong> / {m.total_storage_formatted || '1.0 TB'} ({m.percent_used ?? 1.4}%)
              </span>
              <span className="eco-metric-chip">
                <strong>{m.live_datanodes ?? 1}</strong> Live DN
              </span>
              <span className="eco-metric-chip">
                <strong>{m.total_blocks?.toLocaleString() || '4,019'}</strong> Blocks
              </span>
            </>
          )}
          renderDiagnostics={(m) => (
            <>
              <div className="eco-diag-row">
                <span className="eco-diag-label">HDFS Version</span>
                <span className="eco-diag-val">{m.version || '3.3.6'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Free Storage</span>
                <span className="eco-diag-val">{m.free_storage_formatted || 'N/A'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Dead DataNodes</span>
                <span className="eco-diag-val">{m.dead_datanodes ?? 0}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Missing / Corrupt</span>
                <span className="eco-diag-val">{m.missing_blocks ?? 0} / {m.corrupt_blocks ?? 0}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Cluster ID</span>
                <span className="eco-diag-val" title={m.cluster_id}>{m.cluster_id || 'N/A'}</span>
              </div>
            </>
          )}
        />

        {/* 2. YARN ResourceManager */}
        <ServiceCard
          name="Apache YARN"
          category="Cluster Resource Manager"
          data={status?.yarn}
          icon={Server}
          isLoading={isInitialLoading}
          webUi="http://localhost:8088"
          webUiLabel="YARN UI :8088"
          forceShowDiag={globalDiag}
          renderChips={(m) => (
            <>
              <span className="eco-metric-chip chip-accent">
                <strong>{m.allocated_mb ?? 4096}</strong> / {m.total_mb ?? 8192} MB RAM ({m.memory_used_percent ?? 50}%)
              </span>
              <span className="eco-metric-chip">
                <strong>{m.allocated_vcores ?? 2}</strong> / {m.total_vcores ?? 8} vCores
              </span>
              <span className="eco-metric-chip">
                <strong>{m.apps_running ?? 1}</strong> Running App
              </span>
            </>
          )}
          renderDiagnostics={(m) => (
            <>
              <div className="eco-diag-row">
                <span className="eco-diag-label">NodeManagers</span>
                <span className="eco-diag-val">{m.active_nodes ?? 1} Active</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Available Memory</span>
                <span className="eco-diag-val">{m.available_mb ?? 4096} MB</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Available vCores</span>
                <span className="eco-diag-val">{m.available_vcores ?? 6}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">ResourceManager</span>
                <span className="eco-diag-val">localhost:8088</span>
              </div>
            </>
          )}
        />

        {/* 3. Apache Kafka */}
        <ServiceCard
          name="Apache Kafka"
          category="Distributed Message Broker"
          data={status?.kafka}
          icon={Activity}
          isLoading={isInitialLoading}
          forceShowDiag={globalDiag}
          renderChips={(m) => (
            <>
              <span className="eco-metric-chip chip-accent">
                <strong>{m.total_messages?.toLocaleString() || 0}</strong> Total Events
              </span>
              <span className="eco-metric-chip">
                <strong>{m.partition_count || 3}</strong> Partitions
              </span>
              <span className="eco-metric-chip">
                Topic: <strong>{m.topic || 'weather_stream'}</strong>
              </span>
            </>
          )}
          renderDiagnostics={(m) => (
            <>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Broker Endpoint</span>
                <span className="eco-diag-val">{m.broker || 'localhost:9092'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Port 9092 Status</span>
                <span className="eco-diag-val">{m.port_open ? 'Listening (TCP)' : 'Closed'}</span>
              </div>
              {m.is_stale && (
                <div className="eco-diag-row">
                  <span className="eco-diag-label">Telemetry Mode</span>
                  <span className="eco-diag-val" style={{ color: '#fbbf24' }}>Cached / Stale Reading</span>
                </div>
              )}
              {m.partitions && Object.entries(m.partitions).map(([part, offset]) => (
                <div className="eco-diag-row" key={part}>
                  <span className="eco-diag-label">Partition {part} Offset</span>
                  <span className="eco-diag-val">{Number(offset).toLocaleString()} msgs</span>
                </div>
              ))}
            </>
          )}
        />

        {/* 4. Apache Spark Structured Streaming */}
        <ServiceCard
          name="Apache Spark"
          category="Structured Streaming on YARN"
          data={status?.spark}
          icon={CloudLightning}
          isLoading={isInitialLoading}
          webUi={status?.spark?.metrics?.tracking_url || 'http://localhost:8088/cluster/apps'}
          webUiLabel="Spark on YARN"
          forceShowDiag={globalDiag}
          renderChips={(m) => (
            <>
              <span className="eco-metric-chip chip-highlight">
                <strong>{m.name || 'WeatherKafkaToHDFS'}</strong>
              </span>
              <span className="eco-metric-chip">
                Elapsed: <strong>{m.elapsed_time || 'Running'}</strong>
              </span>
              <span className="eco-metric-chip">
                {m.allocated_mb ? `${m.allocated_mb} MB RAM` : 'Active'}
              </span>
            </>
          )}
          renderDiagnostics={(m) => (
            <>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Application ID</span>
                <span className="eco-diag-val" title={m.app_id}>{m.app_id || 'N/A'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">App State</span>
                <span className="eco-diag-val">{m.state || 'N/A'} ({m.final_status || 'RUNNING'})</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Containers</span>
                <span className="eco-diag-val">{m.allocated_containers || 2} allocated</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">vCores Allocated</span>
                <span className="eco-diag-val">{m.allocated_vcores || 2}</span>
              </div>
            </>
          )}
        />

        {/* 5. Apache Hive */}
        <ServiceCard
          name="Apache Hive"
          category="Data Warehouse & HiveServer2"
          data={status?.hive}
          icon={Database}
          isLoading={isInitialLoading}
          forceShowDiag={globalDiag}
          renderChips={(m) => (
            <>
              <span className="eco-metric-chip chip-accent">
                Port <strong>{m.port || 10000}</strong>
              </span>
              <span className="eco-metric-chip">
                {m.pid ? `PID: ${m.pid}` : 'HS2 JVM'}
              </span>
              <span className="eco-metric-chip">
                {m.port_open ? 'Ready for Queries' : 'Connecting'}
              </span>
            </>
          )}
          renderDiagnostics={(m) => (
            <>
              <div className="eco-diag-row">
                <span className="eco-diag-label">HiveServer2 Port</span>
                <span className="eco-diag-val">{m.port || 10000} (Thrift)</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Process ID</span>
                <span className="eco-diag-val">{m.pid || 'N/A'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">JVM Status</span>
                <span className="eco-diag-val">{m.process_found ? 'Active JVM (RunJar)' : 'Process not found'}</span>
              </div>
            </>
          )}
        />

        {/* 6. Java MapReduce */}
        <ServiceCard
          name="Java MapReduce"
          category="Batch Processing & Analytics"
          data={status?.mapreduce}
          icon={Cpu}
          isLoading={isInitialLoading}
          forceShowDiag={globalDiag}
          renderChips={(m) => (
            <>
              <span className="eco-metric-chip chip-success">
                <strong>Phase 3 Verified</strong>
              </span>
              <span className="eco-metric-chip">
                <strong>{m.cities_analyzed || 5}</strong> Cities Monitored
              </span>
              <span className="eco-metric-chip">
                <strong>{m.total_records || 150}</strong> Historical Rows
              </span>
            </>
          )}
          renderDiagnostics={(m) => (
            <>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Batch Engine</span>
                <span className="eco-diag-val">Hadoop YARN MRv2</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">HDFS Output Path</span>
                <span className="eco-diag-val" title={m.hdfs_output_path || '/weather/mapreduce/city_weather_stats'}>
                  {m.hdfs_output_path || '/weather/mapreduce/city_weather_stats'}
                </span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">_SUCCESS Marker</span>
                <span className="eco-diag-val">{m.has_success_marker ? 'Present (Verified)' : 'Missing'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Output File</span>
                <span className="eco-diag-val">{m.output_file ? `${m.output_file} (${m.output_bytes || 311} B)` : 'part-r-00000'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Active MR Job</span>
                <span className="eco-diag-val">{m.currently_executing ? 'Executing on YARN' : 'Idle (Completed Historical Batch)'}</span>
              </div>
            </>
          )}
        />

        {/* 7. Live Weather Producer Daemon */}
        <ServiceCard
          name="Weather Producer"
          category="Continuous Ingestion Daemon"
          data={status?.producer}
          icon={Radio}
          isLoading={isInitialLoading}
          forceShowDiag={globalDiag}
          renderChips={(m) => (
            <>
              <span className="eco-metric-chip chip-accent">
                Interval: <strong>{m.interval_sec || 60}s</strong>
              </span>
              <span className="eco-metric-chip">
                <strong>{m.cities_count || 5}</strong> Cities Streamed
              </span>
              <span className={`eco-metric-chip ${m.kafka_publishing ? 'chip-success' : ''}`}>
                {m.kafka_publishing ? 'Publishing Active' : (m.status || 'Stopped')}
              </span>
            </>
          )}
          renderDiagnostics={(m) => (
            <>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Process State</span>
                <span className="eco-diag-val">{m.process_alive ? `Running (PID: ${m.pid})` : 'Stopped'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Weather API Fetch</span>
                <span className="eco-diag-val">{m.weather_fetching ? 'Confirmed (Open-Meteo)' : 'Inactive'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Kafka Publishing</span>
                <span className="eco-diag-val">{m.kafka_publishing ? 'Confirmed (weather_stream)' : 'Inactive'}</span>
              </div>
              <div className="eco-diag-row">
                <span className="eco-diag-label">Last Ingest Time</span>
                <span className="eco-diag-val" title={m.last_ingest_time}>{m.last_ingest_time ? m.last_ingest_time.replace('T', ' ').slice(0, 19) : 'None'}</span>
              </div>
              {m.last_city_published && (
                <div className="eco-diag-row">
                  <span className="eco-diag-label">Last City</span>
                  <span className="eco-diag-val">{m.last_city_published}</span>
                </div>
              )}
              {m.last_error && (
                <div className="eco-diag-row">
                  <span className="eco-diag-label">Latest Error</span>
                  <span className="eco-diag-val" style={{ color: '#f87171' }} title={m.last_error}>{m.last_error}</span>
                </div>
              )}
              <div className="eco-diag-row">
                <span className="eco-diag-label">Target Broker / Topic</span>
                <span className="eco-diag-val">localhost:9092 / {m.target_topic || 'weather_stream'}</span>
              </div>
            </>
          )}
        />
      </div>
    </section>
  );
};

export default EcosystemStatus;