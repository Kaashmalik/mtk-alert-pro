/**
 * Recording Service
 * Manages video recording from camera streams
 * 
 * @module lib/recording/recordingService
 */

import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorHandler';

// ============================================================================
// Configuration
// ============================================================================

const MEDIA_SERVER_URL = process.env.EXPO_PUBLIC_MEDIA_SERVER_URL || 'http://localhost:3001';
const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`;
const MAX_RECORDING_DURATION = 300; // 5 minutes max
const DEFAULT_RECORDING_DURATION = 30; // 30 seconds default

// ============================================================================
// Types
// ============================================================================

/**
 * Recording status
 */
export type RecordingStatus = 
  | 'idle'
  | 'recording'
  | 'stopping'
  | 'completed'
  | 'uploading'
  | 'uploaded'
  | 'failed';

/**
 * Recording information
 */
export interface RecordingInfo {
  /** Unique recording ID */
  id: string;
  /** Camera ID */
  cameraId: string;
  /** Camera name for display */
  cameraName?: string;
  /** Recording start time */
  startTime: Date;
  /** Recording end time */
  endTime?: Date;
  /** Duration in seconds */
  duration: number;
  /** Local file path */
  localPath?: string;
  /** Cloud storage URL */
  cloudUrl?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Current status */
  status: RecordingStatus;
  /** Error message if failed */
  error?: string;
}

/**
 * Recording options
 */
export interface RecordingOptions {
  /** Duration in seconds (default: 30, max: 300) */
  durationSeconds?: number;
  /** Auto upload to cloud after recording */
  autoUpload?: boolean;
  /** Camera name for display */
  cameraName?: string;
}

// ============================================================================
// Recording Service
// ============================================================================

/**
 * Recording Service
 * Manages recording lifecycle from start to cloud upload
 */
class RecordingService {
  private isInitialized = false;
  private activeRecordings: Map<string, RecordingInfo> = new Map();
  private recordingHistory: RecordingInfo[] = [];

  /**
   * Initialize the recording service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create recordings directory
      const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { 
          intermediates: true 
        });
      }

      // Load recording history from local storage
      await this.loadHistory();

      this.isInitialized = true;
      console.log('[RecordingService] Initialized');
    } catch (error) {
      console.error('[RecordingService] Initialization failed:', error);
      logError(error, 'RecordingService.initialize');
      throw error;
    }
  }

  /**
   * Start recording for a camera
   * 
   * @param cameraId - Camera to record
   * @param options - Recording options
   * @returns Recording info
   */
  async startRecording(
    cameraId: string,
    options: RecordingOptions = {}
  ): Promise<RecordingInfo> {
    const {
      durationSeconds = DEFAULT_RECORDING_DURATION,
      autoUpload = true,
      cameraName,
    } = options;

    // Validate duration
    const duration = Math.min(Math.max(durationSeconds, 5), MAX_RECORDING_DURATION);

    // Check if already recording this camera
    if (this.activeRecordings.has(cameraId)) {
      throw new Error('Camera is already recording');
    }

    // Generate recording ID
    const recordingId = `rec_${cameraId}_${Date.now()}`;
    
    const recordingInfo: RecordingInfo = {
      id: recordingId,
      cameraId,
      cameraName,
      startTime: new Date(),
      duration,
      status: 'recording',
    };

    console.log(`[RecordingService] Starting recording: ${recordingId}`);

    try {
      // Tell backend to start recording
      const response = await fetch(
        `${MEDIA_SERVER_URL}/api/cameras/${cameraId}/record/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationSeconds: duration }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to start recording: ${response.status}`);
      }

      // Store active recording
      this.activeRecordings.set(cameraId, recordingInfo);

      // Schedule completion check
      setTimeout(async () => {
        await this.completeRecording(cameraId, autoUpload);
      }, (duration * 1000) + 2000); // Extra 2 seconds buffer

      return recordingInfo;
    } catch (error) {
      recordingInfo.status = 'failed';
      recordingInfo.error = error instanceof Error ? error.message : 'Recording failed';
      console.error('[RecordingService] Start recording failed:', error);
      logError(error, 'RecordingService.startRecording');
      throw error;
    }
  }

  /**
   * Stop recording early
   * 
   * @param cameraId - Camera to stop recording
   * @param autoUpload - Whether to upload after stopping
   * @returns Recording info
   */
  async stopRecording(
    cameraId: string,
    autoUpload: boolean = true
  ): Promise<RecordingInfo | null> {
    const recording = this.activeRecordings.get(cameraId);
    
    if (!recording) {
      console.warn(`[RecordingService] No active recording for camera: ${cameraId}`);
      return null;
    }

    console.log(`[RecordingService] Stopping recording: ${recording.id}`);

    try {
      recording.status = 'stopping';

      // Tell backend to stop recording
      await fetch(
        `${MEDIA_SERVER_URL}/api/cameras/${cameraId}/record/stop`,
        { method: 'POST' }
      );

      return await this.completeRecording(cameraId, autoUpload);
    } catch (error) {
      console.error('[RecordingService] Stop recording failed:', error);
      logError(error, 'RecordingService.stopRecording');
      
      recording.status = 'failed';
      recording.error = 'Failed to stop recording';
      this.activeRecordings.delete(cameraId);
      
      return recording;
    }
  }

  /**
   * Complete a recording and optionally download/upload
   */
  private async completeRecording(
    cameraId: string,
    autoUpload: boolean
  ): Promise<RecordingInfo | null> {
    const recording = this.activeRecordings.get(cameraId);
    
    if (!recording) {
      return null;
    }

    recording.endTime = new Date();
    recording.duration = Math.round(
      (recording.endTime.getTime() - recording.startTime.getTime()) / 1000
    );

    try {
      // Download recording from server
      const downloadUrl = `${MEDIA_SERVER_URL}/api/cameras/${cameraId}/record/download`;
      const localPath = `${RECORDINGS_DIR}${recording.id}.mp4`;

      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        localPath
      );

      if (downloadResult.status === 200) {
        recording.localPath = downloadResult.uri;
        
        // Get file size
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists && fileInfo.size) {
          recording.fileSize = fileInfo.size;
        }

        recording.status = 'completed';
        console.log(`[RecordingService] Recording completed: ${recording.id}`);

        // Auto upload if enabled
        if (autoUpload) {
          this.uploadRecording(recording).catch(error => {
            console.error('[RecordingService] Auto upload failed:', error);
          });
        }
      } else {
        recording.status = 'failed';
        recording.error = 'Failed to download recording';
      }
    } catch (error) {
      console.error('[RecordingService] Complete recording failed:', error);
      recording.status = 'failed';
      recording.error = 'Recording completion failed';
    }

    // Remove from active and add to history
    this.activeRecordings.delete(cameraId);
    this.recordingHistory.unshift(recording);
    
    // Save history
    await this.saveHistory();

    return recording;
  }

  /**
   * Upload recording to cloud storage
   */
  async uploadRecording(recording: RecordingInfo): Promise<string | null> {
    if (!recording.localPath) {
      console.warn('[RecordingService] No local path for recording');
      return null;
    }

    try {
      recording.status = 'uploading';
      console.log(`[RecordingService] Uploading recording: ${recording.id}`);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Read file
      const fileContent = await FileSystem.readAsStringAsync(
        recording.localPath,
        { encoding: FileSystem.EncodingType.Base64 }
      );

      // Convert base64 to Uint8Array
      const binaryString = atob(fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to Supabase Storage
      const fileName = `${user.id}/${recording.id}.mp4`;
      
      const { data, error } = await supabase.storage
        .from('recordings')
        .upload(fileName, bytes, {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      recording.cloudUrl = urlData.publicUrl;
      recording.status = 'uploaded';

      console.log(`[RecordingService] Recording uploaded: ${recording.cloudUrl}`);

      // Update history
      await this.saveHistory();

      return urlData.publicUrl;
    } catch (error) {
      console.error('[RecordingService] Upload failed:', error);
      logError(error, 'RecordingService.uploadRecording');
      
      recording.status = 'failed';
      recording.error = 'Upload failed';
      
      return null;
    }
  }

  /**
   * Check if a camera is currently recording
   */
  isRecording(cameraId: string): boolean {
    return this.activeRecordings.has(cameraId);
  }

  /**
   * Get active recording for a camera
   */
  getActiveRecording(cameraId: string): RecordingInfo | null {
    return this.activeRecordings.get(cameraId) || null;
  }

  /**
   * Get all active recordings
   */
  getActiveRecordings(): RecordingInfo[] {
    return Array.from(this.activeRecordings.values());
  }

  /**
   * Get recording history
   */
  getRecordingHistory(): RecordingInfo[] {
    return [...this.recordingHistory];
  }

  /**
   * Get recordings for a specific camera
   */
  getCameraRecordings(cameraId: string): RecordingInfo[] {
    return this.recordingHistory.filter(r => r.cameraId === cameraId);
  }

  /**
   * Delete a local recording
   */
  async deleteLocalRecording(recordingId: string): Promise<boolean> {
    const recording = this.recordingHistory.find(r => r.id === recordingId);
    
    if (!recording?.localPath) {
      return false;
    }

    try {
      await FileSystem.deleteAsync(recording.localPath, { idempotent: true });
      recording.localPath = undefined;
      
      await this.saveHistory();
      return true;
    } catch (error) {
      console.error('[RecordingService] Delete failed:', error);
      return false;
    }
  }

  /**
   * Delete a recording from history
   */
  async deleteRecording(recordingId: string): Promise<boolean> {
    const index = this.recordingHistory.findIndex(r => r.id === recordingId);
    
    if (index === -1) {
      return false;
    }

    const recording = this.recordingHistory[index];

    // Delete local file if exists
    if (recording.localPath) {
      try {
        await FileSystem.deleteAsync(recording.localPath, { idempotent: true });
      } catch (error) {
        // Continue even if file deletion fails
      }
    }

    // Delete from cloud if uploaded
    if (recording.cloudUrl) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fileName = `${user.id}/${recording.id}.mp4`;
          await supabase.storage.from('recordings').remove([fileName]);
        }
      } catch (error) {
        // Continue even if cloud deletion fails
      }
    }

    // Remove from history
    this.recordingHistory.splice(index, 1);
    await this.saveHistory();

    return true;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<{
    localBytes: number;
    localCount: number;
    cloudCount: number;
  }> {
    let localBytes = 0;
    let localCount = 0;
    let cloudCount = 0;

    for (const recording of this.recordingHistory) {
      if (recording.localPath) {
        try {
          const info = await FileSystem.getInfoAsync(recording.localPath);
          if (info.exists && info.size) {
            localBytes += info.size;
            localCount++;
          }
        } catch {
          // Skip this recording
        }
      }
      
      if (recording.cloudUrl) {
        cloudCount++;
      }
    }

    return { localBytes, localCount, cloudCount };
  }

  /**
   * Clean up old recordings (keep most recent)
   */
  async cleanupOldRecordings(keepCount: number = 50): Promise<number> {
    if (this.recordingHistory.length <= keepCount) {
      return 0;
    }

    const toRemove = this.recordingHistory.splice(keepCount);
    let deletedCount = 0;

    for (const recording of toRemove) {
      if (recording.localPath) {
        try {
          await FileSystem.deleteAsync(recording.localPath, { idempotent: true });
          deletedCount++;
        } catch {
          // Continue with other files
        }
      }
    }

    await this.saveHistory();
    return deletedCount;
  }

  /**
   * Save recording history to local storage
   */
  private async saveHistory(): Promise<void> {
    try {
      const historyPath = `${RECORDINGS_DIR}history.json`;
      await FileSystem.writeAsStringAsync(
        historyPath,
        JSON.stringify(this.recordingHistory)
      );
    } catch (error) {
      console.error('[RecordingService] Save history failed:', error);
    }
  }

  /**
   * Load recording history from local storage
   */
  private async loadHistory(): Promise<void> {
    try {
      const historyPath = `${RECORDINGS_DIR}history.json`;
      const info = await FileSystem.getInfoAsync(historyPath);
      
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(historyPath);
        this.recordingHistory = JSON.parse(content);
        
        // Convert date strings back to Date objects
        for (const recording of this.recordingHistory) {
          recording.startTime = new Date(recording.startTime);
          if (recording.endTime) {
            recording.endTime = new Date(recording.endTime);
          }
        }
        
        console.log(`[RecordingService] Loaded ${this.recordingHistory.length} recordings from history`);
      }
    } catch (error) {
      console.error('[RecordingService] Load history failed:', error);
      this.recordingHistory = [];
    }
  }

  /**
   * Dispose of the service
   */
  dispose(): void {
    this.activeRecordings.clear();
    this.isInitialized = false;
    console.log('[RecordingService] Disposed');
  }
}

// Export singleton instance
export const recordingService = new RecordingService();

// Export class for testing
export { RecordingService };

