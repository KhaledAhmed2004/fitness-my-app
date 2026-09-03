import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useNutritionUiStore } from '@/stores/nutrition-ui-store';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

const QUICK_ACTIONS = [
  {
    id: 'food',
    title: 'Log Food',
    subtitle: 'Track meals, snacks & calories',
    icon: 'restaurant' as const,
    color: C.primary,
    bgColor: C.primaryAlpha20,
    route: ROUTES.nutrition,
    isNutrition: true,
  },
  {
    id: 'workout',
    title: 'Start Run / Workout',
    subtitle: 'Begin GPS run or training session',
    icon: 'directions-run' as const,
    color: C.trainingAccent,
    bgColor: C.trainingAlpha20,
    route: '/training/run-session' as const,
  },
  {
    id: 'fasting',
    title: 'Fasting',
    subtitle: 'Track fasting timer & hydration',
    icon: 'timer' as const,
    color: '#89FE00',
    bgColor: 'rgba(137, 254, 0, 0.15)',
    route: ROUTES.fasting,
  },
];

export function QuickAddModal({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requestOpenLog = useNutritionUiStore((s) => s.requestOpenLog);

  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(300, { duration: 200, easing: Easing.in(Easing.ease) });
    }
  }, [visible, opacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const handlePressAction = (action: (typeof QUICK_ACTIONS)[0]) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onClose();

    setTimeout(() => {
      if (action.isNutrition) {
        requestOpenLog();
      }
      router.push(action.route as any);
    }, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop overlay */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.flex} onPress={onClose} />
        </Animated.View>

        {/* Animated Action Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}>
          <View style={styles.handleBar} />
          
          <Text style={styles.sheetTitle}>QUICK ACTIONS</Text>
          <Text style={styles.sheetSubtitle}>Choose an action to log</Text>

          <View style={styles.actionsList}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => handlePressAction(action)}
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && styles.actionCardPressed,
                ]}>
                <View style={[styles.iconBox, { backgroundColor: action.bgColor }]}>
                  <MaterialIcons name={action.icon} size={24} color={action.color} />
                </View>

                <View style={styles.actionTextContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>

                <MaterialIcons name="chevron-right" size={22} color={C.onSurfaceVariant} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  flex: {
    flex: 1,
  },
  sheet: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.outlineVariant,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sheetSubtitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: C.onSurface,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 16,
    gap: 14,
  },
  actionCardPressed: {
    opacity: 0.85,
    backgroundColor: C.surfaceHigh,
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContent: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: F.sansSemiBold,
    fontSize: 16,
    color: C.onSurface,
  },
  actionSubtitle: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
});
