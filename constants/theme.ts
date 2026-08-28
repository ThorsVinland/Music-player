import { Platform } from 'react-native';

const primaryLight = '#7c3aed'; // Modern Vibrant Violet
const primaryDark = '#8b5cf6'; // Electric Violet

export const Colors = {
  light: {
    text: '#0f172a',
    textSecondary: '#64748b',
    background: '#f8fafc',
    card: '#ffffff',
    cardElevated: '#f1f5f9',
    primary: primaryLight,
    primaryMuted: 'rgba(124, 58, 237, 0.12)',
    border: '#e2e8f0',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: primaryLight,
    glassBackground: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    activeRow: 'rgba(124, 58, 237, 0.07)',
    toastBg: 'rgba(15, 23, 42, 0.92)',
    toastText: '#ffffff',
    toastBorder: 'rgba(255, 255, 255, 0.15)',
  },
  dark: {
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    background: '#0b0f19',
    card: '#161f30',
    cardElevated: '#1e293b',
    primary: primaryDark,
    primaryMuted: 'rgba(139, 92, 246, 0.16)',
    border: '#1e293b',
    borderSubtle: 'rgba(255, 255, 255, 0.07)',
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: primaryDark,
    glassBackground: 'rgba(15, 23, 42, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.10)',
    activeRow: 'rgba(139, 92, 246, 0.12)',
    toastBg: 'rgba(30, 41, 59, 0.92)',
    toastText: '#f8fafc',
    toastBorder: 'rgba(255, 255, 255, 0.12)',
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
