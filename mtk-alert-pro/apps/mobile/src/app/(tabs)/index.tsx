import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Shield,
  Camera,
  Bell,
  AlertTriangle,
  ChevronRight,
  Activity,
  Plus,
  Settings,
} from 'lucide-react-native';
import { useAuthStore, useCameraStore, useAlertStore, useSettingsStore } from '@/stores';
import { Button } from '@/components/ui';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { cameras, fetchCameras, isLoading: camerasLoading } = useCameraStore();
  const { alerts, unreadCount, fetchAlerts } = useAlertStore();
  const { detection, setDetection } = useSettingsStore();

  useEffect(() => {
    fetchCameras();
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    fetchCameras();
    fetchAlerts();
  };

  const activeCameras = cameras.filter((c) => c.isActive).length;
  const recentAlerts = alerts.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={camerasLoading} 
            onRefresh={onRefresh}
            tintColor={colors.brand.red}
            colors={[colors.brand.red]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
        </View>

        {/* Red Alert Toggle */}
        <TouchableOpacity
          onPress={() => setDetection({ redAlertMode: !detection.redAlertMode })}
          style={[
            styles.redAlertCard,
            detection.redAlertMode && styles.redAlertCardActive
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.redAlertContent}>
            <AlertTriangle
              size={28}
              color={detection.redAlertMode ? 'white' : colors.brand.red}
            />
            <View style={styles.redAlertTextContainer}>
              <Text style={styles.redAlertTitle}>Red Alert Mode</Text>
              <Text style={styles.redAlertSubtitle}>
                {detection.redAlertMode
                  ? 'Maximum sensitivity active'
                  : 'Tap to enable max sensitivity'}
              </Text>
            </View>
          </View>
          <View style={[
            styles.toggle,
            detection.redAlertMode && styles.toggleActive
          ]}>
            <View style={[
              styles.toggleThumb,
              detection.redAlertMode && styles.toggleThumbActive
            ]} />
          </View>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cameras')}
            style={[styles.statCard, { marginRight: spacing.md }]}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Camera size={24} color="#06B6D4" />
            </View>
            <Text style={styles.statNumber}>{activeCameras}</Text>
            <Text style={styles.statLabel}>Active Cameras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/alerts')}
            style={styles.statCard}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Bell size={24} color={colors.brand.red} />
            </View>
            <Text style={styles.statNumber}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Unread Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* System Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Activity size={20} color={colors.status.success} />
            <Text style={styles.statusTitle}>System Status</Text>
          </View>
          <View style={styles.statusContent}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              All systems operational - Detection active
            </Text>
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentAlerts.length === 0 ? (
            <View style={styles.emptyAlerts}>
              <Shield size={48} color={colors.text.muted} />
              <Text style={styles.emptyText}>
                No alerts yet. Your cameras are monitoring.
              </Text>
            </View>
          ) : (
            recentAlerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertItem}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.alertIcon,
                  { backgroundColor: alert.type === 'person' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)' }
                ]}>
                  <Bell
                    size={20}
                    color={alert.type === 'person' ? colors.brand.red : '#3B82F6'}
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} detected
                  </Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.text.muted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              variant="secondary"
              size="sm"
              style={styles.actionButton}
              onPress={() => router.push('/cameras/add')}
            >
              <View style={styles.actionButtonContent}>
                <Plus size={18} color={colors.text.primary} />
                <Text style={styles.actionButtonText}>Add Camera</Text>
              </View>
            </Button>
            <Button
              variant="outline"
              size="sm"
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <View style={styles.actionButtonContent}>
                <Settings size={18} color={colors.text.primary} />
                <Text style={styles.actionButtonText}>Settings</Text>
              </View>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  welcomeText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
  },
  redAlertCard: {
    marginHorizontal: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  redAlertCardActive: {
    backgroundColor: colors.brand.red,
  },
  redAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  redAlertTextContainer: {
    marginLeft: spacing.md,
  },
  redAlertTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  redAlertSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.tertiary,
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text.primary,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statNumber: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  statusCard: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.success,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  section: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    color: colors.brand.red,
    fontWeight: '500',
  },
  emptyAlerts: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  alertItem: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  alertTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text.primary,
  },
  alertTime: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  quickActions: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
