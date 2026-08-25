import { Platform } from 'react-native';

const primaryLight = '#ec4899'; // Vibrant Pink
const primaryDark = '#8b5cf6'; // Vibrant Purple

export const Colors = {
  light: {
    text: '#1e293b',
    textSecondary: '#64748b',
    background: '#f8fafc',
    card: '#ffffff',
    primary: primaryLight,
    border: '#e2e8f0',
    icon: '#64748b',
    tabIconDefault: '#64748b',
    tabIconSelected: primaryLight,
    glassBackground: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.4)',
  },
  dark: {
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    background: '#0f172a',
    card: '#1e293b',
    primary: primaryDark,
    border: '#334155',
    icon: '#94a3b8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: primaryDark,
    glassBackground: 'rgba(30, 41, 59, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
