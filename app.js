// Plane Spotting & Airport Operations Logical Engine
// Built for AeroSpot SPA Dashboard

// Global State
let windMode = 'auto'; // 'auto' or 'manual'
let windDirection = 240; // Default Westerly (degrees)
let windSpeed = 10; // Default (knots)
let localTime = new Date();
let weatherLoading = true;
let weatherDescription = 'Loading...';
let timeMode = 'live'; // 'live' or 'custom'
let customTime = null; // Simulated Date object

let hourlyWeatherData = null; // Cache for simulated day hourly weather
let fetchedDateStr = ''; // Cache date key (YYYY-MM-DD)

// Coordinates for API & Reference (London central coordinates used for global wind)
const LONDON_LAT = 51.4700; // Heathrow coordinates for weather sensitivity
const LONDON_LON = -0.4543;

// Helper to format date to YYYY-MM-DD
function formatDateToYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Heathrow schedule base date (Monday, Jan 5, 2026 is week 0)
const LHR_BASE_DATE = new Date('2026-01-05T00:00:00Z');

// Spotting Locations Database
const SPOTTING_SPOTS = [
  {
    id: 'myrtle_ave',
    name: 'Myrtle Avenue',
    airport: 'Heathrow (LHR)',
    lat: 51.4682,
    lon: -0.4285,
    mapX: 200, // SVG coordinates
    mapY: 260,
    config: 'Westerly Operations (Runway 27L Arrivals)',
    access: 'Under a 10-minute walk from Hatton Cross Underground Station (Piccadilly Line).',
    tips: 'Extremely close-up low-angle shots. Wide-angle lens (24-70mm) is a must. A household lawn is nearby; please respect residents.',
    description: 'Arguably the most famous plane spotting spot in the world. Aircraft on short final to runway 27L pass less than 100 feet above your head. Incredible engine roar and visual speed impact.',
    image: 'myrtle_avenue.jpg'
  },
  {
    id: 't5_mound',
    name: 'The Terminal 5 Mound',
    airport: 'Heathrow (LHR)',
    lat: 51.4705,
    lon: -0.4901,
    mapX: 95,
    mapY: 235,
    config: 'Easterly Operations (Runway 09L Arrivals)',
    access: 'Walk west from Heathrow Terminal 5 bus station, located near the perimeter fence.',
    tips: 'Best for afternoon light. A telephoto lens (100-400mm) helps isolate aircraft touching down.',
    description: 'A raised grassy vantage point providing clean sightlines of aircraft approaching Heathrow from the West when Easterly operations are active. Ideal during warm east-wind summer days.',
    image: 'myrtle_avenue.jpg' // Reuse or placeholder setup
  },
  {
    id: 'lowfield_heath',
    name: 'Lowfield Heath Rec Ground',
    airport: 'Gatwick (LGW)',
    lat: 51.1444,
    lon: -0.1788,
    mapX: 430,
    mapY: 410,
    config: 'Westerly Operations (Runway 26L Arrivals)',
    access: 'Located south of Gatwick Airport. Take the Metrobus 100 to Lowfield Heath and walk 10 minutes.',
    tips: 'Great for touchdowns and side-on taxiway shots. Portable step ladder is helpful for shooting over the inner fence.',
    description: 'A spacious grassy recreation ground located close to the touchdown zone of Gatwick’s main runway 26L. Offers an excellent panning angle for landing jets.',
    image: 'gatwick_field.jpg'
  },
  {
    id: 'lowfield_road',
    name: 'Lowfield Heath Road',
    airport: 'Gatwick (LGW)',
    lat: 51.1468,
    lon: -0.1905,
    mapX: 220,
    mapY: 140,
    config: 'Westerly Operations (Runway 26L Arrivals & Departures)',
    access: 'Located directly south of Gatwick Airport. Take the Metrobus 100 to the corner of Lowfield Heath Road and walk along the perimeter fence.',
    tips: 'Provides excellent side-on views of taxiing aircraft and takeoffs/landings. A telephoto lens (70-300mm) is recommended.',
    description: 'A popular roadside vantage point right along the southern perimeter fence of Gatwick Airport. Perfect for capturing taxiing aircraft, takeoffs, and landing rolls.',
    image: 'gatwick_field.jpg'
  },
  {
    id: 'lgw_crash_gate',
    name: '08R Crash Gate / Charlwood',
    airport: 'Gatwick (LGW)',
    lat: 51.1578,
    lon: -0.2155,
    mapX: 320,
    mapY: 395,
    config: 'Easterly Operations (Runway 08R Arrivals & Taxi)',
    access: 'Park in the layby opposite "The Flight" pub on Charlwood Road and walk along the public footpath.',
    tips: 'Perfect for morning shots. Safe, designated footpaths exist along the runway approach lighting columns.',
    description: 'Positioned right at the western end of Gatwick runway 08R. During Easterly operations, you get stunning views of incoming arrivals over the fields and aircraft lining up at the holding point.',
    image: 'gatwick_field.jpg'
  },
  {
    id: 'royal_albert_dock',
    name: 'Royal Albert Dock (South Side)',
    airport: 'London City (LCY)',
    lat: 51.5036,
    lon: 0.0545,
    mapX: 635,
    mapY: 222,
    config: 'Westerly Operations (Runway 27 Arrivals)',
    access: 'Adjacent to Gallions Reach DLR Station. Use the dockside pedestrian pathway.',
    tips: 'There are no perimeter fences here! You have an completely unobstructed view across the dock waters directly to the runway.',
    description: 'Located directly across the water from London City Airport. Planes land past Canary Wharf and touch down right in front of you. Exceptional water reflections and clean view.',
    image: 'royal_docks.jpg'
  },
  {
    id: 'connaught_bridge',
    name: 'Steve Redgrave / Connaught Bridge',
    airport: 'London City (LCY)',
    lat: 51.5052,
    lon: 0.0261,
    mapX: 525,
    mapY: 208,
    config: 'Easterly Operations (Runway 09 Arrivals)',
    access: 'Short walk from Pontoon Dock DLR Station. Walkways are available on both sides of the bridge.',
    tips: 'Great for seeing the steep 5.5° descent profile of aircraft flying past Canary Wharf skyscrapers.',
    description: 'A bridge that crosses the docks immediately west of the runway. Offers a dramatic head-on look at aircraft descending steeply over the dock barrier toward runway 09.',
    image: 'royal_docks.jpg'
  }
];

