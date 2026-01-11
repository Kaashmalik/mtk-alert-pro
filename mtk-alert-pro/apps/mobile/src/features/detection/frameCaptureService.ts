/**
 * Frame Capture Service
 * Captures frames from camera streams for AI detection
 * 
 * @module features/detection/frameCaptureService
 */

import * as FileSystem from 'expo-file-system';
import { streamingService } from '@/lib/streaming/streamingService';
import { logError } from '@/lib/utils/errorHandler';

// ============================================================================
// Configuration
// ============================================================================

/** Directory for cached frames */
const FRAME_CACHE_DIR = `${FileSystem.cacheDirectory}detection_frames/`;

/** Maximum age of cached frames in ms */
const MAX_FRAME_AGE_MS = 60000; // 1 minute

// ============================================================================
// Types
// ============================================================================

/**
 * Frame capture callback
 */
export type FrameCallback = (framePath: string, timestamp: Date) => void;

/**
 * Capture session info
 */
interface CaptureSession {
  cameraId: string;
  intervalId: NodeJS.Timeout;
  callback: FrameCallback;
  captureCount: number;
  lastCapture: Date | null;
}

// ============================================================================
// Frame Capture Service
// ============================================================================

/**
 * Frame Capture Service
 * Manages periodic frame capture from camera streams
 */
class FrameCaptureService {
  private isInitialized = false;
  private activeSessions: Map<string, CaptureSession> = new Map();
  private cleanupIntervalId: NodeJS.Timeout | null = null;

