/**
 * Onboarding Screen
 * 
 * Beautiful first-time user experience with app introduction
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Shield,
  Camera,
  Bell,
  Zap,
  Users,
  Smartphone,
  ArrowRight,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius, palette } from '@/lib/theme';
import { hapticPrimaryAction, hapticSelection } from '@/lib/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

// ============================================================================
// Types & Data
// ============================================================================

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to MTK AlertPro',
    description: 'AI-powered security monitoring for your home and business. Get instant alerts when motion is detected.',
    icon: <Shield size={64} color="white" />,
    gradient: [palette.red[500], palette.red[600]],
  },
  {
    id: '2',
    title: 'Connect Your Cameras',
    description: 'Add any IP camera with RTSP support. View live streams from anywhere in the world.',
    icon: <Camera size={64} color="white" />,
    gradient: [palette.cyan[500], palette.cyan[600]],
  },
  {
    id: '3',
    title: 'Smart Detection',
    description: 'AI detects people, vehicles, and faces. Reduce false alarms from pets and moving trees.',
    icon: <Users size={64} color="white" />,
    gradient: [palette.violet[500], palette.violet[600]],
  },
  {
    id: '4',
    title: 'Instant Alerts',
    description: 'Get push notifications with snapshots when activity is detected. Never miss an important moment.',
    icon: <Bell size={64} color="white" />,
    gradient: [palette.amber[500], palette.amber[600]],
  },
  {
    id: '5',
    title: 'Red Alert Mode',
    description: 'Maximum security when you need it. Sound alarms and get priority alerts instantly.',
    icon: <Zap size={64} color="white" />,
    gradient: [palette.red[600], palette.red[700]],
  },
];

// ============================================================================
// Component
// ============================================================================

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    hapticSelection();
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    hapticPrimaryAction();
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={item.gradient as [string, string, ...string[]]}
          style={styles.iconContainer}
        >
          {item.icon}
        </LinearGradient>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />

      <SafeAreaView style={styles.safeArea}>
        {/* Skip Button */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides */}
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(index);
          }}
          scrollEventThrottle={16}
        />

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {renderPagination()}

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.9}
            style={styles.nextButton}
          >
            <LinearGradient
              colors={[palette.red[500], palette.red[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {isLastSlide ? 'Get Started' : 'Next'}
              </Text>
              <ArrowRight size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['4xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 320,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.red[500],
    marginHorizontal: 4,
  },
  nextButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: palette.red[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  nextButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: 'white',
  },
});

