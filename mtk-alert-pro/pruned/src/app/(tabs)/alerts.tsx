import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, User, Car, Check, Trash2 } from 'lucide-react-native';
import { useAlertStore, useCameraStore } from '@/stores';
import { Button } from '@/components/ui';
import type { Alert } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function AlertsScreen() {
  const { alerts, fetchAlerts, markAsRead, markAllAsRead, deleteAlert, isLoading, subscribeToAlerts } = useAlertStore();
  const { cameras } = useCameraStore();

  useEffect(() => {
    fetchAlerts();
    const unsubscribe = subscribeToAlerts();
    return unsubscribe;
  }, []);

  const getCameraName = (cameraId: string) => {
    return cameras.find((c) => c.id === cameraId)?.name || 'Unknown Camera';
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'person':
        return <User size={20} color="#EF4444" />;
      case 'vehicle':
        return <Car size={20} color="#3B82F6" />;
      default:
        return <Bell size={20} color="#F59E0B" />;
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      className={`bg-slate-800 rounded-xl p-4 mb-3 flex-row ${
        !item.isRead ? 'border-l-4 border-brand-red' : ''
      }`}
      onPress={() => markAsRead(item.id)}
    >
      <View
        className={`w-12 h-12 rounded-full items-center justify-center ${
          item.type === 'person' ? 'bg-red-500/20' : 'bg-blue-500/20'
        }`}
      >
        {getAlertIcon(item.type)}
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-semibold capitalize">
            {item.type} Detected
          </Text>
          <Text className="text-slate-400 text-xs">
            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
          </Text>
        </View>
        <Text className="text-slate-400 text-sm mt-1">
          {getCameraName(item.cameraId)}
        </Text>
        <Text className="text-slate-500 text-xs mt-1">
          Confidence: {Math.round(item.confidence * 100)}%
        </Text>
      </View>
      <TouchableOpacity
        className="p-2"
        onPress={() => deleteAlert(item.id)}
      >
        <Trash2 size={18} color="#64748B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-2xl font-bold">Alerts</Text>
          {unreadCount > 0 && (
            <Text className="text-slate-400 text-sm">
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            className="flex-row items-center"
          >
            <Check size={18} color="#10B981" />
            <Text className="text-green-500 ml-1">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {alerts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-slate-800 rounded-full items-center justify-center mb-4">
            <Bell size={40} color="#64748B" />
          </View>
          <Text className="text-white text-xl font-semibold mb-2">No Alerts</Text>
          <Text className="text-slate-400 text-center">
            You'll see detection alerts here when your cameras spot something
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchAlerts} />
          }
        />
      )}
    </SafeAreaView>
  );
}
