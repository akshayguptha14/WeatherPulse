import React, { useState, useEffect } from 'react';
import { getEcosystemStatus } from '../services/api';
import { 
  Radio, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Zap, 
  Database 
} from 'lucide-react';

const KafkaStreamMetrics = ({ refreshTrigger }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchEcosystem = () => {
      getEcosystemStatus()
        .then(res => {
          if (isMounted && res) {
            setMetrics({
              kafka: res.kafka || {},
              producer: res.producer || {},
              spark: res.spark || {}
            });
            setLoading(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            console.error("KafkaStreamMetrics fetch error:", err);
            setLoading(false);
          }
        });
    };

    fetchEcosystem();
    const interval = setInterval(fetchEcosystem, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshTrigger]);

  const kafka = metrics?.kafka || {};
  const kafkaMetrics = kafka.metrics || {};
  const producer = metrics?.producer || {};
  const prodMetrics = producer.metrics || {};
  const spark = metrics?.spark || {};
  const sparkMetrics = spark.metrics || {};

  const totalMessages = kafkaMetrics.total_messages;
  const partitions = kafkaMetrics.partitions || {};
  const isProducerRunning = prodMetrics.process_alive || producer.status === 'Running';
  const isSparkRunning = spark.status === 'Running' || sparkMetrics.state === 'RUNNING';
  const isPipelineActive = isProducerRunning && isSparkRunning;

  return (
    <div className="kafka-stream-metrics-bar">
      <div className="metrics-bar-header">
        <div className="bar-title">
          <Radio size={16} className="text-accent pulse-icon" />
          <h4>Streaming Pipeline Infrastructure Telemetry</h4>
        </div>
        <div className="bar-tag">
          {isPipelineActive ? (
            <>
              <span className="live-dot pulse"></span>
              <span>Active Ingestion Loop</span>
            </>
          ) : isProducerRunning || isSparkRunning ? (
            <span className="status-tag tag-stale">Partial Ingestion</span>
          ) : (
            <span className="status-tag tag-offline">Pipeline Inactive</span>
          )}
        </div>
      </div>

      <div className="metrics-bar-grid">
        {/* Metric 1: Cumulative Kafka Messages */}
        <div className="telemetry-card">
          <div className="telemetry-icon-box kafka-bg">
            <Radio size={20} />
          </div>
          <div className="telemetry-info">
            <span className="telemetry-label">Cumulative Topic Messages</span>
            <div className="telemetry-number">
              {totalMessages !== undefined && totalMessages !== null ? (
                totalMessages.toLocaleString()
              ) : (
                <span className="text-muted">...</span>
              )}
            </div>
            <span className="telemetry-subtext">
              Topic: <code>weather_stream</code> (cumulative messages since topic inception)
            </span>
          </div>
        </div>

        {/* Metric 2: Partition Offsets */}
        <div className="telemetry-card">
          <div className="telemetry-icon-box partition-bg">
            <Layers size={20} />
          </div>
          <div className="telemetry-info">
            <span className="telemetry-label">Kafka Partition End Offsets</span>
            <div className="partition-chips">
              <span className="partition-chip">
                P0: <strong>{partitions['0'] !== undefined ? partitions['0'].toLocaleString() : 'N/A'}</strong>
              </span>
              <span className="partition-chip">
                P1: <strong>{partitions['1'] !== undefined ? partitions['1'].toLocaleString() : 'N/A'}</strong>
              </span>
              <span className="partition-chip">
                P2: <strong>{partitions['2'] !== undefined ? partitions['2'].toLocaleString() : 'N/A'}</strong>
              </span>
            </div>
            <span className="telemetry-subtext">
              {kafkaMetrics.is_stale ? 'Reading cached cluster offsets' : 'Live partition offset counters'}
            </span>
          </div>
        </div>

        {/* Metric 3: Live Producer Daemon */}
        <div className="telemetry-card">
          <div className="telemetry-icon-box producer-bg">
            <Zap size={20} />
          </div>
          <div className="telemetry-info">
            <div className="telemetry-label-row">
              <span className="telemetry-label">Live Weather Producer</span>
              <span className={`status-pill-small ${isProducerRunning ? 'pill-success' : 'pill-muted'}`}>
                {isProducerRunning ? 'ACTIVE' : 'STOPPED'}
              </span>
            </div>
            <div className="telemetry-detail">
              PID: <strong>{prodMetrics.pid || 'N/A'}</strong> &bull; Cadence: <strong>{prodMetrics.interval_sec || 60}s</strong>
            </div>
            <span className="telemetry-subtext">
              Streaming 5 Indian cities to Kafka broker on port 9092
            </span>
          </div>
        </div>

        {/* Metric 4: Spark Structured Streaming Consumer */}
        <div className="telemetry-card">
          <div className="telemetry-icon-box spark-bg">
            <Cpu size={20} />
          </div>
          <div className="telemetry-info">
            <div className="telemetry-label-row">
              <span className="telemetry-label">Spark Streaming on YARN</span>
              <span className={`status-pill-small ${isSparkRunning ? 'pill-success' : 'pill-muted'}`}>
                {isSparkRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <div className="telemetry-detail font-mono" style={{fontSize: '0.82rem'}}>
              {sparkMetrics.app_name || 'WeatherKafkaToHDFS'}
            </div>
            <span className="telemetry-subtext">
              Microbatch sink &rarr; HDFS: <code>/weather/streaming/raw</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KafkaStreamMetrics;
