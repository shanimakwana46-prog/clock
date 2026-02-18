/* ============================================================
   DYNE CLOCK – clock.js
   Features: Analog + Digital clock, Date, Day, Timezone,
             Seconds arc, Stopwatch with laps, Countdown Timer,
             Animated background particles
   ============================================================ */

/* ── Particle background ── */
(function spawnParticles() {
  const container = document.getElementById('particles');
  const count = 40;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      bottom:${Math.random() * -20}%;
      animation-duration:${Math.random() * 12 + 8}s;
      animation-delay:${Math.random() * 10}s;
      opacity:0;
    `;
    // Alternate colours
    if (i % 3 === 0) p.style.background = '#a78bfa';
    if (i % 3 === 1) p.style.background = '#f472b6';
    container.appendChild(p);
  }
})();

/* ── Build tick marks ── */
(function buildTicks() {
  const container = document.getElementById('ticks');
  const face = container.closest('.analog-clock');
  const radius = face.offsetWidth / 2 || 100;
  for (let i = 0; i < 60; i++) {
    const tick = document.createElement('div');
    tick.className = i % 5 === 0 ? 'tick major' : 'tick';
    const isMajor = i % 5 === 0;
    const h = isMajor ? 10 : 5;
    const top = isMajor ? 4 : 6;
    tick.style.cssText = `
      height:${h}px;
      top:${top}px;
      transform:rotate(${i * 6}deg) translateX(-50%);
    `;
    container.appendChild(tick);
  }
})();

/* ── Clock state ── */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const hourHand = document.getElementById('hourHand');
const minuteHand = document.getElementById('minuteHand');
const secondHand = document.getElementById('secondHand');
const digitalTime = document.getElementById('digitalTime');
const ampmBadge = document.getElementById('ampmBadge');
const dayValue = document.getElementById('dayValue');
const dateValue = document.getElementById('dateValue');
const tzValue = document.getElementById('tzValue');
const arcFill = document.getElementById('arcFill');

const ARC_CIRC = 2 * Math.PI * 75; // ≈ 471.24

function pad(n, len = 2) { return String(n).padStart(len, '0'); }

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();

  /* Smooth second fraction */
  const secFrac = s + ms / 1000;
  const minFrac = m + secFrac / 60;
  const hrFrac = (h % 12) + minFrac / 60;

  /* Analog hands */
  hourHand.style.transform = `rotate(${hrFrac * 30}deg)`;
  minuteHand.style.transform = `rotate(${minFrac * 6}deg)`;
  secondHand.style.transform = `rotate(${secFrac * 6}deg)`;

  /* Seconds arc */
  const progress = secFrac / 60;
  arcFill.style.strokeDashoffset = ARC_CIRC * (1 - progress);

  /* Digital time */
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  digitalTime.textContent = `${pad(h12)}:${pad(m)}:${pad(s)}`;
  ampmBadge.textContent = ampm;

  /* Day */
  dayValue.textContent = DAYS[now.getDay()];

  /* Date */
  const dd = pad(now.getDate());
  const mon = MONTHS[now.getMonth()];
  const yr = now.getFullYear();
  dateValue.textContent = `${dd} ${mon} ${yr}`;

  /* Timezone */
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const oh = pad(Math.floor(Math.abs(offset) / 60));
  const om = pad(Math.abs(offset) % 60);
  tzValue.textContent = `UTC${sign}${oh}:${om}`;
}

/* Run clock every ~16ms for smooth sweep */
updateClock();
setInterval(updateClock, 50);

/* ── Tab switching ── */
let currentTab = 'clock';
function switchTab(tab) {
  currentTab = tab;
  ['clock', 'stopwatch', 'timer'].forEach(t => {
    document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1))
      .classList.toggle('active', t === tab);
  });
  document.getElementById('panelStopwatch').style.display = tab === 'stopwatch' ? '' : 'none';
  document.getElementById('panelTimer').style.display = tab === 'timer' ? '' : 'none';
}

/* ── Stopwatch ── */
let swRunning = false;
let swStartTime = 0;
let swElapsed = 0;
let swInterval = null;
let lapCount = 0;
let lastLapTime = 0;

const swDisplay = document.getElementById('swDisplay');
const swLaps = document.getElementById('swLaps');
const btnSwStart = document.getElementById('btnSwStart');
const btnSwLap = document.getElementById('btnSwLap');
const btnSwReset = document.getElementById('btnSwReset');

function formatSW(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mss = ms % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(mss, 3)}`;
}

function swTick() {
  swElapsed = Date.now() - swStartTime;
  swDisplay.textContent = formatSW(swElapsed);
}

function swStart() {
  if (!swRunning) {
    swRunning = true;
    swStartTime = Date.now() - swElapsed;
    swInterval = setInterval(swTick, 30);
    btnSwStart.textContent = '⏸ Pause';
    btnSwLap.disabled = false;
    btnSwReset.disabled = false;
  } else {
    swRunning = false;
    clearInterval(swInterval);
    btnSwStart.textContent = '▶ Resume';
    btnSwLap.disabled = true;
  }
}

function swLap() {
  lapCount++;
  const lapTime = swElapsed - lastLapTime;
  lastLapTime = swElapsed;
  const item = document.createElement('div');
  item.className = 'lap-item';
  item.innerHTML = `<span>Lap ${pad(lapCount)}</span><span>${formatSW(lapTime)}</span><span>${formatSW(swElapsed)}</span>`;
  swLaps.prepend(item);
}

function swReset() {
  swRunning = false;
  clearInterval(swInterval);
  swElapsed = 0;
  lapCount = 0;
  lastLapTime = 0;
  swDisplay.textContent = '00:00:00.000';
  swLaps.innerHTML = '';
  btnSwStart.textContent = '▶ Start';
  btnSwLap.disabled = true;
  btnSwReset.disabled = true;
}

/* ── Countdown Timer ── */
let timerRunning = false;
let timerRemaining = 0;
let timerInterval = null;
let timerLast = 0;

const timerInputs = document.getElementById('timerInputs');
const timerDisplay = document.getElementById('timerDisplay');
const btnTimerStart = document.getElementById('btnTimerStart');
const btnTimerReset = document.getElementById('btnTimerReset');

function formatTimer(ms) {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function timerTick() {
  const now = Date.now();
  const delta = now - timerLast;
  timerLast = now;
  timerRemaining -= delta;
  if (timerRemaining <= 0) {
    timerRemaining = 0;
    timerDisplay.textContent = '00:00:00';
    clearInterval(timerInterval);
    timerRunning = false;
    btnTimerStart.textContent = '▶ Start';
    btnTimerReset.disabled = false;
    /* Flash animation */
    timerDisplay.classList.add('timer-done');
    setTimeout(() => timerDisplay.classList.remove('timer-done'), 3100);
    /* Browser notification if permitted */
    if (Notification && Notification.permission === 'granted') {
      new Notification('⏰ Dyne Clock', { body: 'Timer finished!' });
    }
    return;
  }
  timerDisplay.textContent = formatTimer(timerRemaining);
}

function timerStart() {
  if (!timerRunning) {
    /* First start: read inputs */
    if (timerRemaining === 0) {
      const h = parseInt(document.getElementById('timerH').value) || 0;
      const m = parseInt(document.getElementById('timerM').value) || 0;
      const s = parseInt(document.getElementById('timerS').value) || 0;
      timerRemaining = (h * 3600 + m * 60 + s) * 1000;
      if (timerRemaining <= 0) return;
      timerInputs.style.display = 'none';
      timerDisplay.style.display = '';
      timerDisplay.textContent = formatTimer(timerRemaining);
    }
    timerRunning = true;
    timerLast = Date.now();
    timerInterval = setInterval(timerTick, 100);
    btnTimerStart.textContent = '⏸ Pause';
    btnTimerReset.disabled = false;
    /* Request notification permission */
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } else {
    timerRunning = false;
    clearInterval(timerInterval);
    btnTimerStart.textContent = '▶ Resume';
  }
}

function timerReset() {
  timerRunning = false;
  timerRemaining = 0;
  clearInterval(timerInterval);
  timerDisplay.style.display = 'none';
  timerInputs.style.display = '';
  timerDisplay.textContent = '00:00:00';
  btnTimerStart.textContent = '▶ Start';
  btnTimerReset.disabled = true;
}
