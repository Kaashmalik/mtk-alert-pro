/**
 * Cameras Screen
 * 
 * List of all connected cameras with status and quick actions
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Camera,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCameraStore, useSubscriptionStore, useIsPremium } from '@/stores';
import { designSystem } from '@/theme/design-system';
import { CameraCard } from '@/components/animated';
import { AdBanner } from '@/components/ads/BannerAd';
import type { Camera as CameraType } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Component
// ============================================================================

export default function CamerasScreen() {
  const { cameras, fetchCameras, isLoading } = useCameraStore();
  const { canAddCamera, getRemainingCameras } = useSubscriptionStore();
  const isPremium = useIsPremium();

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleAddCamera = () => {
    if (!canAddCamera()) {
      router.push('/subscription');
      return;
    }
    router.push('/cameras/add');
  };

  const onRefresh = useCallback(() => {
    fetchCameras();
  }, [fetchCameras]);

  const renderCamera = ({ item, index }: { item: CameraType; index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
        <CameraCard
          id={item.id}
          name={item.name}
          thumbnailUrl={item.thumbnailUrl}
          isOnline={item.isActive}
          hasAlert={false} // Todo: Integrate with alert store for realtime status
          onPress={(id) => router.push(`/cameras/${id}`)}
        />
      </Animated.View>
    );
  };

  const remainingCameras = getRemainingCameras();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Cameras</Text>
            <Text style={styles.headerSubtitle}>
              {cameras.length} camera{cameras.length !== 1 ? 's' : ''} connected
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleAddCamera}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[designSystem.colors.primary[500], designSystem.colors.primary[600]]}
              style={styles.addButtonGradient}
            >
              <Plus size={22} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Camera Limit Warning */}
        {!isPremium && remainingCameras !== Infinity && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.limitBanner}>
            <AlertCircle size={16} color={designSystem.colors.status.warning} />
            <Text style={styles.limitText}>
              {remainingCameras > 0
                ? `${remainingCameras} camera slot${remainingCameras > 1 ? 's' : ''} remaining on Free plan`
                : 'Camera limit reached. Upgrade for more.'}
            </Text>
            {remainingCameras === 0 && (
              <TouchableOpacity onPress={() => router.push('/subscription')}>
                <Text style={styles.upgradeLink}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {cameras.length === 0 ? (
          <View style={styles.emptyState}>
            <Animated.View entering={FadeInDown.delay(300)} style={styles.emptyIcon}>
              <Camera size={48} color={designSystem.colors.text.muted} />
            </Animated.View>
            <Text style={styles.emptyTitle}>No Cameras Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first camera to start monitoring your property
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddCamera}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[designSystem.colors.primary[500], designSystem.colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <Plus size={20} color="white" />
                <Text style={styles.emptyButtonText}>Add Camera</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helpLink}
              onPress={() => router.push('/help')}
            >
              <Text style={styles.helpText}>Need help setting up?</Text>
              <ChevronRight size={16} color={designSystem.colors.primary[500]} />
            </TouchableOpacity>
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
                onRefresh={onRefresh}
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

// ============================================================================
// Styles
// ============================================================================

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
    paddingHorizontal: designSystem.spacing.xl,
    paddingTop: designSystem.spacing.md,
    paddingBottom: designSystem.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: designSystem.typography.size.xxl,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginTop: designSystem.spacing.xs,
  },
  addButton: {
    borderRadius: 22,
    overflow: 'hidden',
    ...designSystem.shadows.md,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    marginHorizontal: designSystem.spacing.xl,
    marginBottom: designSystem.spacing.lg,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    borderRadius: designSystem.layout.radius.lg,
    gap: designSystem.spacing.sm,
  },
  limitText: {
    flex: 1,
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.status.warning,
  },
  upgradeLink: {
    fontSize: designSystem.typography.size.sm,
    fontWeight: '600',
    color: designSystem.colors.primary[500],
  },
  listContent: {
    paddingHorizontal: designSystem.spacing.xl,
    paddingBottom: designSystem.spacing.xxxl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designSystem.spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.xl,
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
    marginBottom: designSystem.spacing.xxl,
    lineHeight: 24,
  },
  emptyButton: {
    borderRadius: designSystem.layout.radius.xl,
    overflow: 'hidden',
    ...designSystem.shadows.md,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designSystem.spacing.xxl,
    paddingVertical: designSystem.spacing.lg,
    gap: designSystem.spacing.sm,
  },
  emptyButtonText: {
    fontSize: designSystem.typography.size.base,
    fontWeight: '600',
    color: 'white',
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designSystem.spacing.xl,
    gap: designSystem.spacing.xs,
  },
  helpText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.primary[500],
    fontWeight: '500',
  },
});
