/**
 * Detection Manager
 * Orchestrates detection across multiple cameras
 * 
 * @module features/detection/detectionManager
 */

import { detectionService } from './detectionService';
import { frameCaptureService } from './frameCaptureService';
import { handleDetectionAlarm } from './detectionAlarmIntegration';
import { supabase } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorHandler';
import { sendLocalNotification } from '@/lib/notifications/service';
import { reviewManager } from '@/lib/reviews/reviewManager';
import type { DetectionResult, Camera } from '@/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Detection event that gets triggered when an object is detected
 */
export interface DetectionEvent {
  /** Camera that detected the object */
  cameraId: string;
  /** Camera name for display */
  cameraName: string;
  /** Type of detection */
  type: 'person' | 'vehicle' | 'face' | 'unknown';
  /** Detection confidence (0-1) */
  confidence: number;
  /** When the detection occurred */
  timestamp: Date;
  /** Path to the snapshot image */
  snapshotPath?: string;
  /** Bounding box coordinates */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Detection manager configuration
 */
export interface DetectionManagerConfig {
  /** Frame capture interval in milliseconds */
  captureIntervalMs: number;
  /** Cooldown between alerts for same camera/type in milliseconds */
  cooldownMs: number;
  /** Minimum confidence to trigger alert (0-1) */
  minConfidence: number;
  /** Whether to play alarm sound */
  enableAlarm: boolean;
  /** Whether to send notifications */
  enableNotifications: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: DetectionManagerConfig = {
  captureIntervalMs: 1000,     // Capture every 1 second
  cooldownMs: 30000,           // 30 seconds between alerts per camera/type
  minConfidence: 0.65,         // 65% confidence threshold (optimized)
  enableAlarm: true,
  enableNotifications: true,
};

// ============================================================================
// Detection Manager
// ============================================================================

/**
 * Detection Manager
 * Coordinates detection across multiple cameras
 */
class DetectionManager {
  private config: DetectionManagerConfig;
  private activeCameras: Map<string, Camera> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private isRunning = false;
  private eventHandlers: Set<(event: DetectionEvent) => void> = new Set();
  private alertCreateQueue: DetectionEvent[] = [];
  private isProcessingQueue = false;

