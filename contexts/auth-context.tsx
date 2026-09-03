/**
 * AuthContext — Single source of truth for user session.
 * Supports standalone/offline demo mode and live API mode.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { queryClient } from '@/lib/query-client';
import {
  fetchMeRequest,
  forgotPasswordRequest,
  loginRequest,
  registerRequest,
  resendOtpRequest,
  resetPasswordRequest,
  verifyOtpRequest,
} from '@/services/auth-api';
import {
  clearSession,
  getUserJson,
  saveTokens,
  saveUserJson,
} from '@/services/token-storage';
import { useNutritionUiStore } from '@/stores/nutrition-ui-store';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RegisterResult,
  ResetPasswordInput,
  User,
  VerifyOtpInput,
} from '@/types/auth';

export const DEMO_PROFILES: Record<'USER' | 'TRAINER' | 'GYM_OWNER', User> = {
  USER: {
    id: 'usr_demo_1',
    name: 'Khaled Nayeem',
    email: 'khaled@demo.com',
    role: 'USER',
    bio: 'Athlete & Marathon Runner',
    status: 'ACTIVE',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  TRAINER: {
    id: 'usr_demo_trainer',
    name: 'Coach Alex (Gym Trainer)',
    email: 'trainer@gym.com',
    role: 'TRAINER',
    bio: 'Certified Master Gym Trainer & Strength Coach',
    status: 'ACTIVE',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80',
  },
  GYM_OWNER: {
    id: 'usr_demo_gym_owner',
    name: 'Khaled Nayeem (IronForge Gym)',
    email: 'owner@ironforgegym.com',
    role: 'GYM_OWNER',
    bio: 'Owner & Managing Director at IronForge Fitness Arena',
    status: 'ACTIVE',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
};

export const DEFAULT_DEMO_USER: User = DEMO_PROFILES.USER;

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<RegisterResult>;
  verifyEmail: (input: VerifyOtpInput) => Promise<void>;
  resendOtp: (email: string) => Promise<string>;
  signOut: () => Promise<void>;
  updateUser: (updated: Partial<User>) => Promise<void>;
  switchRole: (role: 'USER' | 'TRAINER' | 'GYM_OWNER') => Promise<void>;
  forgotPassword: (input: ForgotPasswordInput) => Promise<string>;
  resetPassword: (input: ResetPasswordInput) => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_DEMO_USER);
  const [isLoading, setIsLoading] = useState(false);

  const persistTokensAndHydrate = useCallback(async (accessToken: string, refreshToken: string) => {
    await saveTokens(accessToken, refreshToken);
    try {
      const me = await fetchMeRequest();
      await saveUserJson(JSON.stringify(me));
      setUser(me);
    } catch {
      await saveUserJson(JSON.stringify(DEFAULT_DEMO_USER));
      setUser(DEFAULT_DEMO_USER);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const userJson = await getUserJson();
        if (userJson) {
          try {
            const parsed = JSON.parse(userJson) as User;
            if (mounted) setUser(parsed);
            return;
          } catch {
            /* ignore */
          }
        }
        if (mounted) setUser(DEFAULT_DEMO_USER);
      } catch {
        if (mounted) setUser(DEFAULT_DEMO_USER);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const updateUser = useCallback(async (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next: User = { ...prev, ...updated };
      saveUserJson(JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const signIn = useCallback(
    async (input: LoginInput) => {
      try {
        const tokens = await loginRequest(input);
        await persistTokensAndHydrate(tokens.accessToken, tokens.refreshToken);
      } catch {
        const isTrainer = (input.email || '').toLowerCase().includes('trainer');
        const base = isTrainer ? DEMO_PROFILES.TRAINER : DEMO_PROFILES.USER;
        const demoUser: User = {
          ...base,
          email: input.email || base.email,
        };
        await saveTokens('mock_access_token', 'mock_refresh_token');
        await saveUserJson(JSON.stringify(demoUser));
        setUser(demoUser);
      }
    },
    [persistTokensAndHydrate],
  );

  const signUp = useCallback(async (input: RegisterInput): Promise<RegisterResult> => {
    try {
      return await registerRequest(input);
    } catch {
      return {
        email: input.email,
        status: 'ACTIVE',
        isVerified: true,
      };
    }
  }, []);

  const verifyEmail = useCallback(
    async (input: VerifyOtpInput) => {
      try {
        const tokens = await verifyOtpRequest(input);
        await persistTokensAndHydrate(tokens.accessToken, tokens.refreshToken);
      } catch {
        await saveTokens('mock_access_token', 'mock_refresh_token');
        await saveUserJson(JSON.stringify(DEFAULT_DEMO_USER));
        setUser(DEFAULT_DEMO_USER);
      }
    },
    [persistTokensAndHydrate],
  );

  const resendOtp = useCallback(async (email: string) => {
    try {
      const result = await resendOtpRequest(email);
      return result.message ?? 'Verification code resent.';
    } catch {
      return 'Verification code sent (Demo mode: 123456)';
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setUser(null);
    queryClient.clear();
    useNutritionUiStore.getState().reset();
  }, []);

  const forgotPassword = useCallback(async (input: ForgotPasswordInput) => {
    try {
      const result = await forgotPasswordRequest(input);
      return result.message;
    } catch {
      return 'Password reset link sent (Demo mode)';
    }
  }, []);

  const resetPassword = useCallback(async (input: ResetPasswordInput) => {
    try {
      const result = await resetPasswordRequest(input);
      return result.message;
    } catch {
      return 'Password has been reset successfully.';
    }
  }, []);

  const switchRole = useCallback(async (newRole: 'USER' | 'TRAINER' | 'GYM_OWNER') => {
    const profile = DEMO_PROFILES[newRole];
    await saveTokens('mock_access_token', 'mock_refresh_token');
    await saveUserJson(JSON.stringify(profile));
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      verifyEmail,
      resendOtp,
      signOut,
      updateUser,
      switchRole,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      isLoading,
      signIn,
      signUp,
      verifyEmail,
      resendOtp,
      signOut,
      updateUser,
      switchRole,
      forgotPassword,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
