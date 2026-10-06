const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  hideWindow: () => ipcRenderer.send("hide-window"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("toggle-always-on-top"),
  loadState: () => ipcRenderer.invoke("load-state"),
  saveState: (state) => ipcRenderer.send("save-state", state),
  reportRunning: (running) => ipcRenderer.send("running-state", running),
  onTrayCommand: (callback) => ipcRenderer.on("tray-command", (event, command) => callback(command))
});