// Initialize the Application
function initApp() {
  initLucide();
  
  // Render the initial interactive SVG map first to populate DOM elements
  renderMap();
  
  // Set up compass mouse drag interaction
  initCompassDrag();
  
  // Set up SPA routing
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
  
  // Initialize time and start periodic updates
  updateTime();
  setInterval(updateTime, 1000);
  
  // Load initial weather
  fetchLiveWeather();
  setInterval(fetchLiveWeather, 300000); // 5 mins update
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Clock widget updater
function updateTime() {
  if (timeMode === 'live') {
    localTime = new Date();
  } else if (customTime) {
    localTime = new Date(customTime);
  }
  
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  let timeString = localTime.toLocaleTimeString('en-GB', timeOptions);
  
  const timeLabel = document.querySelector('#time-display .widget-label');
  const timeWidget = document.getElementById('time-display');
  const resetBtn = document.getElementById('btn-reset-time');
  
  if (timeMode === 'custom') {
    timeString += ' (SIM)';
    if (timeLabel) timeLabel.textContent = 'Simulated Time';
    if (timeWidget) timeWidget.classList.add('simulated-active');
    if (resetBtn) resetBtn.classList.remove('hidden');
  } else {
    if (timeLabel) timeLabel.textContent = 'Local Time';
    if (timeWidget) timeWidget.classList.remove('simulated-active');
    if (resetBtn) resetBtn.classList.add('hidden');
  }
  
  document.getElementById('local-time-value').textContent = timeString;
  
  // Re-run calculations only if simulation state changes
  checkAndRunOperations();
}

// Time Simulation Handlers
function setTimeMode(mode) {
  timeMode = mode;
  
  const liveBtns = document.querySelectorAll('.time-live-btn');
  const customBtns = document.querySelectorAll('.time-custom-btn');
  const inputs = document.querySelectorAll('.custom-time-input');
  
  if (mode === 'live') {
    liveBtns.forEach(btn => btn.classList.add('active'));
    customBtns.forEach(btn => btn.classList.remove('active'));
    inputs.forEach(input => {
      input.disabled = true;
      input.value = '';
    });
    
    localTime = new Date();
    customTime = null;
  } else {
    liveBtns.forEach(btn => btn.classList.remove('active'));
    customBtns.forEach(btn => btn.classList.add('active'));
    inputs.forEach(input => {
      input.disabled = false;
      if (!customTime) {
        customTime = new Date(localTime);
      }
      const tzoffset = customTime.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(customTime - tzoffset)).toISOString().slice(0, 16);
      input.value = localISOTime;
    });
  }
  
  updateTime();
  fetchLiveWeather();
}

function updateCustomTime(datetimeStr) {
  if (!datetimeStr) return;
  customTime = new Date(datetimeStr);
  
  const inputs = document.querySelectorAll('.custom-time-input');
  inputs.forEach(input => {
    input.value = datetimeStr;
  });
  
  updateTime();
  fetchLiveWeather();
}

// SPA Routing Logic
function handleRoute() {
  const hash = window.location.hash || '#/';
  
  // Hide all page views
  const pageViews = document.querySelectorAll('.page-view');
  pageViews.forEach(view => view.classList.add('hidden'));
  
  if (hash === '#/') {
    document.getElementById('view-dashboard').classList.remove('hidden');
  } else if (hash === '#/lhr') {
    document.getElementById('view-lhr').classList.remove('hidden');
    renderAirportDetail('LHR', true);
  } else if (hash === '#/lgw') {
    document.getElementById('view-lgw').classList.remove('hidden');
    renderAirportDetail('LGW', true);
  } else if (hash === '#/lcy') {
    document.getElementById('view-lcy').classList.remove('hidden');
    renderAirportDetail('LCY', true);
  }
  
  // Update sidebar spotter tips and time simulator based on page view
  const sidebarTips = document.getElementById('sidebar-spotting-tips');
  const sidebarTimeSim = document.getElementById('sidebar-time-simulator');
  
  if (sidebarTimeSim) {
    sidebarTimeSim.classList.remove('hidden');
  }
  
  if (sidebarTips) {
    if (hash === '#/') {
      sidebarTips.classList.add('hidden');
    } else {
      sidebarTips.classList.remove('hidden');
      
      const tipLhr = document.getElementById('tip-lhr');
      const tipLgw = document.getElementById('tip-lgw');
      const tipLcy = document.getElementById('tip-lcy');
      
      if (tipLhr) tipLhr.classList.toggle('hidden', hash !== '#/lhr');
      if (tipLgw) tipLgw.classList.toggle('hidden', hash !== '#/lgw');
      if (tipLcy) tipLcy.classList.toggle('hidden', hash !== '#/lcy');
    }
  }

  
  initLucide();
}

// Track last rendered configuration to avoid DOM thrashing
let lastRenderedConfig = {
  LHR: '',
  LGW: '',
  LCY: ''
};

// Render dynamic spotting list for individual airport detail views
function renderAirportDetail(code, force = false) {
  let filterText = '';
  let listContainerId = '';
  if (code === 'LHR') {
    filterText = 'Heathrow';
    listContainerId = 'lhr-spotting-list';
  } else if (code === 'LGW') {
    filterText = 'Gatwick';
    listContainerId = 'lgw-spotting-list';
  } else if (code === 'LCY') {
    filterText = 'City';
    listContainerId = 'lcy-spotting-list';
  }
  
  const container = document.getElementById(listContainerId);
  if (!container) return;
  
  const spots = SPOTTING_SPOTS.filter(s => s.airport.includes(filterText));
  
  const lhrActiveArr = document.getElementById('lhr-arrivals-runway') ? document.getElementById('lhr-arrivals-runway').textContent.trim() : '';
  const lgwActiveArr = document.getElementById('lgw-main-runway') ? document.getElementById('lgw-main-runway').textContent.trim() : '';
  const lcyActiveArr = document.getElementById('lcy-active-runway') ? document.getElementById('lcy-active-runway').textContent.trim() : '';
  
  let activeArr = '';
  if (code === 'LHR') activeArr = lhrActiveArr;
  else if (code === 'LGW') activeArr = lgwActiveArr;
  else if (code === 'LCY') activeArr = lcyActiveArr;
  
  // Skip rendering if configuration hasn't changed and DOM is already built
  if (!force && lastRenderedConfig[code] === activeArr && container.children.length > 0) {
    return;
  }
  
  lastRenderedConfig[code] = activeArr;
  
  container.innerHTML = spots.map(spot => {
    const isActive = spot.config.includes(activeArr);
    return `
      <div class="spot-list-item glass-card ${isActive ? 'active-spot' : 'inactive-spot'}" onclick="openSpotterModal('${spot.id}')">
        <div class="spot-item-header">
          <span class="spot-item-name">${spot.name}</span>
          <span class="spot-status-pill ${isActive ? 'active' : 'inactive'}">
            ${isActive ? '<i data-lucide="check-circle"></i> Active' : '<i data-lucide="x-circle"></i> Inactive'}
          </span>
        </div>
        <p class="spot-item-desc">${spot.description.substring(0, 85)}...</p>
        <span class="spot-item-config"><i data-lucide="compass"></i> Best config: ${spot.config}</span>
      </div>
    `;
  }).join('');
  
  // Render upcoming arrivals list for this airport
  renderUpcomingArrivals(code);
  
  initLucide();
}

