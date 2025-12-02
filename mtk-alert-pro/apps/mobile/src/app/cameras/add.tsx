import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import {
  Camera,
  Link2,
  User,
  Lock,
  ArrowLeft,
  Wifi,
  Hash,
  Globe,
  HelpCircle,
} from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useCameraStore } from '@/stores';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

type AddMethod = 'rtsp' | 'ip' | 'serial' | 'router';

const cameraSchema = z.object({
  name: z.string().min(1, 'Camera name is required'),
  rtspUrl: z.string().url('Invalid RTSP URL').refine(
    (url) => url.startsWith('rtsp://'),
    'URL must start with rtsp://'
  ),
  username: z.string().optional(),
  password: z.string().optional(),
});

type CameraForm = z.infer<typeof cameraSchema>;

const CAMERA_BRANDS = [
  { id: 'hikvision', name: 'Hikvision', rtspPort: '554', path: '/Streaming/Channels/101' },
  { id: 'dahua', name: 'Dahua', rtspPort: '554', path: '/cam/realmonitor?channel=1&subtype=0' },
  { id: 'reolink', name: 'Reolink', rtspPort: '554', path: '/h264Preview_01_main' },
  { id: 'pyronix', name: 'Pyronix', rtspPort: '8554', path: '/stream1' },
  { id: 'custom', name: 'Custom', rtspPort: '554', path: '/stream' },
];

const ADD_METHODS = [
  { id: 'ip' as const, title: 'IP/Domain', icon: Globe, description: 'Enter camera IP address or domain' },
  { id: 'rtsp' as const, title: 'RTSP URL', icon: Link2, description: 'Direct RTSP stream URL' },
  { id: 'serial' as const, title: 'Serial Number', icon: Hash, description: 'Find by device serial' },
  { id: 'router' as const, title: 'Router Guide', icon: Wifi, description: 'Find cameras on LAN' },
];

export default function AddCameraScreen() {
  const { addCamera, testConnection } = useCameraStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<AddMethod>('ip');
  const [selectedBrand, setSelectedBrand] = useState<string>('hikvision');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CameraForm>({
    resolver: zodResolver(cameraSchema),
    defaultValues: {
      name: '',
      rtspUrl: '',
      username: '',
      password: '',
    },
  });

  const buildRtspUrl = (ip: string, brand: typeof CAMERA_BRANDS[0], username?: string, password?: string) => {
    const auth = username && password ? `${username}:${password}@` : '';
    return `rtsp://${auth}${ip}:${brand.rtspPort}${brand.path}`;
  };

  const handleMethodSelect = (method: AddMethod) => {
    setSelectedMethod(method);
  };

  const onSubmit = async (data: CameraForm) => {
    setIsLoading(true);
    try {
      // Test connection first
      const isValid = await testConnection(data.rtspUrl);
      if (!isValid) {
        Alert.alert('Warning', 'Could not validate the RTSP URL format. Add anyway?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Anyway', onPress: () => saveCamera(data) },
        ]);
        setIsLoading(false);
        return;
      }
      await saveCamera(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add camera';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCamera = async (data: CameraForm) => {
    await addCamera({
      name: data.name,
      rtspUrl: data.rtspUrl,
      username: data.username,
      password: data.password,
      isActive: true,
      detectionSettings: {
        person: true,
        vehicle: true,
        sensitivity: 0.7,
      },
    });
    Alert.alert('Success', 'Camera added successfully!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Camera',
          headerStyle: { backgroundColor: '#1E293B' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
          {/* Camera Icon */}
          <View className="items-center my-6">
            <View className="w-20 h-20 bg-slate-800 rounded-full items-center justify-center">
              <Camera size={40} color="#06B6D4" />
            </View>
          </View>

          {/* Brand Presets */}
          <Text className="text-white font-semibold mb-3">Camera Brand</Text>
          <View className="flex-row flex-wrap mb-6">
            {CAMERA_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.name}
                onPress={() => handlePresetSelect(preset)}
                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                  selectedPreset === preset.name
                    ? 'bg-brand-red border-brand-red'
                    : 'bg-slate-800 border-slate-600'
                }`}
              >
                <Text className="text-white">{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          <View className="space-y-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Camera Name"
                  placeholder="e.g., Front Door, Backyard"
                  leftIcon={<Camera size={20} color="#64748B" />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />

            <View className="h-2" />

            <Controller
              control={control}
              name="rtspUrl"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="RTSP URL"
                  placeholder="rtsp://192.168.1.100:554/stream"
                  leftIcon={<Link2 size={20} color="#64748B" />}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.rtspUrl?.message}
                />
              )}
            />

            <View className="h-2" />

            <Text className="text-slate-400 text-sm mb-2">
              Camera Credentials (optional)
            </Text>

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Username"
                  placeholder="admin"
                  leftIcon={<User size={20} color="#64748B" />}
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <View className="h-2" />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  leftIcon={<Lock size={20} color="#64748B" />}
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* Help Text */}
          <View className="bg-slate-800 rounded-xl p-4 mt-6">
            <Text className="text-slate-400 text-sm">
              💡 <Text className="font-semibold text-slate-300">Tip:</Text> You can find
              your camera's RTSP URL in its settings or manual. Most cameras use port 554.
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            className="mt-6 mb-8"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
          >
            Add Camera
          </Button>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
