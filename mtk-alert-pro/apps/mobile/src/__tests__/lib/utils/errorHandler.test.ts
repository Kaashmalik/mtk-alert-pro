/**
 * Error Handler Utility Tests
 */

import { Alert } from 'react-native';
import {
  ErrorCodes,
  createAppError,
  parseError,
  isAppError,
  logError,
  showErrorAlert,
  withRetry,
  safeAsync,
  isOnline,
  type AppError,
} from '@/lib/utils/errorHandler';

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('Error Handler Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // createAppError
  // =========================================================================
  describe('createAppError', () => {
    it('should create an AppError with default user message', () => {
      const error = createAppError('NETWORK_ERROR', 'Failed to fetch');
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Failed to fetch');
      expect(error.userMessage).toBe('Unable to connect. Please check your internet connection and try again.');
      expect(error.recoverable).toBe(true);
    });

    it('should create an AppError with custom user message', () => {
      const error = createAppError('AUTH_ERROR', 'Token expired', {
        userMessage: 'Please sign in again to continue',
      });
      
      expect(error.userMessage).toBe('Please sign in again to continue');
    });

    it('should attach original error', () => {
      const originalError = new Error('Original error');
      const error = createAppError('CAMERA_ERROR', 'Camera failed', {
        originalError,
      });
      
      expect(error.originalError).toBe(originalError);
    });

    it('should attach context', () => {
      const error = createAppError('STREAM_ERROR', 'Stream failed', {
        context: { cameraId: '123', attempt: 2 },
      });
      
      expect(error.context).toEqual({ cameraId: '123', attempt: 2 });
    });

    it('should mark recoverable errors correctly', () => {
      const recoverableErrors = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'STREAM_ERROR'];
      const nonRecoverableErrors = ['AUTH_ERROR', 'CAMERA_AUTH_FAILED', 'VALIDATION_ERROR'];
      
      recoverableErrors.forEach(code => {
        const error = createAppError(code as keyof typeof ErrorCodes, 'test');
        expect(error.recoverable).toBe(true);
      });
      
      nonRecoverableErrors.forEach(code => {
        const error = createAppError(code as keyof typeof ErrorCodes, 'test');
        expect(error.recoverable).toBe(false);
      });
    });
  });

  // =========================================================================
  // parseError
  // =========================================================================
  describe('parseError', () => {
    it('should return AppError as-is', () => {
      const appError = createAppError('AUTH_ERROR', 'Auth failed');
      const parsed = parseError(appError);
      
      expect(parsed).toBe(appError);
    });

    it('should parse standard Error object', () => {
      const error = new Error('Something went wrong');
      const parsed = parseError(error);
      
      expect(parsed.code).toBe('UNKNOWN_ERROR');
      expect(parsed.message).toBe('Something went wrong');
      expect(parsed.originalError).toBe(error);
    });

    it('should detect network errors', () => {
      const error = new Error('Network request failed');
      const parsed = parseError(error);
      
      expect(parsed.code).toBe('NETWORK_ERROR');
    });

    it('should detect timeout errors', () => {
      const error = new Error('Request timed out');
      const parsed = parseError(error);
      
      expect(parsed.code).toBe('TIMEOUT_ERROR');
    });

    it('should detect auth errors', () => {
      const error = new Error('Unauthorized access');
      const parsed = parseError(error);
      
      expect(parsed.code).toBe('AUTH_ERROR');
    });

    it('should parse string errors', () => {
      const parsed = parseError('String error message');
      
      expect(parsed.code).toBe('UNKNOWN_ERROR');
      expect(parsed.message).toBe('String error message');
    });

    it('should handle unknown error types', () => {
      const parsed = parseError({ weird: 'object' });
      
      expect(parsed.code).toBe('UNKNOWN_ERROR');
      expect(parsed.message).toBe('An unknown error occurred');
    });

    it('should use fallback code', () => {
      const error = new Error('Some error');
      const parsed = parseError(error, 'CAMERA_ERROR');
      
      expect(parsed.code).toBe('CAMERA_ERROR');
    });
  });

  // =========================================================================
  // isAppError
  // =========================================================================
  describe('isAppError', () => {
    it('should return true for AppError', () => {
      const error = createAppError('AUTH_ERROR', 'test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for standard Error', () => {
      expect(isAppError(new Error('test'))).toBe(false);
    });

    it('should return false for string', () => {
      expect(isAppError('error string')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });

    it('should return false for partial match', () => {
      const partial = { code: 'ERROR', message: 'test' };
      expect(isAppError(partial)).toBe(false);
    });
  });

  // =========================================================================
  // logError
  // =========================================================================
  describe('logError', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log AppError', () => {
      const error = createAppError('CAMERA_ERROR', 'Camera failed');
      logError(error, 'CameraTest');
      
      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('CameraTest');
      expect(logMessage).toContain('CAMERA_ERROR');
    });

    it('should log standard Error', () => {
      const error = new Error('Test error');
      logError(error);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include context in log', () => {
      const error = createAppError('STREAM_ERROR', 'Stream failed', {
        context: { cameraId: '123' },
      });
      logError(error);
      
      const logMessage = consoleSpy.mock.calls[0][0];
      expect(logMessage).toContain('cameraId');
    });
  });

  // =========================================================================
  // showErrorAlert
  // =========================================================================
  describe('showErrorAlert', () => {
    it('should show alert with error message', () => {
      const error = createAppError('CAMERA_ERROR', 'Camera failed');
      showErrorAlert(error);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        error.userMessage,
        expect.any(Array)
      );
    });

    it('should show retry button for recoverable errors', () => {
      const error = createAppError('NETWORK_ERROR', 'Network failed');
      const onRetry = jest.fn();
      
      showErrorAlert(error, { onRetry });
      
      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
      expect(buttons).toHaveLength(2);
      expect(buttons[0].text).toBe('Retry');
    });

    it('should show only OK button for non-recoverable errors', () => {
      const error = createAppError('AUTH_ERROR', 'Auth failed');
      showErrorAlert(error);
      
      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
      expect(buttons).toHaveLength(1);
      expect(buttons[0].text).toBe('OK');
    });

    it('should use custom title', () => {
      const error = createAppError('CAMERA_ERROR', 'Camera failed');
      showErrorAlert(error, { title: 'Camera Error' });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Camera Error',
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  // =========================================================================
  // withRetry
  // =========================================================================
  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(fn, { maxRetries: 3, delayMs: 10 });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(withRetry(fn, { maxRetries: 3, delayMs: 10 }))
        .rejects.toThrow('Always fails');
      
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      const onRetry = jest.fn();
      
      await withRetry(fn, { maxRetries: 2, delayMs: 10, onRetry });
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should apply exponential backoff', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await withRetry(fn, { maxRetries: 3, delayMs: 50, backoffMultiplier: 2 });
      const elapsed = Date.now() - startTime;
      
      // First retry: 50ms, Second retry: 100ms = 150ms total minimum
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  // =========================================================================
  // safeAsync
  // =========================================================================
  describe('safeAsync', () => {
    it('should return tuple with result on success', async () => {
      const fn = async (x: number) => x * 2;
      const safeFn = safeAsync(fn);
      
      const [result, error] = await safeFn(5);
      
      expect(result).toBe(10);
      expect(error).toBeNull();
    });

    it('should return tuple with error on failure', async () => {
      const fn = async () => {
        throw new Error('Failed');
      };
      const safeFn = safeAsync(fn);
      
      const [result, error] = await safeFn();
      
      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Failed');
    });

    it('should use specified error code', async () => {
      const fn = async () => {
        throw new Error('Camera error');
      };
      const safeFn = safeAsync(fn, 'CAMERA_ERROR');
      
      const [, error] = await safeFn();
      
      expect(error?.code).toBe('CAMERA_ERROR');
    });

    it('should preserve function arguments', async () => {
      const fn = async (a: string, b: number) => `${a}-${b}`;
      const safeFn = safeAsync(fn);
      
      const [result] = await safeFn('test', 123);
      
      expect(result).toBe('test-123');
    });
  });

  // =========================================================================
  // isOnline
  // =========================================================================
  describe('isOnline', () => {
    it('should return true when online', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });
      
      const result = await isOnline();
      
      expect(result).toBe(true);
    });

    it('should return false when offline', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await isOnline();
      
      expect(result).toBe(false);
    });

    it('should return false on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      const result = await isOnline();
      
      expect(result).toBe(false);
    });
  });
});

