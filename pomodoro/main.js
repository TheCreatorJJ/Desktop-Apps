const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(app.getPath("userData"), "state.json");
let lastKnownState = null;

function loadState() {
  try {const data = fs.readFileSync(STATE_FILE, "utf-8");
    const state = JSON.parse(data);if (!state || typeof state !== "object") return null;
    return state;
  } catch (err) {return null;
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
    }fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
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
      preload: __dirname + "/preload.js"
    }
  });

  win.loadFile("index.html");
}

ipcMain.on("close-app", () => {
  BrowserWindow.getAllWindows().forEach((win) => win.close());
});

ipcMain.handle("toggle-always-on-top", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const next = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(next);
  return next;
});

ipcMain.handle("load-state", () => {return loadState();
});

ipcMain.on("save-state", (event, state) => {saveState(state);
});

app.whenReady().then(createWindow);

app.on("before-quit", () => {if (lastKnownState) {
    saveState(lastKnownState);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});