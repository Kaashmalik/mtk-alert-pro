/**
 * SSL Design System Tokens
 * Enhanced with fluid scaling, dark mode, and accessibility
 * Based on update.md transformation plan
 */

export const designTokens = {
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
    cricket: {
      pitch: '#2d5a27',
      ball: '#c41e3a',
      stumps: '#d4a574',
      boundary: '#ffffff',
      sky: '#87ceeb',
    },
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    dark: {
      primary: {
        50: '#052e16',
        500: '#86efac',
        600: '#4ade80',
      },
      background: '#09090b',
      surface: '#18181b',
      border: '#27272a',
    },
  },

  spacing: {
    px: '1px',
    0: '0',
    0.5: 'clamp(0.125rem, 0.1rem + 0.25vw, 0.25rem)',
    1: 'clamp(0.25rem, 0.2rem + 0.5vw, 0.5rem)',
    2: 'clamp(0.5rem, 0.4rem + 0.75vw, 0.75rem)',
    3: 'clamp(0.75rem, 0.6rem + 1vw, 1rem)',
    4: 'clamp(1rem, 0.8rem + 1.25vw, 1.5rem)',
    5: 'clamp(1.25rem, 1rem + 1.5vw, 2rem)',
    6: 'clamp(1.5rem, 1.2rem + 2vw, 2.5rem)',
    8: 'clamp(2rem, 1.6rem + 2.5vw, 3rem)',
    10: 'clamp(2.5rem, 2rem + 3vw, 4rem)',
    12: 'clamp(3rem, 2.4rem + 3.5vw, 5rem)',
    16: 'clamp(4rem, 3.2rem + 4vw, 6rem)',
    20: 'clamp(5rem, 4rem + 5vw, 8rem)',
  },

  typography: {
    fonts: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      display: ['Cal Sans', 'Inter', 'sans-serif'],
      urdu: ['Noto Nastaliq Urdu', 'serif'],
    },
    sizes: {
      xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
      sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
      base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
      lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
      xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
      '2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
      '3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
      '4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
      '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 4rem)',
      '6xl': 'clamp(3.75rem, 3rem + 3.75vw, 5rem)',
    },
    weights: {
      thin: 100,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    glow: {
      primary: '0 0 20px rgba(34, 197, 94, 0.3)',
      secondary: '0 0 20px rgba(168, 85, 247, 0.3)',
      cricket: '0 0 30px rgba(45, 90, 39, 0.4)',
    },
    elevation: {
      1: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      2: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
      3: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
      4: '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
      5: '0 20px 40px rgba(0,0,0,0.2)',
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  animations: {
    durations: {
      instant: '50ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
      slowest: '1000ms',
    },
    easings: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    keyframes: {
      pulse: {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
      },
      bounce: {
        '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
        '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
      },
      spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      scoreUpdate: {
        '0%': { transform: 'scale(1)', color: 'inherit' },
        '50%': { transform: 'scale(1.2)', color: 'var(--color-primary-500)' },
        '100%': { transform: 'scale(1)', color: 'inherit' },
      },
      wicketFall: {
        '0%': { transform: 'rotate(0deg)' },
        '25%': { transform: 'rotate(-15deg)' },
        '50%': { transform: 'rotate(10deg)' },
        '75%': { transform: 'rotate(-5deg)' },
        '100%': { transform: 'rotate(90deg)' },
      },
      ballTrajectory: {
        '0%': { transform: 'translateX(0) translateY(0)' },
        '50%': { transform: 'translateX(50%) translateY(-30px)' },
        '100%': { transform: 'translateX(100%) translateY(0)' },
      },
    },
  },

  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },

  accessibility: {
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
    highContrast: '@media (prefers-contrast: more)',
    darkMode: '@media (prefers-color-scheme: dark)',
    lightMode: '@media (prefers-color-scheme: light)',
    focusRing: '0 0 0 2px var(--color-primary-500)',
    minTouchTarget: '44px',
  },

  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
    toast: 1700,
  },
} as const;

export type DesignTokens = typeof designTokens;
export default designTokens;
