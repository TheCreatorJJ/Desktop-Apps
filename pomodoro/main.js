const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(app.getPath("userData"), "state.json");
let lastKnownState = null;
let tray = null;
let rendererRunning = false;
let quitting = false;

function loadState() {
  try {
const data = fs.readFileSync(STATE_FILE, "utf-8");
    const state = JSON.parse(data);
if (!state || typeof state !== "object") return null;
    return state;
  } catch (err) {
return null;
  }
}

function saveState(state) {
  try {
    if (state && typeof state === "object") {
      lastKnownState = state;
    }
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    // ignore
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 320,
    height: 300,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: false,
    backgroundColor: "#0e0f10",
    icon: __dirname + "/icon.ico",
    webPreferences: {
      contextIsolation: true,
      backgroundThrottling: false,
      preload: __dirname + "/preload.js"
    }
  });

  win.loadFile("index.html");

  win.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();
    win.hide();
  });

  win.on("show", updateTrayMenu);
  win.on("hide", updateTrayMenu);

  return win;
}

ipcMain.on("hide-window", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.hide();
});

ipcMain.on("running-state", (event, running) => {
  const next = !!running;
  if (next === rendererRunning) return;
  rendererRunning = next;
  updateTrayMenu();
});

ipcMain.handle("toggle-always-on-top", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const next = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(next);
  return next;
});

ipcMain.handle("load-state", () => {
return loadState();
});

ipcMain.on("save-state", (event, state) => {
saveState(state);
});

function updateTrayMenu() {
  if (!tray) return;
  const win = BrowserWindow.getAllWindows()[0];
  const visible = !!win && win.isVisible();
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: rendererRunning ? "Pause" : "Start", click: () => sendTrayCommand(rendererRunning ? "pause" : "start") },
      { label: "Skip", click: () => sendTrayCommand("skip") },
      { label: "Reset", click: () => sendTrayCommand("reset") },
      { type: "separator" },
      { label: visible ? "Hide Window" : "Show Window", click: () => toggleWindow() },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() }
    ])
  );
}

function sendTrayCommand(command) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send("tray-command", command);
}

function toggleWindow() {
  let win = BrowserWindow.getAllWindows()[0];
  if (!win) win = createWindow();
  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
    win.focus();
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "icon.ico")).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip("Pomodoro");
  tray.on("click", () => toggleWindow());
  updateTrayMenu();
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("before-quit", () => {
  quitting = true;
  if (lastKnownState) {
    saveState(lastKnownState);
  }
});

app.on("window-all-closed", () => {
  // do nothing — the app stays alive in the tray
});