import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Alert } from '@/types';

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;

  fetchAlerts: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  subscribeToAlerts: () => () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,

  fetchAlerts: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const alerts: Alert[] = (data || []).map((a) => ({
        id: a.id,
        cameraId: a.camera_id,
        userId: a.user_id,
        type: a.type as Alert['type'],
        confidence: a.confidence,
        snapshotUrl: a.snapshot_url || undefined,
        videoClipUrl: a.video_clip_url || undefined,
        metadata: a.metadata || {},
        isRead: a.is_read,
        createdAt: new Date(a.created_at),
      }));

      set({
        alerts,
        unreadCount: alerts.filter((a) => !a.isRead).length,
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;

    set({
      alerts: get().alerts.map((a) =>
        a.id === id ? { ...a, isRead: true } : a
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
  },

  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    set({
      alerts: get().alerts.map((a) => ({ ...a, isRead: true })),
      unreadCount: 0,
    });
  },

  deleteAlert: async (id) => {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) throw error;

    const alert = get().alerts.find((a) => a.id === id);
    set({
      alerts: get().alerts.filter((a) => a.id !== id),
      unreadCount: alert && !alert.isRead
        ? Math.max(0, get().unreadCount - 1)
        : get().unreadCount,
    });
  },

  subscribeToAlerts: () => {
    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const newAlert: Alert = {
            id: payload.new.id,
            cameraId: payload.new.camera_id,
            userId: payload.new.user_id,
            type: payload.new.type as Alert['type'],
            confidence: payload.new.confidence,
            snapshotUrl: payload.new.snapshot_url || undefined,
            videoClipUrl: payload.new.video_clip_url || undefined,
            metadata: payload.new.metadata || {},
            isRead: payload.new.is_read,
            createdAt: new Date(payload.new.created_at),
          };

          set({
            alerts: [newAlert, ...get().alerts],
            unreadCount: get().unreadCount + 1,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
