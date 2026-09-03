/**
 * MENTOR: (app) group = protected routes.
 * No session → send to login. This is your route guard.
 */

import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';

export default function AppLayout() {
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

  if (!isAuthenticated) {
    return <Redirect href={ROUTES.login} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="fasting" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="today-focus" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="customize-modules" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="help-support" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="units-language" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="security-sessions" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="training" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="gym-member-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>

  );
}
