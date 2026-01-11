import { create } from 'zustand';
import { Vibration } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { alarmService } from '@/lib/audio/alarmService';
import { useSettingsStore } from './settingsStore';
import { useCameraStore } from './cameraStore';
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
        async (payload) => {
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

          // Update state
          set({
            alerts: [newAlert, ...get().alerts],
            unreadCount: get().unreadCount + 1,
          });

          // Get settings and camera info
          const settings = useSettingsStore.getState().notifications;
          const cameras = useCameraStore.getState().cameras;
          const camera = cameras.find(c => c.id === newAlert.cameraId);

          // Check if this alert type should trigger alarm (person or vehicle only)
          const isValidAlertType = newAlert.type === 'person' || newAlert.type === 'vehicle';
          
          // Check camera-level settings
          const cameraAllowsAlarm = camera?.detectionSettings?.alarmEnabled ?? true;
          const cameraAllowsNotification = camera?.detectionSettings?.notificationsEnabled ?? true;

          // Check detection type matches camera settings
          const detectionTypeEnabled = 
            (newAlert.type === 'person' && camera?.detectionSettings?.person) ||
            (newAlert.type === 'vehicle' && camera?.detectionSettings?.vehicle);

          // Only trigger for valid detection types that are enabled
          if (isValidAlertType && detectionTypeEnabled) {
            // Play sound if enabled
            if (settings.sound && cameraAllowsAlarm) {
              try {
                await alarmService.playAlarm(settings.alarmSound, {
                  volume: settings.alarmVolume,
                  repeat: settings.repeatAlarm,
                  repeatCount: settings.repeatCount,
                });
              } catch (error) {
                console.error('Failed to play alarm:', error);
              }
            }

            // Vibrate if enabled
            if (settings.vibration && cameraAllowsNotification) {
              Vibration.vibrate([0, 500, 200, 500, 200, 500]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
