import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';
import {
  fastingHistoryOutcome,
  fastingHistoryOutcomeLabel,
  formatDurationMinutes,
  formatRelativeDay,
} from '@/lib/fasting-format';
import type { FastingSessionStatus } from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  session: FastingSessionStatus;
  onPress?: () => void;
  showDivider?: boolean;
};

export function FastingSessionRow({ session, onPress, showDivider = false }: Props) {
  const outcome = fastingHistoryOutcome(session);
  const success = outcome !== 'early';

  const handlePress = () => {
    if (!onPress) return;
    void Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${formatRelativeDay(session.startedAt)}, ${fastingHistoryOutcomeLabel(outcome)}, ${formatDurationMinutes(session.elapsedMinutes)}`}
      style={({ pressed }) => [
        styles.pressable,
        pressed && onPress && styles.pressablePressed,
      ]}>
      {/* 
        CRITICAL: Keep flex layout styles on the inner View, NOT on Pressable.
        NativeWind v4/v5 resets flexDirection: 'row' on Pressable components.
      */}
      <View style={[styles.row, showDivider && styles.rowDivider]}>
        {/* Status Icon Badge */}
        <View style={[styles.iconBox, success ? styles.iconOk : styles.iconEarly]}>
          <MaterialIcons
            name={success ? 'check' : 'close'}
            size={16}
            color={success ? C.secondary : C.error}
          />
        </View>

        {/* Day and Outcome Label */}
        <View style={styles.copy}>
          <Text style={styles.day}>{formatRelativeDay(session.startedAt)}</Text>
          <Text style={[styles.outcome, success ? styles.outcomeOk : styles.outcomeEarly]}>
            {fastingHistoryOutcomeLabel(outcome)}
          </Text>
        </View>

        {/* Duration and Chevron */}
        <View style={styles.right}>
          <Text style={[styles.duration, !success && styles.durationEarly]}>
            {formatDurationMinutes(session.elapsedMinutes)}
          </Text>
          {onPress ? (
            <MaterialIcons name="chevron-right" size={20} color={C.onSurfaceVariant} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  pressablePressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.glassBorder,
  },
  iconBox: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconOk: {
    backgroundColor: 'rgba(56, 224, 255, 0.12)',
  },
  iconEarly: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  day: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansSemiBold,
    letterSpacing: -0.2,
  },
  outcome: {
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 0.3,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  outcomeOk: {
    color: C.onSurfaceVariant,
  },
  outcomeEarly: {
    color: C.error,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  duration: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
  durationEarly: {
    color: C.error,
  },
});
