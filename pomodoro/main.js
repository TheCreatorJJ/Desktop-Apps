const { app, BrowserWindow, ipcMain } = require("electron");

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

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});