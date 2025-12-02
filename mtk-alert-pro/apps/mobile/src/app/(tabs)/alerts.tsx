import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, User, Car, Check, Trash2 } from 'lucide-react-native';
import { useAlertStore, useCameraStore } from '@/stores';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import type { Alert } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function AlertsScreen() {
  const { alerts, fetchAlerts, markAsRead, markAllAsRead, deleteAlert, isLoading, subscribeToAlerts } = useAlertStore();
  const { cameras } = useCameraStore();

  useEffect(() => {
    fetchAlerts();
    const unsubscribe = subscribeToAlerts();
    return unsubscribe;
  }, []);

  const getCameraName = (cameraId: string) => {
    return cameras.find((c) => c.id === cameraId)?.name || 'Unknown Camera';
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'person':
        return <User size={20} color={colors.brand.red} />;
      case 'vehicle':
        return <Car size={20} color="#3B82F6" />;
      default:
        return <Bell size={20} color={colors.status.warning} />;
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={[
        styles.alertCard,
        !item.isRead && styles.alertCardUnread
      ]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.alertIconContainer,
        { backgroundColor: item.type === 'person' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)' }
      ]}>
        {getAlertIcon(item.type)}
      </View>
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Detected
          </Text>
          <Text style={styles.alertTime}>
            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
          </Text>
        </View>
        <Text style={styles.alertCamera}>{getCameraName(item.cameraId)}</Text>
        <Text style={styles.alertConfidence}>
          Confidence: {Math.round(item.confidence * 100)}%
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteAlert(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={18} color={colors.text.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Check size={18} color={colors.status.success} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Bell size={40} color={colors.text.muted} />
          </View>
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
              tintColor={colors.brand.red}
              colors={[colors.brand.red]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
  },
  unreadCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllText: {
    fontSize: fontSize.sm,
    color: colors.status.success,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  alertCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.brand.red,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  alertTime: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  alertCamera: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  alertConfidence: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 4,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.bg.secondary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