// Fetch weather based on active time (Live or Simulated)
async function fetchLiveWeather() {
  if (windMode !== 'auto') return;
  
  weatherLoading = true;
  document.getElementById('weather-value').textContent = 'Fetching...';
  
  if (timeMode === 'live') {
    // Live mode: fetch current real-time weather
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LONDON_LAT}&longitude=${LONDON_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m`);
      if (!response.ok) throw new Error('API failure');
      
      const data = await response.json();
      const current = data.current;
      
      const windSpeedKmh = current.wind_speed_10m;
      windSpeed = Math.round(windSpeedKmh * 0.539957);
      windDirection = current.wind_direction_10m;
      weatherDescription = parseWmoCode(current.weather_code) + ` (${Math.round(current.temperature_2m)}°C)`;
      
      hourlyWeatherData = null;
      fetchedDateStr = '';
      weatherLoading = false;
      updateUIWithWind();
      calculateAirportOperations();
    } catch (error) {
      console.error('Weather fetch error:', error);
      useFallbackWeather('Weather offline');
    }
  } else {
    // Custom simulated time mode: query target date hourly forecast/archive
    const targetDate = formatDateToYmd(localTime);
    if (fetchedDateStr === targetDate && hourlyWeatherData) {
      weatherLoading = false;
      applyHourlyWeatherForTime();
      return;
    }
    
    try {
      // 1. Try standard forecast API (works for recent past and short-term future)
      let url = `https://api.open-meteo.com/v1/forecast?latitude=${LONDON_LAT}&longitude=${LONDON_LON}&start_date=${targetDate}&end_date=${targetDate}&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m`;
      let response = await fetch(url);
      
      // 2. If it fails, fallback to archive API (works for dates older than a few days)
      if (!response.ok) {
        url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LONDON_LAT}&longitude=${LONDON_LON}&start_date=${targetDate}&end_date=${targetDate}&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m`;
        response = await fetch(url);
      }
      
      if (!response.ok) throw new Error('Weather API requests failed');
      
      const data = await response.json();
      if (!data.hourly || !data.hourly.time || data.hourly.time.length === 0) {
        throw new Error('No hourly data returned');
      }
      
      hourlyWeatherData = data.hourly;
      fetchedDateStr = targetDate;
      weatherLoading = false;
      applyHourlyWeatherForTime();
    } catch (error) {
      console.error('Simulated weather fetch error:', error);
      useFallbackWeather('No forecast');
    }
  }
}

// Extract hourly values from cached day forecast data
function applyHourlyWeatherForTime() {
  if (!hourlyWeatherData) return;
  const hour = localTime.getHours();
  
  const temp = hourlyWeatherData.temperature_2m[hour];
  const wmoCode = hourlyWeatherData.weather_code[hour];
  const windKmh = hourlyWeatherData.wind_speed_10m[hour];
  const windDir = hourlyWeatherData.wind_direction_10m[hour];
  
  windSpeed = Math.round(windKmh * 0.539957); // Convert km/h to knots
  windDirection = windDir;
  weatherDescription = parseWmoCode(wmoCode) + ` (${Math.round(temp)}°C)`;
  
  updateUIWithWind();
  calculateAirportOperations();
}

function useFallbackWeather(desc) {
  windDirection = 240;
  windSpeed = 10;
  weatherDescription = `${desc} (240° @ 10kt)`;
  weatherLoading = false;
  updateUIWithWind();
  calculateAirportOperations();
}


// Convert WMO code to human-readable text
function parseWmoCode(code) {
  if (code === 0) return 'Clear';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 75) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorms';
  return 'Cloudy';
}

// Toggle Auto vs Manual Wind Source
function setWindMode(mode) {
  windMode = mode;
  const btnAuto = document.getElementById('btn-mode-auto');
  const btnManual = document.getElementById('btn-mode-manual');
  const inputDirection = document.getElementById('input-wind-direction');
  const inputSpeed = document.getElementById('input-wind-speed');
  
  if (mode === 'auto') {
    btnAuto.classList.add('active');
    btnManual.classList.remove('active');
    inputDirection.disabled = true;
    inputSpeed.disabled = true;
    fetchLiveWeather();
  } else {
    btnAuto.classList.remove('active');
    btnManual.classList.add('active');
    inputDirection.disabled = false;
    inputSpeed.disabled = false;
    
    // Sync slider positions to state values
    inputDirection.value = windDirection;
    inputSpeed.value = windSpeed;
    document.getElementById('weather-value').textContent = 'Simulation Active';
    updateUIWithWind();
  }
}

// Manual inputs handlers
function updateManualWindDirection(val) {
  windDirection = parseInt(val);
  updateUIWithWind();
  calculateAirportOperations();
}

function updateManualWindSpeed(val) {
  windSpeed = parseInt(val);
  updateUIWithWind();
  calculateAirportOperations();
}

// Updates wind dial compass and text values
function updateUIWithWind() {
  document.getElementById('wind-direction-deg').textContent = `${windDirection}°`;
  document.getElementById('val-wind-direction').textContent = `${windDirection}°`;
  document.getElementById('wind-direction-cardinal').textContent = getCardinalDirection(windDirection);
  
  document.getElementById('val-wind-speed').textContent = `${windSpeed} kts`;
  
  // Rotate compass needle. Compass angles: standard wind blows *from*, arrow points *into* the wind.
  // Rotate arrow wrapper so it visualizes the direction the wind is blowing.
  // Meteorological wind direction: 270 is from West to East, so arrow should point East (90 deg).
  // Thus, the arrow rotate is: windDirection + 180
  const rotateDeg = windDirection + 180;
  document.getElementById('wind-arrow-wrapper').style.transform = `rotate(${rotateDeg}deg)`;
  
  if (windMode === 'auto' && !weatherLoading) {
    document.getElementById('weather-value').textContent = `${weatherDescription} | ${getCardinalDirection(windDirection)} ${windSpeed}kt`;
  }
  
  // Wind Warning Indicator
  const warningMsg = document.getElementById('wind-warning-message');
  if (windSpeed >= 25) {
    warningMsg.classList.remove('hidden');
  } else {
    warningMsg.classList.add('hidden');
  }
}

function getCardinalDirection(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

let lastSimStateKey = '';

// Check if simulation state has changed before running heavy DOM calculations
function checkAndRunOperations() {
  const currentHour = localTime.getHours();
  const currentDay = localTime.getDay();
  
  // LHR weekly cycle alternations
  const msDiff = localTime - LHR_BASE_DATE;
  const weeksDiff = Math.floor(msDiff / (7 * 24 * 60 * 60 * 1000));
  
  // LHR daytime phase: AM (06:00 - 15:00) vs PM (15:00 - end)
  const isAM = (currentHour >= 6 && currentHour < 15);
  
  // LCY closure: Saturday 13:00 to Sunday 10:00
  let isLcyClosed = false;
  if (currentDay === 6) { // Saturday
    if (currentHour >= 13) isLcyClosed = true;
  } else if (currentDay === 0) { // Sunday
    if (currentHour < 10) isLcyClosed = true;
  }
  
  const currentMinute = localTime.getMinutes();
  const stateKey = `${windDirection}_${windSpeed}_${weeksDiff}_${isAM}_${currentDay}_${currentHour}_${currentMinute}_${isLcyClosed}`;
  
  if (stateKey !== lastSimStateKey) {
    lastSimStateKey = stateKey;
    calculateAirportOperations();
  }
}

// Core Operations Decision Tree
function calculateAirportOperations() {
  // 1. Westerly vs Easterly logic
  // Wind is Easterly if it has an easterly component (between 5 and 175 degrees)
  // Heathrow Westerly Preference:
  // Landings continue westerly even under light easterly tailwinds (up to 5 knots)
  // If easterly winds exceed 5 knots, switch to Easterly Operations.
  const isEasterlyWindSector = (windDirection > 5 && windDirection < 175);
  
  let opsDirection = 'westerly';
  if (isEasterlyWindSector && windSpeed > 5) {
    opsDirection = 'easterly';
  }
  
  // Apply operations direction to all airports
  updateHeathrowOps(opsDirection);
  updateGatwickOps(opsDirection);
  updateLondonCityOps(opsDirection);
  
  // Update map visual tracks
  updateMapFlightPaths(opsDirection);

  // Update active subpage spotting list if applicable
  const hash = window.location.hash || '#/';
  if (hash === '#/lhr') renderAirportDetail('LHR');
  else if (hash === '#/lgw') renderAirportDetail('LGW');
  else if (hash === '#/lcy') renderAirportDetail('LCY');
}

// Heathrow-specific Scheduling & Respite Engine
function updateHeathrowOps(ops) {
  const badge = document.getElementById('lhr-ops-badge');
  const detailBadge = document.getElementById('detail-lhr-ops-badge');
  
  const arrivalsRunway = document.getElementById('lhr-arrivals-runway');
  const detailArrivalsRunway = document.getElementById('detail-lhr-arrivals-runway');
  const departuresRunway = document.getElementById('lhr-departures-runway');
  const detailDeparturesRunway = document.getElementById('detail-lhr-departures-runway');
  
  const amPart = document.getElementById('lhr-am-period');
  const detailAmPart = document.getElementById('detail-lhr-am-period');
  const pmPart = document.getElementById('lhr-pm-period');
  const detailPmPart = document.getElementById('detail-lhr-pm-period');
  
  // Calculate LHR weekly schedule cycle for 2026
  // LHR alternations change every Monday at 06:00
  // Let's compute ISO weeks since 2026-01-05
  const msDiff = localTime - LHR_BASE_DATE;
  const weeksDiff = Math.floor(msDiff / (7 * 24 * 60 * 60 * 1000));
  const isEvenWeek = (weeksDiff % 2 === 0);
  
  // Format current week commencing date
  const weekCommencing = new Date(LHR_BASE_DATE.getTime() + (weeksDiff * 7 * 24 * 60 * 60 * 1000));
  const weekStartStr = weekCommencing.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  
  const weekDateEl = document.getElementById('lhr-week-date');
  const detailWeekDateEl = document.getElementById('detail-lhr-week-date');
  if (weekDateEl) weekDateEl.textContent = weekStartStr;
  if (detailWeekDateEl) detailWeekDateEl.textContent = weekStartStr;
  
  // Determine current day-phase: Morning (06:00 to 15:00) vs Afternoon (15:00 to last flight)
  const currentHour = localTime.getHours();
  const isAM = (currentHour >= 6 && currentHour < 15);
  
  // Highlight active period timeline
  const applyActive = (el, active) => {
    if (!el) return;
    if (active) el.classList.add('active');
    else el.classList.remove('active');
  };
  
  applyActive(amPart, isAM);
  applyActive(detailAmPart, isAM);
  applyActive(pmPart, !isAM);
  applyActive(detailPmPart, !isAM);
  
  if (ops === 'westerly') {
    const setBadgeText = (el) => {
      if (!el) return;
      el.textContent = 'Westerly Ops';
      el.className = 'status-badge westerly';
    };
    setBadgeText(badge);
    setBadgeText(detailBadge);
    
    // Set runway values in UI based on alternating weekly calendar
    let amLanding = isEvenWeek ? '27L' : '27R';
    let amTakeoff = isEvenWeek ? '27R' : '27L';
    let pmLanding = isEvenWeek ? '27R' : '27L';
    let pmTakeoff = isEvenWeek ? '27L' : '27R';
    
    const setTimelineValues = (amVal, pmVal) => {
      const lhrAm = document.getElementById('lhr-am-value');
      const detailLhrAm = document.getElementById('detail-lhr-am-value');
      const lhrPm = document.getElementById('lhr-pm-value');
      const detailLhrPm = document.getElementById('detail-lhr-pm-value');
      
      if (lhrAm) lhrAm.textContent = amVal;
      if (detailLhrAm) detailLhrAm.textContent = amVal;
      if (lhrPm) lhrPm.textContent = pmVal;
      if (detailLhrPm) detailLhrPm.textContent = pmVal;
    };
    
    setTimelineValues(`Land ${amLanding} / Takeoff ${amTakeoff}`, `Land ${pmLanding} / Takeoff ${pmTakeoff}`);
    
    // Active runways right now
    const activeLanding = isAM ? amLanding : pmLanding;
    const activeTakeoff = isAM ? amTakeoff : pmTakeoff;
    
    const updateRunways = (landingEl, takeoffEl) => {
      if (landingEl) {
        landingEl.textContent = activeLanding;
        landingEl.className = 'runway-value active-green';
      }
      if (takeoffEl) {
        takeoffEl.textContent = activeTakeoff;
        takeoffEl.className = 'runway-value active-blue';
      }
    };
    
    updateRunways(arrivalsRunway, departuresRunway);
    updateRunways(detailArrivalsRunway, detailDeparturesRunway);
    
  } else {
    // Easterly Operations
    const setBadgeText = (el) => {
      if (!el) return;
      el.textContent = 'Easterly Ops';
      el.className = 'status-badge easterly';
    };
    setBadgeText(badge);
    setBadgeText(detailBadge);
    
    // Easterly: arrivals use Southern runway (09R) and departures use Northern runway (09L)
    const setTimelineValues = (val) => {
      const lhrAm = document.getElementById('lhr-am-value');
      const detailLhrAm = document.getElementById('detail-lhr-am-value');
      const lhrPm = document.getElementById('lhr-pm-value');
      const detailLhrPm = document.getElementById('detail-lhr-pm-value');
      
      if (lhrAm) lhrAm.textContent = val;
      if (detailLhrAm) detailLhrAm.textContent = val;
      if (lhrPm) lhrPm.textContent = val;
      if (detailLhrPm) detailLhrPm.textContent = val;
    };
    setTimelineValues('Land 09R / Takeoff 09L');
    
    const updateRunways = (landingEl, takeoffEl) => {
      if (landingEl) {
        landingEl.textContent = '09R';
        landingEl.className = 'runway-value active-green';
      }
      if (takeoffEl) {
        takeoffEl.textContent = '09L';
        takeoffEl.className = 'runway-value active-blue';
      }
    };
    
    updateRunways(arrivalsRunway, departuresRunway);
    updateRunways(detailArrivalsRunway, detailDeparturesRunway);
  }
}

// Gatwick Operations Engine
function updateGatwickOps(ops) {
  const badge = document.getElementById('lgw-ops-badge');
  const detailBadge = document.getElementById('detail-lgw-ops-badge');
  
  const mainRunway = document.getElementById('lgw-main-runway');
  const detailMainRunway = document.getElementById('detail-lgw-main-runway');
  const standbyRunway = document.getElementById('lgw-standby-runway');
  const detailStandbyRunway = document.getElementById('detail-lgw-standby-runway');
  
  const desc = document.getElementById('lgw-runway-desc');
  const detailDesc = document.getElementById('detail-lgw-runway-desc');
  
  if (ops === 'westerly') {
    const setBadgeText = (el) => {
      if (el) {
        el.textContent = 'Westerly Ops';
        el.className = 'status-badge westerly';
      }
    };
    setBadgeText(badge);
    setBadgeText(detailBadge);
    
    const setMain = (el) => {
      if (el) {
        el.textContent = '26L';
        el.className = 'runway-value active-green';
      }
    };
    setMain(mainRunway);
    setMain(detailMainRunway);
    
    const setStandby = (el) => {
      if (el) {
        el.textContent = '26R (Standby)';
        el.className = 'runway-value disabled-gray';
      }
    };
    setStandby(standbyRunway);
    setStandby(detailStandbyRunway);
    
    const valText = 'Runway 26L is active. Aircraft approach from the East (Kent) and land heading West.';
    if (desc) desc.textContent = valText;
    if (detailDesc) detailDesc.textContent = valText;
    
  } else {
    const setBadgeText = (el) => {
      if (el) {
        el.textContent = 'Easterly Ops';
        el.className = 'status-badge easterly';
      }
    };
    setBadgeText(badge);
    setBadgeText(detailBadge);
    
    const setMain = (el) => {
      if (el) {
        el.textContent = '08R';
        el.className = 'runway-value active-green';
      }
    };
    setMain(mainRunway);
    setMain(detailMainRunway);
    
    const setStandby = (el) => {
      if (el) {
        el.textContent = '08L (Standby)';
        el.className = 'runway-value disabled-gray';
      }
    };
    setStandby(standbyRunway);
    setStandby(detailStandbyRunway);
    
    const valText = 'Runway 08R is active. Aircraft approach from the West (Surrey) and land heading East.';
    if (desc) desc.textContent = valText;
    if (detailDesc) detailDesc.textContent = valText;
  }
}

// London City Operations Engine
function updateLondonCityOps(ops) {
  const badge = document.getElementById('lcy-ops-badge');
  const detailBadge = document.getElementById('detail-lcy-ops-badge');
  
  const activeRunway = document.getElementById('lcy-active-runway');
  const detailActiveRunway = document.getElementById('detail-lcy-active-runway');
  
  const desc = document.getElementById('lcy-runway-desc');
  const detailDesc = document.getElementById('detail-lcy-runway-desc');
  
  // LCY Weekend Closure check: Sat 13:00 to Sun 10:00 local time
  const day = localTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = localTime.getHours();
  const isClosed = (day === 6 && hour >= 13) || (day === 0 && hour < 10);
  
  if (isClosed) {
    const setBadgeText = (el) => {
      if (el) {
        el.textContent = 'CLOSED (Ban)';
        el.className = 'status-badge easterly';
      }
    };
    setBadgeText(badge);
    setBadgeText(detailBadge);
    
    const setClosed = (el) => {
      if (el) {
        el.textContent = 'Closed';
        el.className = 'runway-value disabled-gray';
      }
    };
    setClosed(activeRunway);
    setClosed(detailActiveRunway);
    
    const valText = 'London City Airport is closed for the weekend (ban is in effect from Sat 13:00 to Sun 10:00 for local noise relief). No flight movements are active.';
    if (desc) desc.textContent = valText;
    if (detailDesc) detailDesc.textContent = valText;
    return;
  }
  
  if (ops === 'westerly') {
    const setBadgeText = (el) => {
      if (el) {
        el.textContent = 'Westerly Ops';
        el.className = 'status-badge westerly';
      }
    };
    setBadgeText(badge);
    setBadgeText(detailBadge);
    
    const setActive = (el) => {
      if (el) {
        el.textContent = '27';
        el.className = 'runway-value active-green';
      }
    };
    setActive(activeRunway);
    setActive(detailActiveRunway);
    
    const valText = 'Runway 27 active. Aircraft approach from the East (Thames Estuary) and land heading West past Canary Wharf.';
    if (desc) desc.textContent = valText;
    if (detailDesc) detailDesc.textContent = valText;
  } else {
    const setBadgeText = (el) => {
      if (el) {
        el.textContent = 'Easterly Ops';
        el.className = 'status-badge easterly';
      }
    };
    setBadgeText(badge);
    setBadgeText(detailBadge);
    
    const setActive = (el) => {
      if (el) {
        el.textContent = '09';
        el.className = 'runway-value active-green';
      }
    };
    setActive(activeRunway);
    setActive(detailActiveRunway);
    
    const valText = 'Runway 09 active. Aircraft approach from the West, flying past skyscrapers of central London and Canary Wharf, landing heading East.';
    if (desc) desc.textContent = valText;
    if (detailDesc) detailDesc.textContent = valText;
  }
}

// Render Interactive SVG Maps (one for each airport card)
function renderMap() {
  const lhrContainer = document.getElementById('detail-map-lhr-container');
  const lgwContainer = document.getElementById('detail-map-lgw-container');
  const lcyContainer = document.getElementById('detail-map-lcy-container');
  
  if (!lhrContainer || !lgwContainer || !lcyContainer) return;
  
  // 1. Heathrow Map
  lhrContainer.innerHTML = `
    <svg viewBox="0 15 400 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="15" width="400" height="140" class="svg-bg" />
      <text x="15" y="27" fill="var(--text-muted)" font-family="Outfit" font-size="10" font-weight="700">HEATHROW (LHR) RUNWAY CONFIG</text>
      
      <!-- Paths (updated dynamically) - layered behind runways and text -->
      <path d="" id="path-lhr-approach" class="svg-flight-path approach" />
      <path d="" id="path-lhr-departure" class="svg-flight-path departure" />

      <!-- Parallel Runways -->
      <line x1="80" y1="80" x2="300" y2="80" id="map-runway-lhr-north" class="svg-runway" />
      <text x="50" y="83" class="svg-runway-label">09L</text>
      <text x="310" y="83" class="svg-runway-label">27R</text>
      
      <line x1="80" y1="120" x2="300" y2="120" id="map-runway-lhr-south" class="svg-runway" />
      <text x="50" y="123" class="svg-runway-label">09R</text>
      <text x="310" y="123" class="svg-runway-label">27L</text>
      
      <!-- Spotter Pins -->
      <g id="pins-lhr">
        <!-- Myrtle Avenue (27L Westerly landing) -->
        <g class="spotter-pin-group" id="pin-myrtle_ave" onclick="openSpotterModal('myrtle_ave')">
          <circle cx="340" cy="120" r="4" class="svg-spotter-pin" />
          <text x="340" y="140" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-weight="600">Myrtle Ave (27L)</text>
        </g>
        
        <!-- T5 Mound (09L Easterly landing) -->
        <g class="spotter-pin-group" id="pin-t5_mound" onclick="openSpotterModal('t5_mound')">
          <circle cx="40" cy="80" r="4" class="svg-spotter-pin" />
          <text x="40" y="65" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-weight="600">T5 Mound (09L)</text>
        </g>
      </g>
    </svg>
  `;

  // 2. Gatwick Map
  lgwContainer.innerHTML = `
    <svg viewBox="0 15 400 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="runway-grad-westerly" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--color-primary)" />
          <stop offset="100%" stop-color="var(--color-success)" />
        </linearGradient>
        <linearGradient id="runway-grad-easterly" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--color-success)" />
          <stop offset="100%" stop-color="var(--color-primary)" />
        </linearGradient>
      </defs>
      <rect x="0" y="15" width="400" height="140" class="svg-bg" />
      <text x="15" y="27" fill="var(--text-muted)" font-family="Outfit" font-size="10" font-weight="700">GATWICK (LGW) RUNWAY CONFIG</text>
      
      <!-- Paths (updated dynamically) - layered behind runways and text -->
      <path d="" id="path-lgw-approach" class="svg-flight-path approach" />
      <path d="" id="path-lgw-departure" class="svg-flight-path departure" />

      <!-- Main & Standby Runways -->
      <line x1="80" y1="110" x2="300" y2="110" id="map-runway-lgw" class="svg-runway" />
      <text x="45" y="113" class="svg-runway-label">08R/26L</text>
      <text x="310" y="113" class="svg-runway-label">26L/08R</text>
      
      <line x1="80" y1="75" x2="300" y2="75" id="map-runway-lgw-standby" class="svg-runway" style="stroke: #162030; stroke-width: 3; opacity: 0.4;" />
      <text x="45" y="78" class="svg-runway-label standby">08L/26R</text>
      <text x="310" y="78" class="svg-runway-label standby">26R/08L</text>
      
      <!-- Spotter Pins -->
      <g id="pins-lgw">
        <!-- Lowfield Heath Rec (26L Westerly landing) -->
        <g class="spotter-pin-group" id="pin-lowfield_heath" onclick="openSpotterModal('lowfield_heath')">
          <circle cx="340" cy="110" r="4" class="svg-spotter-pin" />
          <text x="340" y="130" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-weight="600">Lowfield Heath</text>
        </g>
        
        <!-- Lowfield Heath Road (Westerly Takeoff / Side-on) -->
        <g class="spotter-pin-group" id="pin-lowfield_road" onclick="openSpotterModal('lowfield_road')">
          <circle cx="220" cy="140" r="4" class="svg-spotter-pin" />
          <text x="220" y="125" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-weight="600">Lowfield Heath Rd</text>
        </g>
        
        <!-- LGW Crash Gate (08R Easterly landing) -->
        <g class="spotter-pin-group" id="pin-lgw_crash_gate" onclick="openSpotterModal('lgw_crash_gate')">
          <circle cx="40" cy="110" r="4" class="svg-spotter-pin" />
          <text x="40" y="130" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-weight="600">08R Crash Gate</text>
        </g>
      </g>
    </svg>
  `;

  // 3. London City Map
  lcyContainer.innerHTML = `
    <svg viewBox="0 15 400 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="runway-grad-westerly" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--color-primary)" />
          <stop offset="100%" stop-color="var(--color-success)" />
        </linearGradient>
        <linearGradient id="runway-grad-easterly" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--color-success)" />
          <stop offset="100%" stop-color="var(--color-primary)" />
        </linearGradient>
      </defs>
      <rect x="0" y="15" width="400" height="140" class="svg-bg" />
      <text x="15" y="27" fill="var(--text-muted)" font-family="Outfit" font-size="10" font-weight="700">LONDON CITY (LCY) RUNWAY CONFIG</text>
      
      <!-- Paths (updated dynamically) - layered behind runways and text -->
      <path d="" id="path-lcy-approach" class="svg-flight-path approach" />
      <path d="" id="path-lcy-departure" class="svg-flight-path departure" />

      <!-- Royal Docks water body -->
      <rect x="40" y="55" width="320" height="90" fill="#0b1320" rx="6" stroke="rgba(255,255,255,0.02)" />
      <text x="200" y="135" text-anchor="middle" fill="#1e2d42" font-family="Outfit" font-size="8" font-weight="700" letter-spacing="1">ROYAL ALBERT DOCK</text>
      
      <!-- Runway Island and Runway -->
      <rect x="90" y="85" width="220" height="30" fill="#05070c" rx="3" stroke="rgba(255,255,255,0.08)" />
      <line x1="100" y1="100" x2="300" y2="100" id="map-runway-lcy" class="svg-runway" />
      <text x="80" y="103" class="svg-runway-label">09</text>
      <text x="312" y="103" class="svg-runway-label">27</text>
      
      <!-- Spotter Pins -->
      <g id="pins-lcy">
        <!-- Royal Albert Dock South (27 Westerly landing) -->
        <g class="spotter-pin-group" id="pin-royal_albert_dock" onclick="openSpotterModal('royal_albert_dock')">
          <circle cx="330" cy="120" r="4" class="svg-spotter-pin" />
          <text x="330" y="140" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-weight="600">Albert Dock</text>
        </g>
        
        <!-- Connaught Bridge (09 Easterly landing) -->
        <g class="spotter-pin-group" id="pin-connaught_bridge" onclick="openSpotterModal('connaught_bridge')">
          <circle cx="65" cy="100" r="4" class="svg-spotter-pin" />
          <text x="65" y="125" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-weight="600">Connaught Brg</text>
        </g>
      </g>
    </svg>
  `;
  
  // Call ops calculations to populate paths immediately
  calculateAirportOperations();
}

// Update SVG flight paths on the map according to the ops direction
function updateMapFlightPaths(ops) {
  const lhrApproach = document.getElementById('path-lhr-approach');
  const lhrDeparture = document.getElementById('path-lhr-departure');
  const lgwApproach = document.getElementById('path-lgw-approach');
  const lgwDeparture = document.getElementById('path-lgw-departure');
  const lcyApproach = document.getElementById('path-lcy-approach');
  const lcyDeparture = document.getElementById('path-lcy-departure');
  
  const lhrNorth = document.getElementById('map-runway-lhr-north');
  const lhrSouth = document.getElementById('map-runway-lhr-south');
  const lgwRunway = document.getElementById('map-runway-lgw');
  const lcyRunway = document.getElementById('map-runway-lcy');
  
  if (!lhrApproach || !lgwApproach || !lcyApproach) return;

  const lcyActiveArr = document.getElementById('lcy-active-runway').textContent.trim();
  const isLcyClosed = (lcyActiveArr === 'Closed');
  
  if (ops === 'westerly') {
    // Westerly: landing towards the west (arrivals from east)
    
    // Heathrow: active arrivals runway depends on am/pm alternation
    const currentHour = localTime.getHours();
    const isAM = (currentHour >= 6 && currentHour < 15);
    
    const msDiff = localTime - LHR_BASE_DATE;
    const weeksDiff = Math.floor(msDiff / (7 * 24 * 60 * 60 * 1000));
    const isEvenWeek = (weeksDiff % 2 === 0);
    const activeLandingIsSouth = isEvenWeek ? isAM : !isAM;
    
    // Highlight active landing (arrival) and takeoff (departure) runways
    if (lhrNorth && lhrSouth) {
      if (activeLandingIsSouth) {
        lhrSouth.setAttribute('class', 'svg-runway arrival');
        lhrNorth.setAttribute('class', 'svg-runway departure');
      } else {
        lhrNorth.setAttribute('class', 'svg-runway arrival');
        lhrSouth.setAttribute('class', 'svg-runway departure');
      }
    }
    
    const landingY = activeLandingIsSouth ? 120 : 80;
    const takeoffY = activeLandingIsSouth ? 80 : 120;
    
    // Heathrow Westerly approach from East (right to left)
    lhrApproach.setAttribute('d', `M 390 ${landingY} L 310 ${landingY}`);
    lhrDeparture.setAttribute('d', `M 40 ${takeoffY} L 10 ${takeoffY}`);
    
    // Gatwick: landing 26L
    if (lgwRunway) lgwRunway.setAttribute('class', 'svg-runway both-westerly');
    lgwApproach.setAttribute('d', `M 390 110 L 310 110`);
    lgwDeparture.setAttribute('d', `M 35 110 L 10 110`);
    
    // City: landing 27 (if open)
    if (isLcyClosed) {
      if (lcyRunway) lcyRunway.setAttribute('class', 'svg-runway');
      lcyApproach.setAttribute('d', '');
      lcyDeparture.setAttribute('d', '');
    } else {
      if (lcyRunway) lcyRunway.setAttribute('class', 'svg-runway both-westerly');
      lcyApproach.setAttribute('d', `M 390 100 L 305 100`);
      lcyDeparture.setAttribute('d', `M 70 100 L 10 100`);
    }
    
  } else {
    // Easterly Operations: landing towards east (arrivals from west)
    
    // Heathrow: Arrivals Northern 09L / Southern 09R.
    // LHR easterly default: arrivals Southern (09R) and departures Northern (09L).
    if (lhrNorth && lhrSouth) {
      lhrSouth.setAttribute('class', 'svg-runway arrival'); // Land 09R
      lhrNorth.setAttribute('class', 'svg-runway departure'); // Takeoff 09L
    }
    lhrApproach.setAttribute('d', `M 10 120 L 40 120`);
    lhrDeparture.setAttribute('d', `M 310 80 L 390 80`);
    
    // Gatwick: landing 08R
    if (lgwRunway) lgwRunway.setAttribute('class', 'svg-runway both-easterly');
    lgwApproach.setAttribute('d', `M 10 110 L 35 110`);
    lgwDeparture.setAttribute('d', `M 310 110 L 390 110`);
    
    // City: landing 09 (if open)
    if (isLcyClosed) {
      if (lcyRunway) lcyRunway.setAttribute('class', 'svg-runway');
      lcyApproach.setAttribute('d', '');
      lcyDeparture.setAttribute('d', '');
    } else {
      if (lcyRunway) lcyRunway.setAttribute('class', 'svg-runway both-easterly');
      lcyApproach.setAttribute('d', `M 10 100 L 70 100`);
      lcyDeparture.setAttribute('d', `M 305 100 L 390 100`);
    }
  }
  
  // Highlight/dim pins by configuration matching the active arrival runway
  SPOTTING_SPOTS.forEach(spot => {
    const pinGroup = document.getElementById(`pin-${spot.id}`);
    if (!pinGroup) return;
    
    // Select the current active arrival runways from the cards
    const lhrActiveArr = document.getElementById('lhr-arrivals-runway').textContent.trim();
    const lgwActiveArr = document.getElementById('lgw-main-runway').textContent.trim();
    const lcyActiveArr = document.getElementById('lcy-active-runway').textContent.trim();
    
    let isActiveSpot = false;
    
    if (spot.airport.includes('Heathrow')) {
      isActiveSpot = spot.config.includes(lhrActiveArr);
    } else if (spot.airport.includes('Gatwick')) {
      isActiveSpot = spot.config.includes(lgwActiveArr);
    } else if (spot.airport.includes('City')) {
      isActiveSpot = spot.config.includes(lcyActiveArr);
    }
    
    if (isActiveSpot) {
      pinGroup.style.opacity = '1';
      pinGroup.style.filter = 'none';
    } else {
      pinGroup.style.opacity = '0.55';
      pinGroup.style.filter = 'none';
    }
  });
}

// Compass Dial Drag Override Logic
function initCompassDrag() {
  const compass = document.getElementById('wind-compass');
  let isDragging = false;
  
  function handleCompassInteraction(e) {
    if (windMode !== 'manual') return;
    
    const rect = compass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Touch/Mouse event unified coordinates
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    // Calculate angle in radians, convert to degrees, adjust offset
    // Math.atan2(y, x) yields angle with positive X axis.
    // We want 0 deg pointing North (along negative Y axis).
    let angleRad = Math.atan2(dy, dx);
    let deg = Math.round(angleRad * (180 / Math.PI)) + 90;
    
    if (deg < 0) deg += 360;
    
    // Update wind direction (which blows *from* this direction)
    // Compass dial direction aligns standard meteorological representation.
    windDirection = deg % 360;
    
    // Update sliders and calculations
    document.getElementById('input-wind-direction').value = windDirection;
    updateUIWithWind();
    calculateAirportOperations();
  }
  
  compass.addEventListener('mousedown', (e) => {
    if (windMode !== 'manual') return;
    isDragging = true;
    handleCompassInteraction(e);
  });
  
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      handleCompassInteraction(e);
    }
  });
  
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // Touch support for mobiles
  compass.addEventListener('touchstart', (e) => {
    if (windMode !== 'manual') return;
    isDragging = true;
    handleCompassInteraction(e);
  });
  
  window.addEventListener('touchmove', (e) => {
    if (isDragging) {
      handleCompassInteraction(e);
    }
  });
  
  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// Modal open/close actions for Spotter Guides
function openSpotterModal(spotId) {
  const spot = SPOTTING_SPOTS.find(s => s.id === spotId);
  if (!spot) return;
  
  document.getElementById('modal-spot-name').textContent = spot.name;
  document.getElementById('modal-spot-airport').textContent = spot.airport;
  document.getElementById('modal-spot-description').textContent = spot.description;
  document.getElementById('modal-spot-config').textContent = spot.config;
  document.getElementById('modal-spot-access').textContent = spot.access;
  document.getElementById('modal-spot-tips').textContent = spot.tips;
  
  // Set generated image path
  const imageElement = document.getElementById('modal-spot-image');
  imageElement.src = spot.image;
  imageElement.alt = `Plane spotting at ${spot.name}`;
  
  // Show modal
  const modal = document.getElementById('spotter-modal');
  modal.classList.remove('hidden');
  initLucide();
}

function closeSpotterModal() {
  const modal = document.getElementById('spotter-modal');
  modal.classList.add('hidden');
}

// Close modal when clicking outside contents
window.addEventListener('click', (e) => {
  const modal = document.getElementById('spotter-modal');
  if (e.target === modal) {
    closeSpotterModal();
  }
});

// Dynamic Mock Flight Database Pools
const FLIGHT_DATA_POOL = {
  LHR: [
    { fn: 'BA178', origin: 'New York (JFK)', airline: 'British Airways', aircraft: 'Boeing 777-300ER' },
    { fn: 'VS004', origin: 'New York (JFK)', airline: 'Virgin Atlantic', aircraft: 'Airbus A350-1000' },
    { fn: 'EK001', origin: 'Dubai (DXB)', airline: 'Emirates', aircraft: 'Airbus A380' },
    { fn: 'SQ318', origin: 'Singapore (SIN)', airline: 'Singapore Airlines', aircraft: 'Boeing 787-10' },
    { fn: 'LH902', origin: 'Frankfurt (FRA)', airline: 'Lufthansa', aircraft: 'Airbus A320neo' },
    { fn: 'BA226', origin: 'Atlanta (ATL)', airline: 'British Airways', aircraft: 'Boeing 787-9' },
    { fn: 'UA904', origin: 'Chicago (ORD)', airline: 'United Airlines', aircraft: 'Boeing 777-200ER' },
    { fn: 'AC854', origin: 'Vancouver (YVR)', airline: 'Air Canada', aircraft: 'Boeing 787-9' },
    { fn: 'QF002', origin: 'Singapore (SIN)', airline: 'Qantas', aircraft: 'Airbus A380' },
    { fn: 'AF1680', origin: 'Paris (CDG)', airline: 'Air France', aircraft: 'Airbus A220-300' },
    { fn: 'NH211', origin: 'Tokyo (HND)', airline: 'ANA', aircraft: 'Boeing 777-300ER' },
    { fn: 'QR003', origin: 'Doha (DOH)', airline: 'Qatar Airways', aircraft: 'Boeing 777-300ER' }
  ],
  LGW: [
    { fn: 'EZY812', origin: 'Nice (NCE)', airline: 'easyJet', aircraft: 'Airbus A320neo' },
    { fn: 'BA2273', origin: 'Orlando (MCO)', airline: 'British Airways', aircraft: 'Boeing 777-200ER' },
    { fn: 'EZY6486', origin: 'Barcelona (BCN)', airline: 'easyJet', aircraft: 'Airbus A321neo' },
    { fn: 'W95738', origin: 'Budapest (BUD)', airline: 'Wizz Air', aircraft: 'Airbus A321neo' },
    { fn: 'VY6012', origin: 'Barcelona (BCN)', airline: 'Vueling', aircraft: 'Airbus A320' },
    { fn: 'N0702', origin: 'New York (JFK)', airline: 'Norse Atlantic', aircraft: 'Boeing 787-9' },
    { fn: 'BY458', origin: 'Tenerife (TFS)', airline: 'TUI Airways', aircraft: 'Boeing 737 MAX 8' },
    { fn: 'EZY8512', origin: 'Amsterdam (AMS)', airline: 'easyJet', aircraft: 'Airbus A320neo' },
    { fn: 'EK015', origin: 'Dubai (DXB)', airline: 'Emirates', aircraft: 'Airbus A380' },
    { fn: 'QR327', origin: 'Doha (DOH)', airline: 'Qatar Airways', aircraft: 'Boeing 787-8' }
  ],
  LCY: [
    { fn: 'BA4450', origin: 'Zurich (ZRH)', airline: 'BA CityFlyer', aircraft: 'Embraer E190' },
    { fn: 'KL981', origin: 'Amsterdam (AMS)', airline: 'KLM Cityhopper', aircraft: 'Embraer E190' },
    { fn: 'AZ210', origin: 'Milan (LIN)', airline: 'ITA Airways', aircraft: 'Airbus A220-100' },
    { fn: 'LH934', origin: 'Frankfurt (FRA)', airline: 'Lufthansa CityLine', aircraft: 'Embraer E190' },
    { fn: 'LX456', origin: 'Zurich (ZRH)', airline: 'Swiss', aircraft: 'Airbus A220-100' },
    { fn: 'BA4462', origin: 'Edinburgh (EDI)', airline: 'BA CityFlyer', aircraft: 'Embraer E190' },
    { fn: 'LM322', origin: 'Dundee (DDE)', airline: 'Loganair', aircraft: 'ATR 42-600' },
    { fn: 'BA4478', origin: 'Dublin (DUB)', airline: 'BA CityFlyer', aircraft: 'Embraer E190' }
  ]
};

// Generates upcoming arrivals based on local/simulated time deterministically
function getUpcomingArrivals(airportCode) {
  const flights = [];
  const dateSeed = localTime.getFullYear() * 10000 + (localTime.getMonth() + 1) * 100 + localTime.getDate();
  
  let intervalMinutes = 10; // Heathrow
  if (airportCode === 'LGW') intervalMinutes = 15;
  if (airportCode === 'LCY') intervalMinutes = 25;

  // LCY Weekend Closure check
  const currentDay = localTime.getDay();
  const currentHour = localTime.getHours();
  let isLcyClosed = false;
  if (currentDay === 6 && currentHour >= 13) isLcyClosed = true;
  else if (currentDay === 0 && currentHour < 10) isLcyClosed = true;

  if (airportCode === 'LCY' && isLcyClosed) {
    return [];
  }

  const currentTotalMinutes = localTime.getHours() * 60 + localTime.getMinutes();
  let nextTimeSlot = Math.ceil(currentTotalMinutes / intervalMinutes) * intervalMinutes;

  for (let i = 0; i < 4; i++) {
    const slotMinutes = nextTimeSlot + (i * intervalMinutes);
    const slotHour = Math.floor((slotMinutes / 60) % 24);
    const slotMin = Math.floor(slotMinutes % 60);
    const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
    
    const pool = FLIGHT_DATA_POOL[airportCode];
    const poolIndex = (dateSeed + slotMinutes) % pool.length;
    const flightTemplate = pool[poolIndex];
    
    let status = 'Scheduled';
    const diffMin = slotMinutes - currentTotalMinutes;
    if (diffMin <= 4 && diffMin > 0) {
      status = 'Final Approach';
    } else if (diffMin <= 0) {
      status = 'Landed';
    } else if (diffMin <= 12) {
      status = 'On Time';
    }
    
    flights.push({
      time: timeStr,
      flightNumber: flightTemplate.fn,
      origin: flightTemplate.origin,
      airline: flightTemplate.airline,
      aircraft: flightTemplate.aircraft,
      status: status
    });
  }
  
  return flights;
}

// Render the upcoming arrivals on the active airport page
function renderUpcomingArrivals(code) {
  const containerId = `${code.toLowerCase()}-arrivals-list`;
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const flights = getUpcomingArrivals(code);
  
  if (flights.length === 0) {
    container.innerHTML = `<div class="no-arrivals-msg">No scheduled arrivals (Airport Closed due to Curfew)</div>`;
    return;
  }
  
  container.innerHTML = flights.map(flight => {
    let statusClass = 'status-scheduled';
    if (flight.status === 'On Time') statusClass = 'status-ontime';
    else if (flight.status === 'Final Approach') statusClass = 'status-final';
    else if (flight.status === 'Landed') statusClass = 'status-landed';
    
    return `
      <div class="arrival-item">
        <div class="arrival-meta">
          <span class="arrival-time">${flight.time}</span>
          <span class="arrival-flight">${flight.flightNumber}</span>
        </div>
        <div class="arrival-details">
          <div class="arrival-route">${flight.origin}</div>
          <div class="arrival-info">${flight.airline} • ${flight.aircraft}</div>
        </div>
        <div class="arrival-status ${statusClass}">${flight.status}</div>
      </div>
    `;
  }).join('');
}
