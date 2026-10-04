const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS = { focus: 'Focus', short: 'Short Break', long: 'Long Break' };
const ORDER = ['focus', 'short', 'long'];

let mode = 'focus';
let remaining = DURATIONS.focus;
let total = DURATIONS.focus;
let running = false;
let timerId = null;
let completed = 0;
let lastSavedAt = null;
let hydrated = false;

const timeLabel = document.getElementById('timeLabel');
const sessionLabel = document.getElementById('sessionLabel');
const cycleLabel = document.getElementById('cycleLabel');
const progressFill = document.getElementById('progressFill');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const pinBtn = document.getElementById('pinBtn');
const closeBtn = document.getElementById('closeBtn');

function pad(n) {
  return n.toString().padStart(2, '0');
}

function render() {
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  timeLabel.textContent = `${pad(mins)}:${pad(secs)}`;
  sessionLabel.textContent = LABELS[mode];
  cycleLabel.textContent = `Session ${pad(completed + 1)}`;
  document.title = `${pad(mins)}:${pad(secs)} — ${LABELS[mode]}`;
  document.body.classList.toggle('is-break', mode !== 'focus');
  progressFill.style.width = `${(remaining / total) * 100}%`;
}

function persist() {
  try {
    const state = {
      mode,
      remaining,
      running,
      completed,
      total,
      lastSavedAt: Date.now()
    };
    if (!hydrated) {
      return;
    }window.api.saveState(state);
  } catch (e) {}
}

function setRunning(state) {
  running = state;
  playBtn.textContent = running ? 'PAUSE' : 'START';
  playBtn.title = running ? 'Pause' : 'Start';
  playBtn.classList.toggle('is-running', running);
  document.body.classList.toggle('is-running', running);
  persist();
}

function tick() {
  if (remaining <= 0) {
    clearInterval(timerId);
    // guard on `running` so the completion branch can only ever fire once:
    // without it, restarting a finished timer re-counts the session every second
    if (running) {
      if (mode === 'focus') completed += 1;
      setRunning(false);
      render();
      persist();
    }
    return;
  }remaining -= 1;
  render();
  persist();
}

function switchMode(newMode) {
  clearInterval(timerId);
  mode = newMode;
  total = DURATIONS[mode];
  remaining = total;setRunning(false);
  render();
  persist();
}

playBtn.addEventListener('click', () => {if (running) {
    clearInterval(timerId);setRunning(false);} else {
    // restarting a finished block begins a fresh one rather than completing again
    if (remaining <= 0) remaining = total;setRunning(true);
    timerId = setInterval(tick, 1000);
    render();
    persist();}
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerId);
  remaining = total;
  setRunning(false);
  render();
  persist();
});

skipBtn.addEventListener('click', () => {
  switchMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);
});

pinBtn.addEventListener('click', async () => {
  const on = await window.api.toggleAlwaysOnTop();
  pinBtn.classList.toggle('is-on', on);
  pinBtn.setAttribute('aria-pressed', String(on));
});

closeBtn.addEventListener('click', () => {persist();window.api.closeApp();
});

async function init() {try {
    const saved = await window.api.loadState();if (saved && typeof saved === 'object') {
      const now = Date.now();
      const MAX_AGE = 24 * 60 * 60 * 1000;
      const ageOk = saved.lastSavedAt ? (now - saved.lastSavedAt) <= MAX_AGE : false;
      const isValidMode = saved.mode === 'focus' || saved.mode === 'short' || saved.mode === 'long';if (!ageOk) {}
      if (!isValidMode) {}
      if (ageOk && isValidMode) {
        mode = saved.mode;
        total = saved.total || DURATIONS[mode];
        const sessLen = DURATIONS[mode] || total;
        remaining = typeof saved.remaining === 'number' ? saved.remaining : sessLen;
        if (remaining > sessLen) {remaining = sessLen;
        }
        if (remaining < 0) {remaining = 0;
        }
        completed = typeof saved.completed === 'number' && saved.completed >= 0 ? saved.completed : 0;
        const wasRunning = !!saved.running;
        clearInterval(timerId);render();
        if (wasRunning && remaining > 0) {
          hydrated = true;
          setRunning(true);
          timerId = setInterval(tick, 1000);
          render();
          persist();
        } else {
          hydrated = true;
          setRunning(false);
        }
        return;
      }
    } else {}
  } catch (e) {}clearInterval(timerId);
  mode = 'focus';
  total = DURATIONS.focus;
  remaining = DURATIONS.focus;
  completed = 0;
  setRunning(false);
  render();
  hydrated = true;
}

render();
init();