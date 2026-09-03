import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getOnboardingCompleted } from '@/app/onboarding';
import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';

export default function Index() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await getOnboardingCompleted();
        setHasCompletedOnboarding(completed);
      } catch {
        setHasCompletedOnboarding(false);
      } finally {
        setOnboardingChecked(true);
      }
    };
    void checkOnboarding();
  }, []);

  if (authLoading || !onboardingChecked) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Vital.colors.background,
        }}>
        <ActivityIndicator size="large" color={Vital.colors.primary} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href={ROUTES.onboarding} />;
  }

  if (isAuthenticated) {
    return <Redirect href={ROUTES.home} />;
  }

  return <Redirect href={ROUTES.login} />;
}
