# Phase 4: Core Features (Week 8-9)

## Goals
- ✅ Red Alert mode
- ✅ Manual video recording (10-sec clips)
- ✅ 48-hour local alert storage
- ✅ Settings panel
- ✅ Detection sensitivity controls
- ✅ Notification preferences
- ✅ Dashboard with quick stats

---

## Step 1: Settings Store

### `src/stores/settingsStore.ts`
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

interface SettingsState {
  settings: AppSettings;
  redAlertMode: boolean;
  
  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleRedAlert: () => void;
  resetToDefaults: () => void;
}

const defaultSettings: AppSettings = {
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
  detection: {
    redAlertMode: false,
    cooldownSeconds: 10,
  },
  display: {
    theme: 'dark',
    streamQuality: '720p',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      redAlertMode: false,

      updateSettings: (updates) => {
        set({
          settings: {
            ...get().settings,
            ...updates,
            notifications: {
              ...get().settings.notifications,
              ...updates.notifications,
            },
            detection: {
              ...get().settings.detection,
              ...updates.detection,
            },
            display: {
              ...get().settings.display,
              ...updates.display,
            },
          },
        });
      },

      toggleRedAlert: () => {
        const newValue = !get().redAlertMode;
        set({
          redAlertMode: newValue,
          settings: {
            ...get().settings,
            detection: {
              ...get().settings.detection,
              redAlertMode: newValue,
              cooldownSeconds: newValue ? 0 : 10, // No cooldown in red alert
            },
          },
        });
      },

      resetToDefaults: () => {
        set({
          settings: defaultSettings,
          redAlertMode: false,
        });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## Step 2: Recording Service

### `src/features/recording/recordingService.ts`
```typescript
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase/client';
import type { Camera } from '@/types';

interface RecordingOptions {
  camera: Camera;
  durationSeconds: number;
}

interface RecordingResult {
  localUri: string;
  cloudUrl?: string;
  durationMs: number;
}

class RecordingService {
  private recordingsDir = `${FileSystem.documentDirectory}recordings/`;
  private isRecording = new Map<string, boolean>();

  async initialize() {
    // Ensure recordings directory exists
    const dirInfo = await FileSystem.getInfoAsync(this.recordingsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.recordingsDir, { intermediates: true });
    }
  }

  async startRecording({ camera, durationSeconds }: RecordingOptions): Promise<RecordingResult> {
    if (this.isRecording.get(camera.id)) {
      throw new Error('Recording already in progress');
    }

    this.isRecording.set(camera.id, true);
    const startTime = Date.now();

    try {
      // Generate filename
      const filename = `${camera.id}_${Date.now()}.mp4`;
      const localUri = `${this.recordingsDir}${filename}`;

      // In production, this would:
      // 1. Connect to RTSP stream
      // 2. Record for specified duration
      // 3. Save to local file
      
      // For now, simulate recording delay
      await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));

      const endTime = Date.now();

      return {
        localUri,
        durationMs: endTime - startTime,
      };
    } finally {
      this.isRecording.set(camera.id, false);
    }
  }

  async uploadToCloud(localUri: string, cameraId: string): Promise<string> {
    const filename = localUri.split('/').pop() || `${Date.now()}.mp4`;
    const path = `recordings/${cameraId}/${filename}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(path, decode(base64), {
        contentType: 'video/mp4',
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  async getLocalRecordings(): Promise<string[]> {
    const files = await FileSystem.readDirectoryAsync(this.recordingsDir);
    return files.map((f) => `${this.recordingsDir}${f}`);
  }

  async deleteRecording(uri: string): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }

  async getStorageUsage(): Promise<{ used: number; files: number }> {
    const files = await this.getLocalRecordings();
    let totalSize = 0;

    for (const file of files) {
      const info = await FileSystem.getInfoAsync(file);
      if (info.exists && 'size' in info) {
        totalSize += info.size;
      }
    }

    return { used: totalSize, files: files.length };
  }

  async cleanupOldRecordings(maxAgeHours: number = 48): Promise<number> {
    const files = await this.getLocalRecordings();
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const info = await FileSystem.getInfoAsync(file);
      if (info.exists && 'modificationTime' in info) {
        if (info.modificationTime * 1000 < cutoff) {
          await this.deleteRecording(file);
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  isCurrentlyRecording(cameraId: string): boolean {
    return this.isRecording.get(cameraId) || false;
  }
}

// Base64 decode helper
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const recordingService = new RecordingService();
```

---

## Step 3: Red Alert Toggle Component

### `src/components/alerts/RedAlertToggle.tsx`
```typescript
import { View, Text, Pressable, Switch } from 'react-native';
import { AlertTriangle, ShieldAlert } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function RedAlertToggle() {
  const { redAlertMode, toggleRedAlert } = useSettingsStore();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (redAlertMode) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 500 })
        ),
        -1
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = 1;
      pulseOpacity.value = 0.5;
    }
  }, [redAlertMode]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Pressable
      onPress={toggleRedAlert}
      className={`rounded-2xl p-4 ${
        redAlertMode ? 'bg-brand-red' : 'bg-gray-800'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="relative">
            {redAlertMode && (
              <Animated.View
                style={animatedStyle}
                className="absolute -inset-2 rounded-full bg-brand-red"
              />
            )}
            <ShieldAlert
              size={32}
              color={redAlertMode ? 'white' : '#EF4444'}
            />
          </View>
          <View className="ml-3">
            <Text
              className={`text-lg font-bold ${
                redAlertMode ? 'text-white' : 'text-white'
              }`}
            >
              Red Alert Mode
            </Text>
            <Text
              className={`text-sm ${
                redAlertMode ? 'text-red-100' : 'text-gray-400'
              }`}
            >
              {redAlertMode
                ? 'Maximum sensitivity active'
                : 'Tap to enable max sensitivity'}
            </Text>
          </View>
        </View>

        <Switch
          value={redAlertMode}
          onValueChange={toggleRedAlert}
          trackColor={{ false: '#374151', true: '#991B1B' }}
          thumbColor={redAlertMode ? '#FCA5A5' : '#9CA3AF'}
        />
      </View>

      {redAlertMode && (
        <View className="mt-3 flex-row items-center rounded-lg bg-red-900/50 p-2">
          <AlertTriangle size={16} color="#FCA5A5" />
          <Text className="ml-2 text-sm text-red-100">
            All motion will trigger immediate alerts
          </Text>
        </View>
      )}
    </Pressable>
  );
}
```

---

## Step 4: Dashboard Screen

### `src/app/(tabs)/index.tsx`
```typescript
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Camera,
  Bell,
  Shield,
  Activity,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { RedAlertToggle } from '@/components/alerts/RedAlertToggle';
import { useCameraStore } from '@/stores/cameraStore';
import { useAlertStore } from '@/stores/alertStore';
import { useAuthStore } from '@/stores/authStore';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onPress?: () => void;
}

function StatCard({ title, value, icon, color, onPress }: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-xl bg-gray-800 p-4"
    >
      <View className="flex-row items-center justify-between">
        <View
          className="h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </View>
        {onPress && <ChevronRight size={16} color="#6B7280" />}
      </View>
      <Text className="mt-3 text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-1 text-sm text-gray-400">{title}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cameras, fetchCameras } = useCameraStore();
  const { alerts, unreadCount, fetchAlerts } = useAlertStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCameras();
    fetchAlerts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCameras(), fetchAlerts()]);
    setRefreshing(false);
  };

  const onlineCameras = cameras.filter((c) => c.isActive).length;
  const todayAlerts = alerts.filter(
    (a) => new Date(a.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
          />
        }
      >
        {/* Header */}
        <View className="py-4">
          <Text className="text-gray-400">Welcome back,</Text>
          <Text className="text-2xl font-bold text-white">
            {user?.displayName || 'User'}
          </Text>
        </View>

        {/* Red Alert Toggle */}
        <RedAlertToggle />

        {/* Stats Grid */}
        <View className="mt-6 flex-row gap-3">
          <StatCard
            title="Active Cameras"
            value={`${onlineCameras}/${cameras.length}`}
            icon={
              onlineCameras > 0 ? (
                <Wifi size={20} color="#10B981" />
              ) : (
                <WifiOff size={20} color="#6B7280" />
              )
            }
            color="#10B981"
            onPress={() => router.push('/(tabs)/cameras')}
          />
          <StatCard
            title="Unread Alerts"
            value={unreadCount}
            icon={<Bell size={20} color="#2563EB" />}
            color="#2563EB"
            onPress={() => router.push('/(tabs)/alerts')}
          />
        </View>

        <View className="mt-3 flex-row gap-3">
          <StatCard
            title="Today's Alerts"
            value={todayAlerts}
            icon={<Activity size={20} color="#F59E0B" />}
            color="#F59E0B"
          />
          <StatCard
            title="Subscription"
            value={user?.subscriptionTier === 'free' ? 'Free' : 'Pro'}
            icon={<Shield size={20} color="#8B5CF6" />}
            color="#8B5CF6"
            onPress={() => router.push('/settings/subscription')}
          />
        </View>

        {/* Quick Actions */}
        <View className="mt-6">
          <Text className="mb-3 text-lg font-semibold text-white">
            Quick Actions
          </Text>

          <View className="rounded-xl bg-gray-800">
            <Pressable
              onPress={() => router.push('/(tabs)/cameras')}
              className="flex-row items-center justify-between border-b border-gray-700 p-4"
            >
              <View className="flex-row items-center">
                <Camera size={20} color="#2563EB" />
                <Text className="ml-3 text-white">Add New Camera</Text>
              </View>
              <ChevronRight size={20} color="#6B7280" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/alerts')}
              className="flex-row items-center justify-between border-b border-gray-700 p-4"
            >
              <View className="flex-row items-center">
                <Bell size={20} color="#10B981" />
                <Text className="ml-3 text-white">View Alert History</Text>
              </View>
              <ChevronRight size={20} color="#6B7280" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/settings')}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center">
                <Shield size={20} color="#F59E0B" />
                <Text className="ml-3 text-white">Detection Settings</Text>
              </View>
              <ChevronRight size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        {/* Recent Activity */}
        {alerts.length > 0 && (
          <View className="mt-6 mb-8">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-white">
                Recent Activity
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/alerts')}>
                <Text className="text-sm text-brand-blue">View All</Text>
              </Pressable>
            </View>

            {alerts.slice(0, 3).map((alert) => (
              <Pressable
                key={alert.id}
                onPress={() => router.push(`/alerts/${alert.id}`)}
                className="mb-2 flex-row items-center rounded-lg bg-gray-800 p-3"
              >
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${
                    alert.type === 'person'
                      ? 'bg-blue-500/20'
                      : 'bg-orange-500/20'
                  }`}
                >
                  {alert.type === 'person' ? (
                    <Bell size={16} color="#2563EB" />
                  ) : (
                    <Camera size={16} color="#F59E0B" />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-white capitalize">
                    {alert.type} detected
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {(alert.metadata as any).cameraName}
                  </Text>
                </View>
                {!alert.isRead && (
                  <View className="h-2 w-2 rounded-full bg-brand-blue" />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Step 5: Settings Screen

### `src/app/(tabs)/settings.tsx`
```typescript
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  Volume2,
  Vibrate,
  Moon,
  Video,
  Clock,
  Shield,
  User,
  HelpCircle,
  LogOut,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useAlertStore } from '@/stores/alertStore';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingRow({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  destructive,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3"
    >
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-gray-700">
        {icon}
      </View>
      <View className="ml-3 flex-1">
        <Text
          className={`text-base ${destructive ? 'text-brand-red' : 'text-white'}`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-0.5 text-sm text-gray-500">{subtitle}</Text>
        )}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color="#6B7280" />)}
    </Pressable>
  );
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-6">
      <Text className="mb-2 px-4 text-sm font-medium uppercase text-gray-500">
        {title}
      </Text>
      <View className="rounded-xl bg-gray-800">{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettingsStore();
  const { user, signOut } = useAuthStore();
  const { clearOldAlerts } = useAlertStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleClearAlerts = () => {
    Alert.alert(
      'Clear Alerts',
      'This will delete all alerts older than 48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearOldAlerts(48),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-4">
          <Text className="text-2xl font-bold text-white">Settings</Text>
        </View>

        {/* Profile */}
        <Pressable
          onPress={() => router.push('/settings/profile')}
          className="mx-4 flex-row items-center rounded-xl bg-gray-800 p-4"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-blue">
            <Text className="text-xl font-bold text-white">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-lg font-semibold text-white">
              {user?.displayName || 'User'}
            </Text>
            <Text className="text-sm text-gray-400">{user?.email}</Text>
          </View>
          <View className="rounded-full bg-brand-purple/20 px-2 py-1">
            <Text className="text-xs font-medium capitalize text-brand-purple">
              {user?.subscriptionTier}
            </Text>
          </View>
        </Pressable>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingRow
            icon={<Bell size={18} color="#2563EB" />}
            title="Push Notifications"
            subtitle="Receive alerts on your device"
            rightElement={
              <Switch
                value={settings.notifications.enabled}
                onValueChange={(value) =>
                  updateSettings({ notifications: { ...settings.notifications, enabled: value } })
                }
                trackColor={{ false: '#374151', true: '#2563EB' }}
              />
            }
          />
          <View className="mx-4 h-px bg-gray-700" />
          <SettingRow
            icon={<Volume2 size={18} color="#10B981" />}
            title="Alert Sound"
            rightElement={
              <Switch
                value={settings.notifications.sound}
                onValueChange={(value) =>
                  updateSettings({ notifications: { ...settings.notifications, sound: value } })
                }
                trackColor={{ false: '#374151', true: '#10B981' }}
              />
            }
          />
          <View className="mx-4 h-px bg-gray-700" />
          <SettingRow
            icon={<Vibrate size={18} color="#F59E0B" />}
            title="Vibration"
            rightElement={
              <Switch
                value={settings.notifications.vibration}
                onValueChange={(value) =>
                  updateSettings({ notifications: { ...settings.notifications, vibration: value } })
                }
                trackColor={{ false: '#374151', true: '#F59E0B' }}
              />
            }
          />
        </SettingSection>

        {/* Detection */}
        <SettingSection title="Detection">
          <SettingRow
            icon={<Clock size={18} color="#8B5CF6" />}
            title="Alert Cooldown"
            subtitle={`${settings.detection.cooldownSeconds} seconds between alerts`}
            onPress={() => router.push('/settings/cooldown')}
          />
          <View className="mx-4 h-px bg-gray-700" />
          <SettingRow
            icon={<Video size={18} color="#06B6D4" />}
            title="Stream Quality"
            subtitle={settings.display.streamQuality}
            onPress={() => router.push('/settings/quality')}
          />
        </SettingSection>

        {/* Account */}
        <SettingSection title="Account">
          <SettingRow
            icon={<Shield size={18} color="#8B5CF6" />}
            title="Subscription"
            subtitle={`${user?.subscriptionTier} plan`}
            onPress={() => router.push('/settings/subscription')}
          />
          <View className="mx-4 h-px bg-gray-700" />
          <SettingRow
            icon={<HelpCircle size={18} color="#10B981" />}
            title="Help & Support"
            onPress={() => router.push('/settings/help')}
          />
        </SettingSection>

        {/* Data */}
        <SettingSection title="Data">
          <SettingRow
            icon={<Trash2 size={18} color="#EF4444" />}
            title="Clear Old Alerts"
            subtitle="Remove alerts older than 48 hours"
            onPress={handleClearAlerts}
          />
        </SettingSection>

        {/* Sign Out */}
        <View className="mt-6 px-4">
          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center rounded-xl bg-gray-800 py-4"
          >
            <LogOut size={20} color="#EF4444" />
            <Text className="ml-2 font-semibold text-brand-red">Sign Out</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="items-center py-8">
          <Text className="text-sm text-gray-500">MTK AlertPro v1.0.0</Text>
          <Text className="mt-1 text-xs text-gray-600">
            Made with ❤️ by MTK CODEX
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Step 6: Local Storage Cleanup Job

### `src/features/storage/storageCleanup.ts`
```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { recordingService } from '../recording/recordingService';
import { useAlertStore } from '@/stores/alertStore';

const CLEANUP_TASK = 'storage-cleanup-task';

// Free tier: 48 hours
// Pro tier: 30 days (handled by cloud)
const FREE_TIER_MAX_AGE_HOURS = 48;

TaskManager.defineTask(CLEANUP_TASK, async () => {
  try {
    // Clean old recordings
    const deletedRecordings = await recordingService.cleanupOldRecordings(
      FREE_TIER_MAX_AGE_HOURS
    );
    
    // Clean old alerts (local)
    await useAlertStore.getState().clearOldAlerts(FREE_TIER_MAX_AGE_HOURS);

    console.log(`Cleanup complete: ${deletedRecordings} recordings deleted`);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Cleanup task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerCleanupTask() {
  try {
    await BackgroundFetch.registerTaskAsync(CLEANUP_TASK, {
      minimumInterval: 60 * 60 * 6, // Every 6 hours
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Cleanup task registered');
  } catch (error) {
    console.error('Failed to register cleanup task:', error);
  }
}

export async function runCleanupNow() {
  await recordingService.cleanupOldRecordings(FREE_TIER_MAX_AGE_HOURS);
  await useAlertStore.getState().clearOldAlerts(FREE_TIER_MAX_AGE_HOURS);
}
```

---

## Deliverables Checklist

- [ ] Red Alert mode with animation
- [ ] Manual video recording (10-sec clips)
- [ ] Local recording storage management
- [ ] 48-hour auto-cleanup for free tier
- [ ] Dashboard with quick stats
- [ ] Settings screen with all toggles
- [ ] Notification preferences
- [ ] Detection cooldown settings
- [ ] Stream quality settings
- [ ] Profile management
- [ ] Sign out functionality

---

## Next Phase

➡️ [Phase 5: Polish & Testing](./PHASE_5_POLISH.md)
