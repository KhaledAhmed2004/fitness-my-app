/**
 * Vital Serenity design tokens — dark-mode-first health UI.
 */
import tokens from './tokens';

export const Vital = {
  colors: tokens.vitalColors,
  training: tokens.trainingColors,
  fonts: {
    ...tokens.fonts,
    regular: tokens.fonts.sansRegular,
    medium: tokens.fonts.sansMedium,
    semiBold: tokens.fonts.sansSemiBold,
    bold: tokens.fonts.sansBold,
    extraBold: tokens.fonts.sansExtraBold,
    monoBold: tokens.fonts.mono,
  },
  radius: tokens.radius,
} as const;

export const TrainingTheme = tokens.trainingColors;

/**
 * GymTheme & CoachTheme (Volt Titanium Palette — Color Theory Optimized for Strength & Coaching)
 * 60-30-10 Athletic Dark Hierarchy:
 * - 60% Canvas: #0A0D0F (Deep Obsidian)
 * - 30% Cards: #161D24 (Elevated Slate High Contrast) & #11161B (Inner Containers)
 * - 10% Kinetic Accents: #89FE00 (Neon Lime), #00B4D8 (Cyan CRM), #FFB800 (Gold PR), #A78BFA (PT Pack), #FF4D4D (Injury Red)
 */
export const GymTheme = {
  canvas: '#0A0D0F',
  card: '#161D24',
  cardSubtle: '#11161B',
  input: 'rgba(0, 0, 0, 0.40)',
  inputBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  // Kinetic Accents
  lime: '#89FE00',
  limeDim: 'rgba(137, 254, 0, 0.12)',
  limeBorder: 'rgba(137, 254, 0, 0.30)',

  cyan: '#00B4D8',
  cyanDim: 'rgba(0, 180, 216, 0.12)',
  cyanBorder: 'rgba(0, 180, 216, 0.30)',

  gold: '#FFB800',
  goldDim: 'rgba(255, 184, 0, 0.12)',
  goldBorder: 'rgba(255, 184, 0, 0.30)',

  purple: '#A78BFA',
  purpleDim: 'rgba(167, 139, 250, 0.12)',
  purpleBorder: 'rgba(167, 139, 250, 0.30)',

  red: '#FF4D4D',
  redDim: 'rgba(255, 77, 77, 0.12)',
  redBorder: 'rgba(255, 77, 77, 0.30)',

  // Typography
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDark: '#002233',
} as const;

export const CoachTheme = {
  canvas: '#F0F5EC',
  card: '#FFFFFF',
  cardSubtle: '#E7F3DD',
  input: '#EAF4E2',
  inputBorder: 'rgba(14, 77, 52, 0.12)',
  glassBorder: 'rgba(14, 77, 52, 0.10)',

  // Kinetic Accents
  lime: '#B4E876',
  limeDim: '#D5EDB8',
  limeBorder: 'rgba(14, 77, 52, 0.15)',
  forest: '#0E4D34',

  cyan: '#007A99',
  cyanDim: '#D8F1F5',
  cyanBorder: '#A3E3ED',

  gold: '#B45309',
  goldDim: '#FEF0DB',
  goldBorder: '#FCD39B',

  purple: '#6B21A8',
  purpleDim: '#EFE7FC',
  purpleBorder: '#D8B4FE',

  red: '#DC2626',
  redDim: '#FEE2E2',
  redBorder: '#FCA5A5',

  // Typography
  textPrimary: '#0E4D34',
  textSecondary: '#4A6956',
  textMuted: '#789582',
  textDark: '#0E4D34',
} as const;

export const VitalNavTheme = {
  dark: true,
  colors: {
    primary: Vital.colors.primary,
    background: Vital.colors.background,
    card: Vital.colors.surfaceContainer,
    text: Vital.colors.onSurface,
    border: Vital.colors.outlineVariant,
    notification: Vital.colors.secondaryContainer,
  },
  fonts: {
    regular: { fontFamily: 'Manrope_400Regular', fontWeight: '400' as const },
    medium: { fontFamily: 'Manrope_500Medium', fontWeight: '500' as const },
    bold: { fontFamily: 'Manrope_700Bold', fontWeight: '700' as const },
    heavy: { fontFamily: 'Manrope_800ExtraBold', fontWeight: '800' as const },
  },
};
