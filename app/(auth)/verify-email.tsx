import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { OtpCodeInput, OTP_CODE_LENGTH } from '@/components/auth/otp-code-input';
import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/api-error';

const C = Vital.colors;
const F = Vital.fonts;
const RESEND_COOLDOWN_SEC = 60;

export default function VerifyEmailScreen() {
  const { verifyEmail, resendOtp } = useAuth();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const emailParam = useMemo(() => {
    const raw = params.email;
    return (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase() ?? '';
  }, [params.email]);

  const [otp, setOtp] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setOtp('');
    setFormError(null);
    setInfo(null);
  }, [emailParam]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submit = async (code: string) => {
    if (!emailParam || submitting) return;
    if (code.length !== OTP_CODE_LENGTH) {
      setFormError(`Enter the ${OTP_CODE_LENGTH}-digit code`);
      return;
    }

    setFormError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await verifyEmail({ email: emailParam, otp: code });
      router.replace(ROUTES.home);
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Verification failed.'));
      setOtp('');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!emailParam || cooldown > 0 || resending) return;
    setFormError(null);
    setResending(true);
    try {
      const message = await resendOtp(emailParam);
      setInfo(message);
      setCooldown(RESEND_COOLDOWN_SEC);
      setOtp('');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Could not resend code.'));
    } finally {
      setResending(false);
    }
  };

  if (!emailParam) {
    return (
      <AuthScreen>
        <Text style={styles.title}>Verify email</Text>
        <Text style={styles.body}>
          Missing email. Start again from registration or sign in.
        </Text>
        <Link href={ROUTES.register} style={styles.link}>
          Back to register
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: '100%', height: 160, resizeMode: 'contain', alignSelf: 'center', marginBottom: 24 }}
      />
      <Text style={styles.title}>Enter your code</Text>
      <Text style={styles.body}>We sent a {OTP_CODE_LENGTH}-digit code to</Text>

      <View style={styles.emailChip}>
        <Text style={styles.emailText} numberOfLines={1}>
          {emailParam}
        </Text>
      </View>

      <View style={styles.otpBlock}>
        <OtpCodeInput
          value={otp}
          onChange={(code) => {
            setFormError(null);
            setOtp(code);
          }}
          onComplete={(code) => {
            submit(code).catch(() => {});
          }}
          error={formError ?? undefined}
          disabled={submitting}
        />
      </View>

      {info ? <Text style={styles.info}>{info}</Text> : null}

      <PrimaryButton
        label="Verify & continue"
        onPress={() => submit(otp)}
        loading={submitting}
        disabled={otp.length !== OTP_CODE_LENGTH}
      />

      <View style={styles.resendRow}>
        <Text style={styles.resendHint}>Didn’t get it?</Text>
        <Pressable
          onPress={onResend}
          disabled={cooldown > 0 || resending}
          style={{ opacity: cooldown > 0 || resending ? 0.45 : 1 }}>
          <Text style={styles.resendAction}>
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resending
                ? 'Sending…'
                : 'Resend code'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Link href={ROUTES.login} style={styles.link}>
          Back to sign in
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: C.primary,
    fontSize: 12,
    fontFamily: F.mono,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  title: {
    color: C.onSurface,
    fontSize: 28,
    fontFamily: F.sansExtraBold,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  body: {
    color: C.onSurfaceVariant,
    fontSize: 15,
    fontFamily: F.sans,
    lineHeight: 22,
  },
  emailChip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 28,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(137,206,255,0.12)',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  emailText: {
    color: C.primary,
    fontSize: 14,
    fontFamily: F.mono,
  },
  otpBlock: {
    marginBottom: 20,
  },
  info: {
    color: C.secondaryContainer,
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    marginBottom: 12,
  },
  resendRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  resendHint: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: F.sans,
  },
  resendAction: {
    color: C.primary,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    color: C.primary,
    fontSize: 15,
    fontFamily: F.sansSemiBold,
  },
});
