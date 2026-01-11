/**
 * Camera Connection Service
 * Provides camera connectivity testing and health monitoring
 * 
 * @module lib/camera/connectionService
 */

import { parseRtspUrl } from './rtspHelper';

/**
 * Result of a camera connection test
 */
export interface ConnectionTestResult {
  /** Whether the connection was successful */
  success: boolean;
  /** Latency in milliseconds (if successful) */
  latency?: number;
  /** Error message (if failed) */
  error?: string;
  /** Stream information (if available) */
  streamInfo?: {
    width?: number;
    height?: number;
    codec?: string;
    fps?: number;
  };
  /** Timestamp of the test */
  timestamp: Date;
}

/**
 * Camera health status
 */
export interface CameraHealth {
  /** Camera ID */
  cameraId: string;
  /** Whether the camera is online */
  isOnline: boolean;
  /** Average latency over recent tests */
  avgLatency: number;
  /** Last successful connection time */
  lastOnline?: Date;
  /** Number of consecutive failures */
  failureCount: number;
  /** Last test result */
  lastTest: ConnectionTestResult;
}

/**
 * Configuration for connection testing
 */
export interface ConnectionTestConfig {
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Number of retry attempts */
  retryCount: number;
  /** Delay between retries in milliseconds */
  retryDelayMs: number;
}

const DEFAULT_CONFIG: ConnectionTestConfig = {
  timeoutMs: 5000,
  retryCount: 2,
  retryDelayMs: 1000,
};

/**
 * Test camera connectivity by attempting to reach the camera's HTTP interface
 * 
 * @param rtspUrl - The RTSP URL of the camera
 * @param config - Test configuration
 * @returns ConnectionTestResult
 * 
 * @example
 * ```ts
 * const result = await testCameraConnection('rtsp://192.168.1.100:554/stream');
 * if (result.success) {
 *   console.log(`Camera online with ${result.latency}ms latency`);
 * }
 * ```
 */
export async function testCameraConnection(
  rtspUrl: string,
  config: Partial<ConnectionTestConfig> = {}
): Promise<ConnectionTestResult> {
  const { timeoutMs, retryCount, retryDelayMs } = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  // Parse the RTSP URL to extract IP
  const parsed = parseRtspUrl(rtspUrl);
  if (!parsed) {
    return {
      success: false,
      error: 'Invalid RTSP URL format. Expected: rtsp://[user:pass@]ip[:port]/path',
      timestamp: new Date(),
    };
  }

  // Validate IP address format
  if (!isValidIp(parsed.ip)) {
    return {
      success: false,
      error: `Invalid IP address: ${parsed.ip}`,
      timestamp: new Date(),
    };
  }

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    if (attempt > 0) {
      await delay(retryDelayMs * attempt);
    }

    try {
      const result = await performConnectionTest(parsed.ip, parsed.port, timeoutMs);
      
      if (result.success) {
        return {
          ...result,
          latency: Date.now() - startTime,
          timestamp: new Date(),
        };
      }
      
      lastError = result.error;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Connection test failed';
    }
  }

  return {
    success: false,
    error: lastError || 'Connection test failed after all retries',
    latency: Date.now() - startTime,
    timestamp: new Date(),
  };
}

/**
 * Perform a single connection test
 */
async function performConnectionTest(
  ip: string,
  rtspPort: number,
  timeoutMs: number
): Promise<Omit<ConnectionTestResult, 'timestamp'>> {
  // Most IP cameras have a web interface on port 80
  // Try to reach it as a basic connectivity check
  const httpPort = rtspPort === 554 ? 80 : rtspPort;
  const httpUrl = `http://${ip}:${httpPort}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(httpUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    // 401/403 means camera is reachable but requires auth
    // This is still a successful connection test
    if (response.ok || response.status === 401 || response.status === 403) {
      // Additional check: Try to get stream info from media server if available
      try {
        const MEDIA_SERVER_URL = process.env.EXPO_PUBLIC_MEDIA_SERVER_URL;
        if (MEDIA_SERVER_URL) {
          const streamCheck = await fetch(
            `${MEDIA_SERVER_URL}/api/cameras/test-rtsp`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ip, port: rtspPort }),
              signal: AbortSignal.timeout(Math.min(timeoutMs / 2, 3000)),
            }
          );
          if (streamCheck.ok) {
            const streamData = await streamCheck.json();
            return {
              success: true,
              streamInfo: streamData.streamInfo || undefined,
            };
          }
        }
      } catch (streamError) {
        // Media server check failed, but HTTP check passed - still consider it online
        console.warn('[ConnectionTest] Media server check failed, using HTTP result');
      }
      
      return { success: true };
    }

    return {
      success: false,
      error: `Camera responded with status ${response.status}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Connection timed out - camera not responding',
        };
      }

      // Check for common network errors
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('failed to fetch')) {
        return {
          success: false,
          error: 'Network error - check if camera is on the same network',
        };
      }

      if (message.includes('refused')) {
        return {
          success: false,
          error: 'Connection refused - camera may be using different port',
        };
      }
    }

    return {
      success: false,
      error: 'Unable to reach camera - verify IP address and network',
    };
  }
}

