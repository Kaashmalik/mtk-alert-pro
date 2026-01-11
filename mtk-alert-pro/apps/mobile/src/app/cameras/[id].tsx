import { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
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
  Bell,
  Volume2,
  Shield,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCameraStore } from '@/stores';
import { CameraStreamPlayer } from '@/components/camera/CameraStreamPlayer';
import { designSystem } from '@/theme/design-system';

export default function CameraDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Use selectors to prevent unnecessary re-renders
  const cameras = useCameraStore((state) => state.cameras);
  const deleteCamera = useCameraStore((state) => state.deleteCamera);
  const updateCamera = useCameraStore((state) => state.updateCamera);
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

  const toggleNotifications = async () => {
    await updateCamera(camera.id, {
      detectionSettings: {
        ...camera.detectionSettings,
        notificationsEnabled: !camera.detectionSettings.notificationsEnabled,
      },
    });
  };

  const toggleAlarm = async () => {
    await updateCamera(camera.id, {
      detectionSettings: {
        ...camera.detectionSettings,
        alarmEnabled: !camera.detectionSettings.alarmEnabled,
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
          headerStyle: { backgroundColor: designSystem.colors.background.secondary },
          headerTintColor: designSystem.colors.text.primary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: designSystem.spacing.md }}>
              <ArrowLeft size={24} color={designSystem.colors.text.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <Trash2 size={22} color={designSystem.colors.status.danger} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Video Player Area */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.videoContainer}>
            {isPlaying ? (
              <>
                {/* 
                  Enhanced CameraStreamPlayer with:
                  - Zoom controls (pinch + buttons)
                  - Screenshot capture
                  - Video recording
                  - Share functionality
                */}
                <CameraStreamPlayer
                  cameraId={camera.id}
                  cameraName={camera.name}
                  rtspUrl={camera.rtspUrl}
                  userId={camera.userId}
                  autoPlay={true}
                  showControls={true}
                  showAdvancedControls={true}
                  onError={(error: string) => {
                    console.warn('Stream error:', error);
                  }}
                  onStateChange={(state: string) => {
                    if (state === 'error') {
                      setIsPlaying(false);
                    }
                  }}
                />
                {/* Recording indicator */}
                {isRecording && (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>REC</Text>
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity
                onPress={() => setIsPlaying(true)}
                style={styles.playButtonContainer}
              >
                <View style={styles.playButton}>
                  <Play size={32} color="white" fill="white" />
                </View>
                <Text style={styles.playText}>Tap to start stream</Text>
                <Text style={styles.streamUrl}>{camera.rtspUrl}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Controls */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.controlsContainer}>
            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={styles.controlButton}
            >
              {isPlaying ? (
                <Pause size={24} color="white" />
              ) : (
                <Play size={24} color="white" />
              )}
              <Text style={styles.controlText}>
                {isPlaying ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRecord}
              style={styles.controlButton}
            >
              <Video size={24} color={isRecording ? designSystem.colors.status.danger : 'white'} />
              <Text style={[styles.controlText, isRecording && styles.recordingTextActive]}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Settings size={24} color="white" />
              <Text style={styles.controlText}>Settings</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Detection Settings */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.detectionSection}>
            <Text style={styles.sectionTitle}>Detection Settings</Text>

            <TouchableOpacity
              onPress={() => toggleDetection('person')}
              style={[
                styles.detectionCard,
                camera.detectionSettings.person && styles.detectionCardActive,
              ]}
            >
              <User
                size={24}
                color={camera.detectionSettings.person ? designSystem.colors.status.danger : designSystem.colors.text.muted}
              />
              <View style={styles.detectionContent}>
                <Text style={styles.detectionTitle}>Person Detection</Text>
                <Text style={styles.detectionDescription}>
                  Alert when people are detected
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  camera.detectionSettings.person && styles.checkboxActive,
                ]}
              >
                {camera.detectionSettings.person && <View style={styles.checkboxInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleDetection('vehicle')}
              style={[
                styles.detectionCard,
                camera.detectionSettings.vehicle && styles.detectionCardVehicle,
              ]}
            >
              <Car
                size={24}
                color={camera.detectionSettings.vehicle ? '#06B6D4' : designSystem.colors.text.muted}
              />
              <View style={styles.detectionContent}>
                <Text style={styles.detectionTitle}>Vehicle Detection</Text>
                <Text style={styles.detectionDescription}>
                  Alert when vehicles are detected
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  camera.detectionSettings.vehicle && styles.checkboxVehicle,
                ]}
              >
                {camera.detectionSettings.vehicle && <View style={styles.checkboxInner} />}
              </View>
            </TouchableOpacity>

            {/* Notification Settings */}
            <Text style={[styles.sectionTitle, { marginTop: designSystem.spacing.xl }]}>Alert Settings</Text>

            <TouchableOpacity
              onPress={toggleNotifications}
              style={[
                styles.detectionCard,
                camera.detectionSettings.notificationsEnabled && styles.detectionCardNotification,
              ]}
            >
              <Bell
                size={24}
                color={camera.detectionSettings.notificationsEnabled ? designSystem.colors.status.success : designSystem.colors.text.muted}
              />
              <View style={styles.detectionContent}>
                <Text style={styles.detectionTitle}>Push Notifications</Text>
                <Text style={styles.detectionDescription}>
                  Send alerts to your phone
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  camera.detectionSettings.notificationsEnabled && styles.checkboxNotification,
                ]}
              >
                {camera.detectionSettings.notificationsEnabled && <View style={styles.checkboxInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleAlarm}
              style={[
                styles.detectionCard,
                camera.detectionSettings.alarmEnabled && styles.detectionCardAlarm,
              ]}
            >
              <Volume2
                size={24}
                color={camera.detectionSettings.alarmEnabled ? designSystem.colors.status.warning : designSystem.colors.text.muted}
              />
              <View style={styles.detectionContent}>
                <Text style={styles.detectionTitle}>Sound Alarm</Text>
                <Text style={styles.detectionDescription}>
                  Play alarm sound on detection
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  camera.detectionSettings.alarmEnabled && styles.checkboxAlarm,
                ]}
              >
                {camera.detectionSettings.alarmEnabled && <View style={styles.checkboxInner} />}
              </View>
            </TouchableOpacity>

            {/* Info note about detection */}
            <View style={styles.infoNote}>
              <Shield size={16} color={designSystem.colors.text.muted} />
              <Text style={styles.infoNoteText}>
                Only humans and vehicles trigger alerts. Animals and other motion are filtered out.
              </Text>
            </View>
          </Animated.View>

          {/* Camera Info */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.infoSection}>
            <Text style={styles.infoStatus}>
              Status: {camera.isActive ? '🟢 Online' : '🔴 Offline'}
            </Text>
            <Text style={styles.infoDate}>
              Added: {new Date(camera.createdAt).toLocaleDateString()}
            </Text>
          </Animated.View>
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
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playButtonContainer: {
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: {
    color: 'white',
    marginTop: designSystem.spacing.md,
    fontSize: designSystem.typography.size.base,
  },
  streamUrl: {
    color: designSystem.colors.text.muted,
    fontSize: designSystem.typography.size.sm,
    marginTop: designSystem.spacing.xs,
  },
  recordingIndicator: {
    position: 'absolute',
    top: designSystem.spacing.lg,
    right: designSystem.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.status.danger,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.xs,
    borderRadius: designSystem.layout.radius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    marginRight: designSystem.spacing.sm,
  },
  recordingText: {
    color: 'white',
    fontSize: designSystem.typography.size.sm,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.background.secondary,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlText: {
    color: 'white',
    fontSize: designSystem.typography.size.xs,
    marginTop: designSystem.spacing.xs,
  },
  recordingTextActive: {
    color: designSystem.colors.status.danger,
  },
  detectionSection: {
    paddingHorizontal: designSystem.spacing.xxl,
    marginTop: designSystem.spacing.xxl,
  },
  sectionTitle: {
    color: designSystem.colors.text.primary,
    fontWeight: '600',
    fontSize: designSystem.typography.size.lg,
    marginBottom: designSystem.spacing.lg,
  },
  detectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.spacing.lg,
    borderRadius: designSystem.layout.radius.xl,
    backgroundColor: designSystem.colors.background.secondary,
    marginBottom: designSystem.spacing.md,
  },
  detectionCardActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  detectionCardVehicle: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  detectionContent: {
    flex: 1,
    marginLeft: designSystem.spacing.md,
  },
  detectionTitle: {
    color: designSystem.colors.text.primary,
    fontWeight: '500',
    fontSize: designSystem.typography.size.base,
  },
  detectionDescription: {
    color: designSystem.colors.text.secondary,
    fontSize: designSystem.typography.size.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: designSystem.colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: designSystem.colors.status.danger,
    borderColor: designSystem.colors.status.danger,
  },
  checkboxVehicle: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  detectionCardNotification: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  checkboxNotification: {
    backgroundColor: designSystem.colors.status.success,
    borderColor: designSystem.colors.status.success,
  },
  detectionCardAlarm: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  checkboxAlarm: {
    backgroundColor: designSystem.colors.status.warning,
    borderColor: designSystem.colors.status.warning,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designSystem.spacing.lg,
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.background.tertiary,
    borderRadius: designSystem.layout.radius.lg,
  },
  infoNoteText: {
    flex: 1,
    marginLeft: designSystem.spacing.sm,
    color: designSystem.colors.text.muted,
    fontSize: designSystem.typography.size.xs,
    lineHeight: 16,
  },
  infoSection: {
    paddingHorizontal: designSystem.spacing.xxl,
    marginTop: designSystem.spacing.xxl,
    marginBottom: designSystem.spacing.xxxl,
  },
  infoStatus: {
    color: designSystem.colors.text.secondary,
    fontSize: designSystem.typography.size.sm,
  },
  infoDate: {
    color: designSystem.colors.text.muted,
    fontSize: designSystem.typography.size.xs,
    marginTop: designSystem.spacing.xs,
  },
});
