/**
 * Error Handling Utilities
 * Provides standardized error handling across the app
 * 
 * @module lib/utils/errorHandler
 */

import { Alert } from 'react-native';

/**
 * Error codes for categorizing errors
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Authentication errors
  AUTH_ERROR: 'AUTH_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Camera errors
  CAMERA_ERROR: 'CAMERA_ERROR',
  CAMERA_OFFLINE: 'CAMERA_OFFLINE',
  CAMERA_AUTH_FAILED: 'CAMERA_AUTH_FAILED',
  
  // Streaming errors
  STREAM_ERROR: 'STREAM_ERROR',
  STREAM_UNAVAILABLE: 'STREAM_UNAVAILABLE',
  
  // Detection errors
  DETECTION_ERROR: 'DETECTION_ERROR',
  MODEL_LOAD_ERROR: 'MODEL_LOAD_ERROR',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

/**
 * Standardized application error
 */
export interface AppError {
  /** Error code for programmatic handling */
  code: ErrorCode;
  /** Technical error message for logging */
  message: string;
  /** User-friendly error message for display */
  userMessage: string;
  /** Whether the error can be recovered from */
  recoverable: boolean;
  /** Original error if available */
  originalError?: Error;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Default user-friendly messages for each error code
 */
const DEFAULT_USER_MESSAGES: Record<ErrorCode, string> = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'The request took too long. Please try again.',
  AUTH_ERROR: 'Authentication failed. Please check your credentials.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  CAMERA_ERROR: 'Camera connection failed. Please verify your camera settings.',
  CAMERA_OFFLINE: 'Camera is offline. Please check if it\'s powered on and connected.',
  CAMERA_AUTH_FAILED: 'Camera authentication failed. Please check username and password.',
  STREAM_ERROR: 'Video stream unavailable. Please try again.',
  STREAM_UNAVAILABLE: 'Stream is not available. Camera may be offline.',
  DETECTION_ERROR: 'Detection service temporarily unavailable.',
  MODEL_LOAD_ERROR: 'Failed to load AI model. Please restart the app.',
  STORAGE_ERROR: 'Storage operation failed. Please try again.',
  QUOTA_EXCEEDED: 'Storage quota exceeded. Please delete some recordings.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  VALIDATION_ERROR: 'Invalid input. Please check your entries.',
};

/**
 * Errors that can potentially be recovered from
 */
const RECOVERABLE_ERRORS: ErrorCode[] = [
  'NETWORK_ERROR',
  'TIMEOUT_ERROR',
  'STREAM_ERROR',
  'STREAM_UNAVAILABLE',
  'DETECTION_ERROR',
  'CAMERA_OFFLINE',
];

/**
 * Create a standardized AppError
 * 
 * @param code - Error code
 * @param message - Technical message
 * @param options - Additional options
 * @returns AppError object
 * 
 * @example
 * ```ts
 * throw createAppError('NETWORK_ERROR', 'Failed to fetch cameras');
 * ```
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  options?: {
    userMessage?: string;
    originalError?: Error;
    context?: Record<string, unknown>;
  }
): AppError {
  return {
    code,
    message,
    userMessage: options?.userMessage || DEFAULT_USER_MESSAGES[code],
    recoverable: RECOVERABLE_ERRORS.includes(code),
    originalError: options?.originalError,
    context: options?.context,
  };
}

/**
 * Parse an unknown error into an AppError
 * 
 * @param error - Any error type
 * @param fallbackCode - Code to use if error type is unknown
 * @returns AppError object
 */
export function parseError(
  error: unknown,
  fallbackCode: ErrorCode = 'UNKNOWN_ERROR'
): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Standard Error object
  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return createAppError('NETWORK_ERROR', error.message, { originalError: error });
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return createAppError('TIMEOUT_ERROR', error.message, { originalError: error });
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('401')) {
      return createAppError('AUTH_ERROR', error.message, { originalError: error });
    }
    
    if (message.includes('session') || message.includes('expired')) {
      return createAppError('SESSION_EXPIRED', error.message, { originalError: error });
    }
    
    return createAppError(fallbackCode, error.message, { originalError: error });
  }

  // String error
  if (typeof error === 'string') {
    return createAppError(fallbackCode, error);
  }

  // Unknown error type
  return createAppError(fallbackCode, 'An unknown error occurred');
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error &&
    'recoverable' in error
  );
}

/**
 * Log an error with consistent formatting
 * 
 * @param error - The error to log
 * @param context - Additional context for debugging
 */
export function logError(error: AppError | unknown, context?: string): void {
  const appError = isAppError(error) ? error : parseError(error);
  
  const logMessage = [
    `[Error] ${context || 'Application Error'}`,
    `Code: ${appError.code}`,
    `Message: ${appError.message}`,
    appError.context ? `Context: ${JSON.stringify(appError.context)}` : null,
    appError.originalError?.stack ? `Stack: ${appError.originalError.stack}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  
  console.error(logMessage);
}

/**
 * Show an error alert to the user
 * 
 * @param error - The error to display
 * @param options - Alert options
 */
export function showErrorAlert(
  error: AppError | unknown,
  options?: {
    title?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
  }
): void {
  const appError = isAppError(error) ? error : parseError(error);
  
  const buttons: Array<{
    text: string;
    style?: 'cancel' | 'default' | 'destructive';
    onPress?: () => void;
  }> = [];

  // Add retry button for recoverable errors
  if (appError.recoverable && options?.onRetry) {
    buttons.push({
      text: 'Retry',
      style: 'default',
      onPress: options.onRetry,
    });
    buttons.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: options?.onDismiss,
    });
  } else {
    buttons.push({
      text: 'OK',
      style: 'default',
      onPress: options?.onDismiss,
    });
  }

  Alert.alert(
    options?.title || 'Error',
    appError.userMessage,
    buttons
  );
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry options
 * @returns The function result
 * 
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetchCameras(),
 *   { maxRetries: 3, delayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options || {};

  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        
        onRetry?.(attempt, lastError);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Wrap an async function with error handling
 * 
 * @param fn - The async function to wrap
 * @param errorCode - Default error code for failures
 * @returns A wrapped function that returns a result or error
 * 
 * @example
 * ```ts
 * const [data, error] = await safeAsync(fetchCameras)();
 * if (error) {
 *   showErrorAlert(error);
 *   return;
 * }
 * // Use data safely
 * ```
 */
export function safeAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  errorCode: ErrorCode = 'UNKNOWN_ERROR'
): (...args: Args) => Promise<[T, null] | [null, AppError]> {
  return async (...args: Args): Promise<[T, null] | [null, AppError]> => {
    try {
      const result = await fn(...args);
      return [result, null];
    } catch (error) {
      const appError = parseError(error, errorCode);
      logError(appError);
      return [null, appError];
    }
  };
}

/**
 * Check if the device is online
 * Note: This is a basic check, use useNetworkStatus hook for reactive updates
 */
export async function isOnline(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Handle and log error, returning user-friendly message
 * 
 * @param error - The error to handle
 * @param context - Context string for logging
 * @returns User-friendly error message
 */
export function handleError(error: unknown, context?: string): string {
  const appError = isAppError(error) ? error : parseError(error);
  logError(appError, context);
  return appError.userMessage;
}

/**
 * Retry async function with exponential backoff
 * Alias for withRetry for backwards compatibility
 */
export const retryAsync = withRetry;

