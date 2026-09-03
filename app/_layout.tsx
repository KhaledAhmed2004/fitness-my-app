/**
 * MENTOR — Root layout responsibilities:
 * 1) Provide global theme + AuthProvider
 * 2) Hold ONE Stack for route groups
 * 3) Load Vital Serenity fonts
 * 4) Keep splash visible until auth + fonts ready
 */

import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  useFonts as useJetBrains,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts as useManrope,
} from '@expo-google-fonts/manrope';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import '../global.css';
import '@/lib/nativewind-interop';

import { QueryProvider } from '@/components/providers/query-provider';
import { VitalNavTheme } from '@/constants/vital-theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { useThemeStore } from '@/stores/theme-store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: 'index',
};

function CustomSplashScreen({ isReady }: { isReady: boolean }) {
  const [isVisible, setIsVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => setIsVisible(false));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: '#000000', opacity, zIndex: 9999 },
      ]}
      pointerEvents="none">
      <Image
        source={require('@/assets/images/splash.png')}
        style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
      />
    </Animated.View>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading } = useAuth();
  const { isDark } = useThemeStore();

  const isReady = !isLoading && fontsReady;

  return (
    <ThemeProvider value={VitalNavTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#101416' : '#F0F5EC' },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <CustomSplashScreen isReady={isReady} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [manropeLoaded] = useManrope({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [monoLoaded] = useJetBrains({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const fontsReady = manropeLoaded && monoLoaded;

  useEffect(() => {
    void useThemeStore.getState().loadTheme();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <QueryProvider>
          <RootNavigator fontsReady={fontsReady} />
        </QueryProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
