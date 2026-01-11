import { useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: 'mtkalertpro://reset-password',
      });

      if (error) throw error;

      Alert.alert(
        'Check your email',
        'We sent you a password reset link. Check your inbox.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
      
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <ArrowLeft size={24} color={colors.text.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>
          Forgot Password?
        </Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={colors.text.muted} />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Button
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
        >
          Send Reset Link
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    paddingHorizontal: spacing.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  backText: {
    color: colors.text.primary,
    marginLeft: spacing.sm,
    fontSize: fontSize.base,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    marginBottom: spacing.xxl,
  },
  submitButton: {
    marginTop: spacing.xxl,
  },
});
