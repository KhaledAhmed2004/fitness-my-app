import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View, Image } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { DateOfBirthField } from '@/components/auth/date-of-birth-field';
import { PasswordInput } from '@/components/auth/password-input';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/use-auth';
import { applyApiFieldErrors, getApiErrorMessage } from '@/lib/api-error';
import {
  registerSchema,
  toApiDateOfBirth,
  type RegisterFormValues,
} from '@/lib/auth-schemas';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
        dateOfBirth: toApiDateOfBirth(values.dateOfBirth),
      });
      router.push({
        pathname: ROUTES.verifyEmail,
        params: { email: result.email },
      });
    } catch (error) {
      applyApiFieldErrors(setError, error, [
        'name',
        'email',
        'password',
        'dateOfBirth',
      ]);
      setFormError(getApiErrorMessage(error, 'Sign up failed.'));
    }
  });

  return (
    <AuthScreen>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: '100%', height: 160, resizeMode: 'contain', alignSelf: 'center', marginBottom: 24 }}
      />
      <Text className="mb-2 text-[28px] font-extrabold text-ink">Create account</Text>
      <Text className="mb-6 text-[15px] leading-6 text-ink-muted">
        We will email a verification code before you can sign in.
      </Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextInput
            label="Full name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            error={errors.name?.message}
            placeholder="Alex Rivera"
          />
        )}
      />

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
        name="dateOfBirth"
        render={({ field: { onChange, value } }) => (
          <DateOfBirthField
            label="Date of birth"
            value={value}
            onChange={onChange}
            error={errors.dateOfBirth?.message}
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
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password?.message}
            placeholder="Upper, lower, number, special, 8+"
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput
            label="Confirm password"
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

      <PrimaryButton label="Create account" onPress={onSubmit} loading={isSubmitting} />

      <View className="mt-5 items-center">
        <Link href={ROUTES.login} className="text-[15px] font-semibold text-brand">
          Already have an account? Sign in
        </Link>
      </View>
    </AuthScreen>
  );
}
