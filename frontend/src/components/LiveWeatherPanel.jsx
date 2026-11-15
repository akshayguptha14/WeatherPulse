import React, { useState, useEffect } from 'react';
import { getRecentStream } from '../services/api';
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Thermometer, 
  CloudRain, 
  Sun, 
  Gauge, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';

const formatTimestamp = (ts) => {
  if (!ts) return 'N/A';
  // Clean 'LIVE|' prefix if present
  const clean = ts.replace(/^LIVE\|/, '');
  try {
    const d = new Date(clean.replace(' ', 'T'));
    if (isNaN(d.getTime())) {
      return clean.split('.')[0].replace('T', ' ');
    }
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return clean;
  }
};

const getDataAgeMinutes = (ts) => {
  if (!ts) return null;
  try {
    const clean = ts.replace(/^LIVE\|/, '');
    const d = new Date(clean.replace(' ', 'T'));
    if (isNaN(d.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  } catch {
    return null;
  }
};

const getRelativeTime = (ts) => {
  if (!ts) return '';
  try {
    const clean = ts.replace(/^LIVE\|/, '');
    const d = new Date(clean.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    const diffSec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const hours = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    if (diffMin < 1440) return `${hours}h ${remMin}m ago`;
    const days = Math.floor(diffMin / 1440);
    const remHours = Math.floor((diffMin % 1440) / 60);
    return `${days}d ${remHours}h ago (${diffMin.toLocaleString()}m)`;
  } catch {
    return '';
  }
};

const getWeatherIcon = (condition) => {
  const cond = (condition || '').toLowerCase();
  if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain size={16} className="metric-icon rain-icon" />;
  if (cond.includes('cloud') || cond.includes('overcast')) return <Cloud size={16} className="metric-icon cloud-icon" />;
  if (cond.includes('clear') || cond.includes('sunny')) return <Sun size={16} className="metric-icon sun-icon" />;
  return <Thermometer size={16} className="metric-icon" />;
};

// Freshness threshold in minutes: data older than 5m is classified as STALE
const FRESHNESS_THRESHOLD_MINUTES = 5;

const LiveWeatherPanel = ({ refreshTrigger }) => {
  const [liveData, setLiveData] = useState({});
  const [pipelineStatus, setPipelineStatus] = useState('Loading'); // 'LIVE' | 'STALE' | 'OFFLINE' | 'Loading'
  const [latestIngestTime, setLatestIngestTime] = useState(null);
  const [latestSparkTime, setLatestSparkTime] = useState(null);
  const [dataAgeMinutes, setDataAgeMinutes] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setPipelineStatus('Loading');

    const fetchStream = () => {
      getRecentStream()
        .then(res => {
          if (!isMounted) return;
          const streamData = res || [];
          
          const latestByCity = {};
          let maxIngest = null;
          let maxSpark = null;

          for (const row of streamData) {
            if (row.city && !latestByCity[row.city]) {
              latestByCity[row.city] = row;
            }
            if (row.ingest_timestamp && (!maxIngest || row.ingest_timestamp > maxIngest)) {
              maxIngest = row.ingest_timestamp;
            }
            if (row.spark_processing_timestamp && (!maxSpark || row.spark_processing_timestamp > maxSpark)) {
              maxSpark = row.spark_processing_timestamp;
            }
          }

          setLiveData(latestByCity);
          setLatestIngestTime(maxIngest);
          setLatestSparkTime(maxSpark);

          const cityCount = Object.keys(latestByCity).length;
          const ageMin = getDataAgeMinutes(maxIngest);
          setDataAgeMinutes(ageMin);

          if (cityCount === 0) {
            setPipelineStatus('OFFLINE');
            setErrorMsg('No streaming records in HDFS sink yet');
          } else if (ageMin !== null && ageMin <= FRESHNESS_THRESHOLD_MINUTES) {
            // Fresh records within threshold
            setPipelineStatus('LIVE');
            setErrorMsg(null);
          } else {
            // Connected to HDFS data, but records are stale
            setPipelineStatus('STALE');
            setErrorMsg(null);
          }
        })
        .catch(err => {
          if (!isMounted) return;
          console.error("LiveWeatherPanel fetch error:", err);
          setPipelineStatus('OFFLINE');
          setErrorMsg('Unable to retrieve stream records from backend');
        });
    };

    fetchStream();
    const interval = setInterval(fetchStream, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshTrigger]);

  const targetCities = ["Bengaluru", "Delhi", "Mumbai", "Chennai", "Hyderabad"];
  const relativeIngest = getRelativeTime(latestIngestTime);

  return (
    <section className="live-weather-panel info-card">
      <div className="panel-header-flex">
        <div className="panel-title-block">
          <div className="live-badge-row">
            <span className="live-status-pill">
              <span className={`live-dot ${pipelineStatus === 'LIVE' ? 'pulse' : ''}`}></span>
              {pipelineStatus === 'LIVE' ? 'LIVE STREAMING' : pipelineStatus === 'STALE' ? 'STREAMING PIPELINE' : 'PIPELINE MONITOR'}
            </span>
            <span className="pipeline-crumb">Kafka &rarr; Spark &rarr; HDFS</span>
          </div>
          <h3 className="panel-main-heading">Current City Weather Observations</h3>
        </div>

        <div className="panel-meta-block">
          <div className="meta-item">
            <span className="meta-label">Pipeline Status:</span>
            {pipelineStatus === 'LIVE' && (
              <strong className="status-tag tag-live" title="Live streaming: fresh records arriving (< 5m)">
                <span className="live-dot pulse" style={{ width: '6px', height: '6px', marginRight: '6px' }}></span>
                LIVE
              </strong>
            )}
            {pipelineStatus === 'STALE' && (
              <strong className="status-tag tag-stale" title={`Pipeline connected to HDFS, but records exceed ${FRESHNESS_THRESHOLD_MINUTES}m freshness threshold`}>
                <AlertTriangle size={12} style={{ marginRight: '4px' }} />
                STALE
              </strong>
            )}
            {pipelineStatus === 'OFFLINE' && (
              <strong className="status-tag tag-offline" title="Pipeline offline or unavailable">
                <AlertCircle size={12} style={{ marginRight: '4px' }} />
                OFFLINE
              </strong>
            )}
            {pipelineStatus === 'Loading' && (
              <strong className="status-tag tag-loading">
                <Loader2 size={12} className="animate-spin" style={{ marginRight: '4px' }} />
                Loading...
              </strong>
            )}
          </div>
          {latestIngestTime && (
            <div className="meta-item timestamp-item" title={`Spark Processing Time: ${formatTimestamp(latestSparkTime)}`}>
              <Clock size={13} className="text-secondary" />
              <span className="meta-label">Latest Ingest:</span>
              <span className="meta-timestamp font-mono">
                {formatTimestamp(latestIngestTime)}
                {relativeIngest && <span className="time-ago"> ({relativeIngest})</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      {pipelineStatus === 'Loading' && Object.keys(liveData).length === 0 ? (
        <div className="empty-state">
          <Loader2 size={26} className="animate-spin text-accent" style={{marginBottom: '8px'}} />
          <div>Retrieving real-time city observations from HDFS streaming sink...</div>
        </div>
      ) : Object.keys(liveData).length === 0 ? (
        <div className="empty-state">
          <Activity size={26} className="text-warning" style={{marginBottom: '8px'}} />
          <div>{errorMsg || 'Waiting for live weather stream events...'}</div>
          <p className="text-muted" style={{fontSize: '0.85rem', marginTop: '6px'}}>
            Producer runs on a 60-second cycle. Spark Structured Streaming will write Parquet commits to HDFS.
          </p>
        </div>
      ) : (
        <div className="live-cards-grid">
          {targetCities.map(city => {
            const data = liveData[city];
            if (!data) {
              return (
                <div key={city} className="live-city-card awaiting-city">
                  <div className="city-card-header">
                    <h4>{city}</h4>
                    <span className="condition-tag tag-muted">Awaiting stream</span>
                  </div>
                  <div className="city-card-temp text-muted">N/A</div>
                  <p className="awaiting-text">Pending next 60s ingestion cycle</p>
                </div>
              );
            }

            return (
              <div key={city} className="live-city-card">
                <div className="city-card-header">
                  <h4>{city}</h4>
                  <span className="condition-tag">
                    {getWeatherIcon(data.weather_condition)}
                    <span>{data.weather_condition || 'N/A'}</span>
                  </span>
                </div>

                <div className="city-card-temp">
                  {data.temperature !== null && data.temperature !== undefined ? (
                    <>
                      <span className="temp-value">{data.temperature}</span>
                      <span className="temp-unit">&deg;C</span>
                    </>
                  ) : (
                    <span className="temp-value text-muted">N/A</span>
                  )}
                </div>

                {/* 6 Essential Weather Metrics Grid */}
                <div className="city-metrics-grid">
                  <div className="metric-box">
                    <span className="metric-lbl"><Droplets size={13} /> Humidity</span>
                    <strong className="metric-val">
                      {data.humidity !== null && data.humidity !== undefined ? `${data.humidity}%` : 'N/A'}
                    </strong>
                  </div>

                  <div className="metric-box">
                    <span className="metric-lbl"><CloudRain size={13} /> Rainfall</span>
                    <strong className="metric-val">
                      {data.rainfall !== null && data.rainfall !== undefined ? `${data.rainfall} mm` : 'N/A'}
                    </strong>
                  </div>

                  <div className="metric-box">
                    <span className="metric-lbl"><Wind size={13} /> Wind</span>
                    <strong className="metric-val">
                      {data.wind_speed !== null && data.wind_speed !== undefined ? `${data.wind_speed} km/h` : 'N/A'}
                    </strong>
                  </div>

                  <div className="metric-box">
                    <span className="metric-lbl"><Gauge size={13} /> Pressure</span>
                    <strong className="metric-val">
                      {data.pressure !== null && data.pressure !== undefined ? `${data.pressure} hPa` : 'N/A'}
                    </strong>
                  </div>
                </div>

                <div className="city-card-footer">
                  <span className="footer-label">Ingested:</span>
                  <span className="footer-ts font-mono">
                    {data.ingest_timestamp ? formatTimestamp(data.ingest_timestamp) : 'N/A'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LiveWeatherPanel;
