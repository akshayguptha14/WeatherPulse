/**
 * Open-Meteo Geocoding & Weather Observation Service.
 * Provides on-demand worldwide location search and real-time weather retrieval.
 * 
 * Features:
 * - High-priority Indian States and Union Territories lookup dataset (all 36 entities).
 * - Exact and prefix matching for Indian states with representative weather station coordinates.
 * - Decoupled from the continuous Big Data streaming pipeline (Kafka/Spark/HDFS).
 * - Implements client-side in-memory caching and backend proxy with direct API fallback.
 */

const WMO_CONDITIONS = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  56: "Light Freezing Drizzle",
  57: "Dense Freezing Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  66: "Light Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Slight Snow Fall",
  73: "Moderate Snow Fall",
  75: "Heavy Snow Fall",
  77: "Snow Grains",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  85: "Slight Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Slight Hail",
  99: "Thunderstorm with Heavy Hail"
};

// Complete, verified dataset of all 28 Indian States and 8 Union Territories
// with representative capital/metropolitan coordinates for on-demand weather retrieval.
export const INDIAN_STATES_AND_UTS = [
  // 28 States
  {
    name: "Andhra Pradesh",
    type: "State",
    representative_city: "Amaravati",
    latitude: 16.5131,
    longitude: 80.5165,
    elevation: 20,
    aliases: ["andhra pradesh", "andhra", "ap"]
  },
  {
    name: "Arunachal Pradesh",
    type: "State",
    representative_city: "Itanagar",
    latitude: 27.0844,
    longitude: 93.6053,
    elevation: 320,
    aliases: ["arunachal pradesh", "arunachal", "ar"]
  },
  {
    name: "Assam",
    type: "State",
    representative_city: "Guwahati",
    latitude: 26.1445,
    longitude: 91.7362,
    elevation: 55,
    aliases: ["assam", "as"]
  },
  {
    name: "Bihar",
    type: "State",
    representative_city: "Patna",
    latitude: 25.5941,
    longitude: 85.1376,
    elevation: 53,
    aliases: ["bihar", "br"]
  },
  {
    name: "Chhattisgarh",
    type: "State",
    representative_city: "Raipur",
    latitude: 21.2514,
    longitude: 81.6296,
    elevation: 298,
    aliases: ["chhattisgarh", "chattisgarh", "cg"]
  },
  {
    name: "Goa",
    type: "State",
    representative_city: "Panaji",
    latitude: 15.4909,
    longitude: 73.8278,
    elevation: 7,
    aliases: ["goa", "ga"]
  },
  {
    name: "Gujarat",
    type: "State",
    representative_city: "Gandhinagar",
    latitude: 23.2156,
    longitude: 72.6369,
    elevation: 81,
    aliases: ["gujarat", "gj"]
  },
  {
    name: "Haryana",
    type: "State",
    representative_city: "Chandigarh",
    latitude: 30.7333,
    longitude: 76.7794,
    elevation: 321,
    aliases: ["haryana", "hr"]
  },
  {
    name: "Himachal Pradesh",
    type: "State",
    representative_city: "Shimla",
    latitude: 31.1048,
    longitude: 77.1734,
    elevation: 2206,
    aliases: ["himachal pradesh", "himachal", "hp"]
  },
  {
    name: "Jharkhand",
    type: "State",
    representative_city: "Ranchi",
    latitude: 23.3441,
    longitude: 85.3096,
    elevation: 651,
    aliases: ["jharkhand", "jh"]
  },
  {
    name: "Karnataka",
    type: "State",
    representative_city: "Bengaluru",
    latitude: 12.9716,
    longitude: 77.5946,
    elevation: 920,
    aliases: ["karnataka", "karnata", "ka", "bangalore", "bengaluru"]
  },
  {
    name: "Kerala",
    type: "State",
    representative_city: "Thiruvananthapuram",
    latitude: 8.5241,
    longitude: 76.9366,
    elevation: 10,
    aliases: ["kerala", "kl", "trivandrum"]
  },
  {
    name: "Madhya Pradesh",
    type: "State",
    representative_city: "Bhopal",
    latitude: 23.2599,
    longitude: 77.4126,
    elevation: 527,
    aliases: ["madhya pradesh", "mp"]
  },
  {
    name: "Maharashtra",
    type: "State",
    representative_city: "Mumbai",
    latitude: 19.0760,
    longitude: 72.8777,
    elevation: 14,
    aliases: ["maharashtra", "mh", "bombay"]
  },
  {
    name: "Manipur",
    type: "State",
    representative_city: "Imphal",
    latitude: 24.8170,
    longitude: 93.9368,
    elevation: 786,
    aliases: ["manipur", "mn"]
  },
  {
    name: "Meghalaya",
    type: "State",
    representative_city: "Shillong",
    latitude: 25.5788,
    longitude: 91.8933,
    elevation: 1525,
    aliases: ["meghalaya", "ml"]
  },
  {
    name: "Mizoram",
    type: "State",
    representative_city: "Aizawl",
    latitude: 23.7271,
    longitude: 92.7176,
    elevation: 1132,
    aliases: ["mizoram", "mz"]
  },
  {
    name: "Nagaland",
    type: "State",
    representative_city: "Kohima",
    latitude: 25.6751,
    longitude: 94.1086,
    elevation: 1444,
    aliases: ["nagaland", "nl"]
  },
  {
    name: "Odisha",
    type: "State",
    representative_city: "Bhubaneswar",
    latitude: 20.2961,
    longitude: 85.8245,
    elevation: 45,
    aliases: ["odisha", "orissa", "or", "od"]
  },
  {
    name: "Punjab",
    type: "State",
    representative_city: "Chandigarh",
    latitude: 30.7333,
    longitude: 76.7794,
    elevation: 321,
    aliases: ["punjab", "pb"]
  },
  {
    name: "Rajasthan",
    type: "State",
    representative_city: "Jaipur",
    latitude: 26.9124,
    longitude: 75.7873,
    elevation: 431,
    aliases: ["rajasthan", "rj"]
  },
  {
    name: "Sikkim",
    type: "State",
    representative_city: "Gangtok",
    latitude: 27.3389,
    longitude: 88.6065,
    elevation: 1650,
    aliases: ["sikkim", "sk"]
  },
  {
    name: "Tamil Nadu",
    type: "State",
    representative_city: "Chennai",
    latitude: 13.0827,
    longitude: 80.2707,
    elevation: 6,
    aliases: ["tamil nadu", "tamilnadu", "tn", "madras"]
  },
  {
    name: "Telangana",
    type: "State",
    representative_city: "Hyderabad",
    latitude: 17.3850,
    longitude: 78.4867,
    elevation: 542,
    aliases: ["telangana", "tg", "ts"]
  },
  {
    name: "Tripura",
    type: "State",
    representative_city: "Agartala",
    latitude: 23.8315,
    longitude: 91.2868,
    elevation: 15,
    aliases: ["tripura", "tr"]
  },
  {
    name: "Uttar Pradesh",
    type: "State",
    representative_city: "Lucknow",
    latitude: 26.8467,
    longitude: 80.9462,
    elevation: 123,
    aliases: ["uttar pradesh", "up"]
  },
  {
    name: "Uttarakhand",
    type: "State",
    representative_city: "Dehradun",
    latitude: 30.3165,
    longitude: 78.0322,
    elevation: 435,
    aliases: ["uttarakhand", "uttaranchal", "uk"]
  },
  {
    name: "West Bengal",
    type: "State",
    representative_city: "Kolkata",
    latitude: 22.5726,
    longitude: 88.3639,
    elevation: 9,
    aliases: ["west bengal", "wb", "calcutta"]
  },
  // 8 Union Territories
  {
    name: "Andaman and Nicobar Islands",
    type: "Union Territory",
    representative_city: "Port Blair",
    latitude: 11.6234,
    longitude: 92.7265,
    elevation: 16,
    aliases: ["andaman and nicobar", "andaman", "nicobar", "an"]
  },
  {
    name: "Chandigarh",
    type: "Union Territory",
    representative_city: "Chandigarh",
    latitude: 30.7333,
    longitude: 76.7794,
    elevation: 321,
    aliases: ["chandigarh", "ch"]
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    type: "Union Territory",
    representative_city: "Daman",
    latitude: 20.4283,
    longitude: 72.8397,
    elevation: 10,
    aliases: ["daman and diu", "dadra and nagar haveli", "daman", "diu", "dd", "dn"]
  },
  {
    name: "Delhi",
    type: "Union Territory",
    representative_city: "New Delhi",
    latitude: 28.6139,
    longitude: 77.2090,
    elevation: 216,
    aliases: ["delhi", "new delhi", "nct", "dl"]
  },
  {
    name: "Jammu and Kashmir",
    type: "Union Territory",
    representative_city: "Srinagar",
    latitude: 34.0837,
    longitude: 74.7973,
    elevation: 1585,
    aliases: ["jammu and kashmir", "jammu", "kashmir", "jk"]
  },
  {
    name: "Ladakh",
    type: "Union Territory",
    representative_city: "Leh",
    latitude: 34.1526,
    longitude: 77.5771,
    elevation: 3500,
    aliases: ["ladakh", "leh", "la"]
  },
  {
    name: "Lakshadweep",
    type: "Union Territory",
    representative_city: "Kavaratti",
    latitude: 10.5667,
    longitude: 72.6417,
    elevation: 2,
    aliases: ["lakshadweep", "ld"]
  },
  {
    name: "Puducherry",
    type: "Union Territory",
    representative_city: "Puducherry",
    latitude: 11.9416,
    longitude: 79.8083,
    elevation: 3,
    aliases: ["puducherry", "pondicherry", "py"]
  }
];

