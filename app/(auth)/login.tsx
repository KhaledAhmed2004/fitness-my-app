import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { PrimaryButton } from '@/components/ui/primary-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { PasswordInput } from '@/components/auth/password-input';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/use-auth';
import { Vital } from '@/constants/vital-theme';
import {
  applyApiFieldErrors,
  getApiErrorMessage,
  isPendingVerificationError,
} from '@/lib/api-error';
import { loginSchema, type LoginFormValues } from '@/lib/auth-schemas';

const C = Vital.colors;
const F = Vital.fonts;

type DemoAccountType = 'USER' | 'TRAINER';

const DEMO_CREDENTIALS: Record<DemoAccountType, { name: string; email: string; pass: string; title: string; badge: string; icon: any; color: string; bg: string }> = {
  USER: {
    name: 'Khaled Nayeem',
    email: 'khaled@demo.com',
    pass: 'Password123!',
    title: 'Regular Athlete',
    badge: 'Member',
    icon: 'person',
    color: '#00B4D8',
    bg: 'rgba(0, 180, 216, 0.15)',
  },
  TRAINER: {
    name: 'Coach Alex',
    email: 'trainer@gym.com',
    pass: 'Trainer123!',
    title: 'Gym Trainer / Coach',
    badge: 'Certified Trainer',
    icon: 'fitness-center',
    color: '#89FE00',
    bg: 'rgba(137, 254, 0, 0.15)',
  },
};

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<DemoAccountType>('USER');

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEMO_CREDENTIALS.USER.email,
      password: DEMO_CREDENTIALS.USER.pass,
    },
  });

  const handleSelectDemo = (type: DemoAccountType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedDemo(type);
    setValue('email', DEMO_CREDENTIALS[type].email, { shouldValidate: true });
    setValue('password', DEMO_CREDENTIALS[type].pass, { shouldValidate: true });
    setFormError(null);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setPendingEmail(null);
    try {
      await signIn(values);
      router.replace(ROUTES.home);
    } catch (error) {
      applyApiFieldErrors(setError, error, ['email', 'password']);
      setFormError(getApiErrorMessage(error, 'Sign in failed.'));
      if (isPendingVerificationError(error)) {
        setPendingEmail(values.email.trim().toLowerCase());
      }
    }
  });

  const handleQuickDemoLogin = async (type: DemoAccountType) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setFormError(null);
    try {
      await signIn({
        email: DEMO_CREDENTIALS[type].email,
        password: DEMO_CREDENTIALS[type].pass,
      });
      router.replace(ROUTES.home);
    } catch {
      router.replace(ROUTES.home);
    }
  };

  return (
    <AuthScreen>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: '100%', height: 140, resizeMode: 'contain', alignSelf: 'center', marginBottom: 16 }}
      />
      <Text className="mb-1 text-[26px] font-extrabold text-ink">Welcome back</Text>
      <Text className="mb-5 text-[14px] leading-5 text-ink-muted">
        Sign in to your account or select a demo profile below.
      </Text>

      {/* DEMO PROFILE SELECTOR */}
      <View style={styles.demoBox}>
        <View style={styles.demoHeader}>
          <MaterialIcons name="vpn-key" size={16} color="#89FE00" />
          <Text style={styles.demoHeaderText}>QUICK DEMO CREDENTIALS</Text>
        </View>

        <View style={styles.demoCardsRow}>
          {/* USER PROFILE */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectDemo('USER')}
            style={[
              styles.demoCard,
              selectedDemo === 'USER' && styles.demoCardActiveUser,
            ]}>
            <View style={[styles.demoIconCircle, { backgroundColor: DEMO_CREDENTIALS.USER.bg }]}>
              <MaterialIcons name="person" size={20} color={DEMO_CREDENTIALS.USER.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.demoCardTitle}>Regular User</Text>
                <View style={[styles.miniBadge, { backgroundColor: 'rgba(0,180,216,0.15)' }]}>
                  <Text style={[styles.miniBadgeText, { color: '#00B4D8' }]}>Athlete</Text>
                </View>
              </View>
              <Text style={styles.demoCardEmail}>{DEMO_CREDENTIALS.USER.email}</Text>
            </View>
          </TouchableOpacity>

          {/* GYM TRAINER PROFILE */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectDemo('TRAINER')}
            style={[
              styles.demoCard,
              selectedDemo === 'TRAINER' && styles.demoCardActiveTrainer,
            ]}>
            <View style={[styles.demoIconCircle, { backgroundColor: DEMO_CREDENTIALS.TRAINER.bg }]}>
              <MaterialIcons name="fitness-center" size={20} color={DEMO_CREDENTIALS.TRAINER.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.demoCardTitle}>Gym Trainer</Text>
                <View style={[styles.miniBadge, { backgroundColor: 'rgba(137,254,0,0.15)' }]}>
                  <Text style={[styles.miniBadgeText, { color: '#89FE00' }]}>Trainer</Text>
                </View>
              </View>
              <Text style={styles.demoCardEmail}>{DEMO_CREDENTIALS.TRAINER.email}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextInput
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email?.message}
            placeholder="you@example.com"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput
            label="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoComplete="password"
            textContentType="password"
            error={errors.password?.message}
            placeholder="••••••••"
          />
        )}
      />

      {formError ? <Text className="mb-3 text-sm text-danger">{formError}</Text> : null}

      {pendingEmail ? (
        <Pressable
          className="mb-4"
          onPress={() =>
            router.push({
              pathname: ROUTES.verifyEmail,
              params: { email: pendingEmail || getValues('email') },
            })
          }>
          <Text className="text-center text-[15px] font-semibold text-brand">
            Verify email to continue
          </Text>
        </Pressable>
      ) : null}

      <View style={{ marginTop: 8, width: '100%', gap: 10 }}>
        <PrimaryButton label="Sign in" onPress={onSubmit} loading={isSubmitting} />

        <View style={styles.quickActionBtnsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleQuickDemoLogin('USER')}
            style={[styles.instantDemoBtn, { borderColor: 'rgba(0, 180, 216, 0.4)' }]}>
            <MaterialIcons name="person" size={16} color="#00B4D8" />
            <Text style={[styles.instantDemoBtnText, { color: '#00B4D8' }]}>
              ⚡ 1-Tap User Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleQuickDemoLogin('TRAINER')}
            style={[styles.instantDemoBtn, { borderColor: 'rgba(137, 254, 0, 0.4)' }]}>
            <MaterialIcons name="fitness-center" size={16} color="#89FE00" />
            <Text style={[styles.instantDemoBtnText, { color: '#89FE00' }]}>
              🏋️ 1-Tap Trainer Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-5 items-center gap-3">
        <Link href={ROUTES.forgotPassword} className="text-[15px] font-semibold text-brand">
          Forgot password?
        </Link>
        <Link href={ROUTES.register} className="text-[15px] font-semibold text-brand">
          Create account
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  demoBox: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoHeaderText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: C.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  demoCardsRow: {
    gap: 8,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  demoCardActiveUser: {
    borderColor: '#00B4D8',
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
  },
  demoCardActiveTrainer: {
    borderColor: '#89FE00',
    backgroundColor: 'rgba(137, 254, 0, 0.08)',
  },
  demoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoCardTitle: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  demoCardEmail: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  quickActionBtnsRow: {
    gap: 8,
    marginTop: 4,
  },
  instantDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  instantDemoBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
});
