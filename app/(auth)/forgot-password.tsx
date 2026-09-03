import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View, Image } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/use-auth';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/auth-schemas';

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccess(null);
    try {
      const message = await forgotPassword(values);
      setSuccess(message);
      router.push({
        pathname: ROUTES.resetPassword,
        params: { email: values.email },
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Request failed.');
    }
  });

  return (
    <AuthScreen>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: '100%', height: 160, resizeMode: 'contain', alignSelf: 'center', marginBottom: 24 }}
      />
      <Text className="mb-2 text-[28px] font-extrabold text-ink">Forgot password</Text>
      <Text className="mb-6 text-[15px] leading-6 text-ink-muted">
        Enter your email and we&apos;ll send a reset code. Mock code is always 123456.
      </Text>

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

      {formError ? <Text className="mb-3 text-sm text-danger">{formError}</Text> : null}
      {success ? <Text className="mb-3 text-sm text-success">{success}</Text> : null}

      <PrimaryButton label="Send reset code" onPress={onSubmit} loading={isSubmitting} />

      <View className="mt-5 items-center gap-3">
        <Link
          href={{
            pathname: ROUTES.resetPassword,
            params: { email: getValues('email') },
          }}
          className="text-[15px] font-semibold text-brand">
          I already have a code
        </Link>
        <Link href={ROUTES.login} className="text-[15px] font-semibold text-brand">
          Back to sign in
        </Link>
      </View>
    </AuthScreen>
  );
}
