/**
 * MENTOR: Centralize route paths used after auth actions.
 * Typed routes regenerate as you add files; keep replacements in one place.
 */
import type { Href } from 'expo-router';

export const ROUTES = {
  home: '/(app)/(tabs)' as Href,
  today: '/(app)/(tabs)' as const,
  onboarding: '/onboarding' as const,
  nutrition: '/(app)/(tabs)/nutrition' as const,
  add: '/(app)/(tabs)/add' as const,
  fasting: '/(app)/(tabs)/fasting' as const,
  training: '/(app)/(tabs)/training' as const,
  profile: '/(app)/profile' as const,
  customizeModules: '/(app)/customize-modules' as const,
  login: '/(auth)/login' as const,
  register: '/(auth)/register' as const,
  verifyEmail: '/(auth)/verify-email' as const,
  forgotPassword: '/(auth)/forgot-password' as const,
  resetPassword: '/(auth)/reset-password' as const,
  todayFocus: '/(app)/today-focus' as const,
  helpSupport: '/(app)/help-support' as const,
  notifications: '/(app)/notifications' as const,
  unitsLanguage: '/(app)/units-language' as const,
  securitySessions: '/(app)/security-sessions' as const,
  editProfile: '/(app)/edit-profile' as const,
  gymMemberDetail: '/(app)/gym-member-detail' as const,
  modal: '/(app)/modal' as const,
};

