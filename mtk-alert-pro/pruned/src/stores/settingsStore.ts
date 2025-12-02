import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

interface SettingsState extends AppSettings {
  setNotifications: (settings: Partial<AppSettings['notifications']>) => void;
  setDetection: (settings: Partial<AppSettings['detection']>) => void;
  setDisplay: (settings: Partial<AppSettings['display']>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
  detection: {
    redAlertMode: false,
    cooldownSeconds: 30,
  },
  display: {
    theme: 'system',
    streamQuality: '720p',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setNotifications: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        })),

      setDetection: (settings) =>
        set((state) => ({
          detection: { ...state.detection, ...settings },
        })),

      setDisplay: (settings) =>
        set((state) => ({
          display: { ...state.display, ...settings },
        })),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
