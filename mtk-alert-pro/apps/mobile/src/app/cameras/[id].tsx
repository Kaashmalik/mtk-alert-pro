import { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Settings,
  Trash2,
  Play,
  Pause,
  Video,
  User,
  Car,
  Scan,
} from 'lucide-react-native';
import { useCameraStore } from '@/stores';
import { Button } from '@/components/ui';

export default function CameraDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cameras, deleteCamera, updateCamera } = useCameraStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const camera = cameras.find((c) => c.id === id);

  useEffect(() => {
    if (!camera) {
      Alert.alert('Error', 'Camera not found', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [camera]);

  if (!camera) {
    return null;
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Camera',
      `Are you sure you want to delete "${camera.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCamera(camera.id);
            router.back();
          },
        },
      ]
    );
  };

  const toggleDetection = async (type: 'person' | 'vehicle') => {
    await updateCamera(camera.id, {
      detectionSettings: {
        ...camera.detectionSettings,
        [type]: !camera.detectionSettings[type],
      },
    });
  };

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      Alert.alert('Recording Saved', 'Video saved to local storage');
    } else {
      setIsRecording(true);
      // Auto-stop after 10 seconds
      setTimeout(() => {
        setIsRecording(false);
        Alert.alert('Recording Saved', '10-second clip saved');
      }, 10000);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: camera.name,
          headerStyle: { backgroundColor: '#1E293B' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <Trash2 size={22} color="#EF4444" />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
        {/* Video Player Area */}
        <View className="aspect-video bg-black items-center justify-center">
          {isPlaying ? (
            <View className="w-full h-full bg-slate-800 items-center justify-center">
              <Text className="text-slate-400">RTSP Stream</Text>
              <Text className="text-slate-500 text-sm mt-1">{camera.rtspUrl}</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsPlaying(true)}
              className="items-center"
            >
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                <Play size={32} color="white" fill="white" />
              </View>
              <Text className="text-white mt-3">Tap to start stream</Text>
            </TouchableOpacity>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <View className="absolute top-4 right-4 flex-row items-center bg-red-600 px-3 py-1 rounded-full">
              <View className="w-2 h-2 bg-white rounded-full mr-2" />
              <Text className="text-white text-sm font-semibold">REC</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View className="flex-row justify-around py-4 bg-slate-800">
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            className="items-center"
          >
            {isPlaying ? (
              <Pause size={24} color="white" />
            ) : (
              <Play size={24} color="white" />
            )}
            <Text className="text-white text-xs mt-1">
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRecord}
            className="items-center"
          >
            <Video size={24} color={isRecording ? '#EF4444' : 'white'} />
            <Text className={`text-xs mt-1 ${isRecording ? 'text-red-500' : 'text-white'}`}>
              {isRecording ? 'Stop' : 'Record'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center">
            <Settings size={24} color="white" />
            <Text className="text-white text-xs mt-1">Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Detection Settings */}
        <View className="px-6 mt-6">
          <Text className="text-white font-semibold text-lg mb-4">
            Detection Settings
          </Text>

          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => toggleDetection('person')}
              className={`flex-row items-center p-4 rounded-xl ${
                camera.detectionSettings.person ? 'bg-red-500/20' : 'bg-slate-800'
              }`}
            >
              <User
                size={24}
                color={camera.detectionSettings.person ? '#EF4444' : '#64748B'}
              />
              <View className="flex-1 ml-3">
                <Text className="text-white font-medium">Person Detection</Text>
                <Text className="text-slate-400 text-sm">
                  Alert when people are detected
                </Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  camera.detectionSettings.person
                    ? 'bg-red-500 border-red-500'
                    : 'border-slate-500'
                }`}
              >
                {camera.detectionSettings.person && (
                  <View className="w-2 h-2 bg-white rounded-full" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleDetection('vehicle')}
              className={`flex-row items-center p-4 rounded-xl ${
                camera.detectionSettings.vehicle ? 'bg-blue-500/20' : 'bg-slate-800'
              }`}
            >
              <Car
                size={24}
                color={camera.detectionSettings.vehicle ? '#3B82F6' : '#64748B'}
              />
              <View className="flex-1 ml-3">
                <Text className="text-white font-medium">Vehicle Detection</Text>
                <Text className="text-slate-400 text-sm">
                  Alert when vehicles are detected
                </Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  camera.detectionSettings.vehicle
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-slate-500'
                }`}
              >
                {camera.detectionSettings.vehicle && (
                  <View className="w-2 h-2 bg-white rounded-full" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Camera Info */}
        <View className="px-6 mt-6">
          <Text className="text-slate-400 text-sm">
            Status: {camera.isActive ? '🟢 Online' : '🔴 Offline'}
          </Text>
          <Text className="text-slate-500 text-xs mt-1">
            Added: {new Date(camera.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
