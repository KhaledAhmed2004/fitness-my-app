/**
 * Unified Design Tokens
 * This file serves as the Single Source of Truth (SSOT) for the design system.
 * It is used by both tailwind.config.js and the React Native theme (vital-theme.ts).
 */

const tailwindColors = {
  // Vital Serenity
  background: '#101416',
  brand: {
    DEFAULT: '#89ceff',
    dark: '#00b4ff',
    container: '#00b4ff',
  },
  lime: {
    DEFAULT: '#89fe00',
    dim: '#77df00',
  },
  ink: {
    DEFAULT: '#e0e3e6',
    muted: '#bdc8d2',
    soft: '#87929c',
  },
  surface: {
    DEFAULT: '#1c2023',
    muted: '#101416',
    low: '#181c1e',
    high: '#262b2d',
    highest: '#313538',
    lowest: '#0b0f11',
  },
  line: '#3e4851',
  outline: '#87929c',
  danger: '#ffb4ab',
  success: '#89fe00',
};

const vitalColors = {
  background: '#101416',
  surface: '#101416',
  surfaceDim: '#101416',
  surfaceBright: '#363a3c',
  surfaceLowest: '#0b0f11',
  surfaceLow: '#181c1e',
  surfaceContainer: '#1c2023',
  surfaceHigh: '#262b2d',
  surfaceHighest: '#313538',
  onSurface: '#e0e3e6',
  onSurfaceVariant: '#bdc8d2',
  outline: '#87929c',
  outlineVariant: '#3e4851',
  primary: '#89ceff',
  onPrimary: '#00344d',
  primaryContainer: '#00b4ff',
  onPrimaryContainer: '#004361',
  secondary: '#ffffff',
  secondaryContainer: '#89fe00',
  onSecondaryContainer: '#3a7100',
  tertiary: '#b8c7e3',
  error: '#ffb4ab',
  errorContainer: '#8c1d18',
  onErrorContainer: '#ffdad6',
  glassFill: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glow: 'rgba(0, 180, 255, 0.15)',
  trainingAccent: '#A78BFA',
  // Tonal Alpha Tints & Shades
  primaryAlpha10: 'rgba(0, 180, 255, 0.10)',
  primaryAlpha20: 'rgba(0, 180, 255, 0.20)',
  trainingAlpha10: 'rgba(167, 139, 250, 0.10)',
  trainingAlpha20: 'rgba(167, 139, 250, 0.20)',
  surfaceContainerLow: '#15191c',
  surfaceContainerHigh: '#22272a',
};

const trainingColors = {
  background: '#101416',
  surface: '#161B1F',
  surfaceElevated: '#20262B',
  surfaceActiveTint: 'rgba(200, 241, 53, 0.08)',
  primary: '#C8F135',
  onPrimary: '#101416',
  secondary: '#38BDF8',
  metricOrange: '#FB923C',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: 'rgba(255, 255, 255, 0.08)',
  borderFocus: 'rgba(200, 241, 53, 0.4)',
  borderActive: '#C8F135',
  anatomyInactive: '#222A33',
  anatomyStroke: '#3A4654',
  anatomyBase: '#1A2026',
  anatomyActive: '#C8F135',
  glassFill: 'rgba(255, 255, 255, 0.04)',
};

const fonts = {
  sans: 'Manrope_400Regular',
  sansRegular: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemiBold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
  sansExtraBold: 'Manrope_800ExtraBold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_500Medium',
  monoRegular: 'JetBrainsMono_400Regular',
};

const tailwindFonts = {
  sans: ['Manrope_400Regular'],
  'sans-medium': ['Manrope_500Medium'],
  'sans-semibold': ['Manrope_600SemiBold'],
  'sans-bold': ['Manrope_700Bold'],
  'sans-extrabold': ['Manrope_800ExtraBold'],
  mono: ['JetBrainsMono_500Medium'],
};

const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  field: 8,
  card: 32,
  full: 9999,
};

// Map radius to px strings for Tailwind
const tailwindRadius = {};
for (const [key, value] of Object.entries(radius)) {
  tailwindRadius[key] = `${value}px`;
}

module.exports = {
  tailwindColors,
  vitalColors,
  trainingColors,
  fonts,
  tailwindFonts,
  radius,
  tailwindRadius,
};
