const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  queryDB: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  runDB: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
  
  // Sync operations
  syncFromCloud: () => ipcRenderer.invoke('sync-from-cloud'),
  syncToCloud: () => ipcRenderer.invoke('sync-to-cloud'),
  syncBidirectional: () => ipcRenderer.invoke('sync-bidirectional'),
  
  // Connectivity check
  checkConnectivity: () => ipcRenderer.invoke('check-connectivity'),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});

// Also expose a simple flag for detection
window.isElectronApp = true;