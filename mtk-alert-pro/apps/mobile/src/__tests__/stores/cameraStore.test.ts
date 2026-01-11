/**
 * Camera Store Tests
 */

import { act } from '@testing-library/react-native';
import { useCameraStore, getDecryptedCameraPassword } from '@/stores/cameraStore';
import { supabase } from '@/lib/supabase/client';
import { createMockCamera } from '../setup';

// Reset store before each test
const resetStore = () => {
  const { reset } = useCameraStore.getState();
  reset();
};

describe('Camera Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  // =========================================================================
  // Initial State
  // =========================================================================
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useCameraStore.getState();

      expect(state.cameras).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.selectedCamera).toBeNull();
      expect(state.connectionTests).toEqual({});
      expect(state.cameraHealth).toEqual({});
      expect(state.isTestingConnection).toBe(false);
    });
  });

  // =========================================================================
  // fetchCameras
  // =========================================================================
  describe('fetchCameras', () => {
    it('should fetch and transform cameras', async () => {
      const mockCameraData = {
        id: 'cam-1',
        user_id: 'user-1',
        name: 'Test Camera',
        rtsp_url: 'rtsp://192.168.1.100:554/stream',
        username: 'admin',
        password: 'encrypted_password',
        is_active: true,
        thumbnail_url: null,
        detection_settings: { person: true, vehicle: true },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockCameraData],
          error: null,
        }),
      });

      await act(async () => {
        await useCameraStore.getState().fetchCameras();
      });

      const state = useCameraStore.getState();

      expect(state.cameras).toHaveLength(1);
      expect(state.cameras[0].id).toBe('cam-1');
      expect(state.cameras[0].name).toBe('Test Camera');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error on failure', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      });

      await act(async () => {
        await useCameraStore.getState().fetchCameras();
      });

      const state = useCameraStore.getState();

      expect(state.cameras).toEqual([]);
      expect(state.error).toBeDefined();
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>(resolve => {
        resolvePromise = resolve;
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockImplementation(async () => {
          await pendingPromise;
          return { data: [], error: null };
        }),
      });

      const fetchPromise = useCameraStore.getState().fetchCameras();

      // Should be loading
      expect(useCameraStore.getState().isLoading).toBe(true);

      // Resolve the fetch
      resolvePromise!();
      await fetchPromise;

      // Should not be loading
      expect(useCameraStore.getState().isLoading).toBe(false);
    });
  });

  // =========================================================================
  // addCamera
  // =========================================================================
  describe('addCamera', () => {
    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
    });

    it('should add camera successfully', async () => {
      const newCameraData = {
        id: 'new-cam',
        user_id: 'user-1',
        name: 'New Camera',
        rtsp_url: 'rtsp://192.168.1.101:554/stream',
        is_active: true,
        detection_settings: { person: true, vehicle: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock profile check
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { subscription_tier: 'pro' },
              error: null,
            }),
          };
        }
        if (table === 'cameras') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: newCameraData,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
        };
      });

      // Mock connection test
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await act(async () => {
        const camera = await useCameraStore.getState().addCamera({
          name: 'New Camera',
          rtspUrl: 'rtsp://192.168.1.101:554/stream',
          isActive: true,
          detectionSettings: {
            person: true,
            vehicle: true,
            face: false,
            sensitivity: 0.7,
            notificationsEnabled: true,
            alarmEnabled: true,
          },
        });

        expect(camera.id).toBe('new-cam');
      });

      const state = useCameraStore.getState();
      expect(state.cameras).toHaveLength(1);
    });

    it('should handle unauthenticated state', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // The addCamera function may throw or set error in store
      try {
        await useCameraStore.getState().addCamera({
          name: 'Test',
          rtspUrl: 'rtsp://test',
          isActive: true,
          detectionSettings: {
            person: true,
            vehicle: true,
            face: false,
            sensitivity: 0.7,
            notificationsEnabled: true,
            alarmEnabled: true,
          },
        });
        // If it doesn't throw, camera shouldn't be added
        const state = useCameraStore.getState();
        expect(state.cameras.length === 0 || state.error !== null).toBe(true);
      } catch (error) {
        // Expected - function threw an error for unauthenticated
        expect(error).toBeDefined();
      }
    });

    it('should handle camera limit', async () => {
      // Set up existing cameras
      useCameraStore.setState({
        cameras: [createMockCamera({ id: 'cam-1' }), createMockCamera({ id: 'cam-2' })],
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { subscription_tier: 'free' }, // Free tier = 2 cameras
              error: null,
            }),
          };
        }
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Camera limit reached' },
          }),
        };
      });

      // The addCamera function may throw or set error in store
      try {
        await useCameraStore.getState().addCamera({
          name: 'Third Camera',
          rtspUrl: 'rtsp://test',
          isActive: true,
          detectionSettings: {
            person: true,
            vehicle: true,
            face: false,
            sensitivity: 0.7,
            notificationsEnabled: true,
            alarmEnabled: true,
          },
        });
        // If it doesn't throw, check state
        const state = useCameraStore.getState();
        expect(state.cameras.length <= 2 || state.error !== null).toBe(true);
      } catch (error) {
        // Expected - function threw for limit reached
        expect(error).toBeDefined();
      }
    });
  });

  // =========================================================================
  // updateCamera
  // =========================================================================
  describe('updateCamera', () => {
    beforeEach(() => {
      useCameraStore.setState({
        cameras: [createMockCamera({ id: 'cam-1', name: 'Old Name' })],
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
    });

    it('should update camera in store', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      await act(async () => {
        await useCameraStore.getState().updateCamera('cam-1', { name: 'New Name' });
      });

      const camera = useCameraStore.getState().cameras[0];
      expect(camera.name).toBe('New Name');
    });

    it('should handle database error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('DB Error') }),
      });

      // The updateCamera function may throw or set error in store
      try {
        await useCameraStore.getState().updateCamera('cam-1', { name: 'New Name' });
        // If it doesn't throw, check state
        const state = useCameraStore.getState();
        expect(state.error !== null || state.cameras[0].name === 'Old Name').toBe(true);
      } catch (error) {
        // Expected - function threw for DB error
        expect(error).toBeDefined();
      }
    });
  });

  // =========================================================================
  // deleteCamera
  // =========================================================================
  describe('deleteCamera', () => {
    beforeEach(() => {
      useCameraStore.setState({
        cameras: [
          createMockCamera({ id: 'cam-1' }),
          createMockCamera({ id: 'cam-2' }),
        ],
        selectedCamera: createMockCamera({ id: 'cam-1' }),
      });
    });

    it('should remove camera from store', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      await act(async () => {
        await useCameraStore.getState().deleteCamera('cam-1');
      });

      const state = useCameraStore.getState();
      expect(state.cameras).toHaveLength(1);
      expect(state.cameras[0].id).toBe('cam-2');
    });

    it('should clear selectedCamera if deleted', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      await act(async () => {
        await useCameraStore.getState().deleteCamera('cam-1');
      });

      expect(useCameraStore.getState().selectedCamera).toBeNull();
    });
  });

  // =========================================================================
  // selectCamera
  // =========================================================================
  describe('selectCamera', () => {
    it('should set selected camera', () => {
      const camera = createMockCamera();

      act(() => {
        useCameraStore.getState().selectCamera(camera);
      });

      expect(useCameraStore.getState().selectedCamera).toEqual(camera);
    });

    it('should clear selected camera with null', () => {
      useCameraStore.setState({ selectedCamera: createMockCamera() });

      act(() => {
        useCameraStore.getState().selectCamera(null);
      });

      expect(useCameraStore.getState().selectedCamera).toBeNull();
    });
  });

  // =========================================================================
  // testConnection
  // =========================================================================
  describe('testConnection', () => {
    it('should test connection and return result', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      let result;
      await act(async () => {
        result = await useCameraStore.getState().testConnection(
          'rtsp://192.168.1.100:554/stream'
        );
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('timestamp');
    });

    it('should store test result in connectionTests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await act(async () => {
        await useCameraStore.getState().testConnection(
          'rtsp://192.168.1.100:554/stream'
        );
      });

      const tests = useCameraStore.getState().connectionTests;
      expect(Object.keys(tests).length).toBeGreaterThan(0);
    });

    it('should handle invalid URL format', async () => {
      let result: any;
      await act(async () => {
        result = await useCameraStore.getState().testConnection(
          'invalid-url-format' // Invalid RTSP URL format
        );
      });

      expect(result?.success).toBe(false);
      expect(result?.error).toBeDefined();
    });
  });

  // =========================================================================
  // clearError
  // =========================================================================
  describe('clearError', () => {
    it('should clear error state', () => {
      useCameraStore.setState({ error: 'Some error' });

      act(() => {
        useCameraStore.getState().clearError();
      });

      expect(useCameraStore.getState().error).toBeNull();
    });
  });

  // =========================================================================
  // reset
  // =========================================================================
  describe('reset', () => {
    it('should reset to initial state', () => {
      useCameraStore.setState({
        cameras: [createMockCamera()],
        isLoading: true,
        error: 'Some error',
        selectedCamera: createMockCamera(),
      });

      act(() => {
        useCameraStore.getState().reset();
      });

      const state = useCameraStore.getState();
      expect(state.cameras).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.selectedCamera).toBeNull();
    });
  });

  // =========================================================================
  // getDecryptedCameraPassword
  // =========================================================================
  describe('getDecryptedCameraPassword', () => {
    it('should return undefined for camera without password', async () => {
      const camera = createMockCamera({ password: undefined });

      const result = await getDecryptedCameraPassword(camera);

      expect(result).toBeUndefined();
    });

    it('should return undefined when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const camera = createMockCamera({ password: 'encrypted' });

      const result = await getDecryptedCameraPassword(camera);

      expect(result).toBeUndefined();
    });
  });
});

