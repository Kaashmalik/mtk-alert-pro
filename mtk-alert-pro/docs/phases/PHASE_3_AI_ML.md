# Phase 3: AI/ML Layer (Week 5-7)

## Goals
- ✅ Google ML Kit integration
- ✅ Real-time object detection (person, vehicle)
- ✅ Face detection (Pro feature)
- ✅ Frame processor pipeline
- ✅ Alert generation system
- ✅ Push notifications (FCM)
- ✅ Battery optimization

---

## Step 1: Install ML Dependencies

```bash
cd apps/mobile

# ML Kit
pnpm add @react-native-ml-kit/face-detection
pnpm add @react-native-ml-kit/image-labeling

# Vision Camera (for frame processing)
pnpm add react-native-vision-camera
pnpm add react-native-worklets-core

# Firebase Messaging
pnpm add @react-native-firebase/app @react-native-firebase/messaging

# Notifications
pnpm add expo-notifications

# Background tasks
pnpm add expo-task-manager expo-background-fetch

# Rebuild native code
npx expo prebuild --clean
```

---

## Step 2: ML Kit Service

### `src/lib/mlkit/detector.ts`
```typescript
import { FaceDetector } from '@react-native-ml-kit/face-detection';
import { ImageLabeler } from '@react-native-ml-kit/image-labeling';

export interface DetectionResult {
  type: 'person' | 'vehicle' | 'face' | 'unknown';
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Record<string, { x: number; y: number }>;
}

// Labels that indicate person detection
const PERSON_LABELS = ['person', 'human', 'people', 'man', 'woman', 'child', 'pedestrian'];

// Labels that indicate vehicle detection
const VEHICLE_LABELS = ['car', 'vehicle', 'truck', 'motorcycle', 'bicycle', 'bus', 'van'];

class MLKitDetector {
  private imageLabeler: ImageLabeler | null = null;
  private faceDetector: FaceDetector | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize image labeler for person/vehicle detection
      this.imageLabeler = new ImageLabeler({
        confidenceThreshold: 0.6,
      });

      // Initialize face detector
      this.faceDetector = new FaceDetector({
        performanceMode: 'fast',
        landmarkMode: 'none',
        contourMode: 'none',
        classificationMode: 'all',
        minFaceSize: 0.1,
        trackingEnabled: true,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ML Kit:', error);
      throw error;
    }
  }

  async detectObjects(imageUri: string): Promise<DetectionResult[]> {
    if (!this.imageLabeler) {
      await this.initialize();
    }

    const results: DetectionResult[] = [];

    try {
      // Run image labeling
      const labels = await this.imageLabeler!.process(imageUri);

      for (const label of labels) {
        const labelLower = label.text.toLowerCase();

        // Check for person
        if (PERSON_LABELS.some((p) => labelLower.includes(p))) {
          results.push({
            type: 'person',
            confidence: label.confidence,
          });
        }

        // Check for vehicle
        if (VEHICLE_LABELS.some((v) => labelLower.includes(v))) {
          results.push({
            type: 'vehicle',
            confidence: label.confidence,
          });
        }
      }
    } catch (error) {
      console.error('Object detection error:', error);
    }

    return results;
  }

  async detectFaces(imageUri: string): Promise<DetectionResult[]> {
    if (!this.faceDetector) {
      await this.initialize();
    }

    const results: DetectionResult[] = [];

    try {
      const faces = await this.faceDetector!.process(imageUri);

      for (const face of faces) {
        results.push({
          type: 'face',
          confidence: 0.9, // Face detection is binary, high confidence if detected
          boundingBox: {
            x: face.frame.left,
            y: face.frame.top,
            width: face.frame.width,
            height: face.frame.height,
          },
        });
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }

    return results;
  }

  async detect(
    imageUri: string,
    options: {
      detectPerson?: boolean;
      detectVehicle?: boolean;
      detectFace?: boolean;
    }
  ): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    // Run object detection for person/vehicle
    if (options.detectPerson || options.detectVehicle) {
      const objectResults = await this.detectObjects(imageUri);
      
      if (options.detectPerson) {
        results.push(...objectResults.filter((r) => r.type === 'person'));
      }
      if (options.detectVehicle) {
        results.push(...objectResults.filter((r) => r.type === 'vehicle'));
      }
    }

    // Run face detection
    if (options.detectFace) {
      const faceResults = await this.detectFaces(imageUri);
      results.push(...faceResults);
    }

    return results;
  }

  cleanup() {
    this.imageLabeler = null;
    this.faceDetector = null;
    this.isInitialized = false;
  }
}

export const mlkitDetector = new MLKitDetector();
```

