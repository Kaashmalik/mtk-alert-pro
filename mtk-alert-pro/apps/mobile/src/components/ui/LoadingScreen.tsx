/**
 * Loading Screen Component
 * 
 * Beautiful loading state with branding
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield } from 'lucide-react-native';
import { colors, spacing, fontSize, shadows, palette } from '@/lib/theme';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export function LoadingScreen({ message = 'Loading...', showLogo = true }: LoadingScreenProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {showLogo && (
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={[palette.red[500], palette.red[600]]}
            style={styles.logoGradient}
          >
            <Shield size={40} color="white" />
          </LinearGradient>
        </Animated.View>
      )}

      <ActivityIndicator
        size="large"
        color={palette.red[500]}
        style={styles.spinner}
      />

      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.xxxl,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

