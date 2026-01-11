/**
 * Edit Profile Screen
 * Full profile editing with CRUD operations
 * 
 * @module app/profile/edit
 */

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
    ArrowLeft,
    Camera,
    User,
    Mail,
    Phone,
    Save,
    Trash2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/stores';
import { profileService, UserProfile } from '@/lib/profile/profileService';
import { designSystem } from '@/theme/design-system';
import { hapticNotification } from '@/lib/haptics';

export default function EditProfileScreen() {
    const { user, refreshUser } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        const data = await profileService.getProfile();
        if (data) {
            setProfile(data);
            setDisplayName(data.displayName || '');
            setPhone(data.phone || '');
            setAvatarUri(data.avatarUrl || null);
        }
        setIsLoading(false);
    };

    const handlePickImage = async () => {
        hapticNotification();

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant access to your photo library');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
            setHasChanges(true);
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('Error', 'Display name is required');
            return;
        }

        hapticNotification();
        setIsSaving(true);

        try {
            // Upload avatar if changed
            let newAvatarUrl = profile?.avatarUrl;
            if (avatarUri && avatarUri !== profile?.avatarUrl) {
                newAvatarUrl = await profileService.uploadAvatar(avatarUri) || undefined;
            }

            // Update profile
            const success = await profileService.updateProfile({
                displayName: displayName.trim(),
                phone: phone.trim() || undefined,
                avatarUrl: newAvatarUrl,
            });

            if (success) {
                Alert.alert('Success', 'Profile updated successfully', [
                    {
                        text: 'OK', onPress: () => {
                            refreshUser?.();
                            router.back();
                        }
                    }
                ]);
            } else {
                Alert.alert('Error', 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Delete Account',
            'This action cannot be undone. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await profileService.deleteAccount();
                        if (success) {
                            router.replace('/(auth)/login');
                        } else {
                            Alert.alert('Error', 'Failed to delete account');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={designSystem.colors.primary[500]} />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Edit Profile',
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

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar Section */}
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.avatarSection}>
                        <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {displayName?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.cameraButton}>
                                <Camera size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Tap to change photo</Text>
                    </Animated.View>

                    {/* Form Fields */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.formSection}>
                        {/* Display Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Display Name</Text>
                            <View style={styles.inputContainer}>
                                <User size={20} color={designSystem.colors.text.muted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={displayName}
                                    onChangeText={(text) => {
                                        setDisplayName(text);
                                        setHasChanges(true);
                                    }}
                                    placeholder="Your name"
                                    placeholderTextColor={designSystem.colors.text.muted}
                                />
                            </View>
                        </View>

                        {/* Email (Read-only) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={[styles.inputContainer, styles.inputDisabled]}>
                                <Mail size={20} color={designSystem.colors.text.muted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.inputTextDisabled]}
                                    value={user?.email || ''}
                                    editable={false}
                                />
                            </View>
                            <Text style={styles.inputHint}>Email cannot be changed</Text>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                            <View style={styles.inputContainer}>
                                <Phone size={20} color={designSystem.colors.text.muted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={(text) => {
                                        setPhone(text);
                                        setHasChanges(true);
                                    }}
                                    placeholder="+1 234 567 8900"
                                    placeholderTextColor={designSystem.colors.text.muted}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Save Button */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.buttonSection}>
                        <TouchableOpacity
                            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!hasChanges || isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Save size={20} color="white" />
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Delete Account */}
                    <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.dangerZone}>
                        <Text style={styles.dangerTitle}>Danger Zone</Text>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                            <Trash2 size={18} color={designSystem.colors.status.danger} />
                            <Text style={styles.deleteButtonText}>Delete Account</Text>
                        </TouchableOpacity>
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
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: designSystem.spacing.xxl,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: designSystem.spacing.xxl,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: designSystem.colors.primary[500],
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: designSystem.colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 48,
        fontWeight: '700',
        color: 'white',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: designSystem.colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: designSystem.colors.background.primary,
    },
    avatarHint: {
        marginTop: designSystem.spacing.sm,
        fontSize: designSystem.typography.size.sm,
        color: designSystem.colors.text.muted,
    },
    formSection: {
        marginBottom: designSystem.spacing.xl,
    },
    inputGroup: {
        marginBottom: designSystem.spacing.lg,
    },
    inputLabel: {
        fontSize: designSystem.typography.size.sm,
        fontWeight: '600',
        color: designSystem.colors.text.secondary,
        marginBottom: designSystem.spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: designSystem.colors.background.secondary,
        borderRadius: designSystem.layout.radius.lg,
        paddingHorizontal: designSystem.spacing.md,
        borderWidth: 1,
        borderColor: designSystem.colors.border.default,
    },
    inputDisabled: {
        backgroundColor: designSystem.colors.background.tertiary,
    },
    inputIcon: {
        marginRight: designSystem.spacing.sm,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: designSystem.typography.size.base,
        color: designSystem.colors.text.primary,
    },
    inputTextDisabled: {
        color: designSystem.colors.text.muted,
    },
    inputHint: {
        marginTop: designSystem.spacing.xs,
        fontSize: designSystem.typography.size.xs,
        color: designSystem.colors.text.muted,
    },
    buttonSection: {
        marginBottom: designSystem.spacing.xxl,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: designSystem.colors.primary[500],
        paddingVertical: designSystem.spacing.lg,
        borderRadius: designSystem.layout.radius.xl,
        gap: designSystem.spacing.sm,
    },
    saveButtonDisabled: {
        backgroundColor: designSystem.colors.text.muted,
    },
    saveButtonText: {
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
        color: 'white',
    },
    dangerZone: {
        borderTopWidth: 1,
        borderTopColor: designSystem.colors.border.default,
        paddingTop: designSystem.spacing.xl,
    },
    dangerTitle: {
        fontSize: designSystem.typography.size.sm,
        fontWeight: '600',
        color: designSystem.colors.status.danger,
        marginBottom: designSystem.spacing.md,
        textTransform: 'uppercase',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: designSystem.spacing.md,
        borderRadius: designSystem.layout.radius.lg,
        gap: designSystem.spacing.sm,
    },
    deleteButtonText: {
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
        color: designSystem.colors.status.danger,
    },
});
