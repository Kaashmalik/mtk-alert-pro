// MTK AlertPro Design System - Colors
export const colors = {
  // Brand - Softer, more professional colors
  brand: {
    red: '#E63946',        // Softer red, easier on eyes
    redDark: '#C1272D',    // Darker shade
    redLight: '#FF8A94',   // Light accent
    primary: '#2B5876',    // Professional blue-gray
    accent: '#4E8098',     // Softer accent color
  },
  
  // Backgrounds
  bg: {
    primary: '#0F172A',    // slate-900
    secondary: '#1E293B',  // slate-800
    tertiary: '#334155',   // slate-700
    card: '#1E293B',
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',  // slate-400
    tertiary: '#64748B',   // slate-500
    muted: '#475569',      // slate-600
  },
  
  // Border
  border: {
    default: '#334155',    // slate-700
    light: '#475569',      // slate-600
    focus: '#EF4444',
  },
  
  // Status
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Gradient stops
  gradient: {
    start: '#0F172A',
    end: '#1E293B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
