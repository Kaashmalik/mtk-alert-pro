/**
 * Alarm Sounds Settings Screen
 * Configure alarm sounds, volume, vibration, and patterns
 */

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar,
    Switch,
    Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import {
    ArrowLeft,
    Volume2,
    VolumeX,
    Play,
    Pause,
    Check,
    Smartphone,
    Bell,
    AlertTriangle,
    Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSettingsStore } from '@/stores';
import { designSystem } from '@/theme/design-system';
import { hapticNotification } from '@/lib/haptics';
import { alarmService } from '@/lib/audio/alarmService';

// Sound type
type SoundId = 'alert' | 'urgent' | 'siren' | 'chime' | 'beep' | 'heavy';

// Sound Definitions
interface AlarmSound {
    id: SoundId;
    name: string;
    description: string;
    icon: typeof Bell;
    color: string;
    isHeavy?: boolean;
}

const ALARM_SOUNDS: AlarmSound[] = [
    { id: 'alert', name: 'Alert', description: 'Standard security alert', icon: Bell, color: '#3B82F6' },
    { id: 'urgent', name: 'Urgent', description: 'Fast repeating beeps', icon: AlertTriangle, color: '#F59E0B' },
    { id: 'siren', name: 'Siren', description: 'Police siren style', icon: Volume2, color: '#EF4444' },
    { id: 'chime', name: 'Chime', description: 'Gentle notification', icon: Bell, color: '#10B981' },
    { id: 'beep', name: 'Beep', description: 'Simple alert beep', icon: Bell, color: '#6366F1' },
    { id: 'heavy', name: 'Heavy Alarm', description: 'MAXIMUM VOLUME', icon: Zap, color: '#DC2626', isHeavy: true },
];

const VIBRATION_PATTERNS = [
    { id: 'default', name: 'Default', pattern: [0, 500] },
    { id: 'short', name: 'Short', pattern: [0, 200] },
    { id: 'long', name: 'Long', pattern: [0, 1000] },
    { id: 'double', name: 'Double', pattern: [0, 200, 100, 200] },
    { id: 'sos', name: 'SOS', pattern: [0, 200, 100, 200, 100, 200, 200, 500, 200, 500, 200, 500] },
];

