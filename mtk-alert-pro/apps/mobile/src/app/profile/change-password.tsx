/**
 * Change Password Screen
 * Secure password change with validation
 * 
 * @module app/profile/change-password
 */

import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import {
    ArrowLeft,
    Lock,
    Eye,
    EyeOff,
    Shield,
    Check,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { profileService } from '@/lib/profile/profileService';
import { designSystem } from '@/theme/design-system';
import { hapticNotification } from '@/lib/haptics';

export default function ChangePasswordScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Password strength checks
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*]/.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

    const isValidPassword = hasMinLength && hasUppercase && hasLowercase && hasNumber;

    const handleChangePassword = async () => {
        if (!currentPassword) {
            Alert.alert('Error', 'Please enter your current password');
            return;
        }

        if (!isValidPassword) {
            Alert.alert('Error', 'New password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        hapticNotification();
        setIsLoading(true);

        try {
            const result = await profileService.changePassword({
                currentPassword,
                newPassword,
            });

            if (result.success) {
                Alert.alert('Success', 'Password changed successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', result.error || 'Failed to change password');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
        <View style={styles.requirement}>
            <View style={[styles.requirementDot, met && styles.requirementDotMet]}>
                {met && <Check size={10} color="white" />}
            </View>
            <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
                {text}
            </Text>
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Change Password',
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
                    {/* Security Icon */}
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.iconSection}>
                        <View style={styles.iconContainer}>
                            <Shield size={48} color={designSystem.colors.primary[500]} />
                        </View>
                        <Text style={styles.title}>Update Your Password</Text>
                        <Text style={styles.subtitle}>
                            Choose a strong password to protect your account
                        </Text>
                    </Animated.View>

                    {/* Form Fields */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.formSection}>
                        {/* Current Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Current Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock size={20} color={designSystem.colors.text.muted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Enter current password"
                                    placeholderTextColor={designSystem.colors.text.muted}
                                    secureTextEntry={!showCurrent}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                                    {showCurrent ? (
                                        <EyeOff size={20} color={designSystem.colors.text.muted} />
                                    ) : (
                                        <Eye size={20} color={designSystem.colors.text.muted} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* New Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock size={20} color={designSystem.colors.text.muted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password"
                                    placeholderTextColor={designSystem.colors.text.muted}
                                    secureTextEntry={!showNew}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                                    {showNew ? (
                                        <EyeOff size={20} color={designSystem.colors.text.muted} />
                                    ) : (
                                        <Eye size={20} color={designSystem.colors.text.muted} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Requirements */}
                        <View style={styles.requirements}>
                            <PasswordRequirement met={hasMinLength} text="At least 8 characters" />
                            <PasswordRequirement met={hasUppercase} text="One uppercase letter" />
                            <PasswordRequirement met={hasLowercase} text="One lowercase letter" />
                            <PasswordRequirement met={hasNumber} text="One number" />
                            <PasswordRequirement met={hasSpecial} text="One special character (!@#$%^&*)" />
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <View style={[
                                styles.inputContainer,
                                confirmPassword.length > 0 && (passwordsMatch ? styles.inputSuccess : styles.inputError)
                            ]}>
                                <Lock size={20} color={designSystem.colors.text.muted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={designSystem.colors.text.muted}
                                    secureTextEntry={!showConfirm}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                    {showConfirm ? (
                                        <EyeOff size={20} color={designSystem.colors.text.muted} />
                                    ) : (
                                        <Eye size={20} color={designSystem.colors.text.muted} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <Text style={styles.errorText}>Passwords do not match</Text>
                            )}
                        </View>
                    </Animated.View>

                    {/* Save Button */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.buttonSection}>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                (!isValidPassword || !passwordsMatch || !currentPassword) && styles.saveButtonDisabled
                            ]}
                            onPress={handleChangePassword}
                            disabled={!isValidPassword || !passwordsMatch || !currentPassword || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>Change Password</Text>
                            )}
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
    content: {
        padding: designSystem.spacing.xxl,
    },
    iconSection: {
        alignItems: 'center',
        marginBottom: designSystem.spacing.xxl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: designSystem.colors.primary[500] + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: designSystem.spacing.lg,
    },
    title: {
        fontSize: designSystem.typography.size.xl,
        fontWeight: '700',
        color: designSystem.colors.text.primary,
        marginBottom: designSystem.spacing.sm,
    },
    subtitle: {
        fontSize: designSystem.typography.size.sm,
        color: designSystem.colors.text.secondary,
        textAlign: 'center',
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
    inputSuccess: {
        borderColor: designSystem.colors.status.success,
    },
    inputError: {
        borderColor: designSystem.colors.status.danger,
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
    requirements: {
        backgroundColor: designSystem.colors.background.secondary,
        padding: designSystem.spacing.md,
        borderRadius: designSystem.layout.radius.lg,
        marginBottom: designSystem.spacing.lg,
    },
    requirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: designSystem.spacing.xs,
    },
    requirementDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: designSystem.colors.text.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: designSystem.spacing.sm,
    },
    requirementDotMet: {
        backgroundColor: designSystem.colors.status.success,
    },
    requirementText: {
        fontSize: designSystem.typography.size.sm,
        color: designSystem.colors.text.muted,
    },
    requirementTextMet: {
        color: designSystem.colors.status.success,
    },
    errorText: {
        marginTop: designSystem.spacing.xs,
        fontSize: designSystem.typography.size.xs,
        color: designSystem.colors.status.danger,
    },
    buttonSection: {
        marginBottom: designSystem.spacing.xxl,
    },
    saveButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: designSystem.colors.primary[500],
        paddingVertical: designSystem.spacing.lg,
        borderRadius: designSystem.layout.radius.xl,
    },
    saveButtonDisabled: {
        backgroundColor: designSystem.colors.text.muted,
    },
    saveButtonText: {
        fontSize: designSystem.typography.size.base,
        fontWeight: '600',
        color: 'white',
    },
});