  constructor(config: Partial<DetectionManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the detection system
   */
  async initialize(): Promise<void> {
    console.log('[DetectionManager] Initializing...');

    try {
      // Initialize frame capture service
      await frameCaptureService.initialize();

      // Initialize detection service (loads AI model)
      await detectionService.initialize();

      console.log('[DetectionManager] Initialization complete');
    } catch (error) {
      console.error('[DetectionManager] Initialization failed:', error);
      logError(error, 'DetectionManager.initialize');
      throw error;
    }
  }

  /**
   * Start monitoring a camera for detections
   * 
   * @param camera - Camera to monitor
   */
  async startMonitoring(camera: Camera): Promise<void> {
    // Check if detection is enabled for this camera
    if (!camera.detectionSettings.person && !camera.detectionSettings.vehicle) {
      console.log(`[DetectionManager] Camera ${camera.name} has no detection enabled, skipping`);
      return;
    }

    // Check if already monitoring
    if (this.activeCameras.has(camera.id)) {
      console.log(`[DetectionManager] Camera ${camera.name} already being monitored`);
      return;
    }

    console.log(`[DetectionManager] Starting monitoring for camera: ${camera.name}`);

    // Store camera
    this.activeCameras.set(camera.id, camera);

    // Start periodic frame capture and detection
    frameCaptureService.startPeriodicCapture(
      camera.id,
      this.config.captureIntervalMs,
      async (framePath, timestamp) => {
        await this.processFrame(camera, framePath, timestamp);
      }
    );

    this.isRunning = true;
  }

  /**
   * Stop monitoring a specific camera
   * 
   * @param cameraId - Camera ID to stop monitoring
   */
  stopMonitoring(cameraId: string): void {
    const camera = this.activeCameras.get(cameraId);

    if (camera) {
      console.log(`[DetectionManager] Stopping monitoring for camera: ${camera.name}`);
      frameCaptureService.stopPeriodicCapture(cameraId);
      this.activeCameras.delete(cameraId);
    }

    // Update running state
    if (this.activeCameras.size === 0) {
      this.isRunning = false;
    }
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    console.log('[DetectionManager] Stopping all monitoring');

    frameCaptureService.stopAllCaptures();
    this.activeCameras.clear();
    this.lastAlertTime.clear();
    this.isRunning = false;
  }

  /**
   * Process a captured frame for detections
   */
  private async processFrame(
    camera: Camera,
    framePath: string,
    timestamp: Date
  ): Promise<void> {
    try {
      // Run AI detection
      const detections = await detectionService.detect(framePath);

      // Filter detections based on camera settings
      const validDetections = detections.filter(detection => {
        // Check if this detection type is enabled
        if (detection.type === 'person' && !camera.detectionSettings.person) {
          return false;
        }
        if (detection.type === 'vehicle' && !camera.detectionSettings.vehicle) {
          return false;
        }

        // Check confidence threshold
        const threshold = camera.detectionSettings.sensitivity || this.config.minConfidence;
        return detection.confidence >= threshold;
      });

      // Process each valid detection
      for (const detection of validDetections) {
        await this.handleDetection(camera, detection, framePath, timestamp);
      }

      // Clean up frame file after processing (unless needed for alert)
      if (validDetections.length === 0) {
        await frameCaptureService.deleteFrame(framePath);
      }
    } catch (error) {
      console.error('[DetectionManager] Frame processing error:', error);
      logError(error, 'DetectionManager.processFrame');
    }
  }

  /**
   * Handle a valid detection
   */
  private async handleDetection(
    camera: Camera,
    detection: DetectionResult,
    snapshotPath: string,
    timestamp: Date
  ): Promise<void> {
    // Create cooldown key (camera + detection type)
    const cooldownKey = `${camera.id}_${detection.type}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(cooldownKey) || 0;

    // Check cooldown
    if (now - lastAlert < this.config.cooldownMs) {
      console.log(`[DetectionManager] Cooldown active for ${camera.name} - ${detection.type}`);
      return;
    }

    // Update last alert time
    this.lastAlertTime.set(cooldownKey, now);

    console.log(`[DetectionManager] Detection: ${detection.type} (${Math.round(detection.confidence * 100)}%) on ${camera.name}`);

    // Create detection event
    const event: DetectionEvent = {
      cameraId: camera.id,
      cameraName: camera.name,
      type: detection.type,
      confidence: detection.confidence,
      timestamp,
      snapshotPath,
      boundingBox: detection.boundingBox,
    };

    // Trigger happy moment for ASO review
    reviewManager.onHappyMoment('alert-detected');

    // Notify event handlers
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('[DetectionManager] Event handler error:', error);
      }
    });

    // Trigger alarm using integrated system (respects red alert mode and settings)
    if (camera.detectionSettings.alarmEnabled) {
      try {
        await handleDetectionAlarm([detection], camera.id);
      } catch (error) {
        console.error('[DetectionManager] Alarm integration error:', error);
      }
    }

    // Send notification if enabled
    if (this.config.enableNotifications && camera.detectionSettings.notificationsEnabled) {
      try {
        await sendLocalNotification({
          title: `${detection.type === 'person' ? '👤' : '🚗'} ${detection.type === 'person' ? 'Person' : 'Vehicle'} Detected`,
          body: `${camera.name} - ${Math.round(detection.confidence * 100)}% confidence`,
          data: {
            cameraId: camera.id,
            detectionType: detection.type,
          },
        });
      } catch (error) {
        console.error('[DetectionManager] Notification error:', error);
      }
    }

    // Queue alert creation in database
    this.queueAlertCreation(event, camera.userId);
  }

  /**
   * Queue alert creation to avoid blocking detection
   */
  private queueAlertCreation(event: DetectionEvent, userId: string): void {
    this.alertCreateQueue.push(event);

    if (!this.isProcessingQueue) {
      this.processAlertQueue(userId);
    }
  }

  /**
   * Process the alert creation queue
   */
  private async processAlertQueue(userId: string): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    while (this.alertCreateQueue.length > 0) {
      const event = this.alertCreateQueue.shift();
      if (!event) continue;

      try {
        // TODO: Upload snapshot to Supabase Storage
        // const snapshotUrl = await uploadSnapshot(event.snapshotPath, userId);

        const { error } = await supabase.from('alerts').insert({
          camera_id: event.cameraId,
          user_id: userId,
          type: event.type,
          confidence: event.confidence,
          // snapshot_url: snapshotUrl,
          metadata: {
            boundingBox: event.boundingBox,
            processedAt: event.timestamp.toISOString(),
          },
          is_read: false,
        });

        if (error) {
          console.error('[DetectionManager] Failed to create alert:', error);
        }
      } catch (error) {
        console.error('[DetectionManager] Alert creation error:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Register a callback for detection events
   * 
   * @param handler - Callback function
   * @returns Unsubscribe function
   */
  onDetection(handler: (event: DetectionEvent) => void): () => void {
    this.eventHandlers.add(handler);

    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  /**
   * Update manager configuration
   */
  updateConfig(config: Partial<DetectionManagerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[DetectionManager] Configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): DetectionManagerConfig {
    return { ...this.config };
  }

  /**
   * Check if manager is currently monitoring
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }

  /**
   * Get count of monitored cameras
   */
  getMonitoredCameraCount(): number {
    return this.activeCameras.size;
  }

  /**
   * Get list of monitored camera IDs
   */
  getMonitoredCameraIds(): string[] {
    return Array.from(this.activeCameras.keys());
  }

  /**
   * Check if detection service is ready
   */
  isDetectionReady(): boolean {
    return detectionService.isInitialized();
  }

  /**
   * Get detection performance metrics
   */
  getMetrics(): {
    monitoredCameras: number;
    isProcessing: boolean;
    lastProcessTime: number;
  } {
    return {
      monitoredCameras: this.activeCameras.size,
      isProcessing: detectionService.isBusy(),
      lastProcessTime: detectionService.getLastProcessTime(),
    };
  }

  /**
   * Dispose of manager resources
   */
  async dispose(): Promise<void> {
    console.log('[DetectionManager] Disposing...');

    // Stop all monitoring
    this.stopAll();

    // Clear handlers
    this.eventHandlers.clear();

    // Dispose services
    frameCaptureService.dispose();
    await detectionService.dispose();

    console.log('[DetectionManager] Disposed');
  }
}

// Export singleton instance
export const detectionManager = new DetectionManager();

// Export class for testing
export { DetectionManager };

