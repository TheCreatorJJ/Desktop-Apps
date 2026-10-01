const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS = { focus: 'Focus', short: 'Short Break', long: 'Long Break' };
const ORDER = ['focus', 'short', 'long'];

let mode = 'focus';
let remaining = DURATIONS.focus;
let total = DURATIONS.focus;
let running = false;
let timerId = null;
let completed = 0;

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

function setRunning(state) {
  running = state;
  playBtn.textContent = running ? 'PAUSE' : 'START';
  playBtn.title = running ? 'Pause' : 'Start';
  playBtn.classList.toggle('is-running', running);
  document.body.classList.toggle('is-running', running);
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
    }
    return;
  }
  remaining -= 1;
  render();
}

function switchMode(newMode) {
  clearInterval(timerId);
  mode = newMode;
  total = DURATIONS[mode];
  remaining = total;
  setRunning(false);
  render();
}

playBtn.addEventListener('click', () => {
  if (running) {
    clearInterval(timerId);
    setRunning(false);
  } else {
    // restarting a finished block begins a fresh one rather than completing again
    if (remaining <= 0) remaining = total;
    setRunning(true);
    timerId = setInterval(tick, 1000);
    render();
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerId);
  remaining = total;
  setRunning(false);
  render();
});

skipBtn.addEventListener('click', () => {
  switchMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);
});

pinBtn.addEventListener('click', async () => {
  const on = await window.api.toggleAlwaysOnTop();
  pinBtn.classList.toggle('is-on', on);
  pinBtn.setAttribute('aria-pressed', String(on));
});

closeBtn.addEventListener('click', () => window.api.closeApp());

render();
setRunning(false);