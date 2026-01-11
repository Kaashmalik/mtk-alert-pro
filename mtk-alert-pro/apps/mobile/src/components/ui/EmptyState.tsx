/**
 * Empty State Component
 * 
 * Beautiful empty state illustrations and messages
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  Bell,
  Shield,
  Video,
  Search,
  CloudOff,
  WifiOff,
  FileQuestion,
  Inbox,
  UserX,
  PlayCircle,
  Plus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius, palette } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

type EmptyStateType =
  | 'cameras'
  | 'alerts'
  | 'recordings'
  | 'search'
  | 'offline'
  | 'error'
  | 'no-results'
  | 'inbox'
  | 'unauthorized'
  | 'no-stream';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

interface EmptyStateConfig {
  icon: React.ReactNode;
  iconBgColor: string;
  defaultTitle: string;
  defaultMessage: string;
  defaultActionLabel?: string;
}

// ============================================================================
// Config
// ============================================================================

const getConfig = (type: EmptyStateType): EmptyStateConfig => {
  const iconSize = 40;
  
  const configs: Record<EmptyStateType, EmptyStateConfig> = {
    cameras: {
      icon: <Camera size={iconSize} color={colors.status.info} />,
      iconBgColor: colors.status.infoBg,
      defaultTitle: 'No Cameras Added',
      defaultMessage: 'Add your first security camera to start monitoring your property.',
      defaultActionLabel: 'Add Camera',
    },
    alerts: {
      icon: <Bell size={iconSize} color={colors.status.success} />,
      iconBgColor: colors.status.successBg,
      defaultTitle: 'All Clear!',
      defaultMessage: 'No alerts to show. Your cameras are monitoring and everything looks good.',
    },
    recordings: {
      icon: <Video size={iconSize} color={palette.violet[500]} />,
      iconBgColor: 'rgba(139, 92, 246, 0.15)',
      defaultTitle: 'No Recordings Yet',
      defaultMessage: 'Recordings will appear here when motion is detected or you manually record.',
    },
    search: {
      icon: <Search size={iconSize} color={colors.text.muted} />,
      iconBgColor: colors.bg.tertiary,
      defaultTitle: 'No Results Found',
      defaultMessage: 'Try adjusting your search terms or filters.',
    },
    offline: {
      icon: <WifiOff size={iconSize} color={colors.status.error} />,
      iconBgColor: colors.status.errorBg,
      defaultTitle: "You're Offline",
      defaultMessage: 'Please check your internet connection and try again.',
      defaultActionLabel: 'Retry',
    },
    error: {
      icon: <CloudOff size={iconSize} color={colors.status.error} />,
      iconBgColor: colors.status.errorBg,
      defaultTitle: 'Something Went Wrong',
      defaultMessage: "We couldn't load this content. Please try again.",
      defaultActionLabel: 'Retry',
    },
    'no-results': {
      icon: <FileQuestion size={iconSize} color={colors.text.muted} />,
      iconBgColor: colors.bg.tertiary,
      defaultTitle: 'No Results',
      defaultMessage: "We couldn't find what you're looking for.",
    },
    inbox: {
      icon: <Inbox size={iconSize} color={colors.status.info} />,
      iconBgColor: colors.status.infoBg,
      defaultTitle: 'Inbox Empty',
      defaultMessage: 'You have no notifications at this time.',
    },
    unauthorized: {
      icon: <UserX size={iconSize} color={colors.status.warning} />,
      iconBgColor: colors.status.warningBg,
      defaultTitle: 'Access Denied',
      defaultMessage: 'You need to upgrade your plan to access this feature.',
      defaultActionLabel: 'Upgrade Now',
    },
    'no-stream': {
      icon: <PlayCircle size={iconSize} color={colors.text.muted} />,
      iconBgColor: colors.bg.tertiary,
      defaultTitle: 'Stream Unavailable',
      defaultMessage: 'Unable to connect to this camera. Please check if the camera is online.',
      defaultActionLabel: 'Retry Connection',
    },
  };

  return configs[type];
};

// ============================================================================
// Component
// ============================================================================

export function EmptyState({
  type,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}: EmptyStateProps) {
  const config = getConfig(type);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          compact && styles.iconContainerCompact,
          { backgroundColor: config.iconBgColor },
        ]}
      >
        {config.icon}
      </View>

      {/* Title */}
      <Text style={[styles.title, compact && styles.titleCompact]}>
        {title || config.defaultTitle}
      </Text>

      {/* Message */}
      <Text style={[styles.message, compact && styles.messageCompact]}>
        {message || config.defaultMessage}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        {(actionLabel || config.defaultActionLabel) && onAction && (
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.9}
            style={styles.primaryButton}
          >
            <LinearGradient
              colors={[palette.red[500], palette.red[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              {type === 'cameras' && <Plus size={18} color="white" />}
              {(type === 'offline' || type === 'error' || type === 'no-stream') && (
                <RefreshCw size={18} color="white" />
              )}
              {type === 'unauthorized' && <ArrowRight size={18} color="white" />}
              <Text style={styles.primaryButtonText}>
                {actionLabel || config.defaultActionLabel}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <TouchableOpacity
            onPress={onSecondaryAction}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Specialized Empty States
// ============================================================================

interface NoCamerasEmptyStateProps {
  onAddCamera: () => void;
  onHelp?: () => void;
}

export function NoCamerasEmptyState({ onAddCamera, onHelp }: NoCamerasEmptyStateProps) {
  return (
    <View style={styles.specialContainer}>
      {/* Animated Camera Icon */}
      <View style={styles.animatedIconContainer}>
        <View style={styles.cameraCircle}>
          <Camera size={48} color={colors.status.info} />
        </View>
        <View style={styles.pulseRing} />
        <View style={styles.pulseRingOuter} />
      </View>

      <Text style={styles.specialTitle}>Add Your First Camera</Text>
      <Text style={styles.specialMessage}>
        Connect your IP cameras to start monitoring with AI-powered detection
      </Text>

      {/* Features List */}
      <View style={styles.featureList}>
        {[
          'Real-time video streaming',
          'AI person & vehicle detection',
          'Instant push notifications',
        ].map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Shield size={14} color={colors.status.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onAddCamera}
        activeOpacity={0.9}
        style={styles.primaryButton}
      >
        <LinearGradient
          colors={[palette.red[500], palette.red[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButtonGradient}
        >
          <Plus size={20} color="white" />
          <Text style={styles.primaryButtonText}>Add Camera</Text>
        </LinearGradient>
      </TouchableOpacity>

      {onHelp && (
        <TouchableOpacity onPress={onHelp} style={styles.helpLink}>
          <Text style={styles.helpLinkText}>Need help connecting?</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface NoAlertsEmptyStateProps {
  hasActiveDetection?: boolean;
}

export function NoAlertsEmptyState({ hasActiveDetection = true }: NoAlertsEmptyStateProps) {
  return (
    <View style={styles.alertsEmptyContainer}>
      <View style={[styles.alertsIconContainer, { backgroundColor: colors.status.successBg }]}>
        <Shield size={48} color={colors.status.success} />
      </View>
      
      <Text style={styles.alertsTitle}>All Clear!</Text>
      <Text style={styles.alertsMessage}>
        {hasActiveDetection
          ? 'No recent alerts. Your cameras are actively monitoring.'
          : 'Enable detection on your cameras to start receiving alerts.'}
      </Text>

      {hasActiveDetection && (
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Detection Active</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing['5xl'],
  },
  containerCompact: {
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconContainerCompact: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleCompact: {
    fontSize: fontSize.lg,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  messageCompact: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },

  // Special No Cameras Empty State
  specialContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing['4xl'],
  },
  animatedIconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  cameraCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.status.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.15)',
  },
  specialTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  specialMessage: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  featureList: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  helpLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  helpLinkText: {
    fontSize: fontSize.sm,
    color: palette.red[500],
    fontWeight: '500',
  },

  // No Alerts Empty State
  alertsEmptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing['4xl'],
  },
  alertsIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  alertsTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  alertsMessage: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.status.success,
  },
});

