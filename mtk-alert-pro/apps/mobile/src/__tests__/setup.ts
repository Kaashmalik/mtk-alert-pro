/**
 * Jest Test Setup
 * This file runs before each test file
 */

import '@testing-library/jest-native/extend-expect';

// ============================================================================
// Global Mocks
// ============================================================================

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/',
  cacheDirectory: '/mock/cache/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  readAsStringAsync: jest.fn().mockResolvedValue('mock-file-content'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  downloadAsync: jest.fn().mockResolvedValue({ status: 200, uri: '/mock/file.mp4' }),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  setNotificationHandler: jest.fn(),
  getNotificationChannelsAsync: jest.fn().mockResolvedValue([]),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  presentNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  dismissAllNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 },
  AndroidNotificationVisibility: { PUBLIC: 0, PRIVATE: 1, SECRET: 2 },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          stopAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
          setVolumeAsync: jest.fn().mockResolvedValue(undefined),
          setIsMutedAsync: jest.fn().mockResolvedValue(undefined),
          getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false }),
        },
        status: { isLoaded: true },
      }),
    },
  },
  Video: jest.fn(),
  ResizeMode: {
    CONTAIN: 'contain',
    COVER: 'cover',
  },
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1, 2]),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// Mock expo-task-manager
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
  unregisterAllTasksAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-background-fetch
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
  getStatusAsync: jest.fn().mockResolvedValue(3), // Available
  BackgroundFetchStatus: {
    Denied: 1,
    Restricted: 2,
    Available: 3,
  },
  BackgroundFetchResult: {
    NoData: 1,
    NewData: 2,
    Failed: 3,
  },
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => {
  const NetInfoStateType = {
    unknown: 'unknown',
    none: 'none',
    wifi: 'wifi',
    cellular: 'cellular',
    bluetooth: 'bluetooth',
    ethernet: 'ethernet',
    wimax: 'wimax',
    vpn: 'vpn',
    other: 'other',
  };
  
  return {
    fetch: jest.fn().mockResolvedValue({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
      details: { isConnectionExpensive: false },
    }),
    addEventListener: jest.fn().mockImplementation((callback) => {
      // Call callback immediately with initial state
      setTimeout(() => {
        callback({
          isConnected: true,
          type: 'wifi',
          isInternetReachable: true,
          details: { isConnectionExpensive: false },
        });
      }, 0);
      return jest.fn(); // unsubscribe function
    }),
    NetInfoStateType,
    default: {
      fetch: jest.fn().mockResolvedValue({
        isConnected: true,
        type: 'wifi',
        details: { isConnectionExpensive: false },
      }),
      addEventListener: jest.fn().mockReturnValue(jest.fn()),
      NetInfoStateType,
    },
  };
});

// Mock @tensorflow/tfjs
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(undefined),
  getBackend: jest.fn().mockReturnValue('cpu'),
  setBackend: jest.fn().mockResolvedValue(undefined),
  loadGraphModel: jest.fn().mockResolvedValue({
    executeAsync: jest.fn().mockResolvedValue([
      { array: jest.fn().mockResolvedValue([[[0.1, 0.1, 0.9, 0.9]]]), dispose: jest.fn() },
      { array: jest.fn().mockResolvedValue([[0]]), dispose: jest.fn() },
      { array: jest.fn().mockResolvedValue([[0.85]]), dispose: jest.fn() },
      { data: jest.fn().mockResolvedValue([1]), dispose: jest.fn() },
    ]),
    dispose: jest.fn(),
  }),
  zeros: jest.fn().mockReturnValue({ dispose: jest.fn() }),
  image: {
    resizeBilinear: jest.fn().mockReturnValue({ 
      div: jest.fn().mockReturnValue({ 
        expandDims: jest.fn().mockReturnValue({ dispose: jest.fn() }),
        dispose: jest.fn() 
      }),
      dispose: jest.fn() 
    }),
  },
  util: {
    encodeString: jest.fn().mockReturnValue({ buffer: new ArrayBuffer(100) }),
  },
  memory: jest.fn().mockReturnValue({ numTensors: 0 }),
  disposeVariables: jest.fn(),
}));

// Mock @tensorflow/tfjs-react-native
jest.mock('@tensorflow/tfjs-react-native', () => ({
  bundleResourceIO: jest.fn(),
  decodeJpeg: jest.fn().mockReturnValue({
    dispose: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.mp4' } }),
        remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    },
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
  },
  isSupabaseConfigured: true,
}));

// Mock React Native Vibration
jest.mock('react-native/Libraries/Vibration/Vibration', () => ({
  vibrate: jest.fn(),
  cancel: jest.fn(),
}));

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock console.error to fail tests on unexpected errors
const originalError = console.error;
console.error = (...args) => {
  // Allow expected errors in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('[Expected]') || args[0].includes('Warning:'))
  ) {
    return;
  }
  originalError.apply(console, args);
};

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Create a mock camera object
 */
export function createMockCamera(overrides = {}) {
  return {
    id: 'camera-1',
    userId: 'user-1',
    name: 'Test Camera',
    rtspUrl: 'rtsp://192.168.1.100:554/stream',
    username: 'admin',
    password: 'password123',
    isActive: true,
    thumbnailUrl: undefined,
    detectionSettings: {
      person: true,
      vehicle: true,
      face: false,
      sensitivity: 0.7,
      notificationsEnabled: true,
      alarmEnabled: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock alert object
 */
export function createMockAlert(overrides = {}) {
  return {
    id: 'alert-1',
    cameraId: 'camera-1',
    userId: 'user-1',
    type: 'person' as const,
    confidence: 0.85,
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

// Export for use in tests
export { originalError };

