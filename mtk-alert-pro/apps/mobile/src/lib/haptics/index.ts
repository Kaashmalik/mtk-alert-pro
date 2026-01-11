/**
 * Haptic Feedback Service
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const HAPTICS_ENABLED_KEY = 'haptics_enabled';
let enabled = true;

export async function initializeHaptics(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
    enabled = stored !== 'false';
  } catch (error) {
    console.warn('[Haptics] Failed to load settings');
  }
}

export function isHapticsEnabled(): boolean {
  return enabled && Platform.OS !== 'web';
}

export async function setHapticsEnabled(value: boolean): Promise<void> {
  enabled = value;
  await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, value ? 'true' : 'false');
}

export function triggerHaptic(type: HapticType = 'light'): void {
  if (!isHapticsEnabled()) return;

  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    // Silently fail on unsupported devices
  }
}

// Convenience functions
export const hapticButtonPress = () => triggerHaptic('light');
export const hapticPrimaryAction = () => triggerHaptic('medium');
export const hapticSuccess = () => triggerHaptic('success');
export const hapticError = () => triggerHaptic('error');
export const hapticWarning = () => triggerHaptic('warning');
export const hapticSelection = () => triggerHaptic('selection');
export const hapticToggle = () => triggerHaptic('medium');
export const hapticNotification = () => {
  triggerHaptic('medium');
  setTimeout(() => triggerHaptic('light'), 150);
};

