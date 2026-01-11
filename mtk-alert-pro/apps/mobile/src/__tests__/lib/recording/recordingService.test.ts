/**
 * Recording Service Tests
 */

import * as FileSystem from 'expo-file-system';
import {
  RecordingService,
  type RecordingInfo,
} from '@/lib/recording/recordingService';

describe('Recording Service', () => {
  let service: RecordingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecordingService();
  });

  afterEach(() => {
    service.dispose();
  });

  // =========================================================================
  // initialize
  // =========================================================================
  describe('initialize', () => {
    it('should create recordings directory', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

      await service.initialize();

      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
    });

    it('should not create directory if it exists', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });

      await service.initialize();

      expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });

    it('should load history from file', async () => {
      const mockHistory: RecordingInfo[] = [
        {
          id: 'rec_1',
          cameraId: 'cam-1',
          startTime: new Date(),
          duration: 30,
          status: 'completed',
        },
      ];

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // directory
        .mockResolvedValueOnce({ exists: true }); // history file
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockHistory)
      );

      await service.initialize();

      const history = service.getRecordingHistory();
      expect(history).toHaveLength(1);
    });

    it('should handle missing history file gracefully', async () => {
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // directory
        .mockResolvedValueOnce({ exists: false }); // no history file

      await service.initialize();

      expect(service.getRecordingHistory()).toHaveLength(0);
    });
  });

  // =========================================================================
  // startRecording
  // =========================================================================
  describe('startRecording', () => {
    beforeEach(async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('[]');
      await service.initialize();
    });

    it('should start recording and return info', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const info = await service.startRecording('camera-123', {
        durationSeconds: 30,
      });

      expect(info.cameraId).toBe('camera-123');
      expect(info.duration).toBe(30);
      expect(info.status).toBe('recording');
      expect(service.isRecording('camera-123')).toBe(true);
    });

    it('should throw if camera is already recording', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await service.startRecording('camera-123');

      await expect(service.startRecording('camera-123')).rejects.toThrow(
        'Camera is already recording'
      );
    });

    it('should clamp duration to max 5 minutes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const info = await service.startRecording('camera-123', {
        durationSeconds: 600, // 10 minutes
      });

      expect(info.duration).toBe(300); // 5 minutes max
    });

    it('should clamp duration to min 5 seconds', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const info = await service.startRecording('camera-123', {
        durationSeconds: 2, // Too short
      });

      expect(info.duration).toBe(5); // 5 seconds min
    });

    it('should throw on server error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(service.startRecording('camera-123')).rejects.toThrow();
      expect(service.isRecording('camera-123')).toBe(false);
    });
  });

  // =========================================================================
  // stopRecording
  // =========================================================================
  describe('stopRecording', () => {
    beforeEach(async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('[]');
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should stop active recording', async () => {
      // Start recording first
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }) // start
        .mockResolvedValueOnce({ ok: true }) // stop
        .mockResolvedValueOnce({ ok: false, status: 404 }); // download (fails for test)

      await service.startRecording('camera-123');
      const info = await service.stopRecording('camera-123');

      expect(info).not.toBeNull();
      expect(info?.status).toBe('failed'); // Failed download
      expect(service.isRecording('camera-123')).toBe(false);
    });

    it('should return null for non-existent recording', async () => {
      const info = await service.stopRecording('non-existent');

      expect(info).toBeNull();
    });
  });

  // =========================================================================
  // getActiveRecording
  // =========================================================================
  describe('getActiveRecording', () => {
    beforeEach(async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('[]');
      await service.initialize();
    });

    it('should return null for non-recording camera', () => {
      const active = service.getActiveRecording('not-recording');
      expect(active).toBeNull();
    });

    it('should track active recordings via isRecording', async () => {
      // Test that isRecording returns false for non-active camera
      expect(service.isRecording('camera-123')).toBe(false);
    });
  });

  // =========================================================================
  // getActiveRecordings
  // =========================================================================
  describe('getActiveRecordings', () => {
    beforeEach(async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('[]');
      await service.initialize();
    });

    it('should return empty array when no recordings are active', () => {
      const recordings = service.getActiveRecordings();
      expect(recordings).toHaveLength(0);
      expect(Array.isArray(recordings)).toBe(true);
    });
  });

  // =========================================================================
  // getCameraRecordings
  // =========================================================================
  describe('getCameraRecordings', () => {
    it('should filter recordings by camera', async () => {
      const mockHistory: RecordingInfo[] = [
        { id: 'rec_1', cameraId: 'cam-1', startTime: new Date(), duration: 30, status: 'completed' },
        { id: 'rec_2', cameraId: 'cam-2', startTime: new Date(), duration: 30, status: 'completed' },
        { id: 'rec_3', cameraId: 'cam-1', startTime: new Date(), duration: 30, status: 'completed' },
      ];

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockHistory)
      );

      await service.initialize();

      const cam1Recordings = service.getCameraRecordings('cam-1');
      expect(cam1Recordings).toHaveLength(2);
      expect(cam1Recordings.every(r => r.cameraId === 'cam-1')).toBe(true);
    });
  });

  // =========================================================================
  // deleteRecording
  // =========================================================================
  describe('deleteRecording', () => {
    beforeEach(async () => {
      const mockHistory: RecordingInfo[] = [
        {
          id: 'rec_1',
          cameraId: 'cam-1',
          startTime: new Date(),
          duration: 30,
          status: 'completed',
          localPath: '/mock/rec_1.mp4',
        },
      ];

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockHistory)
      );
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      await service.initialize();
    });

    it('should delete recording from history', async () => {
      const result = await service.deleteRecording('rec_1');

      expect(result).toBe(true);
      expect(service.getRecordingHistory()).toHaveLength(0);
    });

    it('should delete local file', async () => {
      await service.deleteRecording('rec_1');

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining('rec_1'),
        expect.any(Object)
      );
    });

    it('should return false for non-existent recording', async () => {
      const result = await service.deleteRecording('non-existent');

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // getStorageUsage
  // =========================================================================
  describe('getStorageUsage', () => {
    it('should calculate storage usage', async () => {
      const mockHistory: RecordingInfo[] = [
        {
          id: 'rec_1',
          cameraId: 'cam-1',
          startTime: new Date(),
          duration: 30,
          status: 'completed',
          localPath: '/mock/rec_1.mp4',
          cloudUrl: 'https://cloud/rec_1.mp4',
        },
        {
          id: 'rec_2',
          cameraId: 'cam-1',
          startTime: new Date(),
          duration: 30,
          status: 'completed',
          localPath: '/mock/rec_2.mp4',
        },
      ];

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true }) // directory
        .mockResolvedValueOnce({ exists: true }) // history file
        .mockResolvedValueOnce({ exists: true, size: 1024 }) // rec_1
        .mockResolvedValueOnce({ exists: true, size: 2048 }); // rec_2
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockHistory)
      );

      await service.initialize();

      const usage = await service.getStorageUsage();

      expect(usage.localBytes).toBe(3072);
      expect(usage.localCount).toBe(2);
      expect(usage.cloudCount).toBe(1);
    });
  });

  // =========================================================================
  // cleanupOldRecordings
  // =========================================================================
  describe('cleanupOldRecordings', () => {
    it('should remove oldest recordings beyond limit', async () => {
      const mockHistory: RecordingInfo[] = Array.from({ length: 60 }, (_, i) => ({
        id: `rec_${i}`,
        cameraId: 'cam-1',
        startTime: new Date(),
        duration: 30,
        status: 'completed' as const,
        localPath: `/mock/rec_${i}.mp4`,
      }));

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockHistory)
      );
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await service.initialize();

      const deleted = await service.cleanupOldRecordings(50);

      expect(deleted).toBe(10);
      expect(service.getRecordingHistory()).toHaveLength(50);
    });

    it('should not delete if under limit', async () => {
      const mockHistory: RecordingInfo[] = Array.from({ length: 10 }, (_, i) => ({
        id: `rec_${i}`,
        cameraId: 'cam-1',
        startTime: new Date(),
        duration: 30,
        status: 'completed' as const,
      }));

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockHistory)
      );

      await service.initialize();

      const deleted = await service.cleanupOldRecordings(50);

      expect(deleted).toBe(0);
    });
  });
});

