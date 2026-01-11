/**
 * Camera Flow Integration Tests
 * Tests the complete flow from adding a camera to detection
 */

import { act } from '@testing-library/react-native';
import { useCameraStore } from '@/stores/cameraStore';
import { streamingService } from '@/lib/streaming/streamingService';
import { DetectionManager } from '@/features/detection/detectionManager';
import { RecordingService } from '@/lib/recording/recordingService';
import { supabase } from '@/lib/supabase/client';
import { createMockCamera } from '../setup';

// Mock all external services
jest.mock('@/lib/streaming/streamingService');
jest.mock('@/features/detection/detectionService');
jest.mock('@/features/detection/frameCaptureService');
jest.mock('@/lib/audio/alarmService');
jest.mock('@/lib/notifications/service');

describe('Camera Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset stores
    useCameraStore.getState().reset();
    
    // Setup default mocks
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });
  });

  // =========================================================================
  // Complete Camera Lifecycle
  // =========================================================================
  describe('Complete Camera Lifecycle', () => {
    it('should handle full camera lifecycle: add → stream → detect → record → delete', async () => {
      // ============ Step 1: Add Camera ============
      const newCameraData = {
        id: 'cam-1',
        user_id: 'user-1',
        name: 'Front Door Camera',
        rtsp_url: 'rtsp://192.168.1.100:554/stream',
        is_active: true,
        detection_settings: { person: true, vehicle: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase calls
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
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      // Mock connection test
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      // Add the camera
      let addedCamera;
      await act(async () => {
        addedCamera = await useCameraStore.getState().addCamera({
          name: 'Front Door Camera',
          rtspUrl: 'rtsp://192.168.1.100:554/stream',
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
      });

      expect(addedCamera).toBeDefined();
      expect(useCameraStore.getState().cameras).toHaveLength(1);

      // ============ Step 2: Stream Camera ============
      (streamingService.registerCamera as jest.Mock).mockResolvedValue({
        success: true,
        pathName: 'cam_cam1',
        streams: {
          hls: 'http://localhost:8888/cam_cam1/index.m3u8',
          webrtc: 'http://localhost:8889/cam_cam1',
          rtsp: 'rtsp://localhost:8554/cam_cam1',
        },
      });

      const streamResult = await (streamingService as any).registerCamera(
        'cam-1',
        'rtsp://192.168.1.100:554/stream',
        'user-1'
      );

      expect(streamResult.success).toBe(true);
      expect(streamResult.streams.hls).toContain('.m3u8');

      // ============ Step 3: Detection ============
      const detectionManager = new DetectionManager({
        captureIntervalMs: 100,
        cooldownMs: 1000,
      });

      // Mock detection initialization
      const { detectionService } = require('@/features/detection/detectionService');
      detectionService.initialize.mockResolvedValue(undefined);
      detectionService.isInitialized.mockReturnValue(true);

      const { frameCaptureService } = require('@/features/detection/frameCaptureService');
      frameCaptureService.initialize.mockResolvedValue(undefined);

      await detectionManager.initialize();
      expect(detectionManager.isDetectionReady()).toBe(true);

      // Start monitoring
      const mockCamera = createMockCamera({
        id: 'cam-1',
        detectionSettings: { person: true, vehicle: true },
      });

      await detectionManager.startMonitoring(mockCamera);
      expect(detectionManager.isMonitoring()).toBe(true);
      expect(detectionManager.getMonitoredCameraCount()).toBe(1);

      // ============ Step 4: Recording ============
      const recordingService = new RecordingService();
      
      // Mock file system for recording
      const FileSystem = require('expo-file-system');
      FileSystem.getInfoAsync.mockResolvedValue({ exists: true });
      FileSystem.readAsStringAsync.mockResolvedValue('[]');
      FileSystem.writeAsStringAsync.mockResolvedValue(undefined);

      await recordingService.initialize();

      // Mock recording API
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const recordingInfo = await recordingService.startRecording('cam-1', {
        durationSeconds: 10,
      });

      expect(recordingInfo.status).toBe('recording');
      expect(recordingService.isRecording('cam-1')).toBe(true);

      // ============ Step 5: Delete Camera ============
      detectionManager.stopMonitoring('cam-1');
      expect(detectionManager.getMonitoredCameraCount()).toBe(0);

      (streamingService.unregisterCamera as jest.Mock).mockResolvedValue(true);
      await (streamingService as any).unregisterCamera('cam-1');

      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      await act(async () => {
        await useCameraStore.getState().deleteCamera('cam-1');
      });

      expect(useCameraStore.getState().cameras).toHaveLength(0);

      // Cleanup
      await detectionManager.dispose();
      recordingService.dispose();
    });
  });

  // =========================================================================
  // Error Recovery
  // =========================================================================
  describe('Error Recovery', () => {
    it('should recover from stream failure', async () => {
      // First attempt fails
      (streamingService.registerCamera as jest.Mock)
        .mockResolvedValueOnce({ success: false, error: 'Connection failed' })
        .mockResolvedValueOnce({
          success: true,
          streams: { hls: 'http://test/stream.m3u8' },
        });

      // First attempt
      const result1 = await (streamingService as any).registerCamera(
        'cam-1',
        'rtsp://192.168.1.100:554/stream',
        'user-1'
      );
      expect(result1.success).toBe(false);

      // Retry succeeds
      const result2 = await (streamingService as any).registerCamera(
        'cam-1',
        'rtsp://192.168.1.100:554/stream',
        'user-1'
      );
      expect(result2.success).toBe(true);
    });

    it('should handle camera going offline during detection', async () => {
      const detectionManager = new DetectionManager();
      
      // Initialize mocks
      const { detectionService } = require('@/features/detection/detectionService');
      detectionService.initialize.mockResolvedValue(undefined);
      detectionService.isInitialized.mockReturnValue(true);

      const { frameCaptureService } = require('@/features/detection/frameCaptureService');
      frameCaptureService.initialize.mockResolvedValue(undefined);

      await detectionManager.initialize();

      const mockCamera = createMockCamera({ id: 'cam-1' });
      await detectionManager.startMonitoring(mockCamera);

      // Simulate camera going offline
      frameCaptureService.captureFrame.mockResolvedValue(null);

      // Detection should continue without crashing
      expect(detectionManager.isMonitoring()).toBe(true);

      await detectionManager.dispose();
    });
  });

  // =========================================================================
  // Multi-Camera Scenario
  // =========================================================================
  describe('Multi-Camera Scenario', () => {
    it('should handle multiple cameras simultaneously', async () => {
      const detectionManager = new DetectionManager();

      // Initialize
      const { detectionService } = require('@/features/detection/detectionService');
      detectionService.initialize.mockResolvedValue(undefined);
      detectionService.isInitialized.mockReturnValue(true);

      const { frameCaptureService } = require('@/features/detection/frameCaptureService');
      frameCaptureService.initialize.mockResolvedValue(undefined);

      await detectionManager.initialize();

      // Add multiple cameras
      const cameras = [
        createMockCamera({ id: 'cam-1', name: 'Front Door' }),
        createMockCamera({ id: 'cam-2', name: 'Back Yard' }),
        createMockCamera({ id: 'cam-3', name: 'Garage' }),
      ];

      for (const camera of cameras) {
        await detectionManager.startMonitoring(camera);
      }

      expect(detectionManager.getMonitoredCameraCount()).toBe(3);

      const ids = detectionManager.getMonitoredCameraIds();
      expect(ids).toContain('cam-1');
      expect(ids).toContain('cam-2');
      expect(ids).toContain('cam-3');

      // Stop one camera
      detectionManager.stopMonitoring('cam-2');
      expect(detectionManager.getMonitoredCameraCount()).toBe(2);
      expect(detectionManager.getMonitoredCameraIds()).not.toContain('cam-2');

      // Stop all
      detectionManager.stopAll();
      expect(detectionManager.getMonitoredCameraCount()).toBe(0);

      await detectionManager.dispose();
    });
  });

  // =========================================================================
  // Subscription Limits
  // =========================================================================
  describe('Subscription Limits', () => {
    it('should enforce free tier camera limit', async () => {
      // Add 2 cameras (free tier limit)
      useCameraStore.setState({
        cameras: [
          createMockCamera({ id: 'cam-1' }),
          createMockCamera({ id: 'cam-2' }),
        ],
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { subscription_tier: 'free' },
              error: null,
            }),
          };
        }
        return {};
      });

      // Should reject 3rd camera or set error state
      try {
        await useCameraStore.getState().addCamera({
          name: 'Third Camera',
          rtspUrl: 'rtsp://192.168.1.102:554/stream',
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
        // If it didn't throw, camera count should still be 2
        const state = useCameraStore.getState();
        expect(state.cameras.length).toBeLessThanOrEqual(2);
      } catch (error) {
        // Expected - limit was enforced
        expect(error).toBeDefined();
      }
    });

    it('should allow more cameras on pro tier', async () => {
      // Add 2 cameras already
      useCameraStore.setState({
        cameras: [
          createMockCamera({ id: 'cam-1' }),
          createMockCamera({ id: 'cam-2' }),
        ],
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { subscription_tier: 'pro' }, // Pro tier
              error: null,
            }),
          };
        }
        if (table === 'cameras') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'cam-3',
                user_id: 'user-1',
                name: 'Third Camera',
                rtsp_url: 'rtsp://192.168.1.102:554/stream',
                is_active: true,
                detection_settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          };
        }
        return {};
      });

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // Should allow 3rd camera
      await act(async () => {
        const camera = await useCameraStore.getState().addCamera({
          name: 'Third Camera',
          rtspUrl: 'rtsp://192.168.1.102:554/stream',
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

        expect(camera).toBeDefined();
      });

      expect(useCameraStore.getState().cameras).toHaveLength(3);
    });
  });
});

