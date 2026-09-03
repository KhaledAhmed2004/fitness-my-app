import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useNutritionUiStore } from '@/stores/nutrition-ui-store';
import { FeatureKey, useFeaturesStore } from '@/stores/features-store';
import { useAuth } from '@/hooks/use-auth';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

type FloatingItemDef = {
  id: string;
  featureKey: FeatureKey;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
  bgColor: string;
  route: any;
  isNutrition?: boolean;
};

const ALL_FLOATING_ITEMS: FloatingItemDef[] = [
  {
    id: 'food',
    featureKey: 'nutrition',
    label: 'Log Food',
    shortLabel: 'Food',
    icon: 'restaurant',
    color: C.primary,
    bgColor: C.primaryAlpha20,
    route: ROUTES.nutrition,
    isNutrition: true,
  },
  {
    id: 'workout',
    featureKey: 'running',
    label: 'Start Run',
    shortLabel: 'Workout',
    icon: 'directions-run',
    color: C.trainingAccent,
    bgColor: C.trainingAlpha20,
    route: '/training/run-session',
  },
  {
    id: 'focus',
    featureKey: 'deepFocus',
    label: 'Today Focus',
    shortLabel: 'Focus',
    icon: 'track-changes',
    color: '#FCC419',
    bgColor: 'rgba(252, 196, 25, 0.18)',
    route: ROUTES.todayFocus,
  },
  {
    id: 'fasting',
    featureKey: 'fasting',
    label: 'Fasting',
    shortLabel: 'Fast',
    icon: 'timer',
    color: '#89FE00',
    bgColor: 'rgba(137, 254, 0, 0.15)',
    route: ROUTES.fasting,
  },
];

const TRAINER_FLOATING_ITEMS: FloatingItemDef[] = [
  {
    id: 'clients',
    featureKey: 'fasting',
    label: 'Athlete CRM',
    shortLabel: 'Clients',
    icon: 'groups',
    color: '#00B4D8',
    bgColor: 'rgba(0, 180, 216, 0.18)',
    route: ROUTES.fasting,
  },
  {
    id: 'schedule',
    featureKey: 'running',
    label: 'PT Schedule',
    shortLabel: 'Schedule',
    icon: 'calendar-month',
    color: '#89FE00',
    bgColor: 'rgba(137, 254, 0, 0.18)',
    route: ROUTES.training,
  },
  {
    id: 'food',
    featureKey: 'nutrition',
    label: 'Log Food',
    shortLabel: 'Food',
    icon: 'restaurant',
    color: C.primary,
    bgColor: C.primaryAlpha20,
    route: ROUTES.nutrition,
    isNutrition: true,
  },
  {
    id: 'focus',
    featureKey: 'deepFocus',
    label: 'Today Focus',
    shortLabel: 'Focus',
    icon: 'track-changes',
    color: '#FCC419',
    bgColor: 'rgba(252, 196, 25, 0.18)',
    route: ROUTES.todayFocus,
  },
];

const GYM_OWNER_FLOATING_ITEMS: FloatingItemDef[] = [
  {
    id: 'members',
    featureKey: 'fasting',
    label: 'Member CRM',
    shortLabel: 'Members',
    icon: 'people-alt',
    color: '#FFB800',
    bgColor: 'rgba(255, 184, 0, 0.18)',
    route: ROUTES.fasting,
  },
  {
    id: 'floor',
    featureKey: 'running',
    label: 'Floor Ops',
    shortLabel: 'Floor',
    icon: 'fitness-center',
    color: '#89FE00',
    bgColor: 'rgba(137, 254, 0, 0.18)',
    route: ROUTES.training,
  },
  {
    id: 'proshop',
    featureKey: 'nutrition',
    label: 'Pro-Shop POS',
    shortLabel: 'Pro-Shop',
    icon: 'local-cafe',
    color: '#FF922B',
    bgColor: 'rgba(255, 146, 43, 0.18)',
    route: ROUTES.nutrition,
  },
  {
    id: 'facility',
    featureKey: 'deepFocus',
    label: 'Facility Hub',
    shortLabel: 'Hub',
    icon: 'storefront',
    color: '#A78BFA',
    bgColor: 'rgba(167, 139, 250, 0.18)',
    route: ROUTES.today,
  },
];

type PlacedFloatingItem = FloatingItemDef & {
  targetX: number;
  targetY: number;
};

