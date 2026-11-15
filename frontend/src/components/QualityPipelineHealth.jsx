import React from 'react';
import { 
  Radio, 
  Layers, 
  Zap, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Activity 
} from 'lucide-react';

const QualityPipelineHealth = ({ pipeline = {} }) => {
  const hops = pipeline.hops || [];
  const isHealthy = pipeline.overall_pipeline_healthy;

  const getHopIcon = (step) => {
    switch (step) {
      case 1: return Radio;
      case 2: return Layers;
      case 3: return Zap;
      case 4: return Database;
      default: return Activity;
    }
  };

  return (
    <div className="chart-card pipeline-health-card">
      <div className="card-header-row">
        <div>
          <h3>Kafka-to-Spark-to-HDFS Pipeline Health</h3>
          <p className="card-subtitle">End-to-end transport integrity, active process table verification, and cluster sinks</p>
        </div>
        <span className={`status-pill ${isHealthy ? 'ok' : 'warn'}`}>
          <span className="live-dot pulse"></span>
          {isHealthy ? 'PIPELINE NOMINAL' : 'PIPELINE WARNING'}
        </span>
      </div>

      <div className="pipeline-hops-container">
        {hops.map((hop, index) => {
          const Icon = getHopIcon(hop.step);
          const isRunning = hop.status === 'Running' || hop.status === 'Available';
          return (
            <React.Fragment key={hop.step}>
              <div className={`pipeline-hop-node ${isRunning ? 'node-running' : 'node-stopped'}`}>
                <div className="hop-step-badge">STEP {hop.step}</div>
                <div className="hop-icon-box">
                  <Icon size={22} className={isRunning ? 'text-accent' : 'text-danger'} />
                </div>
                <div className="hop-name">{hop.name}</div>
                <div className="hop-type">{hop.type}</div>

                <div className="hop-status-row">
                  <span className={`status-dot ${isRunning ? 'running' : 'stopped'}`}></span>
                  <span className="hop-status-text">{hop.status}</span>
                </div>

                {/* Specific Hop Telemetry Details */}
                <div className="hop-details-box">
                  {hop.step === 1 && (
                    <>
                      <div className="hop-sub-stat">PID: <strong className="font-mono">{hop.pid || 'N/A'}</strong></div>
                      <div className="hop-sub-stat">Cadence: <strong>{hop.interval_sec}s</strong></div>
                      <div className="hop-sub-stat">Last City: <strong>{hop.last_city || 'N/A'}</strong></div>
                    </>
                  )}
                  {hop.step === 2 && (
                    <>
                      <div className="hop-sub-stat">Topic: <strong className="font-mono">{hop.topic}</strong></div>
                      <div className="hop-sub-stat">Messages: <strong>{hop.total_messages?.toLocaleString() || '0'}</strong></div>
                      <div className="hop-sub-stat">Broker: <strong>{hop.broker}</strong></div>
                    </>
                  )}
                  {hop.step === 3 && (
                    <>
                      <div className="hop-sub-stat">Trigger: <strong>{hop.trigger_interval}</strong></div>
                      <div className="hop-sub-stat">Batch Latency: <strong>{hop.avg_microbatch_latency_sec || 0}s</strong></div>
                      <div className="hop-sub-stat">Mode: <strong>Append</strong></div>
                    </>
                  )}
                  {hop.step === 4 && (
                    <>
                      <div className="hop-sub-stat">Sink: <strong className="font-mono">{hop.path}</strong></div>
                      <div className="hop-sub-stat">DataNodes: <strong>{hop.live_datanodes} Live</strong></div>
                      <div className="hop-sub-stat">Used: <strong>{hop.used_storage_formatted}</strong></div>
                    </>
                  )}
                </div>
              </div>

              {index < hops.length - 1 && (
                <div className="pipeline-hop-connector">
                  <ArrowRight size={20} className="connector-arrow animate-pulse" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default QualityPipelineHealth;
