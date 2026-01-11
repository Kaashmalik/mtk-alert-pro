import { useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Check, Trash2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlertStore, useCameraStore } from '@/stores';
import { designSystem } from '@/theme/design-system';
import { AlertCard } from '@/components/animated';
import { AdBanner } from '@/components/ads/BannerAd';
import { useInterstitialAd } from '@/components/ads/InterstitialAd';
import type { Alert } from '@/types';

export default function AlertsScreen() {
  const { alerts, fetchAlerts, markAsRead, markAllAsRead, deleteAlert, isLoading, subscribeToAlerts } = useAlertStore();
  const { cameras } = useCameraStore();
  const { show: showInterstitial } = useInterstitialAd();

  useEffect(() => {
    fetchAlerts();
    const unsubscribe = subscribeToAlerts();
    return unsubscribe;
  }, []);

  const getCameraName = (cameraId: string) => {
    return cameras.find((c) => c.id === cameraId)?.name || 'Unknown Camera';
  };

  const renderAlert = ({ item, index }: { item: Alert; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <AlertCard
        id={item.id}
        type={item.type}
        confidence={item.confidence}
        timestamp={new Date(item.createdAt)}
        cameraName={getCameraName(item.cameraId)}
        thumbnailUrl={item.thumbnailUrl} // Ensure Alert type supports this, or pass undefined
        isRead={item.isRead}
        onPress={() => markAsRead(item.id)}
        onDismiss={async () => {
          await deleteAlert(item.id);
          // Trigger interstitial every 3 dismissals
          const unreadCount = alerts.filter(a => !a.isRead).length;
          if (unreadCount % 3 === 0) {
            await showInterstitial();
          }
        }}
      />
    </Animated.View>
  );

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Alerts</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadCount}>{unreadCount} unread</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
              <Check size={18} color={designSystem.colors.status.success} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyIcon}>
              <Bell size={40} color={designSystem.colors.text.muted} />
            </Animated.View>
            <Text style={styles.emptyTitle}>No Alerts</Text>
            <Text style={styles.emptySubtitle}>
              You'll see detection alerts here when your cameras spot something
            </Text>
          </View>
        ) : (
          <FlatList
            data={alerts}
            renderItem={renderAlert}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchAlerts}
                tintColor={designSystem.colors.primary[500]}
                colors={[designSystem.colors.primary[500]]}
              />
            }
          />
        )}
        <AdBanner />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designSystem.spacing.xxl,
    paddingTop: designSystem.spacing.lg,
    paddingBottom: designSystem.spacing.lg,
  },
  headerTitle: {
    fontSize: designSystem.typography.size.xxl,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
  },
  unreadCount: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.xs,
    borderRadius: designSystem.layout.radius.full,
  },
  markAllText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.status.success,
    marginLeft: designSystem.spacing.xs,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: designSystem.spacing.xxl,
    paddingBottom: designSystem.spacing.xxl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designSystem.spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.lg,
  },
  emptyTitle: {
    fontSize: designSystem.typography.size.xl,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.sm,
  },
  emptySubtitle: {
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
  },
});
