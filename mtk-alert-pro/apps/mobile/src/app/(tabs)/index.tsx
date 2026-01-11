/**
 * Home Screen / Dashboard
 * 
 * Main dashboard with quick stats, alerts, and camera status
 */

import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import {
  Shield,
  Camera,
  Bell,
  Activity,
  Plus,
  Settings,
  Crown,
  WifiOff,
  Users,
  Car,
  Zap,
} from 'lucide-react-native';
import { useAuthStore, useCameraStore, useAlertStore, useSettingsStore, useSubscriptionStore, useIsPremium } from '@/stores';
import { designSystem } from '@/theme/design-system';
import { AlertCard } from '@/components/animated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Component
// ============================================================================

export default function HomeScreen() {
  // Store selectors
  const user = useAuthStore((state) => state.user);
  const cameras = useCameraStore((state) => state.cameras);
  const fetchCameras = useCameraStore((state) => state.fetchCameras);
  const camerasLoading = useCameraStore((state) => state.isLoading);
  const alerts = useAlertStore((state) => state.alerts);
  const unreadCount = useAlertStore((state) => state.unreadCount);
  const fetchAlerts = useAlertStore((state) => state.fetchAlerts);
  const detection = useSettingsStore((state) => state.detection);
  const setDetection = useSettingsStore((state) => state.setDetection);
  // const currentTier = useSubscriptionStore((state) => state.currentTier); // Unused
  const isPremium = useIsPremium();

  // Animation values
  const toggleScale = useSharedValue(1);

  useEffect(() => {
    fetchCameras();
    fetchAlerts();
  }, []);

  const onRefresh = useCallback(() => {
    fetchCameras();
    fetchAlerts();
  }, [fetchCameras, fetchAlerts]);

  // Computed values
  const activeCameras = cameras.filter((c) => c.isActive).length;
  const offlineCameras = cameras.length - activeCameras;
  const recentAlerts = alerts.slice(0, 3);
  const personAlerts = alerts.filter((a) => a.type === 'person').length;
  const vehicleAlerts = alerts.filter((a) => a.type === 'vehicle').length;

  // Toggle Animation
  const animatedToggleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: toggleScale.value }],
  }));

  const handleToggleRedAlert = () => {
    toggleScale.value = withSpring(0.9, {}, () => {
      toggleScale.value = withSpring(1);
    });
    setDetection({ redAlertMode: !detection.redAlertMode });
  };

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={camerasLoading}
            onRefresh={onRefresh}
            tintColor={designSystem.colors.primary[500]}
            colors={[designSystem.colors.primary[500]]}
          />
        }
      >
        <SafeAreaView edges={['top']}>

          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={styles.header}
          >
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>
                  {user?.displayName || 'User'}
                </Text>
                {isPremium && (
                  <View style={styles.premiumBadge}>
                    <Crown size={12} color={designSystem.colors.status.warning} />
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Settings size={22} color={designSystem.colors.text.secondary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Red Alert Toggle */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <TouchableOpacity
              onPress={handleToggleRedAlert}
              style={styles.redAlertCard}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={detection.redAlertMode
                  ? [designSystem.colors.status.danger, '#DC2626'] // Red 600
                  : [designSystem.colors.background.tertiary, designSystem.colors.background.secondary]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.redAlertGradient}
              >
                <View style={styles.redAlertContent}>
                  <View style={[
                    styles.redAlertIcon,
                    detection.redAlertMode && styles.redAlertIconActive,
                  ]}>
                    <Zap
                      size={24}
                      color={detection.redAlertMode ? 'white' : designSystem.colors.status.danger}
                      fill={detection.redAlertMode ? 'white' : 'transparent'}
                    />
                  </View>
                  <View style={styles.redAlertText}>
                    <Text style={styles.redAlertTitle}>Red Alert Mode</Text>
                    <Text style={styles.redAlertSubtitle}>
                      {detection.redAlertMode
                        ? 'Maximum sensitivity active'
                        : 'Tap to enable high sensitivity'}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggle,
                  detection.redAlertMode && styles.toggleActive,
                ]}>
                  <Animated.View style={[
                    styles.toggleThumb,
                    detection.redAlertMode && styles.toggleThumbActive,
                    animatedToggleStyle
                  ]} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.statsGrid}
          >
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/(tabs)/cameras')}
              activeOpacity={0.8}
            >
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Camera size={20} color={designSystem.colors.status.info} />
              </View>
              <Text style={styles.statValue}>{activeCameras}</Text>
              <Text style={styles.statLabel}>Active Cameras</Text>
              {offlineCameras > 0 && (
                <View style={styles.offlineBadge}>
                  <WifiOff size={10} color={designSystem.colors.status.danger} />
                  <Text style={styles.offlineText}>{offlineCameras} offline</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/(tabs)/alerts')}
              activeOpacity={0.8}
            >
              <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Bell size={20} color={designSystem.colors.status.danger} />
              </View>
              <Text style={styles.statValue}>{unreadCount}</Text>
              <Text style={styles.statLabel}>Unread Alerts</Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Users size={20} color={designSystem.colors.status.warning} />
              </View>
              <Text style={styles.statValue}>{personAlerts}</Text>
              <Text style={styles.statLabel}>Person Detected</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <Car size={20} color="#06B6D4" />
              </View>
              <Text style={styles.statValue}>{vehicleAlerts}</Text>
              <Text style={styles.statLabel}>Vehicle Detected</Text>
            </View>
          </Animated.View>

          {/* System Status */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.systemStatus}
          >
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot,
                { backgroundColor: activeCameras > 0 ? designSystem.colors.status.success : designSystem.colors.status.warning }
              ]} />
              <View style={styles.statusPulse} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>System Status</Text>
              <Text style={styles.statusText}>
                {activeCameras > 0
                  ? `${activeCameras} camera${activeCameras > 1 ? 's' : ''} monitoring`
                  : 'No cameras connected'}
              </Text>
            </View>
            <Activity size={20} color={designSystem.colors.text.muted} />
          </Animated.View>

          {/* Recent Alerts */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Alerts</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentAlerts.length === 0 ? (
              <View style={styles.emptyAlerts}>
                <View style={styles.emptyIconContainer}>
                  <Shield size={32} color={designSystem.colors.text.muted} />
                </View>
                <Text style={styles.emptyTitle}>All Clear</Text>
                <Text style={styles.emptyText}>
                  No recent alerts. Your cameras are monitoring.
                </Text>
              </View>
            ) : (
              recentAlerts.map((alert, index) => (
                <View key={alert.id} style={index !== recentAlerts.length - 1 ? { marginBottom: designSystem.spacing.sm } : {}}>
                  <AlertCard
                    id={alert.id}
                    type={alert.type as any} // 'person' | 'vehicle' | 'motion'
                    confidence={0.95} // Mock confidence if not available in summary
                    timestamp={new Date(alert.createdAt)}
                    thumbnailUrl={undefined} // Add if available
                    cameraName={`Camera ${alert.cameraId.slice(0, 4)}`} // Mock name if unavailable
                    onPress={() => router.push('/(tabs)/alerts')}
                  />
                </View>
              ))
            )}
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(600)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/cameras/add')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[designSystem.colors.primary[500], designSystem.colors.primary[600]]}
                  style={styles.actionGradient}
                >
                  <Plus size={20} color="white" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Add Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/cameras')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Camera size={20} color={designSystem.colors.status.info} />
                </View>
                <Text style={styles.actionLabel}>View Cameras</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/subscription')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Crown size={20} color={designSystem.colors.status.warning} />
                </View>
                <Text style={styles.actionLabel}>
                  {isPremium ? 'Manage Plan' : 'Upgrade'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/help')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Shield size={20} color={designSystem.colors.status.success} />
                </View>
                <Text style={styles.actionLabel}>Get Help</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Upgrade Banner (for free users) */}
          {!isPremium && (
            <Animated.View entering={FadeInUp.delay(600).duration(600)}>
              <TouchableOpacity
                style={styles.upgradeBanner}
                onPress={() => router.push('/subscription')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.15)', 'rgba(245, 158, 11, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeGradient}
                >
                  <View style={styles.upgradeContent}>
                    <Crown size={24} color={designSystem.colors.status.warning} />
                    <View style={styles.upgradeText}>
                      <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                      <Text style={styles.upgradeSubtitle}>
                        Unlock unlimited cameras & AI features
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Spacer */}
          <View style={{ height: designSystem.spacing.xxxl }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designSystem.spacing.xl,
    paddingTop: designSystem.spacing.md,
    paddingBottom: designSystem.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginBottom: designSystem.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: designSystem.typography.size.xxl,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: 2,
    borderRadius: designSystem.layout.radius.full,
    marginLeft: designSystem.spacing.sm,
    gap: designSystem.spacing.xs,
  },
  premiumText: {
    fontSize: designSystem.typography.size.xs,
    fontWeight: '700',
    color: designSystem.colors.status.warning,
  },
  settingsButton: {
    width: 44,
    height: 44,
    backgroundColor: designSystem.colors.background.tertiary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redAlertCard: {
    marginHorizontal: designSystem.spacing.xl,
    marginBottom: designSystem.spacing.xl,
    borderRadius: designSystem.layout.radius.xl,
    overflow: 'hidden',
    ...designSystem.shadows.md,
  },
  redAlertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: designSystem.spacing.lg,
  },
  redAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  redAlertIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redAlertIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  redAlertText: {
    marginLeft: designSystem.spacing.md,
    flex: 1,
  },
  redAlertTitle: {
    fontSize: designSystem.typography.size.base,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
  },
  redAlertSubtitle: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: designSystem.colors.background.tertiary,
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: designSystem.spacing.xl,
    gap: designSystem.spacing.md,
  },
  statCard: {
    width: (SCREEN_WIDTH - designSystem.spacing.xl * 2 - designSystem.spacing.md) / 2,
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: designSystem.layout.radius.xl,
    padding: designSystem.spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.md,
  },
  statValue: {
    fontSize: designSystem.typography.size.xxl, // 3xl in original but xxl is 24, might want display
    fontWeight: '700',
    color: designSystem.colors.text.primary,
  },
  statLabel: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginTop: designSystem.spacing.xs,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designSystem.spacing.sm,
    gap: designSystem.spacing.xs,
  },
  offlineText: {
    fontSize: designSystem.typography.size.xs,
    color: designSystem.colors.status.danger,
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background.secondary,
    marginHorizontal: designSystem.spacing.xl,
    marginTop: designSystem.spacing.xl,
    padding: designSystem.spacing.lg,
    borderRadius: designSystem.layout.radius.xl,
  },
  statusIndicator: {
    position: 'relative',
    width: 12,
    height: 12,
    marginRight: designSystem.spacing.md,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusPulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: designSystem.typography.size.sm,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
  },
  statusText: {
    fontSize: designSystem.typography.size.xs,
    color: designSystem.colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginTop: designSystem.spacing.xl,
    paddingHorizontal: designSystem.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designSystem.spacing.md,
  },
  sectionTitle: {
    fontSize: designSystem.typography.size.lg,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
  },
  viewAll: {
    fontSize: designSystem.typography.size.sm,
    fontWeight: '500',
    color: designSystem.colors.primary[500],
  },
  emptyAlerts: {
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: designSystem.layout.radius.xl,
    padding: designSystem.spacing.xxl,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: designSystem.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.md,
  },
  emptyTitle: {
    fontSize: designSystem.typography.size.base,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.xs,
  },
  emptyText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: designSystem.spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...designSystem.shadows.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: designSystem.typography.size.xs,
    color: designSystem.colors.text.secondary,
    marginTop: designSystem.spacing.sm,
    textAlign: 'center',
  },
  upgradeBanner: {
    marginHorizontal: designSystem.spacing.xl,
    marginTop: designSystem.spacing.xl,
    borderRadius: designSystem.layout.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: designSystem.spacing.lg,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeText: {
    marginLeft: designSystem.spacing.md,
  },
  upgradeTitle: {
    fontSize: designSystem.typography.size.base,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
  },
  upgradeSubtitle: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginTop: 2,
  },
});