function RadialPillItem({
  item,
  index,
  visible,
  onPress,
}: {
  item: PlacedFloatingItem;
  index: number;
  visible: boolean;
  onPress: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.2);

  useEffect(() => {
    if (visible) {
      const delay = index * 35;
      const easing = Easing.out(Easing.cubic);
      opacity.value = withDelay(delay, withTiming(1, { duration: 200, easing }));
      translateX.value = withDelay(
        delay,
        withTiming(item.targetX, { duration: 240, easing }),
      );
      translateY.value = withDelay(
        delay,
        withTiming(item.targetY, { duration: 240, easing }),
      );
      scale.value = withDelay(
        delay,
        withTiming(1, { duration: 220, easing }),
      );
    } else {
      const easing = Easing.in(Easing.cubic);
      opacity.value = withTiming(0, { duration: 140, easing });
      translateX.value = withTiming(0, { duration: 160, easing });
      translateY.value = withTiming(0, { duration: 160, easing });
      scale.value = withTiming(0.2, { duration: 160, easing });
    }
  }, [visible, index, item.targetX, item.targetY, opacity, translateX, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.radialPillItem, animatedStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardBox,
          pressed && styles.cardBoxPressed,
        ]}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={40}
            tint="dark"
            style={[styles.iconBadge, { overflow: 'hidden', borderColor: item.color + '55', borderWidth: 1 }]}>
            <View style={[styles.iconBadgeBase, { backgroundColor: C.surfaceContainerHigh }]} />
            <View style={[styles.iconBadgeInner]}>
              <MaterialIcons name={item.icon} size={20} color={item.color} />
            </View>
          </BlurView>
        ) : (
          <View style={[styles.iconBadge, { borderColor: item.color + '55', borderWidth: 1, overflow: 'hidden' }]}>
            <View style={[styles.iconBadgeBase, { backgroundColor: C.surfaceContainerHigh }]} />
            <View style={[styles.iconBadgeInner, { backgroundColor: item.bgColor }]}>
              <MaterialIcons name={item.icon} size={20} color={item.color} />
            </View>
          </View>
        )}
        <Text style={styles.cardLabel} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function FloatingSpeedDial({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requestOpenLog = useNutritionUiStore((s) => s.requestOpenLog);
  const { features } = useFeaturesStore();
  const { user } = useAuth();
  const isTrainer = user?.role === 'TRAINER' || (user?.email || '').toLowerCase().includes('trainer');
  const isGymOwner = user?.role === 'GYM_OWNER';

  const centerBottom = Math.max(insets.bottom, 10) + 16;

  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) });
    }
  }, [visible, backdropOpacity]);

  const activeItems = useMemo<PlacedFloatingItem[]>(() => {
    const rawItems = isGymOwner
      ? GYM_OWNER_FLOATING_ITEMS
      : isTrainer
      ? TRAINER_FLOATING_ITEMS
      : ALL_FLOATING_ITEMS;
    const filtered = rawItems.filter(
      (item) => features[item.featureKey] !== false
    );

    const count = filtered.length;
    if (count === 0) return [];

    const radius = 155;
    const startAngle = -150;
    const endAngle = -30;

    return filtered.map((item, index) => {
      let angleDeg = -90;
      if (count > 1) {
        angleDeg = startAngle + (index / (count - 1)) * (endAngle - startAngle);
      }
      const rad = (angleDeg * Math.PI) / 180;
      const targetX = Math.round(radius * Math.cos(rad));
      const targetY = Math.round(radius * Math.sin(rad));

      return {
        ...item,
        targetX,
        targetY,
      };
    });
  }, [features, isTrainer]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  const handlePressItem = (item: PlacedFloatingItem) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onClose();

    setTimeout(() => {
      if (item.isNutrition) {
        requestOpenLog();
      }
      router.push(item.route as any);
    }, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Dark overlay always visible */}
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="box-none">
          <Pressable style={styles.flex} onPress={onClose} />
        </Animated.View>

        {/* iOS-only: Blur layer on top for frosted glass */}
        {Platform.OS === 'ios' && (
          <AnimatedBlurView
            intensity={65}
            tint="dark"
            style={[styles.blurOverlay, backdropStyle]}
            pointerEvents="none"
          />
        )}

        {/* Fan-out Radial Container anchored to center + button */}
        <View style={[styles.centerAnchor, { bottom: centerBottom }]}>
          {activeItems.map((item, index) => (
            <RadialPillItem
              key={item.id}
              item={item}
              index={index}
              visible={visible}
              onPress={() => handlePressItem(item)}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFill,
  },
  flex: {
    flex: 1,
  },
  centerAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialPillItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBox: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 78,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  cardBoxPressed: {
    opacity: 0.85,
    backgroundColor: C.surfaceHigh,
    transform: [{ scale: 0.95 }],
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  iconBadgeBase: {
    ...StyleSheet.absoluteFill,
  },
  iconBadgeInner: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: C.onSurface,
    textAlign: 'center',
    alignSelf: 'center',
  },
});