export default function AlarmSoundsScreen() {
    const { notifications: notifSettings, setNotifications } = useSettingsStore();
    const [selectedSound, setSelectedSound] = useState<'alert' | 'urgent' | 'siren' | 'chime' | 'beep' | 'heavy'>(notifSettings.alarmSound || 'alert');
    const [volume, setVolume] = useState(notifSettings.alarmVolume || 0.8);
    const [soundEnabled, setSoundEnabled] = useState(notifSettings.sound ?? true);
    const [vibrationEnabled, setVibrationEnabled] = useState(notifSettings.vibration ?? true);
    const [repeatAlarm, setRepeatAlarm] = useState(notifSettings.repeatAlarm ?? true);
    const [repeatCount, setRepeatCount] = useState(notifSettings.repeatCount || 3);
    const [selectedVibration, setSelectedVibration] = useState('default');
    const [playingSound, setPlayingSound] = useState<string | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            alarmService.stopAlarm();
        };
    }, []);

    // Save settings when changed
    useEffect(() => {
        setNotifications({
            sound: soundEnabled,
            vibration: vibrationEnabled,
            alarmSound: selectedSound,
            alarmVolume: volume,
            repeatAlarm,
            repeatCount,
        });
    }, [selectedSound, volume, soundEnabled, vibrationEnabled, repeatAlarm, repeatCount]);

    const playPreviewSound = async (soundId: string) => {
        hapticNotification();

        // If already playing this sound, stop it
        if (playingSound === soundId) {
            await alarmService.stopAlarm();
            setPlayingSound(null);
            return;
        }

        // Stop any currently playing sound
        await alarmService.stopAlarm();
        setPlayingSound(soundId);

        try {
            // Use alarmService to preview the sound
            await alarmService.previewSound(soundId as any, volume);

            console.log('[AlarmSounds] Playing sound:', soundId);

            // Auto-clear playing state after a delay (sounds are typically 2-3 seconds)
            setTimeout(() => {
                setPlayingSound(null);
            }, 3000);
        } catch (error) {
            console.error('[AlarmSounds] Sound playback error:', error);
            setPlayingSound(null);
        }
    };

    const previewVibration = (pattern: number[]) => {
        hapticNotification();
        Vibration.vibrate(pattern);
    };

    const SoundCard = ({ sound }: { sound: AlarmSound }) => {
        const isSelected = selectedSound === sound.id;
        const isPlaying = playingSound === sound.id;
        const IconComponent = sound.icon;

        return (
            <TouchableOpacity
                style={[
                    styles.soundCard,
                    isSelected && styles.soundCardSelected,
                    sound.isHeavy && styles.soundCardHeavy,
                ]}
                onPress={() => setSelectedSound(sound.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.soundIcon, { backgroundColor: sound.color + '20' }]}>
                    <IconComponent size={24} color={sound.color} />
                </View>

                <View style={styles.soundInfo}>
                    <Text style={[styles.soundName, sound.isHeavy && styles.soundNameHeavy]}>
                        {sound.name}
                    </Text>
                    <Text style={styles.soundDescription}>{sound.description}</Text>
                </View>

                <View style={styles.soundActions}>
                    <TouchableOpacity
                        style={[styles.previewButton, isPlaying && styles.previewButtonActive]}
                        onPress={(e) => {
                            e.stopPropagation();
                            playPreviewSound(sound.id);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {isPlaying ? (
                            <Pause size={18} color={sound.color} />
                        ) : (
                            <Play size={18} color={sound.color} />
                        )}
                    </TouchableOpacity>

                    {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: sound.color }]}>
                            <Check size={14} color="white" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Alarm Sounds',
                    headerStyle: { backgroundColor: designSystem.colors.background.secondary },
                    headerTintColor: designSystem.colors.text.primary,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                            <ArrowLeft size={24} color={designSystem.colors.text.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <SafeAreaView style={styles.container} edges={['bottom']}>
                <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                    {/* Master Toggles */}
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Master Controls</Text>

                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Volume2 size={22} color={designSystem.colors.primary[500]} />
                                <Text style={styles.toggleLabel}>Sound Enabled</Text>
                            </View>
                            <Switch
                                value={soundEnabled}
                                onValueChange={setSoundEnabled}
                                trackColor={{ false: designSystem.colors.background.tertiary, true: designSystem.colors.primary[500] }}
                                thumbColor="white"
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Smartphone size={22} color={designSystem.colors.status.warning} />
                                <Text style={styles.toggleLabel}>Vibration Enabled</Text>
                            </View>
                            <Switch
                                value={vibrationEnabled}
                                onValueChange={setVibrationEnabled}
                                trackColor={{ false: designSystem.colors.background.tertiary, true: designSystem.colors.status.warning }}
                                thumbColor="white"
                            />
                        </View>
                    </Animated.View>

                    {/* Volume Selection */}
                    {soundEnabled && (
                        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.section}>
                            <Text style={styles.sectionTitle}>Volume Level</Text>
                            <View style={styles.volumeGrid}>
                                {[25, 50, 75, 100].map((v) => (
                                    <TouchableOpacity
                                        key={v}
                                        style={[
                                            styles.volumeButton,
                                            Math.round(volume * 100) === v && styles.volumeButtonActive
                                        ]}
                                        onPress={() => setVolume(v / 100)}
                                    >
                                        <Text style={[
                                            styles.volumeButtonText,
                                            Math.round(volume * 100) === v && styles.volumeButtonTextActive
                                        ]}>
                                            {v}%
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Sound Selection */}
                    {soundEnabled && (
                        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Alarm Sound</Text>
                            {ALARM_SOUNDS.map((sound) => (
                                <SoundCard key={sound.id} sound={sound} />
                            ))}
                        </Animated.View>
                    )}

                    {/* Repeat Settings */}
                    {soundEnabled && (
                        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
                            <Text style={styles.sectionTitle}>Repeat Settings</Text>

                            <View style={styles.toggleRow}>
                                <View style={styles.toggleInfo}>
                                    <Text style={styles.toggleLabel}>Repeat Alarm</Text>
                                </View>
                                <Switch
                                    value={repeatAlarm}
                                    onValueChange={setRepeatAlarm}
                                    trackColor={{ false: designSystem.colors.background.tertiary, true: designSystem.colors.primary[500] }}
                                    thumbColor="white"
                                />
                            </View>

                            {repeatAlarm && (
                                <View style={styles.repeatCountContainer}>
                                    <Text style={styles.repeatLabel}>Repeat Count:</Text>
                                    <View style={styles.repeatButtons}>
                                        {[1, 2, 3, 5, 10].map((count) => (
                                            <TouchableOpacity
                                                key={count}
                                                style={[
                                                    styles.repeatButton,
                                                    repeatCount === count && styles.repeatButtonActive
                                                ]}
                                                onPress={() => setRepeatCount(count)}
                                            >
                                                <Text style={[
                                                    styles.repeatButtonText,
                                                    repeatCount === count && styles.repeatButtonTextActive
                                                ]}>
                                                    {count}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {/* Vibration Patterns */}
                    {vibrationEnabled && (
                        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
                            <Text style={styles.sectionTitle}>Vibration Pattern</Text>
                            <View style={styles.vibrationGrid}>
                                {VIBRATION_PATTERNS.map((pattern) => (
                                    <TouchableOpacity
                                        key={pattern.id}
                                        style={[
                                            styles.vibrationCard,
                                            selectedVibration === pattern.id && styles.vibrationCardActive
                                        ]}
                                        onPress={() => {
                                            setSelectedVibration(pattern.id);
                                            previewVibration(pattern.pattern);
                                        }}
                                    >
                                        <Text style={[
                                            styles.vibrationName,
                                            selectedVibration === pattern.id && styles.vibrationNameActive
                                        ]}>
                                            {pattern.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    <View style={{ height: 50 }} />
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
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: designSystem.colors.text.secondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: designSystem.colors.background.secondary,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        fontSize: 16,
        color: designSystem.colors.text.primary,
    },
    volumeGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    volumeButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: designSystem.colors.background.secondary,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    volumeButtonActive: {
        backgroundColor: designSystem.colors.primary[500] + '20',
        borderColor: designSystem.colors.primary[500],
    },
    volumeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: designSystem.colors.text.secondary,
    },
    volumeButtonTextActive: {
        color: designSystem.colors.primary[500],
    },
    soundCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: designSystem.colors.background.secondary,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    soundCardSelected: {
        borderColor: designSystem.colors.primary[500],
        backgroundColor: designSystem.colors.primary[500] + '10',
    },
    soundCardHeavy: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
    },
    soundIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    soundInfo: {
        flex: 1,
        marginLeft: 12,
    },
    soundName: {
        fontSize: 16,
        fontWeight: '600',
        color: designSystem.colors.text.primary,
    },
    soundNameHeavy: {
        color: '#DC2626',
    },
    soundDescription: {
        fontSize: 13,
        color: designSystem.colors.text.secondary,
    },
    soundActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    previewButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: designSystem.colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewButtonActive: {
        backgroundColor: designSystem.colors.primary[500] + '30',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    repeatCountContainer: {
        backgroundColor: designSystem.colors.background.secondary,
        padding: 16,
        borderRadius: 12,
    },
    repeatLabel: {
        fontSize: 14,
        color: designSystem.colors.text.secondary,
        marginBottom: 12,
    },
    repeatButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    repeatButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: designSystem.colors.background.tertiary,
        borderRadius: 8,
    },
    repeatButtonActive: {
        backgroundColor: designSystem.colors.primary[500],
    },
    repeatButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: designSystem.colors.text.secondary,
    },
    repeatButtonTextActive: {
        color: 'white',
    },
    vibrationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    vibrationCard: {
        width: '31%',
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: designSystem.colors.background.secondary,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    vibrationCardActive: {
        borderColor: designSystem.colors.status.warning,
        backgroundColor: designSystem.colors.status.warning + '10',
    },
    vibrationName: {
        fontSize: 13,
        fontWeight: '600',
        color: designSystem.colors.text.secondary,
    },
    vibrationNameActive: {
        color: designSystem.colors.status.warning,
    },
});