---

## Step 3: Detection Service

### `src/features/detection/detectionService.ts`
```typescript
import { mlkitDetector, DetectionResult } from '@/lib/mlkit/detector';
import { supabase } from '@/lib/supabase/client';
import { notificationService } from '@/lib/notifications/notificationService';
import type { Camera, Alert, DetectionSettings } from '@/types';

interface DetectionConfig {
  camera: Camera;
  settings: DetectionSettings;
  onAlert?: (alert: Alert) => void;
}

class DetectionService {
  private activeDetections = new Map<string, NodeJS.Timeout>();
  private lastAlertTime = new Map<string, number>();
  private cooldownMs = 10000; // 10 second cooldown between alerts

  async startDetection(config: DetectionConfig) {
    const { camera } = config;
    
    // Stop existing detection for this camera
    this.stopDetection(camera.id);

    console.log(`Starting detection for camera: ${camera.name}`);
    
    // Initialize ML Kit
    await mlkitDetector.initialize();

    // Start detection loop
    const intervalId = setInterval(async () => {
      await this.processFrame(config);
    }, 2000); // Process every 2 seconds

    this.activeDetections.set(camera.id, intervalId);
  }

  stopDetection(cameraId: string) {
    const intervalId = this.activeDetections.get(cameraId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeDetections.delete(cameraId);
      console.log(`Stopped detection for camera: ${cameraId}`);
    }
  }

  stopAllDetections() {
    for (const [cameraId] of this.activeDetections) {
      this.stopDetection(cameraId);
    }
    mlkitDetector.cleanup();
  }

  private async processFrame(config: DetectionConfig) {
    const { camera, settings, onAlert } = config;

    try {
      // Capture frame from stream (in real implementation)
      // For now, we'll use a placeholder
      const frameUri = await this.captureFrame(camera);
      if (!frameUri) return;

      // Run detection
      const results = await mlkitDetector.detect(frameUri, {
        detectPerson: settings.person,
        detectVehicle: settings.vehicle,
        detectFace: settings.face,
      });

      // Filter by sensitivity threshold
      const significantResults = results.filter(
        (r) => r.confidence >= settings.sensitivity
      );

      if (significantResults.length === 0) return;

      // Check cooldown
      const lastAlert = this.lastAlertTime.get(camera.id) || 0;
      const now = Date.now();
      
      if (now - lastAlert < this.cooldownMs) {
        return; // Still in cooldown
      }

      // Generate alert for highest confidence detection
      const topResult = significantResults.reduce((a, b) =>
        a.confidence > b.confidence ? a : b
      );

      const alert = await this.createAlert(camera, topResult, frameUri);
      
      this.lastAlertTime.set(camera.id, now);

      // Send push notification
      await notificationService.sendAlertNotification(alert, camera.name);

      // Callback
      onAlert?.(alert);
    } catch (error) {
      console.error('Frame processing error:', error);
    }
  }

  private async captureFrame(camera: Camera): Promise<string | null> {
    // In production, this would:
    // 1. Connect to RTSP stream
    // 2. Capture a single frame
    // 3. Save to temporary file
    // 4. Return file URI
    
    // For now, return null (no-op)
    // Real implementation would use react-native-vision-camera
    // or native RTSP frame grabber
    return null;
  }

  private async createAlert(
    camera: Camera,
    detection: DetectionResult,
    snapshotUri?: string
  ): Promise<Alert> {
    // Upload snapshot to Supabase Storage (if available)
    let snapshotUrl: string | undefined;
    
    if (snapshotUri) {
      const fileName = `${camera.id}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('alert-snapshots')
        .upload(fileName, {
          uri: snapshotUri,
          type: 'image/jpeg',
          name: fileName,
        } as any);

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('alert-snapshots')
          .getPublicUrl(fileName);
        snapshotUrl = urlData.publicUrl;
      }
    }

    // Save alert to database
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        camera_id: camera.id,
        user_id: camera.userId,
        type: detection.type,
        confidence: detection.confidence,
        snapshot_url: snapshotUrl,
        metadata: {
          boundingBox: detection.boundingBox,
        },
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      cameraId: data.camera_id,
      userId: data.user_id,
      type: data.type as Alert['type'],
      confidence: data.confidence,
      snapshotUrl: data.snapshot_url || undefined,
      videoClipUrl: data.video_clip_url || undefined,
      metadata: data.metadata as Record<string, unknown>,
      isRead: data.is_read,
      createdAt: new Date(data.created_at),
    };
  }

  setCooldown(ms: number) {
    this.cooldownMs = ms;
  }
}

