import { useMemo } from 'react';
import { useThemeStore, isThemeDark, type ThemeMode } from '@/stores/theme-store';

export type AppThemeColors = {
  // Canvas & Base
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnDark: string;

  // Core Brand & Accents
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  accentLime: string;
  accentLimeSoft: string;
  accentCyan: string;
  accentCyanSoft: string;
  accentGold: string;
  accentGoldSoft: string;
  accentRed: string;
  accentRedSoft: string;

  // Borders & Glass
  border: string;
  borderStrong: string;
  glassFill: string;
  glassBorder: string;

  // Form & Inputs
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;

  // Badges & Chips
  chipActiveBg: string;
  chipActiveText: string;
  chipInactiveBg: string;
  chipInactiveText: string;

  // Navigation Bar
  navPillBg: string;
  navPillStroke: string;
  navActiveIcon: string;
  navInactiveIcon: string;
  navAddBtnBg: string;
  navAddBtnIcon: string;
  navBlurFade: string;
  navBlurTint: 'dark' | 'light';

  // Shadows
  shadowColor: string;
};

// 1. ONYX NEON (Default Cyber Dark)
const DARK_COLORS: AppThemeColors = {
  background: '#101416',
  surface: '#1C2023',
  surfaceElevated: '#262B2D',
  surfaceMuted: '#14181B',
  surfaceContainer: '#1C2023',
  surfaceContainerLow: '#15191C',
  surfaceContainerHigh: '#22272A',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnPrimary: '#00344D',
  textOnDark: '#FFFFFF',

  primary: '#89CEFF',
  onPrimary: '#00344D',
  primaryContainer: '#00B4FF',
  onPrimaryContainer: '#004361',
  accentLime: '#89FE00',
  accentLimeSoft: 'rgba(137, 254, 0, 0.15)',
  accentCyan: '#00B4D8',
  accentCyanSoft: 'rgba(0, 180, 216, 0.15)',
  accentGold: '#FFB800',
  accentGoldSoft: 'rgba(255, 184, 0, 0.15)',
  accentRed: '#FF4D4D',
  accentRedSoft: 'rgba(255, 77, 77, 0.15)',

  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  glassFill: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',

  inputBg: 'rgba(0, 0, 0, 0.35)',
  inputBorder: 'rgba(255, 255, 255, 0.10)',
  inputText: '#F1F5F9',
  inputPlaceholder: '#64748B',

  chipActiveBg: '#00B4FF',
  chipActiveText: '#002233',
  chipInactiveBg: 'rgba(255, 255, 255, 0.06)',
  chipInactiveText: '#94A3B8',

  navPillBg: '#262B2D',
  navPillStroke: 'rgba(255, 255, 255, 0.10)',
  navActiveIcon: '#89CEFF',
  navInactiveIcon: '#87929C',
  navAddBtnBg: '#00B4FF',
  navAddBtnIcon: '#00344D',
  navBlurFade: '#0B131E',
  navBlurTint: 'dark',

  shadowColor: '#000000',
};

// 2. SAGE OASIS (Organic Fresh Light)
const LIGHT_SAGE_COLORS: AppThemeColors = {
  background: '#F0F5EC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#E7F3DD',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#F7FAF4',
  surfaceContainerHigh: '#EAF4E2',

  textPrimary: '#0E4D34',
  textSecondary: '#4A6956',
  textMuted: '#789582',
  textOnPrimary: '#B4E876',
  textOnDark: '#FFFFFF',

  primary: '#0E4D34',
  onPrimary: '#B4E876',
  primaryContainer: '#B4E876',
  onPrimaryContainer: '#0E4D34',
  accentLime: '#B4E876',
  accentLimeSoft: '#D5EDB8',
  accentCyan: '#007A99',
  accentCyanSoft: '#D8F1F5',
  accentGold: '#B45309',
  accentGoldSoft: '#FEF0DB',
  accentRed: '#DC2626',
  accentRedSoft: '#FEE2E2',

  border: 'rgba(14, 77, 52, 0.12)',
  borderStrong: 'rgba(14, 77, 52, 0.25)',
  glassFill: 'rgba(255, 255, 255, 0.70)',
  glassBorder: 'rgba(14, 77, 52, 0.10)',

  inputBg: '#EAF4E2',
  inputBorder: 'rgba(14, 77, 52, 0.15)',
  inputText: '#0E4D34',
  inputPlaceholder: '#789582',

  chipActiveBg: '#0E4D34',
  chipActiveText: '#B4E876',
  chipInactiveBg: '#E3F0DA',
  chipInactiveText: '#4A6956',

  navPillBg: '#0E4D34',
  navPillStroke: 'rgba(180, 232, 118, 0.35)',
  navActiveIcon: '#B4E876',
  navInactiveIcon: '#85A893',
  navAddBtnBg: '#B4E876',
  navAddBtnIcon: '#0E4D34',
  navBlurFade: '#F0F5EC',
  navBlurTint: 'light',

  shadowColor: '#0E4D34',
};