/**
 * Test connection via media server
 * This provides more accurate RTSP testing when a media server is available
 * 
 * @param mediaServerUrl - URL of the media server API
 * @param rtspUrl - The RTSP URL to test
 * @param timeoutMs - Timeout in milliseconds
 */
export async function testConnectionViaMediaServer(
  mediaServerUrl: string,
  rtspUrl: string,
  timeoutMs: number = 10000
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${mediaServerUrl}/api/cameras/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rtspUrl }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Server error: ${response.status}`,
        latency: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    const data = await response.json();

    return {
      success: data.connected === true,
      error: data.connected ? undefined : 'Camera stream not available',
      latency: Date.now() - startTime,
      streamInfo: data.streamInfo,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Media server test failed',
      latency: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

/**
 * Create a health monitor for multiple cameras
 * 
 * @param cameras - Array of cameras to monitor
 * @param onStatusChange - Callback when a camera's status changes
 * @param intervalMs - Check interval in milliseconds
 * @returns Cleanup function
 */
export function createHealthMonitor(
  cameras: Array<{ id: string; rtspUrl: string }>,
  onStatusChange: (cameraId: string, health: CameraHealth) => void,
  intervalMs: number = 30000
): () => void {
  const healthMap = new Map<string, CameraHealth>();
  let isRunning = true;

  // Initialize health records
  cameras.forEach(camera => {
    healthMap.set(camera.id, {
      cameraId: camera.id,
      isOnline: true, // Assume online initially
      avgLatency: 0,
      failureCount: 0,
      lastTest: {
        success: true,
        timestamp: new Date(),
      },
    });
  });

  const checkAll = async () => {
    if (!isRunning) return;

    for (const camera of cameras) {
      if (!isRunning) break;

      const result = await testCameraConnection(camera.rtspUrl);
      const currentHealth = healthMap.get(camera.id)!;

      const wasOnline = currentHealth.isOnline;
      const newHealth: CameraHealth = {
        cameraId: camera.id,
        isOnline: result.success,
        avgLatency: result.latency 
          ? (currentHealth.avgLatency + result.latency) / 2 
          : currentHealth.avgLatency,
        lastOnline: result.success ? new Date() : currentHealth.lastOnline,
        failureCount: result.success ? 0 : currentHealth.failureCount + 1,
        lastTest: result,
      };

      healthMap.set(camera.id, newHealth);

      // Notify on status change
      if (wasOnline !== newHealth.isOnline) {
        onStatusChange(camera.id, newHealth);
      }
    }
  };

  // Initial check
  checkAll();

  // Periodic checks
  const intervalId = setInterval(checkAll, intervalMs);

  // Return cleanup function
  return () => {
    isRunning = false;
    clearInterval(intervalId);
  };
}

/**
 * Validate IP address format
 */
function isValidIp(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    // Could also be a hostname
    return /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/.test(ip);
  }

  const parts = ip.split('.').map(Number);
  return parts.every(part => part >= 0 && part <= 255);
}

/**
 * Simple delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get connection quality based on latency
 */
export function getConnectionQuality(latency: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (latency < 100) return 'excellent';
  if (latency < 300) return 'good';
  if (latency < 1000) return 'fair';
  return 'poor';
}

/**
 * Format latency for display
 */
export function formatLatency(latency: number): string {
  if (latency < 1000) {
    return `${latency}ms`;
  }
  return `${(latency / 1000).toFixed(1)}s`;
}

