import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Menu handlers
  onMenuNewCard: (callback: () => void) => {
    ipcRenderer.on('menu-new-card', callback);
  },
  onMenuImport: (callback: () => void) => {
    ipcRenderer.on('menu-import', callback);
  },
  onMenuReview: (callback: () => void) => {
    ipcRenderer.on('menu-review', callback);
  },
  onMenuSync: (callback: () => void) => {
    ipcRenderer.on('menu-sync', callback);
  },
  onMenuAbout: (callback: () => void) => {
    ipcRenderer.on('menu-about', callback);
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // App info
  platform: process.platform,
});