/**
 * Intelligent matching function for Indian States and UTs
 */
export function matchIndianStates(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const scored = [];
  INDIAN_STATES_AND_UTS.forEach(state => {
    const nameLower = state.name.toLowerCase();
    const aliases = (state.aliases || []).map(a => a.toLowerCase());

    let score = 0;
    if (q === nameLower) {
      score = 100; // Exact state name
    } else if (aliases.includes(q)) {
      score = 95; // Exact alias match
    } else if (nameLower.startsWith(q)) {
      score = 90; // State name prefix (e.g. "karnata" -> "karnataka")
    } else if (aliases.some(a => a.startsWith(q)) && q.length >= 3) {
      score = 85; // Alias prefix
    } else if (q.length >= 4 && nameLower.includes(q)) {
      score = 70; // Substring in name
    } else if (q.length >= 4 && aliases.some(a => a.includes(q))) {
      score = 65; // Substring in alias
    }

    if (score > 0) {
      scored.push({ score, state });
    }
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map(({ score, state }) => {
    const slug = state.name.toLowerCase().replace(/\s+/g, '-');
    return {
      id: `in-state-${slug}`,
      name: state.name,
      admin1: state.name,
      country: "India",
      country_code: "IN",
      latitude: state.latitude,
      longitude: state.longitude,
      elevation: state.elevation || 0,
      timezone: "Asia/Kolkata",
      display_name: `${state.name}, India`,
      is_indian_state: true,
      isIndianState: true,
      location_type: state.type,
      representative_city: state.representative_city,
      representative_weather_label: `Representative Weather — ${state.representative_city}`,
      _match_score: score
    };
  });
}

// In-memory caches to prevent duplicate rapid requests
const queryCache = new Map();
const weatherCache = new Map();

/**
 * Searches worldwide locations with state/country disambiguation.
 * Prioritizes Indian states/UTs when matching queries appear.
 * @param {string} query - City, region, or location name
 * @param {number} count - Max results (default 8)
 * @returns {Promise<Array>} Array of disambiguated location suggestions
 */
export async function searchLocations(query, count = 8) {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = `${trimmed.toLowerCase()}_${count}`;
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }

  // 1. Try internal backend proxy first (which now has state-aware matching)
  try {
    const res = await fetch(`/api/search/locations?q=${encodeURIComponent(trimmed)}&count=${count}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.results) && data.results.length > 0) {
        queryCache.set(cacheKey, data.results);
        return data.results;
      }
    }
  } catch (err) {
    console.warn("Backend search proxy unreachable, using direct state lookup & Open-Meteo Geocoding:", err);
  }

  // 2. Direct Fallback: Match Indian states first + Open-Meteo Geocoding API
  const stateMatches = matchIndianStates(trimmed);
  const hasStrongStateMatch = stateMatches.length > 0 && stateMatches[0]._match_score >= 85;

  let openMeteoResults = [];
  try {
    const directUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=${count + 4}&language=en&format=json`;
    const res = await fetch(directUrl);
    if (res.ok) {
      const data = await res.json();
      const raw = data.results || [];
      
      openMeteoResults = raw
        .filter(r => {
          // If user searched for an Indian state (e.g. Karnataka), filter out obscure phonetic hamlets in MP/Jharkhand
          if (hasStrongStateMatch) {
            const topState = stateMatches[0].name.toLowerCase();
            const cleanName = (r.name || '').toLowerCase().replace(/ā/g, 'a').replace(/ī/g, 'i');
            if (cleanName.startsWith('karnat') && (r.admin1 || '').toLowerCase() !== topState) {
              return false;
            }
          }
          return true;
        })
        .map(r => {
          const parts = [r.name];
          if (r.admin1 && r.admin1.toLowerCase() !== r.name.toLowerCase()) {
            parts.push(r.admin1);
          }
          if (r.country) {
            parts.push(r.country);
          }
          return {
            id: r.id,
            name: r.name,
            admin1: r.admin1 || '',
            country: r.country || '',
            country_code: r.country_code || '',
            latitude: r.latitude,
            longitude: r.longitude,
            elevation: r.elevation || 0,
            timezone: r.timezone || 'UTC',
            display_name: parts.join(', '),
            is_indian_state: false,
            isIndianState: false
          };
        });
    }
  } catch (err) {
    console.warn("Direct Open-Meteo Geocoding failed:", err);
  }

  // Combine: Indian states first, then Open-Meteo global results
  const combined = [];
  const seenKeys = new Set();

  for (const s of stateMatches) {
    const key = `${s.name.toLowerCase()}_${s.country.toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combined.push(s);
    }
  }

  for (const r of openMeteoResults) {
    const key = `${r.name.toLowerCase()}_${(r.admin1 || '').toLowerCase()}_${r.country.toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combined.push(r);
    }
  }

  const finalResults = combined.slice(0, count);
  queryCache.set(cacheKey, finalResults);
  return finalResults;
}

/**
 * Fetches current weather observations for given coordinates.
 * Handles both worldwide city coordinates and Indian state representative coordinates.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {object} locationMeta - Optional location metadata for enriched labeling
 * @returns {Promise<object>} Formatted cityNode object matching WeatherPulse schema
 */
export async function fetchCurrentWeather(lat, lon, locationMeta = {}) {
  const roundedLat = Number(Number(lat).toFixed(3));
  const roundedLon = Number(Number(lon).toFixed(3));
  const cacheKey = `${roundedLat}_${roundedLon}`;

  let liveData = null;
  let elevation = locationMeta.elevation || 0;
  let timezoneStr = locationMeta.timezone || 'UTC';

  // 1. Try backend proxy first
  try {
    const res = await fetch(`/api/search/weather?lat=${roundedLat}&lon=${roundedLon}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success' && data.live) {
        liveData = data.live;
        elevation = data.elevation || elevation;
        timezoneStr = data.timezone || timezoneStr;
      }
    }
  } catch (err) {
    console.warn("Backend weather proxy unreachable, falling back to direct Open-Meteo API:", err);
  }

  // 2. Direct fallback to Open-Meteo Current Forecast API
  if (!liveData) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo Forecast returned status ${res.status}`);
      const data = await res.json();
      const current = data.current || {};
      const code = current.weather_code || 0;

      elevation = data.elevation || elevation;
      timezoneStr = data.timezone || timezoneStr;

      liveData = {
        temperature: current.temperature_2m ?? null,
        apparent_temperature: current.apparent_temperature ?? null,
        humidity: current.relative_humidity_2m ?? null,
        precipitation: current.precipitation ?? 0.0,
        rainfall: current.rain ?? 0.0,
        wind_speed: current.wind_speed_10m ?? null,
        wind_direction: current.wind_direction_10m ?? null,
        pressure: current.surface_pressure ?? null,
        weather_code: code,
        weather_condition: WMO_CONDITIONS[code] || "Clear Sky",
        source_timestamp: current.time || new Date().toISOString()
      };
    } catch (err) {
      console.error("Open-Meteo Current Weather fetch error:", err);
      throw err;
    }
  }

  // Determine if this is an Indian State/UT query
  const isState = Boolean(locationMeta.is_indian_state || locationMeta.isIndianState);
  const locationType = locationMeta.location_type || (isState ? 'State' : 'City');
  const representativeCity = locationMeta.representative_city || null;
  const representativeLabel = locationMeta.representative_weather_label || (representativeCity ? `Representative Weather — ${representativeCity}` : null);

  const cityName = locationMeta.name || `Location (${roundedLat}, ${roundedLon})`;
  const stateName = locationMeta.admin1 || locationMeta.country || 'Global Region';

  const node = {
    city: cityName,
    state: stateName,
    country: locationMeta.country || (isState ? 'India' : ''),
    country_code: locationMeta.country_code || (isState ? 'IN' : ''),
    display_name: locationMeta.display_name || `${cityName}, ${locationMeta.country || ''}`,
    coordinates: { lat: roundedLat, lon: roundedLon },
    elevation_meters: Math.round(elevation),
    climate_zone: isState 
      ? `State Representative Station (${representativeCity || cityName})`
      : `Global Observation (${timezoneStr})`,
    isGlobalSearch: true,
    isIndianState: isState,
    location_type: locationType,
    representative_city: representativeCity,
    representative_weather_label: representativeLabel,
    live: liveData,
    baseline: {
      avg_temperature: null,
      avg_humidity: null,
      nominal_surface_pressure: liveData.pressure ? Math.round(liveData.pressure) : 1013
    },
    variance: {
      temperature_difference: null,
      humidity_difference: null,
      pressure_difference: null
    },
    alert_status: {
      highest_severity: 'Normal',
      active_alert_count: 0,
      alerts: []
    },
    provenance: {
      source: 'Open-Meteo On-Demand API',
      pipeline: 'Direct HTTPS Query',
      note: isState 
        ? `Representative capital station observation (${representativeCity || cityName}). Decoupled from Kafka/HDFS.`
        : 'On-Demand Ephemeral Query (Decoupled from Kafka/HDFS)'
    }
  };

  weatherCache.set(cacheKey, node);
  return node;
}