export const detectionService = new DetectionService();
```

---

## Step 4: Notification Service

### `src/lib/notifications/notificationService.ts`
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { supabase } from '@/lib/supabase/client';
import type { Alert } from '@/types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private fcmToken: string | null = null;

  async initialize() {
    // Request permissions
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      this.expoPushToken = token.data;

      // Get FCM token for Android
      if (Platform.OS === 'android') {
        await messaging().requestPermission();
        this.fcmToken = await messaging().getToken();
      }

      // Save token to user profile
      await this.saveTokenToProfile();

      // Setup notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }
    }

    // Listen for FCM messages in foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log('FCM Message received:', remoteMessage);
      
      // Show local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'MTK AlertPro',
          body: remoteMessage.notification?.body || 'New alert detected',
          data: remoteMessage.data,
          sound: 'alert.wav',
        },
        trigger: null,
      });
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      // Navigate to alert detail
      // router.push(`/alerts/${data.alertId}`);
    });
  }

  private async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Security Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
      sound: 'alert.wav',
    });

    await Notifications.setNotificationChannelAsync('info', {
      name: 'General Info',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  private async saveTokenToProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ fcm_token: this.fcmToken || this.expoPushToken })
      .eq('id', user.id);
  }

  async sendAlertNotification(alert: Alert, cameraName: string) {
    const typeLabels = {
      person: '🚶 Person Detected',
      vehicle: '🚗 Vehicle Detected',
      face: '👤 Face Detected',
      motion: '📍 Motion Detected',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: typeLabels[alert.type],
        body: `${cameraName} - Confidence: ${Math.round(alert.confidence * 100)}%`,
        data: {
          alertId: alert.id,
          cameraId: alert.cameraId,
          type: alert.type,
        },
        sound: 'alert.wav',
        categoryIdentifier: 'alert',
      },
      trigger: null,
    });
  }

  async sendRedAlertNotification(alert: Alert, cameraName: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 RED ALERT',
        body: `Intrusion detected at ${cameraName}!`,
        data: {
          alertId: alert.id,
          cameraId: alert.cameraId,
          isRedAlert: true,
        },
        sound: 'red-alert.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }
}

export const notificationService = new NotificationService();
```

---

## Step 5: Alert Store