  /**
   * Initialize the frame capture service
   * Creates the cache directory if needed
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create frame cache directory
      const dirInfo = await FileSystem.getInfoAsync(FRAME_CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(FRAME_CACHE_DIR, { 
          intermediates: true 
        });
      }

      // Start cleanup interval
      this.cleanupIntervalId = setInterval(
        () => this.cleanupOldFrames(),
        30000 // Every 30 seconds
      );

      this.isInitialized = true;
      console.log('[FrameCaptureService] Initialized');
    } catch (error) {
      console.error('[FrameCaptureService] Initialization failed:', error);
      logError(error, 'FrameCaptureService.initialize');
      throw error;
    }
  }

  /**
   * Capture a single frame from a camera stream
   * 
   * @param cameraId - Camera to capture from
   * @returns Local path to the captured frame, or null if failed
   */
  async captureFrame(cameraId: string): Promise<string | null> {
    try {
      // Request snapshot from media server
      const snapshotUrl = await streamingService.captureSnapshot(cameraId);
      
      if (!snapshotUrl) {
        console.warn('[FrameCaptureService] No snapshot URL returned');
        return null;
      }

      // Generate local filename
      const timestamp = Date.now();
      const localPath = `${FRAME_CACHE_DIR}${cameraId}_${timestamp}.jpg`;

      // Download snapshot to local cache
      const downloadResult = await FileSystem.downloadAsync(snapshotUrl, localPath);
      
      if (downloadResult.status !== 200) {
        console.warn('[FrameCaptureService] Download failed:', downloadResult.status);
        return null;
      }

      // Verify file was created
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        console.warn('[FrameCaptureService] File not created');
        return null;
      }

      return localPath;
    } catch (error) {
      console.error('[FrameCaptureService] Capture failed:', error);
      logError(error, 'FrameCaptureService.captureFrame');
      return null;
    }
  }

  /**
   * Start periodic frame capture for a camera
   * 
   * @param cameraId - Camera to capture from
   * @param intervalMs - Capture interval in milliseconds
   * @param callback - Callback called with each captured frame
   */
  startPeriodicCapture(
    cameraId: string,
    intervalMs: number,
    callback: FrameCallback
  ): void {
    // Stop existing session for this camera
    if (this.activeSessions.has(cameraId)) {
      this.stopPeriodicCapture(cameraId);
    }

    console.log(`[FrameCaptureService] Starting capture for camera ${cameraId} every ${intervalMs}ms`);

    const session: CaptureSession = {
      cameraId,
      callback,
      captureCount: 0,
      lastCapture: null,
      intervalId: setInterval(async () => {
        const currentSession = this.activeSessions.get(cameraId);
        if (!currentSession) return;

        try {
          const framePath = await this.captureFrame(cameraId);
          
          if (framePath) {
            const now = new Date();
            currentSession.captureCount++;
            currentSession.lastCapture = now;
            
            // Call the callback with the frame
            callback(framePath, now);
          }
        } catch (error) {
          console.error(`[FrameCaptureService] Capture error for camera ${cameraId}:`, error);
          logError(error, `FrameCaptureService.periodicCapture.${cameraId}`);
        }
      }, intervalMs),
    };

    this.activeSessions.set(cameraId, session);
  }

  /**
   * Stop periodic capture for a specific camera
   * 
   * @param cameraId - Camera to stop capturing
   */
  stopPeriodicCapture(cameraId: string): void {
    const session = this.activeSessions.get(cameraId);
    
    if (session) {
      clearInterval(session.intervalId);
      this.activeSessions.delete(cameraId);
      console.log(`[FrameCaptureService] Stopped capture for camera ${cameraId} (${session.captureCount} frames captured)`);
    }
  }

  /**
   * Stop all periodic captures
   */
  stopAllCaptures(): void {
    for (const [cameraId] of this.activeSessions) {
      this.stopPeriodicCapture(cameraId);
    }
    console.log('[FrameCaptureService] Stopped all captures');
  }

  /**
   * Check if a camera is being captured
   */
  isCapturing(cameraId: string): boolean {
    return this.activeSessions.has(cameraId);
  }

  /**
   * Get capture statistics for a camera
   */
  getCaptureStats(cameraId: string): { 
    captureCount: number; 
    lastCapture: Date | null 
  } | null {
    const session = this.activeSessions.get(cameraId);
    
    if (!session) {
      return null;
    }

    return {
      captureCount: session.captureCount,
      lastCapture: session.lastCapture,
    };
  }

  /**
   * Clean up old cached frames
   */
  async cleanupOldFrames(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(FRAME_CACHE_DIR);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = `${FRAME_CACHE_DIR}${file}`;
        
        try {
          const info = await FileSystem.getInfoAsync(filePath);
          
          if (info.exists && info.modificationTime) {
            const age = now - (info.modificationTime * 1000);
            
            if (age > MAX_FRAME_AGE_MS) {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
              deletedCount++;
            }
          }
        } catch (fileError) {
          // Continue with other files
        }
      }

      if (deletedCount > 0) {
        console.log(`[FrameCaptureService] Cleaned up ${deletedCount} old frames`);
      }
    } catch (error) {
      console.error('[FrameCaptureService] Cleanup failed:', error);
    }
  }

  /**
   * Delete a specific frame file
   */
  async deleteFrame(framePath: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(framePath, { idempotent: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache directory size
   */
  async getCacheSize(): Promise<{ bytes: number; fileCount: number }> {
    try {
      const files = await FileSystem.readDirectoryAsync(FRAME_CACHE_DIR);
      let totalBytes = 0;

      for (const file of files) {
        const info = await FileSystem.getInfoAsync(`${FRAME_CACHE_DIR}${file}`);
        if (info.exists && info.size) {
          totalBytes += info.size;
        }
      }

      return { bytes: totalBytes, fileCount: files.length };
    } catch (error) {
      return { bytes: 0, fileCount: 0 };
    }
  }

  /**
   * Clear all cached frames
   */
  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(FRAME_CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(FRAME_CACHE_DIR, { intermediates: true });
      console.log('[FrameCaptureService] Cache cleared');
    } catch (error) {
      console.error('[FrameCaptureService] Failed to clear cache:', error);
    }
  }

  /**
   * Dispose of the service
   */
  dispose(): void {
    // Stop all captures
    this.stopAllCaptures();

    // Stop cleanup interval
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    this.isInitialized = false;
    console.log('[FrameCaptureService] Disposed');
  }
}

// Export singleton instance
export const frameCaptureService = new FrameCaptureService();

// Export class for testing
export { FrameCaptureService };

