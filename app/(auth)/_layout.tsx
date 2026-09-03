/**
 * MENTOR: (auth) group = public screens only.
 * If the user is already signed in, bounce them into the app.
 */

import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';

export default function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Vital.colors.background }}>
        <ActivityIndicator size="large" color={Vital.colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={ROUTES.home} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
