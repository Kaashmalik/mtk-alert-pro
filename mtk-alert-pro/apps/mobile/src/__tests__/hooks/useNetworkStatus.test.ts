/**
 * useNetworkStatus Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  useNetworkStatus,
  useNetworkStatusWithRefresh,
  waitForNetwork,
  shouldUseHighQuality,
  getRecommendedQuality,
  type NetworkStatus,
} from '@/hooks/useNetworkStatus';

describe('useNetworkStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // useNetworkStatus
  // =========================================================================
  describe('useNetworkStatus', () => {
    it('should return initial loading state', () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
    });

    it('should return connected state after fetch', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: true,
        type: 'wifi',
        details: { isConnectionExpensive: false },
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isWifi).toBe(true);
    });

    it('should subscribe to network changes', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Verify addEventListener was called
      expect(NetInfo.addEventListener).toHaveBeenCalled();
      
      // Eventually should not be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });
    });

    it('should have correct initial defaults', () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Initial state should assume connected while loading
      expect(result.current.isConnected).toBe(true);
    });

    it('should cleanup listener on unmount', () => {
      const unsubscribe = jest.fn();
      (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useNetworkStatus());

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // useNetworkStatusWithRefresh
  // =========================================================================
  describe('useNetworkStatusWithRefresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should provide refresh function', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        type: 'wifi',
      });

      const { result } = renderHook(() => useNetworkStatusWithRefresh(30000));

      await act(async () => {
        await result.current.refresh();
      });

      expect(NetInfo.fetch).toHaveBeenCalled();
    });

    it('should auto-refresh at interval', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        type: 'wifi',
      });

      renderHook(() => useNetworkStatusWithRefresh(1000));

      // Initial fetch
      expect(NetInfo.fetch).toHaveBeenCalledTimes(1);

      // Advance timer
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should have refreshed
      expect(NetInfo.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // waitForNetwork
  // =========================================================================
  describe('waitForNetwork', () => {
    it('should resolve immediately if connected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
      });

      const result = await waitForNetwork(5000);

      expect(result).toBeUndefined();
    });

    it('should be a function that returns a promise', () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
      });

      const result = waitForNetwork(1000);
      
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // =========================================================================
  // shouldUseHighQuality
  // =========================================================================
  describe('shouldUseHighQuality', () => {
    it('should return true for wifi without expense', () => {
      const status: NetworkStatus = {
        isConnected: true,
        isWifi: true,
        isCellular: false,
        type: 'wifi' as any,
        isExpensive: false,
        isLoading: false,
      };

      expect(shouldUseHighQuality(status)).toBe(true);
    });

    it('should return false for expensive wifi (hotspot)', () => {
      const status: NetworkStatus = {
        isConnected: true,
        isWifi: true,
        isCellular: false,
        type: 'wifi' as any,
        isExpensive: true,
        isLoading: false,
      };

      expect(shouldUseHighQuality(status)).toBe(false);
    });

    it('should return false for cellular', () => {
      const status: NetworkStatus = {
        isConnected: true,
        isWifi: false,
        isCellular: true,
        type: 'cellular' as any,
        isExpensive: true,
        isLoading: false,
      };

      expect(shouldUseHighQuality(status)).toBe(false);
    });
  });

  // =========================================================================
  // getRecommendedQuality
  // =========================================================================
  describe('getRecommendedQuality', () => {
    it('should recommend 1080p for wifi', () => {
      const status: NetworkStatus = {
        isConnected: true,
        isWifi: true,
        isCellular: false,
        type: 'wifi' as any,
        isExpensive: false,
        isLoading: false,
      };

      expect(getRecommendedQuality(status)).toBe('1080p');
    });

    it('should recommend 720p for expensive wifi', () => {
      const status: NetworkStatus = {
        isConnected: true,
        isWifi: true,
        isCellular: false,
        type: 'wifi' as any,
        isExpensive: true,
        isLoading: false,
      };

      expect(getRecommendedQuality(status)).toBe('720p');
    });

    it('should recommend 480p for cellular', () => {
      const status: NetworkStatus = {
        isConnected: true,
        isWifi: false,
        isCellular: true,
        type: 'cellular' as any,
        isExpensive: true,
        isLoading: false,
      };

      expect(getRecommendedQuality(status)).toBe('480p');
    });

    it('should recommend 360p when disconnected', () => {
      const status: NetworkStatus = {
        isConnected: false,
        isWifi: false,
        isCellular: false,
        type: 'none' as any,
        isExpensive: false,
        isLoading: false,
      };

      expect(getRecommendedQuality(status)).toBe('360p');
    });
  });
});

