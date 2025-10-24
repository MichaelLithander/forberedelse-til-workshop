// Halden coordinates
const LAT = 59.1310;
const LON = 11.3876;
const API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';

const el = {
  loading: document.getElementById('loading'),
  content: document.getElementById('content'),
  error: document.getElementById('error'),
  temp: document.getElementById('temp'),
  wind: document.getElementById('wind'),
  precip: document.getElementById('precip'),
  pressure: document.getElementById('pressure'),
  symbol: document.getElementById('symbol'),
  time: document.getElementById('time'),
  refresh: document.getElementById('refresh')
};

el.forecastRow = document.getElementById('forecast-row');
el.hourlySection = document.getElementById('hourly-forecast');

async function fetchHalden() {
  showLoading(true);
  showError(null);
  try {
    const url = `${API_BASE}?lat=${LAT}&lon=${LON}`;

    // Note: Browsers disallow setting the User-Agent header. If you run into issues
    // (CORS or API rejecting requests), run a server-side proxy that adds a proper
    // User-Agent header per met.no policy. See README.md.
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const item = chooseRelevantTimeseries(data);
    if (!item) throw new Error('Fant ingen tidsserie i responsen');

    // instant details
    const inst = item.data && item.data.instant && item.data.instant.details;
    const next1 = item.data && item.data.next_1_hours && item.data.next_1_hours.summary;
    const next6 = item.data && item.data.next_6_hours && item.data.next_6_hours.summary;

    el.temp.textContent = inst && (inst.air_temperature ?? '—');
    el.wind.textContent = inst && (inst.wind_speed ?? '—');
    el.pressure.textContent = inst && (inst.air_pressure_at_sea_level ?? '—');

    // precipitation for next 1h if available
    const precipValue = (item.data && item.data.next_1_hours && item.data.next_1_hours.details && (item.data.next_1_hours.details.precipitation_amount ?? null));
    el.precip.textContent = precipValue ?? '—';

    // symbol code
    const symbolCode = (next1 && next1.symbol_code) || (next6 && next6.symbol_code) || '—';
    el.symbol.textContent = symbolCode.replace('_', ' ');

    el.time.textContent = new Date(item.time).toLocaleString('nb-NO');

    showContent(true);

    // build hourly forecast (next ~12 points)
    buildHourlyForecast(data);
  } catch (err) {
    showError(err.message || String(err));
    showContent(false);
  } finally {
    showLoading(false);
  }
}

function chooseRelevantTimeseries(data) {
  // data.properties.timeseries is usually present. We'll pick the first entry whose
  // time is >= now, or fall back to the first element.
  const ts = data && data.properties && data.properties.timeseries;
  if (!Array.isArray(ts) || ts.length === 0) return null;
  const now = new Date();
  // find element with time >= now (first future/now point)
  for (const entry of ts) {
    const t = new Date(entry.time);
    if (t >= now) return entry;
  }
  // fallback: last known
  return ts[0];
}

function getUpcomingTimeseries(data, maxPoints = 12) {
  const ts = data && data.properties && data.properties.timeseries;
  if (!Array.isArray(ts) || ts.length === 0) return [];
  const now = new Date();
  // collect first maxPoints entries with time >= now
  const result = [];
  for (const entry of ts) {
    const t = new Date(entry.time);
    if (t >= now) {
      result.push(entry);
      if (result.length >= maxPoints) break;
    }
  }
  // if we didn't find enough future points, pad with earliest entries
  if (result.length < maxPoints) {
    for (const entry of ts) {
      if (result.length >= maxPoints) break;
      // avoid duplicates
      if (!result.includes(entry)) result.push(entry);
    }
  }
  return result.slice(0, maxPoints);
}

function symbolToEmoji(symbolCode) {
  if (!symbolCode || typeof symbolCode !== 'string') return '❓';
  // simplify to base code (e.g. partlycloudy_day -> partlycloudy)
  const base = symbolCode.split('_')[0];
  const map = {
    clearsky: '☀️',
    fair: '🌤️',
    partlycloudy: '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    lightrain: '🌦️',
    rainshowers: '🌦️',
    sleet: '🌨️',
    snow: '❄️',
    fog: '🌫️',
    drizzle: '🌦️',
    showers: '🌦️'
  };
  return map[base] || '🌈';
}

function buildHourlyForecast(data) {
  const points = getUpcomingTimeseries(data, 12);
  if (!points || points.length === 0) {
    el.hourlySection.classList.add('hidden');
    return;
  }
  el.forecastRow.innerHTML = '';
  for (const p of points) {
    const t = new Date(p.time);
    const inst = p.data && p.data.instant && p.data.instant.details;
    const next1 = p.data && p.data.next_1_hours && p.data.next_1_hours.summary;
    const precip = p.data && p.data.next_1_hours && p.data.next_1_hours.details && (p.data.next_1_hours.details.precipitation_amount ?? null);
    const temp = inst && (inst.air_temperature ?? '—');
    const symbol = (next1 && next1.symbol_code) || '—';

    const card = document.createElement('div');
    card.className = 'hour-card';
    card.innerHTML = `
      <div class="time">${t.toLocaleTimeString('nb-NO', {hour: '2-digit', minute: '2-digit'})}</div>
      <div class="icon">${symbolToEmoji(symbol)}</div>
      <div class="t">${temp}°</div>
      <div class="p">${precip !== null ? precip + ' mm' : ''}</div>
    `;
    el.forecastRow.appendChild(card);
  }
  el.hourlySection.classList.remove('hidden');
}

function showLoading(yes) {
  el.loading.style.display = yes ? 'block' : 'none';
}
function showContent(yes) {
  el.content.style.display = yes ? 'block' : 'none';
}
function showError(msg) {
  if (!msg) {
    el.error.style.display = 'none';
    el.error.textContent = '';
  } else {
    el.error.style.display = 'block';
    el.error.textContent = 'Feil: ' + msg;
  }
}

el.refresh.addEventListener('click', fetchHalden);

// initial load
fetchHalden();