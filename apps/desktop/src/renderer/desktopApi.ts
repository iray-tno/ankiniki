import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { AppSettings } from './types';

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

const STORAGE_KEY = 'ankiniki-settings';
const DEFAULT_SETTINGS: AppSettings = {
  ankiConnectUrl: 'http://localhost:8765',
  theme: 'system',
  autoSync: true,
  newCardsPerDay: 20,
  reviewCardsPerDay: 200,
};

export const desktopApi = {
  settings: {
    get: async (): Promise<AppSettings> => {
      if (isTauri()) {
        return invoke<AppSettings>('get_settings');
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
          : DEFAULT_SETTINGS;
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
    set: async (settings: Partial<AppSettings>): Promise<void> => {
      if (isTauri()) {
        await invoke('set_settings', { newSettings: settings });
        return;
      }
      try {
        const current = await desktopApi.settings.get();
        const merged = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Ignore fallback storage write error
      }
    },
  },
  menu: {
    onNewCard: (callback: () => void): Promise<UnlistenFn> => {
      if (isTauri()) {
        return listen('menu-new-card', callback);
      }
      return Promise.resolve(() => {});
    },
    onImport: (callback: () => void): Promise<UnlistenFn> => {
      if (isTauri()) {
        return listen('menu-import', callback);
      }
      return Promise.resolve(() => {});
    },
    onReview: (callback: () => void): Promise<UnlistenFn> => {
      if (isTauri()) {
        return listen('menu-review', callback);
      }
      return Promise.resolve(() => {});
    },
    onSync: (callback: () => void): Promise<UnlistenFn> => {
      if (isTauri()) {
        return listen('menu-sync', callback);
      }
      return Promise.resolve(() => {});
    },
    onAbout: (callback: () => void): Promise<UnlistenFn> => {
      if (isTauri()) {
        return listen('menu-about', callback);
      }
      return Promise.resolve(() => {});
    },
  },
};
