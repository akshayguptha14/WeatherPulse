import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  // 600s timeout since Hadoop 3 YARN MapReduce cold starts can take > 500s on this VM
  timeout: 600000, 
});

// Cache in-flight promises to prevent duplicate simultaneous requests
const inFlightRequests = {};

// Queue for sequential execution to prevent crashing backend MapReduce/Hive
let apiQueue = Promise.resolve();

const fetchWithDeduplication = (url) => {
  if (inFlightRequests[url]) {
    console.log("[API START] Reusing in-flight request for:", url);
    return inFlightRequests[url];
  }
  
  console.log("[API START] Queuing request for:", url);
  // Chain this request to the global queue so they run sequentially
  const req = new Promise((resolve, reject) => {
    // Catch any prior errors in the queue so the next request always runs
    apiQueue = apiQueue.catch(() => {}).then(() => {
      console.log("[API START]", url);
      return api.get(url)
        .then(res => {
          console.log("[API SUCCESS]", url, res.data);
          resolve(res.data);
        })
        .catch(err => {
          console.log("[API ERROR]", url, err);
          reject(err);
        })
        .finally(() => {
          console.log("[API FINISH]", url);
          delete inFlightRequests[url];
        });
    });
  });

  inFlightRequests[url] = req;
  return req;
};

export const getEcosystemStatus = () => api.get('/api/ecosystem').then(res => res.data);
export const getBackendStatus = () => api.get('/api/status').then(res => res.data);
export const getSummary = () => fetchWithDeduplication('/api/summary');
export const getCities = () => fetchWithDeduplication('/api/cities');
export const getTemperature = () => fetchWithDeduplication('/api/temperature');
export const getHistorical = () => fetchWithDeduplication('/api/historical');
export const getRecentStream = () => api.get('/api/stream/recent').then(res => res.data);
// Route specific chart endpoints through getCities to prevent MapReduce crashes
export const getRainfall = () => getCities().then(data => data.map(r => ({ city: r.city, rainfall: r.total_rainfall })));
export const getHumidity = () => getCities().then(data => data.map(r => ({ city: r.city, humidity: r.avg_humidity })));
export const getWind = () => getCities().then(data => data.map(r => ({ city: r.city, avg_wind_speed: r.avg_wind_speed, max_wind_speed: r.max_wind_speed })));

// Phase 3 Historical Analytics Endpoints
const buildQueryParams = (params = {}) => {
  const query = new URLSearchParams();
  if (params.city && params.city !== 'All') query.append('city', params.city);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  const qStr = query.toString();
  return qStr ? `?${qStr}` : '';
};

export const getHistoricalRecords = (params = {}) => {
  const url = `/api/historical/records${buildQueryParams(params)}`;
  return fetchWithDeduplication(url);
};

export const getHistoricalDailyTrends = (params = {}) => {
  const url = `/api/historical/daily-trends${buildQueryParams(params)}`;
  return fetchWithDeduplication(url);
};

export const getHistoricalConditions = () => fetchWithDeduplication('/api/historical/conditions');
export const getHistoricalExtremes = () => fetchWithDeduplication('/api/historical/extremes');

export const getHistoricalExportUrl = (type = 'daily', params = {}) => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const query = new URLSearchParams();
  query.append('type', type);
  if (params.city && params.city !== 'All') query.append('city', params.city);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  return `${base}/api/historical/export?${query.toString()}`;
};

// Phase 4 Intelligent Weather Alerts Endpoints
export const getAlerts = (params = {}) => {
  const query = new URLSearchParams();
  if (params.city && params.city !== 'All') query.append('city', params.city);
  if (params.severity && params.severity !== 'All') query.append('severity', params.severity);
  if (params.rule_id && params.rule_id !== 'All') query.append('rule_id', params.rule_id);
  if (params.limit) query.append('limit', params.limit);
  const qStr = query.toString();
  return api.get(`/api/alerts${qStr ? `?${qStr}` : ''}`).then(res => res.data);
};

export const getAlertsHistory = (params = {}) => {
  const query = new URLSearchParams();
  if (params.city && params.city !== 'All') query.append('city', params.city);
  if (params.severity && params.severity !== 'All') query.append('severity', params.severity);
  if (params.page) query.append('page', params.page);
  if (params.pageSize) query.append('page_size', params.pageSize);
  const qStr = query.toString();
  return api.get(`/api/alerts/history${qStr ? `?${qStr}` : ''}`).then(res => res.data);
};

export const getAlertThresholds = () => api.get('/api/alerts/thresholds').then(res => res.data);
export const getAlertsSummary = () => api.get('/api/alerts/summary').then(res => res.data);

export const acknowledgeAlert = (alertId, note = '') => {
  return api.post('/api/alerts/acknowledge', { alert_id: alertId, note }).then(res => res.data);
};

// Phase 5 Interactive Weather Map & Data Quality Endpoints
export const getMapCities = (forceFresh = false) => {
  return api.get(`/api/map/cities${forceFresh ? '?force_fresh=true' : ''}`).then(res => res.data);
};

export const getQualitySummary = () => api.get('/api/quality/summary').then(res => res.data);
export const getQualityMetrics = () => api.get('/api/quality/metrics').then(res => res.data);
export const getQualityPipeline = () => api.get('/api/quality/pipeline').then(res => res.data);

export const getQualityIssues = (params = {}) => {
  const query = new URLSearchParams();
  if (params.severity && params.severity !== 'All') query.append('severity', params.severity);
  if (params.city && params.city !== 'All') query.append('city', params.city);
  if (params.rule && params.rule !== 'All') query.append('rule', params.rule);
  if (params.page) query.append('page', params.page);
  if (params.pageSize) query.append('page_size', params.pageSize);
  const qStr = query.toString();
  return api.get(`/api/quality/issues${qStr ? `?${qStr}` : ''}`).then(res => res.data);
};

export default api;
