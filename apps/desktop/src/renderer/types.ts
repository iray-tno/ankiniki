export interface AppSettings {
  ankiConnectUrl: string;
  theme: string;
  autoSync: boolean;
  newCardsPerDay: number;
  reviewCardsPerDay: number;
}

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
      settings: {
        get: () => Promise<AppSettings>;
        set: (settings: Partial<AppSettings>) => Promise<void>;
      };
    };
  }
}

export {};
