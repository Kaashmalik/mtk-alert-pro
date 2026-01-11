import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== SECURITY UTILITIES ====================

// Encryption key - in production, this should be stored securely
const ENCRYPTION_KEY = 'mtk-alert-pro-secure-key-2024';

// Camera validation schemas
export const cameraCredentialsSchema = z.object({
  username: z.string().min(1, 'Username required').max(50, 'Username too long'),
  password: z.string().min(4, 'Password must be at least 4 characters').max(100, 'Password too long'),
});

export const rtspUrlSchema = z.string()
  .min(1, 'RTSP URL required')
  .regex(/^rtsp:\/\/[\w.-]+(:\d+)?\/.+$/, 'Invalid RTSP URL format')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'rtsp:';
    } catch {
      return false;
    }
  }, 'RTSP URL must be valid');

export const cameraNameSchema = z.string()
  .min(1, 'Camera name required')
  .max(50, 'Camera name too long')
  .regex(/^[\w\s\-]+$/, 'Camera name can only contain letters, numbers, spaces, and hyphens');

export const cameraSchema = z.object({
  name: cameraNameSchema,
  rtspUrl: rtspUrlSchema,
  username: z.string().optional(),
  password: z.string().optional(),
  isActive: z.boolean().default(true),
  detectionSettings: z.object({
    person: z.boolean(),
    vehicle: z.boolean(),
    face: z.boolean().optional(),
    sensitivity: z.number().min(0.1).max(1.0),
    notificationsEnabled: z.boolean(),
    alarmEnabled: z.boolean(),
  }),
});

// Authentication schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  displayName: z.string().min(1).max(30).regex(/^[\w\s]+$/, 'Invalid display name').optional(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Encryption utilities
export function encryptData(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

export function encryptCameraCredentials(username?: string, password?: string): {
  username?: string;
  password?: string;
} {
  const result: { username?: string; password?: string } = {};
  
  if (username) result.username = encryptData(username);
  if (password) result.password = encryptData(password);
  
  return result;
}

export function decryptCameraCredentials(encryptedUsername?: string, encryptedPassword?: string): {
  username?: string;
  password?: string;
} {
  const result: { username?: string; password?: string } = {};
  
  try {
    if (encryptedUsername) result.username = decryptData(encryptedUsername);
    if (encryptedPassword) result.password = decryptData(encryptedPassword);
  } catch (error) {
    console.error('Failed to decrypt camera credentials:', error);
    return { username: '', password: '' };
  }
  
  return result;
}

// RTSP connection testing
export async function testRTSPConnection(rtspUrl: string): Promise<{
  isValid: boolean;
  error?: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    const urlValidation = rtspUrlSchema.safeParse(rtspUrl);
    if (!urlValidation.success) {
      return {
        isValid: false,
        error: urlValidation.error.errors[0]?.message || 'Invalid RTSP URL',
      };
    }

    const parsedUrl = new URL(rtspUrl);
    const host = parsedUrl.hostname;
    
    // Check if it's a private IP
    const isPrivateIP = /^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\.|^127\./.test(host);
    
    if (!isPrivateIP) {
      return {
        isValid: false,
        error: 'Only private IP addresses are supported',
      };
    }

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      isValid: true,
      responseTime: Date.now() - startTime,
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}

// Validation helpers
export function validateCameraInput(cameraData: unknown) {
  const result = cameraSchema.safeParse(cameraData);
  
  if (result.success) {
    return { isValid: true, data: result.data };
  }
  
  return {
    isValid: false,
    errors: result.error.errors.map(err => err.message),
  };
}

export function validateAuthInput(type: 'signIn' | 'signUp', data: unknown) {
  const schema = type === 'signIn' ? signInSchema : signUpSchema;
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { isValid: true, data: result.data };
  }
  
  return {
    isValid: false,
    errors: result.error.errors.map(err => err.message),
  };
}

// ==================== OFFLINE & ERROR RECOVERY UTILITIES ====================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

/**
 * Exponential backoff retry function with jitter
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffFactor } = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries + 1} attempts:`, lastError);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return false;
    }
    
    // Try to reach a reliable endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Safe fetch with retry and timeout
 */
export async function safeFetch(
  url: string,
  options: RequestInit & { timeout?: number } = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }, retryConfig);
}

/**
 * Queue for offline operations
 */
export class OfflineQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  
  add(operation: () => Promise<any>) {
    this.queue.push(operation);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      
      try {
        const online = await isOnline();
        if (online) {
          await operation();
        } else {
          // Put it back in the queue if offline
          this.queue.unshift(operation);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error('Offline operation failed:', error);
      }
    }
    
    this.isProcessing = false;
  }
}

export const offlineQueue = new OfflineQueue();

/**
 * Error boundary fallback component data
 */
export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
  userAgent?: string;
}

/**
 * Log error for debugging and potential reporting
 */
export function logError(error: Error, context?: string): ErrorInfo {
  const errorInfo: ErrorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };
  
  console.error(`Error${context ? ` in ${context}` : ''}:`, errorInfo);
  
  // In production, you'd send this to Sentry or similar service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement error reporting service
  }
  
  return errorInfo;
}

/**
 * TanStack Query persistence configuration
 * Excludes sensitive data like credentials
 */
export const PERSISTENCE_CONFIG = {
  key: 'mtk-alert-pro-cache',
  storage: {
    getItem: async (key: string) => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, value);
      } catch {
        // Silent fail for storage errors
      }
    },
    removeItem: async (key: string) => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(key);
      } catch {
        // Silent fail for storage errors
      }
    },
  },
  // Only persist non-sensitive queries
  persistQuery: (query: any) => {
    const queryKey = query.queryKey[0];
    // Exclude sensitive operations
    const sensitiveQueries = ['cameras-with-credentials', 'auth-session'];
    return !sensitiveQueries.some(sensitive => queryKey.includes(sensitive));
  },
};
