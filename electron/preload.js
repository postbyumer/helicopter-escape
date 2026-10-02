const { contextBridge, ipcRenderer } = require('electron');

// Only a tiny, explicit surface is exposed to the renderer - no raw
// Node or Electron APIs. The renderer can never do more than this.
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  getPlatform: () => process.platform
});
