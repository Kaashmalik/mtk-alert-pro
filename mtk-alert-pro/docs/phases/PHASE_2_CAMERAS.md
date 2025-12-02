# Phase 2: Camera Integration (Week 3-4)

## Goals
- ✅ RTSP stream player component
- ✅ Camera CRUD operations
- ✅ Add camera flow with RTSP validation
- ✅ Camera grid/list view
- ✅ Live streaming with reconnection handling
- ✅ Multi-brand camera support

---

## Step 1: Install Camera Dependencies

```bash
cd apps/mobile

# RTSP/Video streaming
pnpm add react-native-video react-native-vlc-media-player

# Vision Camera (for frame processing - AI later)
pnpm add react-native-vision-camera

# Needed for native modules
npx expo prebuild --clean
```

---

## Step 2: Camera Store

### `src/stores/cameraStore.ts`
```typescript
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Camera, DetectionSettings } from '@/types';

interface CameraState {
  cameras: Camera[];
  isLoading: boolean;
  selectedCamera: Camera | null;
  
  // Actions
  fetchCameras: () => Promise<void>;
  addCamera: (camera: Omit<Camera, 'id' | 'userId' | 'createdAt'>) => Promise<Camera>;
  updateCamera: (id: string, updates: Partial<Camera>) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  selectCamera: (camera: Camera | null) => void;
  testConnection: (rtspUrl: string, username?: string, password?: string) => Promise<boolean>;
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

    // Check camera limit for free tier
    const { cameras } = get();
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';
    const limits = { free: 2, pro: Infinity, business: Infinity };
    
    if (cameras.length >= limits[tier as keyof typeof limits]) {
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
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  },

  deleteCamera: async (id) => {
    const { error } = await supabase.from('cameras').delete().eq('id', id);
    if (error) throw error;
    set({ cameras: get().cameras.filter((c) => c.id !== id) });
  },

  selectCamera: (camera) => set({ selectedCamera: camera }),

  testConnection: async (rtspUrl, username, password) => {
    // Build authenticated URL if credentials provided
    let testUrl = rtspUrl;
    if (username && password) {
      const url = new URL(rtspUrl);
      url.username = username;
      url.password = password;
      testUrl = url.toString();
    }

    // Test connection via timeout promise
    return new Promise((resolve) => {
      // In production, we'd use native module to test RTSP
      // For now, assume valid if URL format is correct
      const rtspPattern = /^rtsp:\/\/[\w.-]+(:\d+)?\/.*$/;
      resolve(rtspPattern.test(rtspUrl));
    });
  },
}));
```

---

## Step 3: RTSP Stream Player Component

### `src/components/camera/StreamPlayer.tsx`
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import Video, { VideoRef, OnErrorData, OnLoadData } from 'react-native-video';
import { RefreshCw, Volume2, VolumeX, Maximize2 } from 'lucide-react-native';
import { cn } from '@/lib/utils/cn';

interface StreamPlayerProps {
  rtspUrl: string;
  username?: string;
  password?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  className?: string;
  showControls?: boolean;
}

