import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Camera, Wifi, WifiOff, MoreVertical } from 'lucide-react-native';
import { useCameraStore } from '@/stores';
import { Button } from '@/components/ui';
import type { Camera as CameraType } from '@/types';

export default function CamerasScreen() {
  const { cameras, fetchCameras, isLoading, deleteCamera } = useCameraStore();

  useEffect(() => {
    fetchCameras();
  }, []);

  const renderCamera = ({ item }: { item: CameraType }) => (
    <TouchableOpacity
      className="bg-slate-800 rounded-2xl overflow-hidden mb-4"
      onPress={() => router.push(`/cameras/${item.id}`)}
    >
      {/* Thumbnail */}
      <View className="h-40 bg-slate-700 items-center justify-center">
        {item.thumbnailUrl ? (
          <View className="w-full h-full bg-slate-700" />
        ) : (
          <Camera size={40} color="#64748B" />
        )}
        {/* Status Badge */}
        <View
          className={`absolute top-3 right-3 flex-row items-center px-2 py-1 rounded-full ${
            item.isActive ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}
        >
          {item.isActive ? (
            <Wifi size={14} color="#10B981" />
          ) : (
            <WifiOff size={14} color="#EF4444" />
          )}
          <Text
            className={`ml-1 text-xs font-medium ${
              item.isActive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {item.isActive ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg">{item.name}</Text>
          <Text className="text-slate-400 text-sm mt-1">
            {item.detectionSettings.person && 'Person'}{' '}
            {item.detectionSettings.vehicle && '• Vehicle'}{' '}
            {item.detectionSettings.face && '• Face'}
          </Text>
        </View>
        <TouchableOpacity className="p-2">
          <MoreVertical size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold">Cameras</Text>
        <TouchableOpacity
          onPress={() => router.push('/cameras/add')}
          className="bg-brand-red w-10 h-10 rounded-full items-center justify-center"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {cameras.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-slate-800 rounded-full items-center justify-center mb-4">
            <Camera size={40} color="#64748B" />
          </View>
          <Text className="text-white text-xl font-semibold mb-2">No Cameras</Text>
          <Text className="text-slate-400 text-center mb-6">
            Add your first camera to start monitoring
          </Text>
          <Button onPress={() => router.push('/cameras/add')}>
            Add Camera
          </Button>
        </View>
      ) : (
        <FlatList
          data={cameras}
          renderItem={renderCamera}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchCameras} />
          }
        />
      )}
    </SafeAreaView>
  );
}
