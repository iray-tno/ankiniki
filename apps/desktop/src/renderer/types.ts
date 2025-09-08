// Extend global Window interface for Electron API
declare global {
  interface Window {
    electronAPI?: {
      onMenuNewCard: (callback: () => void) => void;
      onMenuImport: (callback: () => void) => void;
      onMenuReview: (callback: () => void) => void;
      onMenuSync: (callback: () => void) => void;
      onMenuAbout: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
      platform: string;
    };
  }
}

export {};
