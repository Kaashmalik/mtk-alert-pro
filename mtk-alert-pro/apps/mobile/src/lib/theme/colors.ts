/**
 * MTK AlertPro Design System - Colors & Theme
 * 
 * A premium dark theme inspired by professional security apps
 * with vibrant accent colors for important actions
 */

// ============================================================================
// Core Color Palette
// ============================================================================

export const palette = {
  // Primary brand colors - Vibrant red for alerts/actions
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Primary action color
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Slate for backgrounds and text
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  
  // Accent colors
  cyan: {
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
  },
  
  emerald: {
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
  },
  
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
  
  violet: {
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
  },
};

// ============================================================================
// Semantic Colors
// ============================================================================

export const colors = {
  // Brand
  brand: {
    red: palette.red[500],
    redDark: palette.red[700],
    redLight: palette.red[400],
    primary: '#1A1F2E',     // Deep navy
    accent: palette.cyan[500],
    gradient: {
      start: palette.red[600],
      end: palette.red[400],
    },
  },
  
  // Backgrounds - Deep dark theme
  bg: {
    primary: '#0A0D14',      // Near black
    secondary: '#12151E',    // Dark navy
    tertiary: '#1A1F2E',     // Card background
    card: '#1A1F2E',
    elevated: '#222838',     // Elevated cards/modals
    glass: 'rgba(26, 31, 46, 0.8)', // Glass effect
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    muted: '#475569',
    inverse: '#0F172A',
  },
  
  // Border
  border: {
    default: '#1E293B',
    light: '#334155',
    focus: palette.red[500],
    subtle: 'rgba(255, 255, 255, 0.08)',
  },
  
  // Status colors
  status: {
    success: palette.emerald[500],
    successBg: 'rgba(16, 185, 129, 0.15)',
    warning: palette.amber[500],
    warningBg: 'rgba(245, 158, 11, 0.15)',
    error: palette.red[500],
    errorBg: 'rgba(239, 68, 68, 0.15)',
    info: palette.cyan[500],
    infoBg: 'rgba(6, 182, 212, 0.15)',
  },
  
  // Gradient stops for LinearGradient
  gradient: {
    dark: ['#0A0D14', '#12151E'],
    card: ['#1A1F2E', '#12151E'],
    red: [palette.red[600], palette.red[500]],
    premium: ['#7C3AED', '#5B21B6'],
    pro: [palette.red[600], palette.amber[500]],
    success: [palette.emerald[600], palette.emerald[500]],
  },
};

// ============================================================================
// Spacing System (8pt grid)
// ============================================================================

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
};

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// ============================================================================
// Typography
// ============================================================================

export const fontFamily = {
  // Use system fonts for better performance
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// ============================================================================
// Shadows
// ============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  }),
};

// ============================================================================
// Animation Timing
// ============================================================================

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

// ============================================================================
// Z-Index Stack
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  popover: 40,
  overlay: 50,
  toast: 60,
};
