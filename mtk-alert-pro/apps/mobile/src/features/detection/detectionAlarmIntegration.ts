/**
 * Detection-Alarm Integration
 * Connects detection events to alarm system with red alert mode support
 */

import { alarmService } from '@/lib/audio/alarmService';
import { useSettingsStore } from '@/stores/settingsStore';
import { hapticNotification } from '@/lib/haptics';
import type { DetectionResult, AlarmSoundType } from '@/types';

export interface DetectionAlarmConfig {
    enabled: boolean;
    redAlertMode: boolean;
    alarmSound: AlarmSoundType;
    alarmVolume: number;
    repeatAlarm: boolean;
    repeatCount: number;
}

/**
 * Handle detection event and trigger alarm if needed
 */
export async function handleDetectionAlarm(
    detections: DetectionResult[],
    cameraId: string,
    cameraSettings?: {
        alarmEnabled: boolean;
        notificationsEnabled: boolean;
    }
): Promise<void> {
    if (detections.length === 0) return;

    // Get current settings
    const settings = useSettingsStore.getState();
    const { notifications, detection } = settings;

    // Check if alarms are enabled globally
    if (!notifications.enabled || !notifications.sound) {
        return;
    }

    // Check camera-specific alarm settings if provided
    if (cameraSettings && !cameraSettings.alarmEnabled) {
        console.log('[DetectionAlarm] Camera alarm disabled, skipping');
        return;
    }

    // Determine if this is a high-priority detection
    const hasPersonDetection = detections.some(d => d.type === 'person' && d.confidence >= 0.60);
    const hasVehicleDetection = detections.some(d => d.type === 'vehicle' && d.confidence >= 0.65);

    // Red alert mode: immediate alarm for any detection
    if (detection.redAlertMode) {
        await triggerAlarm({
            enabled: true,
            redAlertMode: true,
            alarmSound: notifications.alarmSound,
            alarmVolume: notifications.alarmVolume,
            repeatAlarm: notifications.repeatAlarm,
            repeatCount: notifications.repeatCount,
        });
        return;
    }

    // Normal mode: alarm only for high-confidence detections
    if (hasPersonDetection || hasVehicleDetection) {
        await triggerAlarm({
            enabled: true,
            redAlertMode: false,
            alarmSound: notifications.alarmSound,
            alarmVolume: notifications.alarmVolume,
            repeatAlarm: notifications.repeatAlarm,
            repeatCount: notifications.repeatCount,
        });
    } else {
        // Low-priority detection: just haptic feedback
        hapticNotification();
    }
}

/**
 * Trigger alarm with configuration
 */
async function triggerAlarm(config: DetectionAlarmConfig): Promise<void> {
    try {
        // Play haptic feedback
        hapticNotification();

        // Play alarm sound
        await alarmService.playAlarm(
            config.alarmSound,
            {
                volume: config.alarmVolume,
                repeat: config.repeatAlarm,
                repeatCount: config.repeatCount,
            }
        );

        console.log('[DetectionAlarm] Alarm triggered', {
            sound: config.alarmSound,
            redAlert: config.redAlertMode,
        });
    } catch (error) {
        console.error('[DetectionAlarm] Failed to trigger alarm:', error);
    }
}

/**
 * Stop any currently playing alarm
 */
export async function stopDetectionAlarm(): Promise<void> {
    await alarmService.stopAlarm();
}
