import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Camera, Link2, User, Lock, ArrowLeft, Wifi, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useCameraStore } from '@/stores';
import { designSystem } from '@/theme/design-system';
import { CAMERA_BRANDS, generateRtspUrl, isValidIpAddress } from '@/lib/camera/rtspHelper';

const cameraSchema = z.object({
  name: z.string().min(1, 'Camera name is required'),
  rtspUrl: z.string().min(1, 'RTSP URL is required'),
  username: z.string().optional(),
  password: z.string().optional(),
});

type CameraForm = z.infer<typeof cameraSchema>;

export default function AddCameraScreen() {
  const addCamera = useCameraStore((state) => state.addCamera);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('hikvision');
  const [showUrlBuilder, setShowUrlBuilder] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [showBrandSelector, setShowBrandSelector] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
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

  const watchedUsername = watch('username');
  const watchedPassword = watch('password');

  const handleGenerateUrl = useCallback(() => {
    if (!isValidIpAddress(ipAddress)) {
      Alert.alert('Invalid IP', 'Please enter a valid IP address');
      return;
    }

    const url = generateRtspUrl(selectedBrand, ipAddress, {
      username: watchedUsername || undefined,
      password: watchedPassword || undefined,
    });

    if (url) {
      setValue('rtspUrl', url);
      setShowUrlBuilder(false);
      Alert.alert('URL Generated', 'RTSP URL has been generated. You can edit it if needed.');
    }
  }, [ipAddress, selectedBrand, watchedUsername, watchedPassword, setValue]);

  const selectedBrandData = CAMERA_BRANDS.find(b => b.id === selectedBrand);

  const onSubmit = async (data: CameraForm) => {
    setIsLoading(true);
    try {
      await saveCamera(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add camera';
      Alert.alert('Error', message);
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
        face: false,
        sensitivity: 0.7,
        notificationsEnabled: true,
        alarmEnabled: true,
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
          headerStyle: { backgroundColor: designSystem.colors.background.secondary },
          headerTintColor: designSystem.colors.text.primary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: designSystem.spacing.md }}>
              <ArrowLeft size={24} color={designSystem.colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">

          {/* Smart URL Builder Header */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.urlBuilderHeader}>
            <View style={styles.urlBuilderHeaderIcon}>
              <Wifi size={24} color={designSystem.colors.primary[500]} />
            </View>
            <View style={styles.urlBuilderHeaderText}>
              <Text style={styles.urlBuilderHeaderTitle}>Smart Camera Setup</Text>
              <Text style={styles.urlBuilderHeaderDesc}>
                Enter your camera's IP address and we'll generate the RTSP URL
              </Text>
            </View>
          </Animated.View>

          {/* Smart URL Builder */}
          {showUrlBuilder && (
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.urlBuilder}>
              <Text style={styles.urlBuilderTitle}>Smart URL Builder</Text>

              {/* Brand Selector */}
              <TouchableOpacity
                style={styles.brandSelector}
                onPress={() => setShowBrandSelector(!showBrandSelector)}
              >
                <Text style={styles.brandSelectorLabel}>Camera Brand</Text>
                <View style={styles.brandSelectorValue}>
                  <Text style={styles.brandSelectorText}>
                    {selectedBrandData?.name || 'Select Brand'}
                  </Text>
                  {showBrandSelector ? (
                    <ChevronUp size={20} color={designSystem.colors.text.secondary} />
                  ) : (
                    <ChevronDown size={20} color={designSystem.colors.text.secondary} />
                  )}
                </View>
              </TouchableOpacity>

              {showBrandSelector && (
                <View style={styles.brandDropdown}>
                  {CAMERA_BRANDS.filter(b => b.id !== 'custom').map((brand) => (
                    <TouchableOpacity
                      key={brand.id}
                      style={[
                        styles.brandDropdownItem,
                        selectedBrand === brand.id && styles.brandDropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedBrand(brand.id);
                        setShowBrandSelector(false);
                      }}
                    >
                      <Text style={[
                        styles.brandDropdownText,
                        selectedBrand === brand.id && styles.brandDropdownTextActive,
                      ]}>
                        {brand.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* IP Address Input */}
              <View style={styles.ipInputContainer}>
                <Text style={styles.ipInputLabel}>Camera IP Address</Text>
                <TextInput
                  style={styles.ipInput}
                  placeholder="192.168.1.100"
                  placeholderTextColor={designSystem.colors.text.muted}
                  value={ipAddress}
                  onChangeText={setIpAddress}
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateUrl}
              >
                <Text style={styles.generateButtonText}>Generate RTSP URL</Text>
              </TouchableOpacity>

              <Text style={styles.urlBuilderHint}>
                💡 Enter credentials below for authenticated cameras
              </Text>
            </Animated.View>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or enter manually</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Camera Name"
                  placeholder="e.g., Front Door, Backyard"
                  leftIcon={<Camera size={20} color={designSystem.colors.text.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />

            <View style={{ height: designSystem.spacing.md }} />

            <Controller
              control={control}
              name="rtspUrl"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="RTSP URL"
                  placeholder="rtsp://192.168.1.100:554/stream"
                  leftIcon={<Link2 size={20} color={designSystem.colors.text.muted} />}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.rtspUrl?.message}
                />
              )}
            />

            <View style={{ height: designSystem.spacing.md }} />

            <Text style={styles.credentialsLabel}>
              Camera Credentials (optional)
            </Text>

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Username"
                  placeholder="admin"
                  leftIcon={<User size={20} color={designSystem.colors.text.muted} />}
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <View style={{ height: designSystem.spacing.md }} />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  leftIcon={<Lock size={20} color={designSystem.colors.text.muted} />}
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </Animated.View>

          {/* Help Text */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.helpCard}>
            <Text style={styles.helpText}>
              💡 <Text style={styles.helpBold}>Tip:</Text> You can find your camera's RTSP URL in its settings or manual. Most cameras use port 554.
            </Text>
          </Animated.View>

          {/* Submit Button */}
          <Button
            style={styles.submitButton}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: designSystem.spacing.xxl,
  },
  urlBuilderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: designSystem.layout.radius.xl,
    padding: designSystem.spacing.lg,
    marginTop: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.lg,
  },
  urlBuilderHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designSystem.spacing.md,
  },
  urlBuilderHeaderText: {
    flex: 1,
  },
  urlBuilderHeaderTitle: {
    fontSize: designSystem.typography.size.base,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.xs,
  },
  urlBuilderHeaderDesc: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    lineHeight: 18,
  },
  urlBuilder: {
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: designSystem.layout.radius.xl,
    padding: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.xl,
  },
  urlBuilderTitle: {
    fontSize: designSystem.typography.size.base,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.lg,
  },
  brandSelector: {
    marginBottom: designSystem.spacing.md,
  },
  brandSelectorLabel: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginBottom: designSystem.spacing.xs,
  },
  brandSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: designSystem.colors.background.tertiary,
    borderRadius: designSystem.layout.radius.lg,
    padding: designSystem.spacing.md,
  },
  brandSelectorText: {
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.text.primary,
  },
  brandDropdown: {
    backgroundColor: designSystem.colors.background.tertiary,
    borderRadius: designSystem.layout.radius.lg,
    marginBottom: designSystem.spacing.md,
    overflow: 'hidden',
  },
  brandDropdownItem: {
    paddingVertical: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border.default,
  },
  brandDropdownItemActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  brandDropdownText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.primary,
  },
  brandDropdownTextActive: {
    color: designSystem.colors.primary[500],
    fontWeight: '600',
  },
  ipInputContainer: {
    marginBottom: designSystem.spacing.md,
  },
  ipInputLabel: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginBottom: designSystem.spacing.xs,
  },
  ipInput: {
    backgroundColor: designSystem.colors.background.tertiary,
    borderRadius: designSystem.layout.radius.lg,
    padding: designSystem.spacing.md,
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.text.primary,
  },
  generateButton: {
    backgroundColor: designSystem.colors.primary[500],
    borderRadius: designSystem.layout.radius.lg,
    padding: designSystem.spacing.md,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: designSystem.typography.size.base,
    fontWeight: '600',
    color: 'white',
  },
  urlBuilderHint: {
    fontSize: designSystem.typography.size.xs,
    color: designSystem.colors.text.muted,
    marginTop: designSystem.spacing.md,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: designSystem.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: designSystem.colors.border.default,
  },
  dividerText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.muted,
    paddingHorizontal: designSystem.spacing.md,
  },
  form: {
    marginBottom: designSystem.spacing.lg,
  },
  credentialsLabel: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginBottom: designSystem.spacing.sm,
  },
  helpCard: {
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: designSystem.layout.radius.xl,
    padding: designSystem.spacing.lg,
    marginTop: designSystem.spacing.xxl,
  },
  helpText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: '600',
    color: designSystem.colors.text.primary,
  },
  submitButton: {
    marginTop: designSystem.spacing.xxl,
    marginBottom: designSystem.spacing.xxxl,
  },
});
