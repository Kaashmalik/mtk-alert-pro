import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Camera, DetectionSettings } from '@/types';

interface CameraState {
  cameras: Camera[];
  isLoading: boolean;
  selectedCamera: Camera | null;

  fetchCameras: () => Promise<void>;
  addCamera: (camera: Omit<Camera, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Camera>;
  updateCamera: (id: string, updates: Partial<Camera>) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  selectCamera: (camera: Camera | null) => void;
  testConnection: (rtspUrl: string) => Promise<boolean>;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  cameras: [],
  isLoading: false,
  selectedCamera: null,

  fetchCameras: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const cameras: Camera[] = (data || []).map((c) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        rtspUrl: c.rtsp_url,
        username: c.username || undefined,
        password: c.password || undefined,
        isActive: c.is_active,
        thumbnailUrl: c.thumbnail_url || undefined,
        detectionSettings: c.detection_settings as DetectionSettings,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      }));

      set({ cameras });
    } catch (error) {
      console.error('Failed to fetch cameras:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addCamera: async (cameraData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { cameras } = get();
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';
    const limits: Record<string, number> = { free: 2, pro: 100, business: 100 };

    if (cameras.length >= limits[tier]) {
      throw new Error(`Camera limit reached. Upgrade to Pro for unlimited cameras.`);
    }

    const { data, error } = await supabase
      .from('cameras')
      .insert({
        user_id: user.id,
        name: cameraData.name,
        rtsp_url: cameraData.rtspUrl,
        username: cameraData.username,
        password: cameraData.password,
        is_active: cameraData.isActive ?? true,
        detection_settings: cameraData.detectionSettings,
      })
      .select()
      .single();

    if (error) throw error;

    const newCamera: Camera = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      rtspUrl: data.rtsp_url,
      username: data.username || undefined,
      password: data.password || undefined,
      isActive: data.is_active,
      thumbnailUrl: data.thumbnail_url || undefined,
      detectionSettings: data.detection_settings as DetectionSettings,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set({ cameras: [newCamera, ...get().cameras] });
    return newCamera;
  },

  updateCamera: async (id, updates) => {
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

    set({
      cameras: get().cameras.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
      ),
    });
  },

  deleteCamera: async (id) => {
    const { error } = await supabase.from('cameras').delete().eq('id', id);
    if (error) throw error;
    set({ cameras: get().cameras.filter((c) => c.id !== id) });
  },

  selectCamera: (camera) => set({ selectedCamera: camera }),

  testConnection: async (rtspUrl) => {
    const rtspPattern = /^rtsp:\/\/[\w.-]+(:\d+)?\/.*$/;
    return rtspPattern.test(rtspUrl);
  },
}));
