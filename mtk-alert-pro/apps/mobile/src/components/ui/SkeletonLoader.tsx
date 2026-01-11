/**
 * Skeleton Loader Component
 * 
 * Beautiful skeleton loading states for better perceived performance
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

// ============================================================================
// Base Skeleton Component
// ============================================================================

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as number,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ============================================================================
// Skeleton Card
// ============================================================================

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={14} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={12} style={{ marginTop: 16 }} />
      <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

// ============================================================================
// Camera Card Skeleton
// ============================================================================

export function SkeletonCameraCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.cameraCard, style]}>
      <Skeleton width="100%" height={160} borderRadius={borderRadius.xl} />
      <View style={styles.cameraInfo}>
        <Skeleton width="50%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={14} />
      </View>
      <View style={styles.cameraStatus}>
        <Skeleton width={60} height={24} borderRadius={borderRadius.full} />
        <Skeleton width={80} height={24} borderRadius={borderRadius.full} />
      </View>
    </View>
  );
}

// ============================================================================
// Alert Card Skeleton
// ============================================================================

export function SkeletonAlertCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.alertCard, style]}>
      <Skeleton width={40} height={40} borderRadius={12} />
      <View style={styles.alertContent}>
        <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={20} height={20} borderRadius={10} />
    </View>
  );
}

// ============================================================================
// Stats Grid Skeleton
// ============================================================================

export function SkeletonStatsGrid() {
  const cardWidth = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

  return (
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.statCard, { width: cardWidth }]}>
          <Skeleton width={40} height={40} borderRadius={12} style={{ marginBottom: 12 }} />
          <Skeleton width={60} height={32} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={14} />
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Dashboard Skeleton
// ============================================================================

export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View>
          <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
          <Skeleton width={150} height={28} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Red Alert Card */}
      <Skeleton
        width={SCREEN_WIDTH - spacing.xl * 2}
        height={80}
        borderRadius={borderRadius['2xl']}
        style={{ marginHorizontal: spacing.xl, marginBottom: spacing.xl }}
      />

      {/* Stats Grid */}
      <SkeletonStatsGrid />

      {/* System Status */}
      <Skeleton
        width={SCREEN_WIDTH - spacing.xl * 2}
        height={60}
        borderRadius={borderRadius.xl}
        style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl }}
      />

      {/* Recent Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Skeleton width={120} height={20} />
          <Skeleton width={60} height={16} />
        </View>
        <SkeletonAlertCard />
        <SkeletonAlertCard style={{ marginTop: spacing.sm }} />
        <SkeletonAlertCard style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

// ============================================================================
// List Skeleton
// ============================================================================

interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  gap?: number;
}

export function SkeletonList({ count = 5, itemHeight = 72, gap = spacing.md }: SkeletonListProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          width="100%"
          height={itemHeight}
          borderRadius={borderRadius.lg}
          style={{ marginBottom: i < count - 1 ? gap : 0 }}
        />
      ))}
    </View>
  );
}

// ============================================================================
// Profile Skeleton
// ============================================================================

export function SkeletonProfile() {
  return (
    <View style={styles.profile}>
      <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
      <Skeleton width={150} height={24} style={{ marginBottom: 8 }} />
      <Skeleton width={200} height={16} style={{ marginBottom: 24 }} />

      <View style={styles.profileStats}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.profileStat}>
            <Skeleton width={40} height={28} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Subscription Card Skeleton
// ============================================================================

export function SkeletonSubscriptionCard() {
  return (
    <View style={styles.subscriptionCard}>
      <View style={styles.subscriptionHeader}>
        <Skeleton width={120} height={24} style={{ marginBottom: 8 }} />
        <View style={styles.priceRow}>
          <Skeleton width={80} height={40} />
          <Skeleton width={40} height={16} style={{ marginLeft: 8 }} />
        </View>
      </View>

      <View style={styles.featuresList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.featureRow}>
            <Skeleton width={20} height={20} borderRadius={10} />
            <Skeleton width="80%" height={14} style={{ marginLeft: 12 }} />
          </View>
        ))}
      </View>

      <Skeleton width="100%" height={48} borderRadius={borderRadius.xl} style={{ marginTop: 16 }} />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.bg.tertiary,
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cameraCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  cameraInfo: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  cameraStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  alertContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  dashboard: {
    flex: 1,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profile: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxxl,
  },
  profileStat: {
    alignItems: 'center',
  },
  subscriptionCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  subscriptionHeader: {
    marginBottom: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

