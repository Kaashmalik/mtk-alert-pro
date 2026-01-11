/**
 * Offline Indicator Component
 * 
 * Shows network status and provides offline-aware UI feedback
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { WifiOff, RefreshCw, Wifi, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

interface OfflineIndicatorProps {
  onRetry?: () => void;
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  style?: any;
}

interface NetworkBannerProps {
  visible: boolean;
  type: 'offline' | 'slow' | 'restored';
  onDismiss?: () => void;
  onRetry?: () => void;
}

// ============================================================================
// Offline Indicator (Compact)
// ============================================================================

export function OfflineIndicator({
  onRetry,
  showWhenOnline = false,
  position = 'top',
  style,
}: OfflineIndicatorProps) {
  const { isConnected } = useNetworkStatus();
  const [slideAnim] = useState(new Animated.Value(-50));
  const [isVisible, setIsVisible] = useState(false);

  const isOffline = !isConnected;

  useEffect(() => {
    if (isOffline) {
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else if (!showWhenOnline) {
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -50 : 50,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [isOffline, showWhenOnline, position]);

  if (!isVisible && !showWhenOnline) return null;

  return (
    <Animated.View
      style={[
        styles.indicator,
        position === 'top' ? styles.indicatorTop : styles.indicatorBottom,
        { transform: [{ translateY: slideAnim }] },
        style,
      ]}
    >
      <View style={styles.indicatorContent}>
        {isOffline ? (
          <>
            <WifiOff size={16} color={colors.status.error} />
            <Text style={styles.indicatorText}>No Internet Connection</Text>
            {onRetry && (
              <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                <RefreshCw size={14} color={colors.status.error} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Wifi size={16} color={colors.status.success} />
            <Text style={[styles.indicatorText, { color: colors.status.success }]}>
              Connected
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Network Status Banner (Full Width)
// ============================================================================

export function NetworkBanner({
  visible,
  type,
  onDismiss,
  onRetry,
}: NetworkBannerProps) {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();

      // Auto-dismiss for 'restored' type
      if (type === 'restored') {
        setTimeout(() => {
          handleDismiss();
        }, 3000);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [visible, type]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  if (!isVisible) return null;

  const config = {
    offline: {
      icon: <WifiOff size={20} color="white" />,
      text: 'No internet connection',
      subtext: 'Some features may be unavailable',
      bgColor: colors.status.error,
    },
    slow: {
      icon: <AlertTriangle size={20} color="white" />,
      text: 'Slow connection detected',
      subtext: 'Streaming may be affected',
      bgColor: colors.status.warning,
    },
    restored: {
      icon: <Wifi size={20} color="white" />,
      text: 'Connection restored',
      subtext: 'You\'re back online',
      bgColor: colors.status.success,
    },
  };

  const { icon, text, subtext, bgColor } = config[type];

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bgColor, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerIcon}>{icon}</View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>{text}</Text>
          <Text style={styles.bannerSubtitle}>{subtext}</Text>
        </View>
        {onRetry && type === 'offline' && (
          <TouchableOpacity onPress={onRetry} style={styles.bannerRetry}>
            <RefreshCw size={18} color="white" />
            <Text style={styles.bannerRetryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Offline Overlay (Full Screen)
// ============================================================================

interface OfflineOverlayProps {
  onRetry?: () => void;
  message?: string;
}

export function OfflineOverlay({ onRetry, message }: OfflineOverlayProps) {
  const { isConnected } = useNetworkStatus();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isConnected ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);

  if (isConnected) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.overlayContent}>
        <View style={styles.overlayIcon}>
          <WifiOff size={48} color={colors.text.muted} />
        </View>
        <Text style={styles.overlayTitle}>You're Offline</Text>
        <Text style={styles.overlayMessage}>
          {message || 'Please check your internet connection to continue.'}
        </Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.overlayButton}>
            <RefreshCw size={18} color="white" />
            <Text style={styles.overlayButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Connection Quality Indicator
// ============================================================================

interface ConnectionQualityProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ConnectionQualityIndicator({
  showLabel = true,
  size = 'medium',
}: ConnectionQualityProps) {
  const { isConnected, isWifi, isCellular, isExpensive } = useNetworkStatus();

  const getQuality = () => {
    if (!isConnected) return { level: 0, label: 'Offline', color: colors.status.error };
    if (isWifi && !isExpensive) return { level: 3, label: 'Excellent', color: colors.status.success };
    if (isWifi && isExpensive) return { level: 2, label: 'Good', color: colors.status.warning };
    if (isCellular) return { level: 1, label: 'Fair', color: colors.status.warning };
    return { level: 2, label: 'Good', color: colors.status.success };
  };

  const { level, label, color } = getQuality();
  const barSizes = { small: 4, medium: 6, large: 8 };
  const barWidth = barSizes[size];

  return (
    <View style={styles.qualityContainer}>
      <View style={styles.qualityBars}>
        {[1, 2, 3].map((bar) => (
          <View
            key={bar}
            style={[
              styles.qualityBar,
              {
                width: barWidth,
                height: bar * 4 + 4,
                backgroundColor: bar <= level ? color : colors.bg.tertiary,
              },
            ]}
          />
        ))}
      </View>
      {showLabel && (
        <Text style={[styles.qualityLabel, { color }]}>{label}</Text>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.bg.elevated,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  indicatorTop: {
    top: spacing.lg,
  },
  indicatorBottom: {
    bottom: spacing.lg,
  },
  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  indicatorText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.status.error,
  },
  retryButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  banner: {
    width: SCREEN_WIDTH,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    marginRight: spacing.md,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
  bannerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  bannerRetry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  bannerRetryText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: 'white',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 13, 20, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  overlayIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  overlayTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  overlayMessage: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  overlayButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qualityBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  qualityBar: {
    borderRadius: 1,
  },
  qualityLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});

// Platform import needed for shadow
import { Platform } from 'react-native';

