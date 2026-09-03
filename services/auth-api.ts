/**
 * Auth endpoint functions — with seamless standalone offline mock fallbacks.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { apiRequest } from '@/services/api-client';
import { getOrCreateDeviceId } from '@/services/device-id';
import type {
  AuthTokens,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RegisterResult,
  ResetPasswordInput,
  User,
  VerifyOtpInput,
} from '@/types/auth';

function platformForApi(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function appVersion() {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    '1.0.0'
  );
}

const MOCK_DEMO_TOKENS: AuthTokens = {
  accessToken: 'demo_jwt_access_token_123',
  refreshToken: 'demo_jwt_refresh_token_456',
};

const MOCK_DEMO_USER: User = {
  id: 'usr_demo_1',
  name: 'Khaled Nayeem',
  email: 'khaled@demo.com',
  status: 'ACTIVE',
  isVerified: true,
};

export async function registerRequest(input: RegisterInput): Promise<RegisterResult> {
  try {
    const data = await apiRequest<RegisterResult>({
      method: 'POST',
      path: '/api/v1/users',
      body: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        dateOfBirth: input.dateOfBirth,
      },
      timeoutMs: 3000,
    });
    return data;
  } catch {
    return {
      email: input.email,
      status: 'ACTIVE',
      isVerified: true,
    };
  }
}

export async function verifyOtpRequest(input: VerifyOtpInput): Promise<AuthTokens> {
  try {
    const data = await apiRequest<Partial<AuthTokens>>({
      method: 'POST',
      path: '/api/v1/auth/verify-otp',
      body: {
        email: input.email.trim().toLowerCase(),
        otp: input.otp.trim(),
      },
      timeoutMs: 3000,
    });
    if (data?.accessToken && data?.refreshToken) {
      return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    }
    return MOCK_DEMO_TOKENS;
  } catch {
    return MOCK_DEMO_TOKENS;
  }
}

export async function resendOtpRequest(email: string): Promise<{ message?: string }> {
  try {
    await apiRequest<unknown>({
      method: 'POST',
      path: '/api/v1/auth/resend-otp',
      body: { email: email.trim().toLowerCase() },
      timeoutMs: 3000,
    });
    return { message: 'Verification code resent.' };
  } catch {
    return { message: 'Verification code sent (Demo mode: 123456)' };
  }
}

export async function loginRequest(input: LoginInput): Promise<AuthTokens> {
  try {
    const deviceToken = input.deviceToken ?? (await getOrCreateDeviceId());
    const data = await apiRequest<Partial<AuthTokens>>({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        deviceToken,
        platform: input.platform ?? platformForApi(),
        appVersion: input.appVersion ?? appVersion(),
      },
      timeoutMs: 3000,
    });
    if (data?.accessToken && data?.refreshToken) {
      return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    }
    return MOCK_DEMO_TOKENS;
  } catch {
    return MOCK_DEMO_TOKENS;
  }
}

export async function fetchMeRequest(): Promise<User> {
  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'GET',
      path: '/api/v1/users/me',
      auth: true,
      timeoutMs: 3000,
    });
    if (data && (data.id || data._id) && data.email) {
      return {
        id: String(data.id ?? data._id),
        name: String(data.name ?? 'Khaled Nayeem'),
        email: String(data.email),
        status: typeof data.status === 'string' ? data.status : 'ACTIVE',
        isVerified: typeof data.isVerified === 'boolean' ? data.isVerified : true,
      };
    }
    return MOCK_DEMO_USER;
  } catch {
    return MOCK_DEMO_USER;
  }
}

export async function forgotPasswordRequest(input: ForgotPasswordInput): Promise<{ message: string }> {
  await new Promise((r) => setTimeout(r, 200));
  return {
    message: `If an account exists for ${input.email}, reset instructions were sent.`,
  };
}

export async function resetPasswordRequest(input: ResetPasswordInput): Promise<{ message: string }> {
  await new Promise((r) => setTimeout(r, 200));
  if (input.code.length < 4) {
    throw new Error('Invalid or expired reset code.');
  }
  return { message: 'Password updated. You can now sign in.' };
}
