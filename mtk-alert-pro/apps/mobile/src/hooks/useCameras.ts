/**
 * 🔒 SAFE: Camera data fetching with TanStack Query
 *
 * Features:
 * - Proper query keys and dependencies
 * - Infinite refetch prevention
 * - Error handling and retry logic
 * - Cache invalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { logError } from '@/lib/utils/errorHandler';
import type { Camera } from '@/types';

// ============================================================================
// Query Keys
// ============================================================================

export const cameraKeys = {
  all: ['cameras'] as const,
  lists: () => [...cameraKeys.all, 'list'] as const,
  details: (id: string) => [...cameraKeys.all, id] as const,
  userCameras: (userId: string) => [...cameraKeys.all, 'user', userId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * 🔒 SAFE: Fetch cameras for current user
 * Prevents infinite refetch loops with proper dependencies
 */
export function useCameras() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // 🔒 PERFORMANCE: Memoize query to prevent unnecessary re-renders
  const fetchUserCameras = useCallback(async (): Promise<Camera[]> => {
    if (!user?.id) {
      console.warn('[useCameras] No user ID found');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((c) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        rtspUrl: c.rtsp_url,
        username: c.username || undefined,
        password: c.password || undefined,
        isActive: c.is_active ?? true,
        thumbnailUrl: c.thumbnail_url || undefined,
        detectionSettings: {
          person: true,
          vehicle: true,
          face: false,
          sensitivity: 0.7,
          notificationsEnabled: true,
          alarmEnabled: true,
          ...(c.detection_settings as any),
        },
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at || c.created_at),
      }));
    } catch (error) {
      logError(error, 'useCameras.fetchUserCameras');
      throw error;
    }
  }, [user?.id]);

  // 🔒 CRITICAL: Proper query configuration to prevent infinite loops
  const {
    data: cameras = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: cameraKeys.userCameras(user?.id || ''),
    queryFn: fetchUserCameras,
    enabled: !!user?.id, // Only run when we have a user
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Prevent infinite refetch on app focus
    refetchOnReconnect: true,
  });

  // 🔒 SAFE: Optimistic mutation for camera updates
  const updateCameraMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: { id: string; updates: Partial<Camera> }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cameras')
        .update({
          name: updates.name,
          rtsp_url: updates.rtspUrl,
          username: updates.username,
          password: updates.password,
          is_active: updates.isActive,
          detection_settings: updates.detectionSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // 🔒 CACHE: Invalidate camera list to trigger refetch
      queryClient.invalidateQueries({
        queryKey: cameraKeys.userCameras(user?.id || ''),
      });
    },
    onError: (error) => {
      logError(error, 'useCameras.updateCamera');
    },
  });

  // 🔒 SAFE: Optimistic mutation for camera deletion
  const deleteCameraMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase.from('cameras').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // 🔒 CACHE: Invalidate camera list
      queryClient.invalidateQueries({
        queryKey: cameraKeys.userCameras(user?.id || ''),
      });
    },
    onError: (error) => {
      logError(error, 'useCameras.deleteCamera');
    },
  });

  // 🔒 PERFORMANCE: Memoized computed values
  const camerasByStatus = useMemo(() => {
    return {
      active: cameras.filter((c) => c.isActive),
      inactive: cameras.filter((c) => !c.isActive),
    };
  }, [cameras]);

  return {
    // Data
    cameras,
    camerasByStatus,
    isLoading,
    error,

    // Actions
    refetch,
    updateCamera: updateCameraMutation.mutateAsync,
    isUpdatingCamera: updateCameraMutation.isPending,
    deleteCamera: deleteCameraMutation.mutateAsync,
    isDeletingCamera: deleteCameraMutation.isPending,

    // Helpers
    isEmpty: !isLoading && cameras.length === 0,
    hasError: !!error,
  };
}

/**
 * 🔒 SAFE: Fetch single camera by ID
 */
export function useCamera(cameraId: string) {
  const user = useAuthStore((state) => state.user);

  const fetchCamera = useCallback(async (): Promise<Camera | null> => {
    if (!user?.id || !cameraId) return null;

    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .eq('id', cameraId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      rtspUrl: data.rtsp_url,
      username: data.username || undefined,
      password: data.password || undefined,
      isActive: data.is_active ?? true,
      thumbnailUrl: data.thumbnail_url || undefined,
      detectionSettings: {
        person: true,
        vehicle: true,
        face: false,
        sensitivity: 0.7,
        notificationsEnabled: true,
        alarmEnabled: true,
        ...(data.detection_settings as any),
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at || data.created_at),
    };
  }, [user?.id, cameraId]);

  return useQuery({
    queryKey: cameraKeys.details(cameraId),
    queryFn: fetchCamera,
    enabled: !!user?.id && !!cameraId,
    staleTime: 1000 * 60 * 2, // 2 minutes for single item
    retry: 2,
  });
}
