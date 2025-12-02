import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Shield,
  Camera,
  Bell,
  AlertTriangle,
  ChevronRight,
  Activity,
} from 'lucide-react-native';
import { useAuthStore, useCameraStore, useAlertStore, useSettingsStore } from '@/stores';
import { Button } from '@/components/ui';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { cameras, fetchCameras, isLoading: camerasLoading } = useCameraStore();
  const { alerts, unreadCount, fetchAlerts } = useAlertStore();
  const { detection, setDetection } = useSettingsStore();

  useEffect(() => {
    fetchCameras();
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    fetchCameras();
    fetchAlerts();
  };

  const activeCameras = cameras.filter((c) => c.isActive).length;
  const recentAlerts = alerts.slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={camerasLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-slate-400 text-sm">Welcome back</Text>
          <Text className="text-white text-2xl font-bold">
            {user?.displayName || 'User'}
          </Text>
        </View>

        {/* Red Alert Toggle */}
        <TouchableOpacity
          onPress={() => setDetection({ redAlertMode: !detection.redAlertMode })}
          className={`mx-6 p-4 rounded-2xl flex-row items-center justify-between ${
            detection.redAlertMode ? 'bg-red-600' : 'bg-slate-800'
          }`}
        >
          <View className="flex-row items-center">
            <AlertTriangle
              size={24}
              color={detection.redAlertMode ? 'white' : '#EF4444'}
            />
            <View className="ml-3">
              <Text className="text-white font-semibold text-lg">
                Red Alert Mode
              </Text>
              <Text className="text-slate-300 text-sm">
                {detection.redAlertMode
                  ? 'Maximum sensitivity active'
                  : 'Tap to enable max sensitivity'}
              </Text>
            </View>
          </View>
          <View
            className={`w-12 h-7 rounded-full p-1 ${
              detection.redAlertMode ? 'bg-red-800' : 'bg-slate-600'
            }`}
          >
            <View
              className={`w-5 h-5 rounded-full bg-white ${
                detection.redAlertMode ? 'ml-auto' : ''
              }`}
            />
          </View>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View className="flex-row px-6 mt-6">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cameras')}
            className="flex-1 bg-slate-800 rounded-2xl p-4 mr-3"
          >
            <Camera size={24} color="#06B6D4" />
            <Text className="text-3xl font-bold text-white mt-2">
              {activeCameras}
            </Text>
            <Text className="text-slate-400">Active Cameras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/alerts')}
            className="flex-1 bg-slate-800 rounded-2xl p-4"
          >
            <Bell size={24} color="#EF4444" />
            <Text className="text-3xl font-bold text-white mt-2">
              {unreadCount}
            </Text>
            <Text className="text-slate-400">Unread Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* System Status */}
        <View className="mx-6 mt-6 bg-slate-800 rounded-2xl p-4">
          <View className="flex-row items-center mb-3">
            <Activity size={20} color="#10B981" />
            <Text className="text-white font-semibold ml-2">System Status</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <Text className="text-slate-300">
              All systems operational - Detection active
            </Text>
          </View>
        </View>

        {/* Recent Alerts */}
        <View className="mx-6 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-semibold text-lg">Recent Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
              <Text className="text-brand-red">View All</Text>
            </TouchableOpacity>
          </View>

          {recentAlerts.length === 0 ? (
            <View className="bg-slate-800 rounded-2xl p-6 items-center">
              <Shield size={40} color="#64748B" />
              <Text className="text-slate-400 mt-3 text-center">
                No alerts yet. Your cameras are monitoring.
              </Text>
            </View>
          ) : (
            recentAlerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                className="bg-slate-800 rounded-xl p-4 mb-2 flex-row items-center"
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    alert.type === 'person' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}
                >
                  <Bell
                    size={20}
                    color={alert.type === 'person' ? '#EF4444' : '#3B82F6'}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-medium capitalize">
                    {alert.type} detected
                  </Text>
                  <Text className="text-slate-400 text-sm">
                    {new Date(alert.createdAt).toLocaleString()}
                  </Text>
                </View>
                <ChevronRight size={20} color="#64748B" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-6 mt-6 mb-8">
          <Text className="text-white font-semibold text-lg mb-3">
            Quick Actions
          </Text>
          <View className="flex-row">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 mr-2"
              onPress={() => router.push('/cameras/add')}
            >
              Add Camera
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onPress={() => router.push('/(tabs)/settings')}
            >
              Settings
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
