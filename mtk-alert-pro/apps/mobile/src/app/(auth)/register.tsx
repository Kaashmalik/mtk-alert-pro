import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { designSystem } from '@/theme/design-system';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    if (isSubmitting) return; // Prevent double submission

    setError(null);
    setIsSubmitting(true);

    try {
      await signUpWithEmail(data.email, data.password, data.name);

      // Show success and navigate to login
      Alert.alert(
        'Account Created! 🎉',
        'Please check your email to verify your account before signing in.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              router.replace('/(auth)/login');
            }
          }
        ],
        { cancelable: false }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);

      // Show specific error messages
      if (message.includes('already registered')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Please sign in instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.replace('/(auth)/login') }
          ]
        );
      } else {
        Alert.alert('Registration Failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={designSystem.colors.text.primary} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={styles.logoSection}
          >
            <View style={styles.logoContainer}>
              <Shield size={36} color="white" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join MTK AlertPro today</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.form}
          >
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your name"
                  autoCapitalize="words"
                  leftIcon={<User size={20} color={designSystem.colors.text.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />

            <View style={styles.inputSpacer} />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={20} color={designSystem.colors.text.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <View style={styles.inputSpacer} />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create a password"
                  secureTextEntry
                  leftIcon={<Lock size={20} color={designSystem.colors.text.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <View style={styles.inputSpacer} />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  secureTextEntry
                  leftIcon={<Lock size={20} color={designSystem.colors.text.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />
          </Animated.View>

          {error && (
            <Animated.View
              entering={FadeInDown}
              style={styles.errorContainer}
            >
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Button
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Account
          </Button>

          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background.primary,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: designSystem.spacing.lg,
    zIndex: 10,
    padding: designSystem.spacing.sm,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: designSystem.spacing.xxl,
    paddingVertical: designSystem.spacing.xxxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: designSystem.spacing.xxl,
  },
  logoContainer: {
    width: 72,
    height: 72,
    backgroundColor: designSystem.colors.primary[500],
    borderRadius: designSystem.layout.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.lg,
    ...designSystem.shadows.glow.primary,
  },
  title: {
    fontSize: designSystem.typography.size.xxl,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.xs,
  },
  subtitle: {
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.text.secondary,
  },
  form: {
    marginBottom: designSystem.spacing.lg,
  },
  inputSpacer: {
    height: designSystem.spacing.md,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: designSystem.layout.radius.md,
    padding: designSystem.spacing.md,
    marginBottom: designSystem.spacing.lg,
  },
  errorText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.status.danger,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: designSystem.spacing.md,
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: designSystem.spacing.xxl,
  },
  signinText: {
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.text.secondary,
  },
  signinLink: {
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.primary[500],
    fontWeight: '600',
  },
});
