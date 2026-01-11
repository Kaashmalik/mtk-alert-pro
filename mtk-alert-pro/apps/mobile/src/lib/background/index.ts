/**
 * Background tasks module exports
 */

export {
  TASK_NAMES,
  registerBackgroundDetection,
  unregisterBackgroundDetection,
  isBackgroundDetectionRegistered,
  getBackgroundFetchStatus,
  isBackgroundFetchAvailable,
  initializeBackgroundTasks,
  disableBackgroundTasks,
  getRegisteredTasks,
  forceRunDetection,
} from './backgroundTasks';

