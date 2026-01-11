/**
 * Login Screen
 * 
 * Beautiful login experience with biometric support and animations
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Mail, Lock, Fingerprint, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { designSystem } from '@/theme/design-system';
import {
  isBiometricEnabled,
  authenticateWithBiometric,
  checkBiometricCapability,
} from '@/lib/biometric';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const initialize = useAuthStore((state) => state.initialize);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if biometric login is available
  useEffect(() => {
    let mounted = true;

    const checkBiometric = async () => {
      try {
        const enabled = await isBiometricEnabled();
        const capability = await checkBiometricCapability();
        const available = enabled && capability.enrolled;

        if (mounted) {
          setBiometricAvailable(available);

          // Auto-prompt biometric on mount if available
          if (available) {
            setTimeout(() => {
              if (mounted) handleBiometricLogin();
            }, 500);
          }
        }
      } catch (err) {
        console.warn('Biometric check error:', err);
      }
    };

    checkBiometric();
    return () => { mounted = false; };
  }, []);

  const handleBiometricLogin = async () => {
    if (biometricLoading) return;

    setBiometricLoading(true);
    setError(null);

    try {
      const result = await authenticateWithBiometric('Sign in to MTK AlertPro');

      if (result.success) {
        await initialize();
        const { isAuthenticated } = useAuthStore.getState();

        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          setError('Session expired. Please sign in with email.');
          setBiometricAvailable(false);
        }
      } else if (result.error) {
        if (!result.error.toLowerCase().includes('cancel') &&
          !result.error.toLowerCase().includes('user fallback')) {
          setError(result.error);
        }
      }
    } catch (err: any) {
      console.error('Biometric login error:', err);
      setError('Biometric login failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await signInWithEmail(data.email, data.password);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Hero Section */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(800)}
              style={styles.heroSection}
            >
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[designSystem.colors.primary[500], designSystem.colors.primary[700]]}
                  style={styles.logoGradient}
                >
                  <Shield size={40} color="white" />
                </LinearGradient>
              </View>

              <Text style={styles.appName}>MTK AlertPro</Text>
              <Text style={styles.tagline}>AI-Powered Security Monitoring</Text>
            </Animated.View>

            {/* Login Form */}
            <Animated.View
              entering={FadeInUp.delay(300).springify()}
              style={styles.formContainer}
            >
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to continue monitoring</Text>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email Address"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      leftIcon={<Mail size={20} color={designSystem.colors.text.muted} />}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor={designSystem.colors.text.muted}
                      error={errors.email?.message}
                    />
                  )}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Password"
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      leftIcon={<Lock size={20} color={designSystem.colors.text.muted} />}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor={designSystem.colors.text.muted}
                      error={errors.password?.message}
                    />
                  )}
                />
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[designSystem.colors.primary[500], designSystem.colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <ArrowRight size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Biometric Login */}
              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={biometricLoading}
                  activeOpacity={0.8}
                >
                  {biometricLoading ? (
                    <ActivityIndicator color={designSystem.colors.primary[500]} />
                  ) : (
                    <>
                      <Fingerprint size={24} color={designSystem.colors.primary[500]} />
                      <Text style={styles.biometricText}>Sign in with Biometrics</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Link */}
              <Button
                variant="outline"
                style={styles.registerButton}
                onPress={() => router.push('/(auth)/register')}
              >
                Create New Account
              </Button>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By signing in, you agree to our{' '}
                <Text style={styles.footerLink}>Terms of Service</Text>
              </Text>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: designSystem.spacing.xxxl,
    paddingBottom: designSystem.spacing.xxl,
  },
  logoContainer: {
    marginBottom: designSystem.spacing.lg,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...designSystem.shadows.lg,
  },
  appName: {
    fontSize: designSystem.typography.size.display,
    fontFamily: designSystem.typography.fontFamily.bold,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.xs,
  },
  tagline: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
  },
  formContainer: {
    paddingHorizontal: designSystem.spacing.xl,
  },
  formTitle: {
    fontSize: designSystem.typography.size.xxl,
    fontFamily: designSystem.typography.fontFamily.bold,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.xs,
  },
  formSubtitle: {
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.text.secondary,
    marginBottom: designSystem.spacing.xl,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: designSystem.spacing.lg,
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.layout.radius.lg,
    marginBottom: designSystem.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: designSystem.colors.status.danger,
  },
  errorText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.status.danger,
  },
  inputGroup: {
    marginBottom: designSystem.spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: designSystem.spacing.xl,
  },
  forgotPasswordText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.primary[500],
    fontFamily: designSystem.typography.fontFamily.medium,
  },
  loginButton: {
    borderRadius: designSystem.layout.radius.xl,
    overflow: 'hidden',
    ...designSystem.shadows.md,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designSystem.spacing.lg,
    gap: designSystem.spacing.sm,
  },
  loginButtonText: {
    fontSize: designSystem.typography.size.base,
    fontFamily: designSystem.typography.fontFamily.semibold,
    color: 'white',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designSystem.spacing.lg,
    marginTop: designSystem.spacing.lg,
    borderWidth: 1,
    borderColor: designSystem.colors.border.default,
    borderRadius: designSystem.layout.radius.xl,
    backgroundColor: designSystem.colors.background.secondary,
    gap: designSystem.spacing.sm,
  },
  biometricText: {
    fontSize: designSystem.typography.size.base,
    fontFamily: designSystem.typography.fontFamily.medium,
    color: designSystem.colors.text.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: designSystem.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: designSystem.colors.border.default,
  },
  dividerText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.muted,
    marginHorizontal: designSystem.spacing.lg,
  },
  registerButton: {
    borderColor: designSystem.colors.primary[500],
    borderWidth: 1,
  },
  footer: {
    paddingHorizontal: designSystem.spacing.xl,
    paddingVertical: designSystem.spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.muted,
    textAlign: 'center',
  },
  footerLink: {
    color: designSystem.colors.primary[500],
  },
});
