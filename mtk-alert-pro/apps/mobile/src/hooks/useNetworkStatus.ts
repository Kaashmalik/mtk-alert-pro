/**
 * Network Status Hook
 * Provides reactive network connectivity status
 * 
 * @module hooks/useNetworkStatus
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

/**
 * Network status information
 */
export interface NetworkStatus {
  /** Whether the device has an active network connection */
  isConnected: boolean;
  /** Whether the connection is WiFi */
  isWifi: boolean;
  /** Whether the connection is cellular */
  isCellular: boolean;
  /** The type of network connection */
  type: NetInfoStateType;
  /** Whether the connection is expensive (cellular data) */
  isExpensive: boolean;
  /** Whether the network status is still being determined */
  isLoading: boolean;
}

/**
 * Default network status while loading
 */
const DEFAULT_STATUS: NetworkStatus = {
  isConnected: true, // Assume connected initially
  isWifi: false,
  isCellular: false,
  type: NetInfoStateType.unknown,
  isExpensive: false,
  isLoading: true,
};

/**
 * Hook to monitor network connectivity status
 * 
 * @returns NetworkStatus object with current network state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, isWifi } = useNetworkStatus();
 *   
 *   if (!isConnected) {
 *     return <OfflineMessage />;
 *   }
 *   
 *   return <Content streamQuality={isWifi ? 'high' : 'low'} />;
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(DEFAULT_STATUS);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus(mapNetInfoState(state));
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus(mapNetInfoState(state));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}

/**
 * Map NetInfo state to our NetworkStatus interface
 */
function mapNetInfoState(state: NetInfoState): NetworkStatus {
  return {
    isConnected: state.isConnected ?? false,
    isWifi: state.type === NetInfoStateType.wifi,
    isCellular: state.type === NetInfoStateType.cellular,
    type: state.type,
    isExpensive: state.details !== null && 'isConnectionExpensive' in state.details 
      ? (state.details as { isConnectionExpensive?: boolean }).isConnectionExpensive ?? false
      : false,
    isLoading: false,
  };
}

/**
 * Hook to get network status with automatic refresh
 * 
 * @param refreshIntervalMs - How often to refresh the status (default: 30000ms)
 * @returns NetworkStatus with refresh function
 */
export function useNetworkStatusWithRefresh(refreshIntervalMs: number = 30000): NetworkStatus & {
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<NetworkStatus>(DEFAULT_STATUS);

  const refresh = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      setStatus(mapNetInfoState(state));
    } catch (error) {
      console.error('[NetworkStatus] Refresh failed:', error);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refresh();

    // Subscribe to updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus(mapNetInfoState(state));
    });

    // Periodic refresh
    const interval = setInterval(refresh, refreshIntervalMs);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refresh, refreshIntervalMs]);

  return { ...status, refresh };
}

/**
 * Wait for network to become available
 * 
 * @param timeoutMs - Maximum time to wait (default: 30000ms)
 * @returns Promise that resolves when network is available
 * @throws Error if timeout is reached
 */
export async function waitForNetwork(timeoutMs: number = 30000): Promise<void> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      
      if (state.isConnected) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime >= timeoutMs) {
        reject(new Error('Network timeout - no connection available'));
        return;
      }
      
      // Check again in 1 second
      setTimeout(checkConnection, 1000);
    };
    
    checkConnection();
  });
}

/**
 * Check if streaming should use high quality based on network
 * 
 * @param status - Current network status
 * @returns Whether to use high quality streaming
 */
export function shouldUseHighQuality(status: NetworkStatus): boolean {
  // Only use high quality on WiFi that isn't expensive (e.g., hotspot)
  return status.isWifi && !status.isExpensive;
}

/**
 * Get recommended stream quality based on network
 * 
 * @param status - Current network status
 * @returns Recommended quality setting
 */
export function getRecommendedQuality(status: NetworkStatus): '1080p' | '720p' | '480p' | '360p' {
  if (!status.isConnected) {
    return '360p';
  }
  
  if (status.isWifi && !status.isExpensive) {
    return '1080p';
  }
  
  if (status.isWifi) {
    return '720p';
  }
  
  if (status.isCellular) {
    return '480p';
  }
  
  return '720p';
}

