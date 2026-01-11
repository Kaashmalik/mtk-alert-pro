/**
 * Background Tasks
 * Manages background processing for detection and monitoring
 * 
 * @module lib/background/backgroundTasks
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { logError } from '@/lib/utils/errorHandler';
import { useCameraStore } from '@/stores/cameraStore';
import { testCameraConnection } from '@/lib/camera/connectionService';

// ============================================================================
// Task Names
// ============================================================================

export const TASK_NAMES = {
  /** Background detection task */
  DETECTION: 'mtk-background-detection',
  /** Camera health monitoring */
  HEALTH_MONITOR: 'mtk-camera-health-monitor',
  /** Push notification handler */
  NOTIFICATION_HANDLER: 'mtk-notification-handler',
} as const;

// ============================================================================
// Task Definitions
// ============================================================================

/**
 * Define the background detection task
 * This runs periodically when the app is in the background
 */
TaskManager.defineTask(TASK_NAMES.DETECTION, async () => {
  const startTime = Date.now();
  console.log('[BackgroundTask] Detection task started');

  try {
    // Note: Full on-device detection may not work in background on iOS
    // due to memory and processing limitations.
    // 
    // For production, consider:
    // 1. Server-side detection with push notifications
    // 2. On-device detection only when app is foregrounded
    // 3. Using iOS's native CoreML for background detection

    // For now, we'll just check camera health
    const { useCameraStore } = await import('@/stores/cameraStore');
    const cameras = useCameraStore.getState().cameras.filter(c => c.isActive);

    if (cameras.length === 0) {
      console.log('[BackgroundTask] No active cameras');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Check if any cameras are offline
    const { testCameraConnection } = await import('@/lib/camera/connectionService');
    let offlineCount = 0;

    for (const camera of cameras) {
      const result = await testCameraConnection(camera.rtspUrl, {
        timeoutMs: 5000,
        retryCount: 0
      });

      if (!result.success) {
        offlineCount++;
      }
    }

    // Send notification if cameras went offline
    if (offlineCount > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Camera Offline',
          body: `${offlineCount} camera(s) are currently offline`,
          data: { type: 'camera_offline', count: offlineCount },
        },
        trigger: null, // Immediate
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[BackgroundTask] Detection task completed in ${duration}ms`);

    return offlineCount > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundTask] Detection task failed:', error);
    logError(error, 'BackgroundTask.DETECTION');
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Define the notification handler task
 * Handles notification responses when app is in background
 */
TaskManager.defineTask(TASK_NAMES.NOTIFICATION_HANDLER, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundTask] Notification handler error:', error);
    return;
  }

  console.log('[BackgroundTask] Notification handler received:', data);

  // Handle notification data
  // This can be used to process notification actions
});

// ============================================================================
// Registration Functions
// ============================================================================

/**
 * Register background detection task
 * 
 * @returns Whether registration was successful
 */
export async function registerBackgroundDetection(): Promise<boolean> {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAMES.DETECTION);

    if (isRegistered) {
      console.log('[BackgroundTasks] Detection task already registered');
      return true;
    }

    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(TASK_NAMES.DETECTION, {
      minimumInterval: 60 * 15, // 15 minutes (iOS minimum)
      stopOnTerminate: false,   // Keep running after app is terminated
      startOnBoot: true,        // Start on device boot (Android)
    });

    console.log('[BackgroundTasks] Detection task registered');
    return true;
  } catch (error) {
    console.error('[BackgroundTasks] Failed to register detection task:', error);
    logError(error, 'registerBackgroundDetection');
    return false;
  }
}

/**
 * Unregister background detection task
 */
export async function unregisterBackgroundDetection(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAMES.DETECTION);

    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(TASK_NAMES.DETECTION);
      console.log('[BackgroundTasks] Detection task unregistered');
    }
  } catch (error) {
    console.error('[BackgroundTasks] Failed to unregister detection task:', error);
  }
}

/**
 * Check if background detection is registered
 */
export async function isBackgroundDetectionRegistered(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(TASK_NAMES.DETECTION);
}

/**
 * Get background fetch status
 */
export async function getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
  return BackgroundFetch.getStatusAsync();
}

/**
 * Check if background fetch is available
 */
export async function isBackgroundFetchAvailable(): Promise<boolean> {
  const status = await BackgroundFetch.getStatusAsync();
  return status === BackgroundFetch.BackgroundFetchStatus.Available;
}

// ============================================================================
// Task Management
// ============================================================================

/**
 * Initialize all background tasks
 * Call this on app startup
 */
export async function initializeBackgroundTasks(): Promise<void> {
  console.log('[BackgroundTasks] Initializing...');

  try {
    // Check background fetch availability
    const status = await BackgroundFetch.getStatusAsync();
    console.log('[BackgroundTasks] Background fetch status:', status);

    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn('[BackgroundTasks] Background fetch not available');
      return;
    }

    // Register tasks
    await registerBackgroundDetection();

    console.log('[BackgroundTasks] Initialization complete');
  } catch (error) {
    console.error('[BackgroundTasks] Initialization failed:', error);
    logError(error, 'initializeBackgroundTasks');
  }
}

/**
 * Disable all background tasks
 */
export async function disableBackgroundTasks(): Promise<void> {
  console.log('[BackgroundTasks] Disabling...');

  await unregisterBackgroundDetection();

  console.log('[BackgroundTasks] All tasks disabled');
}

/**
 * Get list of registered tasks
 */
export async function getRegisteredTasks(): Promise<string[]> {
  const tasks: string[] = [];

  for (const taskName of Object.values(TASK_NAMES)) {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(taskName);
    if (isRegistered) {
      tasks.push(taskName);
    }
  }

  return tasks;
}

/**
 * Force run background detection (for debugging)
 */
export async function forceRunDetection(): Promise<void> {
  console.log('[BackgroundTasks] Forcing detection run...');

  try {
    // Note: expo-background-fetch doesn't have fetchAsync method
    // Background tasks run automatically on system schedule
    console.log('[BackgroundTasks] Manual trigger not available');
  } catch (error) {
    console.error('[BackgroundTasks] Manual run failed:', error);
  }
}

