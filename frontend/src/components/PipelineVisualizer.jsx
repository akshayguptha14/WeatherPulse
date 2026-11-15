import React from 'react';
import { 
  FileText, 
  Database, 
  Server, 
  HardDrive, 
  Layers, 
  Activity, 
  LayoutDashboard, 
  ArrowRight, 
  CloudLightning 
} from 'lucide-react';
import './PipelineVisualizer.css';

const PipelineVisualizer = () => {
  return (
    <div className="pipeline-card">
      <div className="pipeline-header-block">
        <h3 className="section-title">Big Data Pipeline Architecture</h3>
        <p className="pipeline-subtitle">
          Dual data workflows: Historical Batch Processing &amp; Real-Time Continuous Streaming
        </p>
      </div>

      <div className="pipeline-tracks-container">
        {/* Track 1: Historical / Batch */}
        <div className="pipeline-track historical-track">
          <div className="track-badge batch-badge">
            <span className="track-tag">BATCH PIPELINE</span>
            <span className="track-name">Historical Climate Analytics</span>
          </div>
          
          <div className="pipeline-flow historical-flow">
            {/* Stage 1 */}
            <div className="flow-stage">
              <div className="node-icon-wrapper batch-icon">
                <FileText size={18} />
              </div>
              <div className="node-details">
                <span className="node-name">Historical CSV</span>
                <span className="node-label">150 Weather Records</span>
              </div>
            </div>

            {/* Connector 1 */}
            <div className="flow-connector batch-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">
                <ArrowRight size={13} className="flow-arrow-icon" />
              </div>
            </div>

            {/* Stage 2 */}
            <div className="flow-stage">
              <div className="node-icon-wrapper batch-icon">
                <HardDrive size={18} />
              </div>
              <div className="node-details">
                <span className="node-name">HDFS</span>
                <span className="node-label">Distributed Storage</span>
              </div>
            </div>

            {/* Connector 2 */}
            <div className="flow-connector batch-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">
                <ArrowRight size={13} className="flow-arrow-icon" />
              </div>
            </div>

            {/* Stage 3 */}
            <div className="flow-stage">
              <div className="node-icon-wrapper batch-icon">
                <Database size={18} />
              </div>
              <div className="node-details">
                <span className="node-name">MapReduce + Hive</span>
                <span className="node-label">Batch Analytics Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Track 2: Live / Streaming */}
        <div className="pipeline-track streaming-track">
          <div className="track-badge stream-badge">
            <span className="track-tag">STREAMING PIPELINE</span>
            <span className="track-name">Real-Time Weather Ingestion</span>
          </div>

          <div className="pipeline-flow streaming-flow">
            {/* Stage 1 */}
            <div className="flow-stage">
              <div className="node-icon-wrapper stream-icon">
                <CloudLightning size={18} />
              </div>
              <div className="node-details">
                <span className="node-name">Open-Meteo API</span>
                <span className="node-label">Live Weather Source</span>
              </div>
            </div>

            {/* Connector 1 */}
            <div className="flow-connector stream-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">
                <ArrowRight size={13} className="flow-arrow-icon" />
              </div>
            </div>

            {/* Stage 2 */}
            <div className="flow-stage">
              <div className="node-icon-wrapper stream-icon">
                <Activity size={18} />
              </div>
              <div className="node-details">
                <span className="node-name">Kafka</span>
                <span className="node-label">Topic: weather_stream</span>
              </div>
            </div>

            {/* Connector 2 */}
            <div className="flow-connector stream-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">
                <ArrowRight size={13} className="flow-arrow-icon" />
              </div>
            </div>

            {/* Stage 3 */}
            <div className="flow-stage">
              <div className="node-icon-wrapper stream-icon">
                <Server size={18} />
              </div>
              <div className="node-details">
                <span className="node-name">Spark Structured Streaming (YARN)</span>
                <span className="node-label">Real-time Micro-batches</span>
              </div>
            </div>

            {/* Connector 3 */}
            <div className="flow-connector stream-connector">
              <div className="connector-line"></div>
              <div className="connector-arrow">
                <ArrowRight size={13} className="flow-arrow-icon" />
              </div>
            </div>

            {/* Stage 4 */}
            <div className="flow-stage">
              <div className="node-icon-wrapper stream-icon">
                <HardDrive size={18} />
              </div>
              <div className="node-details">
                <span className="node-name">HDFS (Parquet)</span>
                <span className="node-label">Processed Stream Sink</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Consumption Layer */}
      <div className="pipeline-convergence">
        <div className="convergence-label">
          <span>UNIFIED APPLICATION &amp; VISUALIZATION LAYER</span>
        </div>
        <div className="pipeline-flow convergence-flow">
          <div className="flow-stage">
            <div className="node-icon-wrapper app-icon">
              <Layers size={18} />
            </div>
            <div className="node-details">
              <span className="node-name">Flask REST API</span>
              <span className="node-label">Aggregations &amp; Endpoints</span>
            </div>
          </div>

          <div className="flow-connector app-connector">
            <div className="connector-line"></div>
            <div className="connector-arrow">
              <ArrowRight size={13} className="flow-arrow-icon" />
            </div>
          </div>

          <div className="flow-stage">
            <div className="node-icon-wrapper app-icon">
              <LayoutDashboard size={18} />
            </div>
            <div className="node-details">
              <span className="node-name">React UI</span>
              <span className="node-label">Dashboard &amp; Monitors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineVisualizer;
