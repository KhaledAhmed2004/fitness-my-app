import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View, Image } from 'react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { PasswordInput } from '@/components/auth/password-input';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/use-auth';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/auth-schemas';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: typeof params.email === 'string' ? params.email : '',
      code: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccess(null);
    try {
      const message = await resetPassword({
        email: values.email,
        code: values.code,
        password: values.password,
      });
      setSuccess(message);
      router.replace(ROUTES.login);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Reset failed.');
    }
  });

  return (
    <AuthScreen>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: '100%', height: 160, resizeMode: 'contain', alignSelf: 'center', marginBottom: 24 }}
      />
      <Text className="mb-2 text-[28px] font-extrabold text-ink">Reset password</Text>
      <Text className="mb-6 text-[15px] leading-6 text-ink-muted">
        Use the code from email. Mock code: 123456
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

      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextInput
            label="Reset code"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="number-pad"
            error={errors.code?.message}
            placeholder="123456"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput
            label="New password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password?.message}
            placeholder="At least 8 characters"
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput
            label="Confirm new password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.confirmPassword?.message}
            placeholder="Repeat password"
          />
        )}
      />

      {formError ? <Text className="mb-3 text-sm text-danger">{formError}</Text> : null}
      {success ? <Text className="mb-3 text-sm text-success">{success}</Text> : null}

      <PrimaryButton label="Update password" onPress={onSubmit} loading={isSubmitting} />

      <View className="mt-5 items-center">
        <Link href={ROUTES.login} className="text-[15px] font-semibold text-brand">
          Back to sign in
        </Link>
      </View>
    </AuthScreen>
  );
}
