/**
 * Camera Store
 * Manages camera state with Zustand
 * 
 * @module stores/cameraStore
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { encryptPassword, decryptPassword, isEncrypted } from '@/lib/crypto';
import {
  testCameraConnection,
  createHealthMonitor,
  type ConnectionTestResult,
  type CameraHealth
} from '@/lib/camera/connectionService';
import { withRetry, logError, createAppError } from '@/lib/utils/errorHandler';
import { reviewManager } from '@/lib/reviews/reviewManager';
import type { Camera, DetectionSettings } from '@/types';

/**
 * Camera store state interface
 */
interface CameraState {
  // State
  cameras: Camera[];
  isLoading: boolean;
  error: string | null;
  selectedCamera: Camera | null;
  connectionTests: Record<string, ConnectionTestResult>;
  cameraHealth: Record<string, CameraHealth>;
  isTestingConnection: boolean;
  isOffline: boolean;
  offlineQueue: QueuedOperation[];

  // Actions
  fetchCameras: () => Promise<void>;
  addCamera: (camera: Omit<Camera, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Camera>;
  updateCamera: (id: string, updates: Partial<Camera>) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  selectCamera: (camera: Camera | null) => void;
  testConnection: (rtspUrl: string) => Promise<ConnectionTestResult>;
  startHealthMonitoring: () => () => void;
  getCameraHealth: (cameraId: string) => CameraHealth | undefined;
  clearError: () => void;
  reset: () => void;
  queueOfflineOperation: (operation: QueuedOperation) => Promise<void>;
  processOfflineQueue: () => Promise<void>;
}

/**
 * Queued offline operation
 */
interface QueuedOperation {
  type: 'add' | 'update' | 'delete';
  id?: string;
  data?: any;
  timestamp: number;
}

/**
 * Initial state
 */
const initialState = {
  cameras: [],
  isLoading: false,
  error: null,
  selectedCamera: null,
  connectionTests: {},
  cameraHealth: {},
  isTestingConnection: false,
  isOffline: false,
  offlineQueue: [],
};

/**
 * Camera Zustand store
 */
export const useCameraStore = create<CameraState>((set, get) => ({
  ...initialState,

  /**
   * Fetch all cameras for the current user
   */
  fetchCameras: async () => {
    if (!isSupabaseConfigured) {
      console.warn('[CameraStore] Supabase not configured - using empty cameras list');
      set({ cameras: [], isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await withRetry(
        async () => {
          const result = await supabase
            .from('cameras')
            .select('*')
            .order('created_at', { ascending: false });

          if (result.error) throw result.error;
          return result;
        },
        { maxRetries: 2 }
      );

      if (error) throw error;

      const cameras: Camera[] = (data || []).map((c) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        rtspUrl: c.rtsp_url,
        username: c.username || undefined,
        // Keep password encrypted in memory for security
        password: c.password || undefined,
        isActive: c.is_active ?? true,
        thumbnailUrl: c.thumbnail_url || undefined,
        detectionSettings: {
          person: true,
          vehicle: true,
          face: false,
          sensitivity: 0.7,
          notificationsEnabled: true,
          alarmEnabled: true,
          ...(c.detection_settings as Partial<DetectionSettings>),
        },
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at || c.created_at),
      }));

      // Cache cameras for offline use
      try {
        await AsyncStorage.setItem('cameras-cache', JSON.stringify(cameras));
      } catch (cacheError) {
        console.warn('[CameraStore] Failed to cache cameras:', cacheError);
      }

      set({ cameras, error: null, isOffline: false });

      // Process offline queue when back online
      await get().processOfflineQueue();
    } catch (error) {
      console.error('[CameraStore] Fetch failed:', error);

      // Try to load from cache on error
      try {
        const cached = await AsyncStorage.getItem('cameras-cache');
        if (cached) {
          const cachedCameras: Camera[] = JSON.parse(cached);
          set({
            cameras: cachedCameras,
            isLoading: false,
            isOffline: true,
            error: 'Using cached data - offline mode'
          });
          return;
        }
      } catch (cacheError) {
        console.warn('[CameraStore] Failed to load from cache:', cacheError);
      }

      const message = error instanceof Error ? error.message : 'Failed to fetch cameras';
      logError(error, 'CameraStore.fetchCameras');
      set({ error: message, isLoading: false, isOffline: true });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Add a new camera
   */
  addCamera: async (cameraData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw createAppError('AUTH_ERROR', 'User not authenticated');
    }

    const { cameras } = get();

    // Check subscription limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';
    const limits: Record<string, number> = { free: 2, pro: 100, business: 100 };

    if (cameras.length >= limits[tier]) {
      throw createAppError(
        'QUOTA_EXCEEDED',
        `Camera limit reached for ${tier} tier`,
        { userMessage: `Camera limit reached (${limits[tier]}). Upgrade to Pro for unlimited cameras.` }
      );
    }

    // Encrypt password before storing
    let encryptedPassword: string | undefined;
    if (cameraData.password) {
      try {
        encryptedPassword = encryptPassword(cameraData.password, user.id);
      } catch (error) {
        logError(error, 'CameraStore.addCamera.encryptPassword');
        // Store as plain text if encryption fails (shouldn't happen)
        encryptedPassword = cameraData.password;
      }
    }

    // Validate RTSP URL format before saving
    const connectionTest = await get().testConnection(cameraData.rtspUrl);
    const isActive = connectionTest.success;

    const { data, error } = await supabase
      .from('cameras')
      .insert({
        user_id: user.id,
        name: cameraData.name,
        rtsp_url: cameraData.rtspUrl,
        username: cameraData.username,
        password: encryptedPassword,
        is_active: isActive,
        detection_settings: cameraData.detectionSettings,
      })
      .select()
      .single();

    if (error) {
      logError(error, 'CameraStore.addCamera');
      throw createAppError('CAMERA_ERROR', error.message);
    }

    const newCamera: Camera = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      rtspUrl: data.rtsp_url,
      username: data.username || undefined,
      password: data.password || undefined,
      isActive: data.is_active,
      thumbnailUrl: data.thumbnail_url || undefined,
      detectionSettings: data.detection_settings as DetectionSettings,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set({ cameras: [newCamera, ...get().cameras] });

    // Trigger happy moment for ASO review
    reviewManager.onHappyMoment('camera-added');

    return newCamera;
  },

  /**
   * Update an existing camera
   */
  updateCamera: async (id, updates) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Handle password encryption for updates
    let processedUpdates = { ...updates };
    if (updates.password && user) {
      try {
        // Only encrypt if not already encrypted
        if (!isEncrypted(updates.password)) {
          processedUpdates.password = encryptPassword(updates.password, user.id);
        }
      } catch (error) {
        logError(error, 'CameraStore.updateCamera.encryptPassword');
      }
    }

    const { error } = await supabase
      .from('cameras')
      .update({
        name: processedUpdates.name,
        rtsp_url: processedUpdates.rtspUrl,
        username: processedUpdates.username,
        password: processedUpdates.password,
        is_active: processedUpdates.isActive,
        detection_settings: processedUpdates.detectionSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      logError(error, 'CameraStore.updateCamera');
      throw createAppError('CAMERA_ERROR', error.message);
    }

    set({
      cameras: get().cameras.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
      ),
    });
  },

  /**
   * Delete a camera
   */
  deleteCamera: async (id) => {
    const { error } = await supabase.from('cameras').delete().eq('id', id);

    if (error) {
      logError(error, 'CameraStore.deleteCamera');
      throw createAppError('CAMERA_ERROR', error.message);
    }

    set({
      cameras: get().cameras.filter((c) => c.id !== id),
      selectedCamera: get().selectedCamera?.id === id ? null : get().selectedCamera,
    });
  },

  /**
   * Select a camera for viewing
   */
  selectCamera: (camera) => set({ selectedCamera: camera }),

  /**
   * Test camera connection
   * Now uses real network testing instead of just URL validation
   */
  testConnection: async (rtspUrl: string): Promise<ConnectionTestResult> => {
    set({ isTestingConnection: true });

    try {
      const result = await testCameraConnection(rtspUrl, {
        timeoutMs: 5000,
        retryCount: 1,
      });

      // Store the test result
      const parsed = new URL(rtspUrl.replace('rtsp://', 'http://'));
      const key = `${parsed.hostname}:${parsed.port || '554'}`;

      set(state => ({
        connectionTests: {
          ...state.connectionTests,
          [key]: result,
        },
      }));

      return result;
    } catch (error) {
      logError(error, 'CameraStore.testConnection');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date(),
      };
    } finally {
      set({ isTestingConnection: false });
    }
  },

  /**
   * Start health monitoring for all cameras
   * Returns a cleanup function to stop monitoring
   */
  startHealthMonitoring: () => {
    const { cameras } = get();

    if (cameras.length === 0) {
      return () => { }; // No cameras to monitor
    }

    const cleanup = createHealthMonitor(
      cameras.map(c => ({ id: c.id, rtspUrl: c.rtspUrl })),
      (cameraId, health) => {
        // Update health state
        set(state => ({
          cameraHealth: {
            ...state.cameraHealth,
            [cameraId]: health,
          },
        }));

        // Update camera active status if changed
        const camera = get().cameras.find(c => c.id === cameraId);
        if (camera && camera.isActive !== health.isOnline) {
          // Update locally without hitting the database every time
          set(state => ({
            cameras: state.cameras.map(c =>
              c.id === cameraId ? { ...c, isActive: health.isOnline } : c
            ),
          }));
        }
      },
      30000 // Check every 30 seconds
    );

    return cleanup;
  },

  /**
   * Get health info for a specific camera
   */
  getCameraHealth: (cameraId: string) => {
    return get().cameraHealth[cameraId];
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store to initial state
   */
  reset: () => set(initialState),

  /**
   * Queue an operation for when offline
   */
  queueOfflineOperation: async (operation: QueuedOperation) => {
    const queue = get().offlineQueue;
    const updatedQueue = [...queue, { ...operation, timestamp: Date.now() }];
    set({ offlineQueue: updatedQueue });

    // Persist queue to AsyncStorage
    try {
      await AsyncStorage.setItem('camera-offline-queue', JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('[CameraStore] Failed to persist offline queue:', error);
    }
  },

  /**
   * Process queued operations when back online
   */
  processOfflineQueue: async () => {
    const queue = get().offlineQueue;
    if (queue.length === 0) return;

    console.log(`[CameraStore] Processing ${queue.length} queued operations`);

    for (const operation of queue) {
      try {
        if (operation.type === 'add' && operation.data) {
          // Retry add operation
          await get().addCamera(operation.data);
        } else if (operation.type === 'update' && operation.id) {
          // Retry update operation
          await get().updateCamera(operation.id, operation.data);
        } else if (operation.type === 'delete' && operation.id) {
          // Retry delete operation
          await get().deleteCamera(operation.id);
        }
      } catch (error) {
        console.error('[CameraStore] Failed to process queued operation:', error);
      }
    }

    // Clear queue
    set({ offlineQueue: [] });
    try {
      await AsyncStorage.removeItem('camera-offline-queue');
    } catch (error) {
      console.error('[CameraStore] Failed to clear offline queue:', error);
    }
  },
}));

/**
 * Helper to get decrypted password for a camera
 * Use this when you need the actual password for camera authentication
 */
export async function getDecryptedCameraPassword(
  camera: Camera
): Promise<string | undefined> {
  if (!camera.password) return undefined;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    // If it looks encrypted, decrypt it
    if (isEncrypted(camera.password)) {
      return decryptPassword(camera.password, user.id);
    }

    // Return as-is if not encrypted (legacy data)
    return camera.password;
  } catch (error) {
    logError(error, 'getDecryptedCameraPassword');
    return undefined;
  }
}