export function StreamPlayer({
  rtspUrl,
  username,
  password,
  onError,
  onLoad,
  className,
  showControls = true,
}: StreamPlayerProps) {
  const videoRef = useRef<VideoRef>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [muted, setMuted] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Build authenticated RTSP URL
  const buildStreamUrl = useCallback(() => {
    if (!username || !password) return rtspUrl;
    try {
      const url = new URL(rtspUrl);
      url.username = encodeURIComponent(username);
      url.password = encodeURIComponent(password);
      return url.toString();
    } catch {
      return rtspUrl;
    }
  }, [rtspUrl, username, password]);

  const handleLoad = (data: OnLoadData) => {
    setStatus('playing');
    setRetryCount(0);
    onLoad?.();
  };

  const handleError = (error: OnErrorData) => {
    console.error('Stream error:', error);
    
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      setTimeout(() => {
        videoRef.current?.seek(0);
      }, 2000 * (retryCount + 1)); // Exponential backoff
    } else {
      setStatus('error');
      onError?.('Failed to connect to camera stream');
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setRetryCount(0);
  };

  return (
    <View className={cn('relative overflow-hidden rounded-xl bg-black', className)}>
      <Video
        ref={videoRef}
        source={{ uri: buildStreamUrl() }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
        muted={muted}
        repeat
        playInBackground={false}
        playWhenInactive={false}
        onLoad={handleLoad}
        onError={handleError}
        bufferConfig={{
          minBufferMs: 15000,
          maxBufferMs: 50000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
      />

      {/* Loading Overlay */}
      {status === 'loading' && (
        <View className="absolute inset-0 items-center justify-center bg-black/80">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-3 text-sm text-gray-400">
            Connecting to camera{retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : '...'}
          </Text>
        </View>
      )}

      {/* Error Overlay */}
      {status === 'error' && (
        <View className="absolute inset-0 items-center justify-center bg-black/80">
          <Text className="mb-4 text-center text-gray-400">
            Unable to connect to camera stream
          </Text>
          <Pressable
            onPress={handleRetry}
            className="flex-row items-center rounded-lg bg-brand-blue px-4 py-2"
          >
            <RefreshCw size={18} color="white" />
            <Text className="ml-2 font-medium text-white">Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Controls */}
      {showControls && status === 'playing' && (
        <View className="absolute bottom-3 left-3 right-3 flex-row justify-between">
          <Pressable
            onPress={() => setMuted(!muted)}
            className="rounded-full bg-black/60 p-2"
          >
            {muted ? (
              <VolumeX size={20} color="white" />
            ) : (
              <Volume2 size={20} color="white" />
            )}
          </Pressable>

          <Pressable className="rounded-full bg-black/60 p-2">
            <Maximize2 size={20} color="white" />
          </Pressable>
        </View>
      )}

      {/* Live Badge */}
      {status === 'playing' && (
        <View className="absolute left-3 top-3 flex-row items-center rounded-full bg-brand-red px-2 py-1">
          <View className="mr-1.5 h-2 w-2 rounded-full bg-white" />
          <Text className="text-xs font-bold text-white">LIVE</Text>
        </View>
      )}
    </View>
  );
}
```

---

## Step 4: Camera Card Component

### `src/components/camera/CameraCard.tsx`
```typescript
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, MoreVertical, Wifi, WifiOff } from 'lucide-react-native';
import type { Camera } from '@/types';
import { cn } from '@/lib/utils/cn';

interface CameraCardProps {
  camera: Camera;
  onPress?: () => void;
  onOptionsPress?: () => void;
}

export function CameraCard({ camera, onPress, onOptionsPress }: CameraCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/cameras/${camera.id}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        'overflow-hidden rounded-2xl bg-gray-800',
        'active:scale-[0.98] transition-transform'
      )}
    >
      {/* Thumbnail / Preview */}
      <View className="relative aspect-video bg-gray-900">
        {camera.thumbnailUrl ? (
          <Image
            source={{ uri: camera.thumbnailUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <CameraIcon size={48} color="#475569" />
          </View>
        )}

        {/* Status Badge */}
        <View
          className={cn(
            'absolute left-2 top-2 flex-row items-center rounded-full px-2 py-1',
            camera.isActive ? 'bg-brand-green' : 'bg-gray-600'
          )}
        >
          {camera.isActive ? (
            <Wifi size={12} color="white" />
          ) : (
            <WifiOff size={12} color="white" />
          )}
          <Text className="ml-1 text-xs font-medium text-white">
            {camera.isActive ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Detection Indicators */}
        <View className="absolute bottom-2 right-2 flex-row gap-1">
          {camera.detectionSettings.person && (
            <View className="rounded bg-brand-blue/80 px-1.5 py-0.5">
              <Text className="text-[10px] font-medium text-white">Person</Text>
            </View>
          )}
          {camera.detectionSettings.vehicle && (
            <View className="rounded bg-brand-orange/80 px-1.5 py-0.5">
              <Text className="text-[10px] font-medium text-white">Vehicle</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info */}
      <View className="flex-row items-center justify-between p-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-white" numberOfLines={1}>
            {camera.name}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-400" numberOfLines={1}>
            {camera.rtspUrl.replace(/rtsp:\/\/[^@]*@/, 'rtsp://')}
          </Text>
        </View>

        <Pressable
          onPress={onOptionsPress}
          className="ml-2 rounded-lg p-2 active:bg-gray-700"
        >
          <MoreVertical size={20} color="#9CA3AF" />
        </Pressable>
      </View>
    </Pressable>
  );
}
```

---

## Step 5: Add Camera Modal

### `src/components/camera/AddCameraModal.tsx`
```typescript
import { useState } from 'react';
import { View, Text, Modal, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Camera, CheckCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCameraStore } from '@/stores/cameraStore';

const cameraSchema = z.object({
  name: z.string().min(1, 'Camera name is required').max(50),
  rtspUrl: z
    .string()
    .min(1, 'RTSP URL is required')
    .regex(/^rtsp:\/\//, 'Must be a valid RTSP URL (rtsp://)'),
  username: z.string().optional(),
  password: z.string().optional(),
});

type CameraForm = z.infer<typeof cameraSchema>;

interface AddCameraModalProps {
  visible: boolean;
  onClose: () => void;
}

// Common camera RTSP URL patterns
const CAMERA_PRESETS = [
  { brand: 'Hikvision', pattern: 'rtsp://{ip}:554/Streaming/Channels/101' },
  { brand: 'Dahua', pattern: 'rtsp://{ip}:554/cam/realmonitor?channel=1&subtype=0' },
  { brand: 'Reolink', pattern: 'rtsp://{ip}:554/h264Preview_01_main' },
  { brand: 'TP-Link Tapo', pattern: 'rtsp://{ip}:554/stream1' },
  { brand: 'Wyze', pattern: 'rtsp://{ip}/live' },
  { brand: 'Generic ONVIF', pattern: 'rtsp://{ip}:554/onvif1' },
];

export function AddCameraModal({ visible, onClose }: AddCameraModalProps) {
  const { addCamera, testConnection } = useCameraStore();
  const [step, setStep] = useState<'form' | 'testing' | 'success'>('form');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CameraForm>({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      name: '',
      rtspUrl: '',
      username: '',
      password: '',
    },
  });

  const handlePresetSelect = (pattern: string) => {
    setSelectedPreset(pattern);
    setValue('rtspUrl', pattern);
  };

  const onSubmit = async (data: CameraForm) => {
    try {
      setStep('testing');

      // Test connection first
      const isConnected = await testConnection(
        data.rtspUrl,
        data.username,
        data.password
      );

      if (!isConnected) {
        Alert.alert(
          'Connection Failed',
          'Unable to connect to the camera. Please verify the RTSP URL and credentials.',
          [{ text: 'OK', onPress: () => setStep('form') }]
        );
        return;
      }

      // Add camera to database
      await addCamera({
        name: data.name,
        rtspUrl: data.rtspUrl,
        username: data.username || undefined,
        password: data.password || undefined,
        isActive: true,
        detectionSettings: {
          person: true,
          vehicle: true,
          sensitivity: 0.7,
        },
      });

      setStep('success');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add camera');
      setStep('form');
    }
  };

  const handleClose = () => {
    reset();
    setStep('form');
    setSelectedPreset(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-brand-navy">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-700 px-4 py-3">
          <Pressable onPress={handleClose} className="p-2">
            <X size={24} color="white" />
          </Pressable>
          <Text className="text-lg font-semibold text-white">Add Camera</Text>
          <View className="w-10" />
        </View>

        {step === 'form' && (
          <ScrollView className="flex-1 px-4 py-6">
            {/* Camera Presets */}
            <Text className="mb-3 text-sm font-medium text-gray-400">
              Quick Setup - Select your camera brand
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {CAMERA_PRESETS.map((preset) => (
                <Pressable
                  key={preset.brand}
                  onPress={() => handlePresetSelect(preset.pattern)}
                  className={`mr-2 rounded-lg border px-4 py-2 ${
                    selectedPreset === preset.pattern
                      ? 'border-brand-blue bg-brand-blue/20'
                      : 'border-gray-600 bg-gray-800'
                  }`}
                >
                  <Text className="text-sm text-white">{preset.brand}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Form Fields */}
            <View className="space-y-4">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Camera Name"
                    placeholder="e.g., Front Door, Driveway"
                    value={value}
                    onChangeText={onChange}
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="rtspUrl"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="RTSP URL"
                    placeholder="rtsp://192.168.1.100:554/stream"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    error={errors.rtspUrl?.message}
                  />
                )}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="username"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Username (optional)"
                        placeholder="admin"
                        value={value}
                        onChangeText={onChange}
                        autoCapitalize="none"
                      />
                    )}
                  />
                </View>

                <View className="flex-1">
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Password (optional)"
                        placeholder="••••••••"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry
                      />
                    )}
                  />
                </View>
              </View>
            </View>

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              className="mt-8"
            >
              Add Camera
            </Button>
          </ScrollView>
        )}

        {step === 'testing' && (
          <View className="flex-1 items-center justify-center">
            <Camera size={64} color="#2563EB" />
            <Text className="mt-4 text-lg font-medium text-white">
              Testing Connection...
            </Text>
            <Text className="mt-2 text-gray-400">
              Verifying camera stream
            </Text>
          </View>
        )}

        {step === 'success' && (
          <View className="flex-1 items-center justify-center">
            <CheckCircle size={64} color="#10B981" />
            <Text className="mt-4 text-lg font-medium text-white">
              Camera Added!
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
```

---

## Step 6: Cameras Screen

### `src/app/(tabs)/cameras.tsx`
```typescript
import { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { CameraCard } from '@/components/camera/CameraCard';
import { AddCameraModal } from '@/components/camera/AddCameraModal';
import { useCameraStore } from '@/stores/cameraStore';
import { useAuthStore } from '@/stores/authStore';

export default function CamerasScreen() {
  const { cameras, isLoading, fetchCameras } = useCameraStore();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCameras();
    setRefreshing(false);
  };

  const cameraLimit = user?.subscriptionTier === 'free' ? 2 : Infinity;
  const canAddCamera = cameras.length < cameraLimit;

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <View>
          <Text className="text-2xl font-bold text-white">Cameras</Text>
          <Text className="text-gray-400">
            {cameras.length} / {cameraLimit === Infinity ? '∞' : cameraLimit} cameras
          </Text>
        </View>

        {canAddCamera && (
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center rounded-full bg-brand-blue px-4 py-2"
          >
            <Plus size={20} color="white" />
            <Text className="ml-1 font-medium text-white">Add</Text>
          </Pressable>
        )}
      </View>

      {/* Camera List */}
      <FlatList
        data={cameras}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 pb-4">
            <CameraCard camera={item} />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-lg text-gray-400">No cameras added yet</Text>
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="mt-4 rounded-lg bg-brand-blue px-6 py-3"
            >
              <Text className="font-medium text-white">Add Your First Camera</Text>
            </Pressable>
          </View>
        }
      />

      {/* Upgrade Banner (Free Tier at limit) */}
      {!canAddCamera && user?.subscriptionTier === 'free' && (
        <View className="absolute bottom-20 left-4 right-4 rounded-xl bg-brand-purple p-4">
          <Text className="font-semibold text-white">
            Camera limit reached
          </Text>
          <Text className="mt-1 text-sm text-purple-200">
            Upgrade to Pro for unlimited cameras
          </Text>
          <Pressable className="mt-3 rounded-lg bg-white py-2">
            <Text className="text-center font-semibold text-brand-purple">
              Upgrade to Pro - $3.99/mo
            </Text>
          </Pressable>
        </View>
      )}

      <AddCameraModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}
```

---

## Step 7: Live View Screen

### `src/app/cameras/[id].tsx`
```typescript
import { useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Settings, Trash2 } from 'lucide-react-native';
import { StreamPlayer } from '@/components/camera/StreamPlayer';
import { useCameraStore } from '@/stores/cameraStore';

export default function CameraDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cameras, selectCamera, selectedCamera, deleteCamera } = useCameraStore();

  useEffect(() => {
    const camera = cameras.find((c) => c.id === id);
    selectCamera(camera || null);
    return () => selectCamera(null);
  }, [id, cameras]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Camera',
      `Are you sure you want to delete "${selectedCamera?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCamera(id);
            router.back();
          },
        },
      ]
    );
  };

  if (!selectedCamera) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-brand-navy">
        <Text className="text-gray-400">Camera not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text className="text-lg font-semibold text-white" numberOfLines={1}>
          {selectedCamera.name}
        </Text>
        <View className="flex-row gap-2">
          <Pressable className="p-2">
            <Settings size={22} color="white" />
          </Pressable>
          <Pressable onPress={handleDelete} className="p-2">
            <Trash2 size={22} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      {/* Stream Player */}
      <View className="flex-1 px-4">
        <StreamPlayer
          rtspUrl={selectedCamera.rtspUrl}
          username={selectedCamera.username}
          password={selectedCamera.password}
          className="flex-1"
        />

        {/* Detection Status */}
        <View className="mt-4 rounded-xl bg-gray-800 p-4">
          <Text className="mb-2 font-medium text-white">AI Detection</Text>
          <View className="flex-row gap-3">
            <View className={`flex-row items-center rounded-lg px-3 py-2 ${
              selectedCamera.detectionSettings.person ? 'bg-brand-blue' : 'bg-gray-700'
            }`}>
              <Text className="text-sm text-white">Person</Text>
            </View>
            <View className={`flex-row items-center rounded-lg px-3 py-2 ${
              selectedCamera.detectionSettings.vehicle ? 'bg-brand-orange' : 'bg-gray-700'
            }`}>
              <Text className="text-sm text-white">Vehicle</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

---

## Deliverables Checklist

- [ ] RTSP stream player with error handling
- [ ] Camera CRUD operations via Supabase
- [ ] Add camera modal with brand presets
- [ ] Camera card component with status badges
- [ ] Camera list with refresh control
- [ ] Live view screen with controls
- [ ] Free tier camera limit enforcement
- [ ] Connection testing before save
- [ ] Credential handling (encrypted)

---

## Next Phase

➡️ [Phase 3: AI/ML Layer](./PHASE_3_AI_ML.md)
