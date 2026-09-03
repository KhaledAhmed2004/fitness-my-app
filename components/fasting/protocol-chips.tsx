import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Vital } from '@/constants/vital-theme';
import type { FastingProtocol, SelectableProtocolPreset } from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  protocols: SelectableProtocolPreset[];
  selected: FastingProtocol;
  disabled?: boolean;
  onSelect: (protocol: Exclude<FastingProtocol, 'CUSTOM'>) => void;
};

/**
 * MENTOR: Chips from GET /fasting/protocols (CUSTOM filtered by screen).
 * Layout on Views only — NativeWind strips flex/width on Pressable.
 */
export function ProtocolChips({ protocols, selected, disabled, onSelect }: Props) {
  const pick = (protocol: Exclude<FastingProtocol, 'CUSTOM'>) => {
    if (disabled || protocol === selected) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onSelect(protocol);
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.wrap}>
      <Text style={styles.title}>Protocol</Text>

      <View style={styles.grid}>
        {protocols.map((preset) => {
          const active = selected === preset.code;
          const { code, fastingHours, eatingHours } = preset;
          return (
            <View key={code} style={styles.slot}>
              <Pressable
                disabled={disabled}
                onPress={() => pick(code)}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: !!disabled }}
                accessibilityLabel={`${code}, ${fastingHours} hour fast, ${eatingHours} hour eating window${
                  active ? ', selected' : ''
                }`}
                style={({ pressed }) => [pressed && !disabled && { opacity: 0.88 }]}>
                <View
                  style={[
                    styles.chip,
                    active && styles.chipActive,
                    disabled && styles.chipDisabled,
                  ]}>
                  <Text style={[styles.protocol, active && styles.protocolActive]}>{code}</Text>
                  <Text style={[styles.split, active && styles.splitActive]}>
                    {fastingHours}h fast / {eatingHours}h eat
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  title: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sansSemiBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  slot: {
    width: '48.5%',
  },
  chip: {
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: C.primary,
    backgroundColor: C.glow,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  protocol: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansExtraBold,
    letterSpacing: -0.4,
  },
  protocolActive: {
    color: C.primary,
  },
  split: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.mono,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  splitActive: {
    color: C.onSurface,
  },
});
