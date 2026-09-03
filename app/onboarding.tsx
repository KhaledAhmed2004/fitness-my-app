import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingDeviceMockup } from '@/components/onboarding';
import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = Vital.colors;
const F = Vital.fonts;

export const ONBOARDING_COMPLETED_KEY = 'trackme_onboarding_completed_v1';

export async function setOnboardingCompleted() {
  if (Platform.OS === 'web') {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    return;
  }
  await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true');
}

export async function getOnboardingCompleted(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  }
  const val = await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY);
  return val === 'true';
}

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  slideIndex: number;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'slide-finance',
    title: 'Manage and Organize your Finances',
    subtitle: 'Use the possibilities of a personal account, Save and Invest',
    slideIndex: 0,
  },
  {
    id: 'slide-routine',
    title: 'Master Your Daily Routine',
    subtitle: 'Build lasting discipline with time-locked circadian protocols & streak tracking',
    slideIndex: 1,
  },
  {
    id: 'slide-todos',
    title: 'Execute What Truly Matters',
    subtitle: 'Streamline your day with weighted priorities (P1-P4), subtasks & focus planning',
    slideIndex: 2,
  },
  {
    id: 'slide-health',
    title: 'Elevate Health & Performance',
    subtitle: 'Track fasting intervals, nutrition macros & fitness bio-telemetry in real-time',
    slideIndex: 3,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await setOnboardingCompleted();
    router.replace(ROUTES.home);
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}>
      {/* TOP HEADER (BRAND & SKIP) */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandTitle}>TrackMe</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleFinish}
          style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* SWIPEABLE SLIDES CAROUSEL */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        style={styles.carouselList}
        renderItem={({ item }) => (
          <View style={styles.slideContainer}>
            {/* TOP 3D DEVICE MOCKUP */}
            <View style={styles.mockupWrapper}>
              <OnboardingDeviceMockup slideIndex={item.slideIndex} />
            </View>

            {/* TEXT CONTENT CONTAINER */}
            <View style={styles.textContainer}>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* BOTTOM CONTROLLER (DOTS & ACTION BUTTON) */}
      <View style={styles.bottomControls}>
        {/* PAGINATION DOTS */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* GET STARTED / CONTINUE BUTTON */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>
            {isLastSlide ? 'Get Started' : 'Continue'}
          </Text>
          <MaterialIcons
            name={isLastSlide ? 'arrow-forward' : 'chevron-right'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101416',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6C5CE7',
  },
  brandTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: C.onSurface,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skipBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  carouselList: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  mockupWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 410,
    marginTop: 10,
  },
  textContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    gap: 10,
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontFamily: F.sansBold,
    fontSize: 24,
    color: C.onSurface,
    textAlign: 'center',
    lineHeight: 30,
  },
  slideSubtitle: {
    fontFamily: F.sans,
    fontSize: 14,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 20,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#6C5CE7',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 24,
    paddingVertical: 16,
    gap: 6,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  actionBtnText: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