### `src/stores/alertStore.ts`
```typescript
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { notificationService } from '@/lib/notifications/notificationService';
import type { Alert } from '@/types';

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  fetchAlerts: (limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
  clearOldAlerts: (olderThanHours: number) => Promise<void>;
  subscribeToAlerts: () => () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,

  fetchAlerts: async (limit = 50) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, cameras(name)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const alerts: Alert[] = (data || []).map((a) => ({
        id: a.id,
        cameraId: a.camera_id,
        userId: a.user_id,
        type: a.type as Alert['type'],
        confidence: a.confidence,
        snapshotUrl: a.snapshot_url || undefined,
        videoClipUrl: a.video_clip_url || undefined,
        metadata: {
          ...a.metadata as Record<string, unknown>,
          cameraName: (a.cameras as any)?.name,
        },
        isRead: a.is_read,
        createdAt: new Date(a.created_at),
      }));

      set({ alerts });
      await get().fetchUnreadCount();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const { count, error } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (!error && count !== null) {
      set({ unreadCount: count });
      await notificationService.setBadgeCount(count);
    }
  },

  markAsRead: async (alertId) => {
    await supabase.from('alerts').update({ is_read: true }).eq('id', alertId);
    
    set({
      alerts: get().alerts.map((a) =>
        a.id === alertId ? { ...a, isRead: true } : a
      ),
    });
    
    await get().fetchUnreadCount();
  },

  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    set({
      alerts: get().alerts.map((a) => ({ ...a, isRead: true })),
      unreadCount: 0,
    });

    await notificationService.clearBadge();
  },

  deleteAlert: async (alertId) => {
    await supabase.from('alerts').delete().eq('id', alertId);
    set({ alerts: get().alerts.filter((a) => a.id !== alertId) });
    await get().fetchUnreadCount();
  },

  clearOldAlerts: async (olderThanHours) => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('alerts')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', cutoff.toISOString());

    await get().fetchAlerts();
  },

  subscribeToAlerts: () => {
    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        async (payload) => {
          const newAlert = payload.new as any;
          
          // Fetch camera name
          const { data: camera } = await supabase
            .from('cameras')
            .select('name')
            .eq('id', newAlert.camera_id)
            .single();

          const alert: Alert = {
            id: newAlert.id,
            cameraId: newAlert.camera_id,
            userId: newAlert.user_id,
            type: newAlert.type,
            confidence: newAlert.confidence,
            snapshotUrl: newAlert.snapshot_url,
            videoClipUrl: newAlert.video_clip_url,
            metadata: {
              ...newAlert.metadata,
              cameraName: camera?.name,
            },
            isRead: newAlert.is_read,
            createdAt: new Date(newAlert.created_at),
          };

          set({ alerts: [alert, ...get().alerts] });
          await get().fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
```

---

## Step 6: Alerts Screen

### `src/app/(tabs)/alerts.tsx`
```typescript
import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { User, Car, AlertCircle, Check, Trash2 } from 'lucide-react-native';
import { useAlertStore } from '@/stores/alertStore';
import type { Alert } from '@/types';

const ALERT_ICONS = {
  person: { icon: User, color: '#2563EB', bg: 'bg-blue-500/20' },
  vehicle: { icon: Car, color: '#F59E0B', bg: 'bg-orange-500/20' },
  face: { icon: User, color: '#8B5CF6', bg: 'bg-purple-500/20' },
  motion: { icon: AlertCircle, color: '#10B981', bg: 'bg-green-500/20' },
};

function AlertCard({ alert, onPress }: { alert: Alert; onPress: () => void }) {
  const { icon: Icon, color, bg } = ALERT_ICONS[alert.type];

  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 rounded-xl p-4 ${alert.isRead ? 'bg-gray-800' : 'bg-gray-800 border-l-4 border-brand-blue'}`}
    >
      <View className="flex-row">
        {/* Snapshot */}
        {alert.snapshotUrl ? (
          <Image
            source={{ uri: alert.snapshotUrl }}
            className="h-16 w-24 rounded-lg bg-gray-700"
            resizeMode="cover"
          />
        ) : (
          <View className={`h-16 w-24 items-center justify-center rounded-lg ${bg}`}>
            <Icon size={28} color={color} />
          </View>
        )}

        {/* Content */}
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <View className={`rounded-full px-2 py-0.5 ${bg}`}>
              <Text style={{ color }} className="text-xs font-medium capitalize">
                {alert.type}
              </Text>
            </View>
            <Text className="ml-2 text-xs text-gray-400">
              {Math.round(alert.confidence * 100)}% confidence
            </Text>
          </View>

          <Text className="mt-1 text-sm text-white" numberOfLines={1}>
            {(alert.metadata as any).cameraName || 'Unknown Camera'}
          </Text>

          <Text className="mt-1 text-xs text-gray-500">
            {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
          </Text>
        </View>

        {/* Unread indicator */}
        {!alert.isRead && (
          <View className="h-2 w-2 rounded-full bg-brand-blue" />
        )}
      </View>
    </Pressable>
  );
}

