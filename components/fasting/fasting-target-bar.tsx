import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Vital } from '@/constants/vital-theme';
import type { FastingProtocol } from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  protocol: FastingProtocol;
  fastingHours: number;
  targetEndTime: string;
  onChangeTarget: () => void;
};

/**
 * MENTOR: Replaces the heavy 4-card protocol grid during active fasting.
 * Preserves full awareness of the goal with an intuitive change trigger.
 * Notice: All layout styles are placed on inner Views to prevent NativeWind from stripping flex rows.
 */
export function FastingTargetBar({
  protocol,
  fastingHours,
  targetEndTime,
  onChangeTarget,
}: Props) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onChangeTarget();
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.container}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Current goal: ${protocol} protocol, ${Math.round(fastingHours)} hours. ${targetEndTime}. Tap to change target.`}
        style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.85 }]}>
        <View style={styles.innerRow}>
          {/* Target Icon & Info */}
          <View style={styles.infoLeft}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="flag" size={18} color={C.primary} />
            </View>
            <View style={styles.textGroup}>
              <View style={styles.titleRow}>
                <Text style={styles.protocolBadge}>{protocol}</Text>
                <Text style={styles.goalText}>{Math.round(fastingHours)}h Target</Text>
              </View>
              <Text style={styles.targetEnd}>{targetEndTime}</Text>
            </View>
          </View>

          {/* Change Target Action Pill */}
          <View style={styles.changeAction}>
            <Text style={styles.changeText}>Adjust</Text>
            <MaterialIcons name="tune" size={14} color={C.primary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: C.surfaceLow,
    overflow: 'hidden',
  },
  pressable: {
    width: '100%',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 224, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 224, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  protocolBadge: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  goalText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sansMedium,
  },
  targetEnd: {
    color: C.primary,
    fontSize: 12,
    fontFamily: F.sansSemiBold,
  },
  changeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  changeText: {
    color: C.primary,
    fontSize: 12,
    fontFamily: F.sansSemiBold,
  },
});
