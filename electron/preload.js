const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbRun: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
  
  // Connectivity check
  checkConnectivity: () => ipcRenderer.invoke('check-connectivity'),
  
  // Manual sync
  syncNow: () => ipcRenderer.invoke('sync-now'),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});

console.log('Preload script loaded');