export default function AlertsScreen() {
  const router = useRouter();
  const {
    alerts,
    unreadCount,
    isLoading,
    fetchAlerts,
    markAllAsRead,
    subscribeToAlerts,
  } = useAlertStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const unsubscribe = subscribeToAlerts();
    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <View>
          <Text className="text-2xl font-bold text-white">Alerts</Text>
          {unreadCount > 0 && (
            <Text className="text-sm text-gray-400">
              {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={markAllAsRead}
            className="flex-row items-center rounded-lg bg-gray-800 px-3 py-2"
          >
            <Check size={16} color="#10B981" />
            <Text className="ml-1 text-sm text-gray-300">Mark all read</Text>
          </Pressable>
        )}
      </View>

      {/* Alert List */}
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <AlertCard
              alert={item}
              onPress={() => router.push(`/alerts/${item.id}`)}
            />
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
            <AlertCircle size={48} color="#475569" />
            <Text className="mt-4 text-lg text-gray-400">No alerts yet</Text>
            <Text className="mt-1 text-sm text-gray-500">
              Alerts will appear when AI detects activity
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
```

---

## Step 7: Background Detection (Battery Optimized)

### `src/features/detection/backgroundDetection.ts`
```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { detectionService } from './detectionService';
import { useCameraStore } from '@/stores/cameraStore';

const BACKGROUND_DETECTION_TASK = 'background-detection-task';

// Define background task
TaskManager.defineTask(BACKGROUND_DETECTION_TASK, async () => {
  try {
    const cameras = useCameraStore.getState().cameras.filter((c) => c.isActive);
    
    // Process each camera (lightweight check in background)
    for (const camera of cameras) {
      // In background, we do lighter processing
      // Full AI detection runs in foreground
      await checkCameraActivity(camera.id);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background detection error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function checkCameraActivity(cameraId: string): Promise<void> {
  // Lightweight connectivity check
  // Save battery by not running full AI in background
}

export async function registerBackgroundDetection() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_DETECTION_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background detection registered');
  } catch (error) {
    console.error('Failed to register background detection:', error);
  }
}

export async function unregisterBackgroundDetection() {
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_DETECTION_TASK);
}
```

---

## Deliverables Checklist

- [ ] ML Kit integration (image labeling, face detection)
- [ ] Detection service with frame processing
- [ ] Person detection with confidence threshold
- [ ] Vehicle detection with confidence threshold
- [ ] Face detection (Pro feature gated)
- [ ] Alert creation with snapshot storage
- [ ] Push notifications via FCM
- [ ] Alert store with real-time subscription
- [ ] Alerts screen with filtering
- [ ] Background detection (battery optimized)
- [ ] Cooldown system to prevent spam

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Detection Latency | < 500ms |
| Accuracy (Person) | > 85% |
| False Positive Rate | < 10% |
| Processing FPS | 10-15 |
| Battery Drain (Active) | < 5%/hour |

---

## Next Phase

➡️ [Phase 4: Core Features](./PHASE_4_FEATURES.md)
