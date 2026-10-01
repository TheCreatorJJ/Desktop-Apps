const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  closeApp: () => ipcRenderer.send("close-app"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("toggle-always-on-top")
});