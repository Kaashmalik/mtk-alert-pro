import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * MTK AlertPro Design System
 * A comprehensive guide for colors, typography, spacing, and animations.
 */
export const designSystem = {
  // Color Palette
  colors: {
    // Dark theme optimized for security apps (OLED friendly)
    background: {
      primary: '#0F172A', // Slate 900
      secondary: '#1E293B', // Slate 800
      tertiary: '#334155', // Slate 700
      modal: 'rgba(15, 23, 42, 0.95)',
    },

    // Primary brand colors
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3', // Base Blue
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },

    // Semantic colors for alerts
    status: {
      success: '#10B981', // Emerald 500
      warning: '#F59E0B', // Amber 500
      danger: '#EF4444', // Red 500
      info: '#3B82F6',   // Blue 500
      inactive: '#64748B', // Slate 500
    },

    text: {
      primary: '#F8FAFC', // Slate 50
      secondary: '#94A3B8', // Slate 400
      tertiary: '#CBD5E1', // Slate 300
      muted: '#64748B', // Slate 500
      inverse: '#0F172A', // Slate 900
    },

    border: {
      default: '#334155', // Slate 700
      light: '#475569', // Slate 600
    },

    overlay: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(0, 0, 0, 0.5)',
      heavy: 'rgba(0, 0, 0, 0.8)',
    }
  },

  // Spacing System (8px grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  // Layout Helpers
  layout: {
    screenWidth: width,
    screenHeight: height,
    gutter: 16,        // Standard horizontal padding
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 20,
      xxl: 32,
      full: 9999,
    }
  },

  // Typography System
  typography: {
    fontFamily: {
      regular: Platform.select({ ios: 'Inter', android: 'Inter-Regular' }),
      medium: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
      semibold: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
      bold: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
    },
    // Font Sizes
    size: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      display: 32,
    },
    // Line Heights
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  // Animation Constants (Reanimated v3)
  animations: {
    durations: {
      fast: 200,
      base: 300,
      slow: 500,
      long: 800,
    },
    easings: {
      // Cubic Beziers
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      elastic: 'cubic-bezier(0.5, 1.5, 0.5, 1)',
    },
    spring: {
      stiff: { damping: 20, stiffness: 200 },
      default: { damping: 20, stiffness: 90 },
      bouncy: { damping: 10, stiffness: 100 },
    }
  },

  // Elevation / Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.35,
      shadowRadius: 6.27,
      elevation: 10,
    },
    glow: {
      primary: {
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
      },
      danger: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
      }
    }
  },
};

export type DesignSystem = typeof designSystem;