// 3. MIDNIGHT COBALT (Deep Ocean Pro Athletic)
const MIDNIGHT_COLORS: AppThemeColors = {
  background: '#0B111E',
  surface: '#141D2F',
  surfaceElevated: '#1C283F',
  surfaceMuted: '#0F1726',
  surfaceContainer: '#141D2F',
  surfaceContainerLow: '#0E1523',
  surfaceContainerHigh: '#1A253C',

  textPrimary: '#F0F6FC',
  textSecondary: '#8BA3C7',
  textMuted: '#52688A',
  textOnPrimary: '#08162B',
  textOnDark: '#FFFFFF',

  primary: '#38BDF8',
  onPrimary: '#08162B',
  primaryContainer: '#0284C7',
  onPrimaryContainer: '#E0F2FE',
  accentLime: '#4ADE80',
  accentLimeSoft: 'rgba(74, 222, 128, 0.15)',
  accentCyan: '#38BDF8',
  accentCyanSoft: 'rgba(56, 189, 248, 0.15)',
  accentGold: '#FBBF24',
  accentGoldSoft: 'rgba(251, 191, 36, 0.15)',
  accentRed: '#F87171',
  accentRedSoft: 'rgba(248, 113, 113, 0.15)',

  border: 'rgba(56, 189, 248, 0.10)',
  borderStrong: 'rgba(56, 189, 248, 0.22)',
  glassFill: 'rgba(20, 29, 47, 0.70)',
  glassBorder: 'rgba(56, 189, 248, 0.12)',

  inputBg: 'rgba(11, 17, 30, 0.55)',
  inputBorder: 'rgba(56, 189, 248, 0.15)',
  inputText: '#F0F6FC',
  inputPlaceholder: '#52688A',

  chipActiveBg: '#38BDF8',
  chipActiveText: '#08162B',
  chipInactiveBg: 'rgba(56, 189, 248, 0.08)',
  chipInactiveText: '#8BA3C7',

  navPillBg: '#141E30',
  navPillStroke: 'rgba(56, 189, 248, 0.25)',
  navActiveIcon: '#38BDF8',
  navInactiveIcon: '#64748B',
  navAddBtnBg: '#38BDF8',
  navAddBtnIcon: '#08162B',
  navBlurFade: '#0B111E',
  navBlurTint: 'dark',

  shadowColor: '#000000',
};

// 4. CRIMSON BEAST (Heavy Iron & Power Dark)
const CRIMSON_COLORS: AppThemeColors = {
  background: '#140A0C',
  surface: '#201215',
  surfaceElevated: '#2D191D',
  surfaceMuted: '#180D0F',
  surfaceContainer: '#201215',
  surfaceContainerLow: '#170C0E',
  surfaceContainerHigh: '#29161B',

  textPrimary: '#FFF1F2',
  textSecondary: '#FDA4AF',
  textMuted: '#884C55',
  textOnPrimary: '#1F0609',
  textOnDark: '#FFFFFF',

  primary: '#FF4655',
  onPrimary: '#1F0609',
  primaryContainer: '#E11D48',
  onPrimaryContainer: '#FFE4E6',
  accentLime: '#A3E635',
  accentLimeSoft: 'rgba(163, 230, 53, 0.15)',
  accentCyan: '#22D3EE',
  accentCyanSoft: 'rgba(34, 211, 238, 0.15)',
  accentGold: '#F59E0B',
  accentGoldSoft: 'rgba(245, 158, 11, 0.15)',
  accentRed: '#FF4655',
  accentRedSoft: 'rgba(255, 70, 85, 0.18)',

  border: 'rgba(255, 70, 85, 0.12)',
  borderStrong: 'rgba(255, 70, 85, 0.25)',
  glassFill: 'rgba(32, 18, 21, 0.70)',
  glassBorder: 'rgba(255, 70, 85, 0.15)',

  inputBg: 'rgba(20, 10, 12, 0.55)',
  inputBorder: 'rgba(255, 70, 85, 0.18)',
  inputText: '#FFF1F2',
  inputPlaceholder: '#884C55',

  chipActiveBg: '#FF4655',
  chipActiveText: '#1F0609',
  chipInactiveBg: 'rgba(255, 70, 85, 0.08)',
  chipInactiveText: '#FDA4AF',

  navPillBg: '#221217',
  navPillStroke: 'rgba(255, 70, 85, 0.30)',
  navActiveIcon: '#FF4655',
  navInactiveIcon: '#884C55',
  navAddBtnBg: '#FF4655',
  navAddBtnIcon: '#1F0609',
  navBlurFade: '#140A0C',
  navBlurTint: 'dark',

  shadowColor: '#000000',
};

