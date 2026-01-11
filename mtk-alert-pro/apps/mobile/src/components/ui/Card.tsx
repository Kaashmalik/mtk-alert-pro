/**
 * Card Component
 * 
 * A versatile card component with multiple variants
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';

// ============================================================================
// Types
// ============================================================================

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';

interface CardProps extends TouchableOpacityProps {
  variant?: CardVariant;
  padding?: keyof typeof spacing | number;
  children: React.ReactNode;
  style?: ViewStyle;
  gradientColors?: string[];
  onPress?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function Card({
  variant = 'default',
  padding = 'lg',
  children,
  style,
  gradientColors,
  onPress,
  ...props
}: CardProps) {
  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return colors.bg.elevated;
      case 'outlined':
        return 'transparent';
      case 'glass':
        return colors.bg.glass;
      case 'gradient':
        return 'transparent';
      default:
        return colors.bg.card;
    }
  };

  const getBorderStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.border.default,
        };
      case 'glass':
        return {
          borderWidth: 1,
          borderColor: colors.border.subtle,
        };
      default:
        return {};
    }
  };

  const getShadow = () => {
    switch (variant) {
      case 'elevated':
        return shadows.lg;
      case 'glass':
        return shadows.md;
      default:
        return {};
    }
  };

  const cardStyle: ViewStyle = {
    ...styles.card,
    backgroundColor: getBackgroundColor(),
    padding: paddingValue,
    ...getBorderStyle(),
    ...getShadow(),
    ...(style as ViewStyle),
  };

  const content = variant === 'gradient' ? (
    <LinearGradient
      colors={gradientColors || (colors.gradient.card as any)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { padding: paddingValue }]}
    >
      {children}
    </LinearGradient>
  ) : (
    children
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={variant === 'gradient' ? styles.gradientWrapper : cardStyle}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }

  if (variant === 'gradient') {
    return (
      <View style={[styles.gradientWrapper, style]}>
        {content}
      </View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  gradientWrapper: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: borderRadius.xl,
  },
});

