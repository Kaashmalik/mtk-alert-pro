import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Camera, Wifi, WifiOff, MoreVertical } from 'lucide-react-native';
import { useCameraStore } from '@/stores';
import { Button } from '@/components/ui';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import type { Camera as CameraType } from '@/types';

export default function CamerasScreen() {
  const { cameras, fetchCameras, isLoading } = useCameraStore();

  useEffect(() => {
    fetchCameras();
  }, []);

  const renderCamera = ({ item }: { item: CameraType }) => (
    <TouchableOpacity
      style={styles.cameraCard}
      onPress={() => router.push(`/cameras/${item.id}`)}
      activeOpacity={0.8}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {item.thumbnailUrl ? (
          <View style={styles.thumbnailImage} />
        ) : (
          <Camera size={40} color={colors.text.muted} />
        )}
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
        ]}>
          {item.isActive ? (
            <Wifi size={14} color={colors.status.success} />
          ) : (
            <WifiOff size={14} color={colors.status.error} />
          )}
          <Text style={[
            styles.statusText,
            { color: item.isActive ? colors.status.success : colors.status.error }
          ]}>
            {item.isActive ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cameraInfo}>
        <View style={styles.cameraInfoText}>
          <Text style={styles.cameraName}>{item.name}</Text>
          <Text style={styles.cameraFeatures}>
            {item.detectionSettings.person && 'Person'}{' '}
            {item.detectionSettings.vehicle && '• Vehicle'}{' '}
            {item.detectionSettings.face && '• Face'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cameras</Text>
        <TouchableOpacity
          onPress={() => router.push('/cameras/add')}
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {cameras.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Camera size={40} color={colors.text.muted} />
          </View>
          <Text style={styles.emptyTitle}>No Cameras</Text>
          <Text style={styles.emptySubtitle}>
            Add your first camera to start monitoring
          </Text>
          <Button onPress={() => router.push('/cameras/add')} style={styles.emptyButton}>
            Add Camera
          </Button>
        </View>
      ) : (
        <FlatList
          data={cameras}
          renderItem={renderCamera}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={fetchCameras}
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
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.brand.red,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  cameraCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  thumbnail: {
    height: 160,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg.tertiary,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginLeft: 4,
  },
  cameraInfo: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraInfoText: {
    flex: 1,
  },
  cameraName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cameraFeatures: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  moreButton: {
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
    marginBottom: spacing.xxl,
  },
  emptyButton: {
    minWidth: 160,
  },
});
