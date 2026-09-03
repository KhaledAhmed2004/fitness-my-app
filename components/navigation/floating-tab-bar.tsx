import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FloatingSpeedDial } from '@/components/navigation/floating-speed-dial';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColors } from '@/hooks/use-theme-colors';

const C = Vital.colors;
const F = Vital.fonts;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH - 32;
const BAR_HEIGHT = 64;
const BUMP_HEIGHT = 24;

const getPath = (width: number, height: number, bumpHeight: number) => {
  const center = width / 2;
  const cr = 32; 
  const th = bumpHeight;
  const totalH = height + bumpHeight; 
  const dipDepth = th + 28;
  
  return `
    M ${cr} ${th}
    L ${center - 55} ${th}
    C ${center - 25} ${th}, ${center - 32} ${dipDepth}, ${center} ${dipDepth}
    C ${center + 32} ${dipDepth}, ${center + 25} ${th}, ${center + 55} ${th}
    L ${width - cr} ${th}
    A ${cr} ${cr} 0 0 1 ${width} ${th + cr}
    L ${width} ${totalH - cr}
    A ${cr} ${cr} 0 0 1 ${width - cr} ${totalH}
    L ${cr} ${totalH}
    A ${cr} ${cr} 0 0 1 0 ${totalH - cr}
    L 0 ${th + cr}
    A ${cr} ${cr} 0 0 1 ${cr} ${th}
    Z
  `;
};

type TabMeta = {
  key: string;
  label: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  isCenter?: boolean;
};

const CLIENT_TAB_META: Record<string, TabMeta> = {
  index: { key: 'index', label: 'Home', icon: 'home' },
  nutrition: { key: 'nutrition', label: 'Nutrition', icon: 'restaurant' },
  add: { key: 'add', label: 'Add', icon: 'add', isCenter: true },
  fasting: { key: 'fasting', label: 'Fasting', icon: 'timer' },
  training: { key: 'training', label: 'Training', icon: 'fitness-center' },
};

const TRAINER_TAB_META: Record<string, TabMeta> = {
  index: { key: 'index', label: 'Home', icon: 'home' },
  nutrition: { key: 'nutrition', label: 'Diets', icon: 'restaurant-menu' },
  add: { key: 'add', label: 'Add', icon: 'add', isCenter: true },
  fasting: { key: 'fasting', label: 'Clients', icon: 'groups' },
  training: { key: 'training', label: 'Studio', icon: 'sports' },
};

const GYM_OWNER_TAB_META: Record<string, TabMeta> = {
  index: { key: 'index', label: 'Facility', icon: 'storefront' },
  nutrition: { key: 'nutrition', label: 'Pro-Shop', icon: 'local-cafe' },
  add: { key: 'add', label: 'Quick Ops', icon: 'add', isCenter: true },
  fasting: { key: 'fasting', label: 'Members', icon: 'people-alt' },
  training: { key: 'training', label: 'Floor Ops', icon: 'fitness-center' },
};

export type FloatingTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { user } = useAuth();
  const { colors, isDark } = useThemeColors();
  const isTrainer = user?.role === 'TRAINER' || (user?.email || '').toLowerCase().includes('trainer');
  const isGymOwner = user?.role === 'GYM_OWNER';

  const currentRouteName = state.routes[state.index]?.name;
  const isCoachScreen = isTrainer && (currentRouteName === 'fasting' || currentRouteName === 'training');
  const isOwnerScreen = isGymOwner && (currentRouteName === 'fasting' || currentRouteName === 'training' || currentRouteName === 'nutrition');
  const isSageMode = !isDark || isCoachScreen || isOwnerScreen;

  const StyleColors = {
    pillBg: colors.navPillBg,
    activeCircleBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(180, 232, 118, 0.18)',
    inactiveIcon: colors.navInactiveIcon,
    activeIcon: colors.navActiveIcon,
    addBtnBg: colors.navAddBtnBg,
    addBtnIcon: colors.navAddBtnIcon,
    shadowColor: colors.shadowColor || '#000',
  };

  const rotateVal = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    rotateVal.value = withTiming(quickAddOpen ? 1 : 0, { duration: 220, easing });
  }, [quickAddOpen, rotateVal]);

  const addIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateVal.value * 135}deg` }],
  }));

  return (
    <>
      <View
        style={{
          position: 'absolute',
          bottom: bottomPad,
          left: 16,
          right: 16,
          height: BAR_HEIGHT + BUMP_HEIGHT,
          alignItems: 'center',
          ...Platform.select({
            ios: {
              shadowColor: StyleColors.shadowColor,
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            },
            android: { elevation: 12 },
            default: {},
          }),
        }}>
        
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Svg width={BAR_WIDTH} height={BAR_HEIGHT + BUMP_HEIGHT} viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT + BUMP_HEIGHT}`}>
            <Path
              d={getPath(BAR_WIDTH, BAR_HEIGHT, BUMP_HEIGHT)}
              fill={StyleColors.pillBg}
            /> 
          </Svg>
        </View>

        <View style={{ flexDirection: 'row', height: BAR_HEIGHT, marginTop: BUMP_HEIGHT }}>
          {state.routes.map((route, index) => {
            const tabMetaMap = isGymOwner
              ? GYM_OWNER_TAB_META
              : isTrainer
              ? TRAINER_TAB_META
              : CLIENT_TAB_META;
            const meta = tabMetaMap[route.name] ?? {
              key: route.name,
              label: route.name,
              icon: 'circle' as const,
            };
            const focused = state.index === index;
            const { options } = descriptors[route.key];

            const onPress = () => {
              if (meta.isCenter) {
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                }
                setQuickAddOpen((prev) => !prev);
                return;
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              if (meta.isCenter) {
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
                }
                setQuickAddOpen((prev) => !prev);
                return;
              }
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            if (meta.isCenter) {
              return (
                <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={focused ? { selected: true } : {}}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={{
                      marginTop: -32,
                      height: 56,
                      width: 56,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: StyleColors.addBtnBg,
                      zIndex: 1000,
                    }}>
                    <Animated.View style={addIconStyle}>
                      <MaterialIcons name="add" size={32} color={StyleColors.addBtnIcon} />
                    </Animated.View>
                  </Pressable>
                </View>
              );
            }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{
                width: 52,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaterialIcons
                  name={meta.icon}
                  size={24}
                  color={focused ? StyleColors.activeIcon : StyleColors.inactiveIcon}
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: focused ? F.sansSemiBold : F.sansMedium,
                    color: focused ? StyleColors.activeIcon : StyleColors.inactiveIcon,
                    marginTop: 2,
                  }}>
                  {meta.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
    <FloatingSpeedDial visible={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}