// 5. SOLAR AMBER (Warm Energetic Morning Cardio)
const AMBER_COLORS: AppThemeColors = {
  background: '#16120E',
  surface: '#231B15',
  surfaceElevated: '#30251E',
  surfaceMuted: '#1A1410',
  surfaceContainer: '#231B15',
  surfaceContainerLow: '#1B140F',
  surfaceContainerHigh: '#2C221B',

  textPrimary: '#FFFBEB',
  textSecondary: '#FCD34D',
  textMuted: '#8D6F4B',
  textOnPrimary: '#261600',
  textOnDark: '#FFFFFF',

  primary: '#FF922B',
  onPrimary: '#261600',
  primaryContainer: '#F59E0B',
  onPrimaryContainer: '#FEF3C7',
  accentLime: '#84CC16',
  accentLimeSoft: 'rgba(132, 204, 22, 0.15)',
  accentCyan: '#06B6D4',
  accentCyanSoft: 'rgba(6, 182, 212, 0.15)',
  accentGold: '#FBBF24',
  accentGoldSoft: 'rgba(251, 191, 36, 0.18)',
  accentRed: '#EF4444',
  accentRedSoft: 'rgba(239, 68, 68, 0.15)',

  border: 'rgba(255, 146, 43, 0.12)',
  borderStrong: 'rgba(255, 146, 43, 0.25)',
  glassFill: 'rgba(35, 27, 21, 0.70)',
  glassBorder: 'rgba(255, 146, 43, 0.15)',

  inputBg: 'rgba(22, 18, 14, 0.55)',
  inputBorder: 'rgba(255, 146, 43, 0.18)',
  inputText: '#FFFBEB',
  inputPlaceholder: '#8D6F4B',

  chipActiveBg: '#FF922B',
  chipActiveText: '#261600',
  chipInactiveBg: 'rgba(255, 146, 43, 0.08)',
  chipInactiveText: '#FCD34D',

  navPillBg: '#251E17',
  navPillStroke: 'rgba(255, 146, 43, 0.30)',
  navActiveIcon: '#FF922B',
  navInactiveIcon: '#8D6F4B',
  navAddBtnBg: '#FF922B',
  navAddBtnIcon: '#261600',
  navBlurFade: '#16120E',
  navBlurTint: 'dark',

  shadowColor: '#000000',
};

// 6. SYNTHWAVE VIOLET (Neon Night Cyber)
const PURPLE_COLORS: AppThemeColors = {
  background: '#120E1C',
  surface: '#1E172E',
  surfaceElevated: '#2A2040',
  surfaceMuted: '#161122',
  surfaceContainer: '#1E172E',
  surfaceContainerLow: '#151020',
  surfaceContainerHigh: '#251C39',

  textPrimary: '#FAF5FF',
  textSecondary: '#D8B4FE',
  textMuted: '#7E639B',
  textOnPrimary: '#1E0A3C',
  textOnDark: '#FFFFFF',

  primary: '#C084FC',
  onPrimary: '#1E0A3C',
  primaryContainer: '#9333EA',
  onPrimaryContainer: '#F3E8FF',
  accentLime: '#A3E635',
  accentLimeSoft: 'rgba(163, 230, 53, 0.15)',
  accentCyan: '#22D3EE',
  accentCyanSoft: 'rgba(34, 211, 238, 0.15)',
  accentGold: '#FBBF24',
  accentGoldSoft: 'rgba(251, 191, 36, 0.15)',
  accentRed: '#F43F5E',
  accentRedSoft: 'rgba(244, 63, 94, 0.18)',

  border: 'rgba(192, 132, 252, 0.12)',
  borderStrong: 'rgba(192, 132, 252, 0.25)',
  glassFill: 'rgba(30, 23, 46, 0.70)',
  glassBorder: 'rgba(192, 132, 252, 0.15)',

  inputBg: 'rgba(18, 14, 28, 0.55)',
  inputBorder: 'rgba(192, 132, 252, 0.18)',
  inputText: '#FAF5FF',
  inputPlaceholder: '#7E639B',

  chipActiveBg: '#C084FC',
  chipActiveText: '#1E0A3C',
  chipInactiveBg: 'rgba(192, 132, 252, 0.08)',
  chipInactiveText: '#D8B4FE',

  navPillBg: '#201830',
  navPillStroke: 'rgba(192, 132, 252, 0.30)',
  navActiveIcon: '#C084FC',
  navInactiveIcon: '#7E639B',
  navAddBtnBg: '#C084FC',
  navAddBtnIcon: '#1E0A3C',
  navBlurFade: '#120E1C',
  navBlurTint: 'dark',

  shadowColor: '#000000',
};

const THEME_PALETTES: Record<ThemeMode, AppThemeColors> = {
  dark: DARK_COLORS,
  light: LIGHT_SAGE_COLORS,
  midnight: MIDNIGHT_COLORS,
  crimson: CRIMSON_COLORS,
  amber: AMBER_COLORS,
  purple: PURPLE_COLORS,
};

export function useThemeColors(): {
  theme: ThemeMode;
  isDark: boolean;
  colors: AppThemeColors;
} {
  const theme = useThemeStore((s) => s.theme);
  const isDark = isThemeDark(theme);

  const colors = useMemo(() => {
    return THEME_PALETTES[theme] || DARK_COLORS;
  }, [theme]);

  return {
    theme,
    isDark,
    colors,
  };
}
