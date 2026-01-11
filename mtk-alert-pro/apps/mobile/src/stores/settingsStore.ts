import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

interface SettingsState extends AppSettings {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setNotifications: (settings: Partial<AppSettings['notifications']>) => void;
  setDetection: (settings: Partial<AppSettings['detection']>) => void;
  setDisplay: (settings: Partial<AppSettings['display']>) => void;
  setSecurity: (settings: Partial<AppSettings['security']>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  notifications: {
    enabled: true,
    push: true,
    sound: true,
    vibration: true,
    // Sound settings
    alarmSound: 'alert',
    alarmVolume: 0.8,
    repeatAlarm: true,
    repeatCount: 3,
  },
  detection: {
    redAlertMode: false,
    cooldownSeconds: 30,
  },
  display: {
    theme: 'system',
    streamQuality: '720p',
  },
  security: {
    biometricEnabled: false,
    autoLock: false,
    autoLockTimeout: 300, // 5 minutes
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      theme: 'system',

      setTheme: (theme) => set({ theme }),

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

      setSecurity: (settings) =>
        set((state) => ({
          security: { ...state.security, ...settings },
        })),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
