const { ipcRenderer } = require('electron');

console.log('🚀 Preload script loaded!');

// Since contextIsolation is disabled, we can directly assign to window
window.electronAPI = {
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
};

// Also expose a simple flag for detection
window.isElectronApp = true;

console.log('✅ Preload script setup complete!');
console.log('  window.isElectronApp:', window.isElectronApp);
console.log('  window.electronAPI:', window.electronAPI);