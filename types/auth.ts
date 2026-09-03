/**
 * MENTOR: Keep auth-related TypeScript types in one place.
 * Screens/API/Context should import from here — avoids duplicated shapes.
 */

export type UserRole = 'USER' | 'TRAINER' | 'GYM_OWNER' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';
  goals?: string[];
  status?: string;
  isVerified?: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  user: User;
  tokens: AuthTokens;
};

export type LoginInput = {
  email: string;
  password: string;
  deviceToken?: string;
  platform?: 'ios' | 'android' | 'web';
  appVersion?: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
};

export type RegisterResult = {
  email: string;
  status: string;
  isVerified: boolean;
};

export type VerifyOtpInput = {
  email: string;
  otp: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  email: string;
  code: string;
  password: string;
};
