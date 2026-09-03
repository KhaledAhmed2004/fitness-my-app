import React, { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View, TextStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { formatDurationMinutes } from '@/lib/fasting-format';
import { FastingStopwatchDial } from '@/components/fasting/fasting-stopwatch-dial';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  mode: 'idle' | 'active';
  progressPercent: number;
  remainingMinutes: number;
  elapsedMinutes: number;
  goalMet: boolean;
  protocolLabel: string;
  idleHours?: number;
  idleEatingHours?: number;
  planInfo?: string | null;
  metaLine?: string | null;
  startTimeLabel?: string | null;
  targetEndTime?: string | null;
  onEditFast?: () => void;
  onEditStart?: () => void;
  onChangeTarget?: () => void;
};

/**
 * FastingHero — featuring authentic Stopwatch Analog Dial with tick marks,
 * green shaded sector, glowing arrow hands, and live countdown.
 */
export function FastingHero({
  mode,
  progressPercent,
  remainingMinutes,
  elapsedMinutes,
  goalMet,
  protocolLabel,
  idleHours = 16,
  idleEatingHours = 8,
  metaLine,
  startTimeLabel,
  planInfo,
  targetEndTime,
  onEditFast,
  onEditStart,
  onChangeTarget,
}: Props) {
  const idle = mode === 'idle';
  
  // Bulletproof sanitization
  const safeProgress = Number.isFinite(progressPercent) ? progressPercent : 0;
  const safeElapsed = Number.isFinite(elapsedMinutes) ? Math.max(0, elapsedMinutes) : 0;
  const safeRemaining = Number.isFinite(remainingMinutes) ? Math.max(0, remainingMinutes) : 0;
  const safeIdleHours = Number.isFinite(Number(idleHours)) ? Number(idleHours) : 16;
  const safeIdleEatingHours = Number.isFinite(Number(idleEatingHours)) ? Number(idleEatingHours) : 8;

  const status = goalMet ? 'Goal reached' : 'Fasting';

  const stopwatchDial = (
    <View style={[styles.ringWrap, idle && styles.ringWrapIdle]}>
      <FastingStopwatchDial
        mode={mode}
        progressPercent={safeProgress}
        elapsedMinutes={safeElapsed}
        remainingMinutes={safeRemaining}
        goalMet={goalMet}
        protocolLabel={protocolLabel}
        idleHours={safeIdleHours}
        size={idle ? 154 : 196}
      />
    </View>
  );

  if (idle) {
    return (
      <Animated.View
        entering={FadeIn.duration(420)}
        style={styles.idleShell}
        accessibilityLabel={`${protocolLabel}, ${Math.round(safeIdleHours)} hours fasting, ${Math.round(safeIdleEatingHours)} hours eating`}>
        <View style={styles.idleRow}>
          <SideStat
            icon="schedule"
            value={Math.round(safeIdleHours)}
            suffix="h"
            label="Fasting"
            useHaptic
          />
          {stopwatchDial}
          <SideStat
            icon="restaurant"
            value={Math.round(safeIdleEatingHours)}
            suffix="h"
            label="Eating"
          />
        </View>
      </Animated.View>
    );
  }

  const displayStart = startTimeLabel || (metaLine ? metaLine.replace(/^Started\s*/i, '') : null);
  const displayTarget = targetEndTime ? targetEndTime.replace(/^Target ends at\s*/i, '') : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(380)}
      style={styles.card}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeProgress) }}
      accessibilityLabel={`${protocolLabel}, ${status}, ${Math.round(safeProgress)} percent`}>
      
      {/* Top Action: Clean Top-Right Edit Button (Option 3) */}
      <View style={styles.activeHeaderRow}>
        {onEditFast ? (
          <Pressable
            onPress={onEditFast}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Edit Fast"
            style={({ pressed }) => pressed && { opacity: 0.75 }}>
            <View style={styles.editFastButton}>
              <MaterialIcons name="edit" size={12} color="#38e0ff" />
              <Text style={styles.editFastButtonText}>Edit</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      {stopwatchDial}

      {/* Connected Timeline: Start & Target End placed cleanly below the circle */}
      {displayStart && displayTarget ? (
        <View style={styles.timelineBar}>
          <View style={styles.timelinePoint}>
            <MaterialIcons name="schedule" size={12} color="#94a3b8" />
            <Text style={styles.timelinePointText}>Started {displayStart}</Text>
          </View>

          <Text style={styles.timelineDot}>·</Text>

          <View style={styles.timelinePoint}>
            <MaterialIcons name="flag" size={12} color="#38e0ff" />
            <Text style={[styles.timelinePointText, styles.timelinePointTarget]}>Target {displayTarget}</Text>
          </View>
        </View>
      ) : displayStart ? (
        <View style={styles.timelineBar}>
          <View style={styles.timelinePoint}>
            <MaterialIcons name="schedule" size={12} color="#94a3b8" />
            <Text style={styles.timelinePointText}>Started {displayStart}</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.elapsed}>
        {formatDurationMinutes(safeElapsed)} elapsed · {Math.round(safeProgress)}%
      </Text>
    </Animated.View>
  );
}

function AnimatedCounterText({ targetValue, suffix, style, useHaptic = false }: { targetValue: number; suffix: string; style: TextStyle | TextStyle[]; useHaptic?: boolean }) {
  const [displayValue, setDisplayValue] = useState(targetValue);

  useEffect(() => {
    if (displayValue === targetValue) return;

    const diff = targetValue > displayValue ? 1 : -1;
    const steps = Math.abs(targetValue - displayValue);
    const intervalTime = Math.max(40, 350 / steps);
    
    const interval = setInterval(() => {
      setDisplayValue(prev => {
        if (prev === targetValue) {
          clearInterval(interval);
          return prev;
        }
        
        // Light haptic per-step for tactile feel only
        if (useHaptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        const next = prev + diff;
        if ((diff > 0 && next >= targetValue) || (diff < 0 && next <= targetValue)) {
          clearInterval(interval);
          return targetValue;
        }
        return next;
      });
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [targetValue]);

  return <Text style={style}>{displayValue}{suffix}</Text>;
}

function SideStat({
  icon,
  value,
  suffix,
  label,
  useHaptic = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: number;
  suffix: string;
  label: string;
  useHaptic?: boolean;
}) {
  return (
    <View style={styles.sideStat} accessibilityRole="text">
      <View style={styles.sideIcon}>
        <MaterialIcons name={icon} size={20} color={C.primary} />
      </View>
      <View style={{ height: 26, width: 50, justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedCounterText targetValue={value} suffix={suffix} style={styles.sideValue} useHaptic={useHaptic} />
      </View>
      <Text style={styles.sideLabel}>{label}</Text>
    </View>
  );
}

export function announceGoalReached() {
  AccessibilityInfo.announceForAccessibility('Goal reached. You can complete this fast.');
}

const styles = StyleSheet.create({
  idleShell: {
    alignItems: 'center',
    paddingVertical: 12,
    overflow: 'visible',
  },
  idleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    overflow: 'visible',
  },
  sideStat: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  sideIcon: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  sideValue: {
    color: C.primary,
    fontSize: 18,
    fontFamily: F.sansExtraBold,
    letterSpacing: -0.4,
  },
  sideLabel: {
    color: C.onSurface,
    fontSize: 12,
    fontFamily: F.sans,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  activeHeaderRow: {
    position: 'absolute',
    top: 16,
    right: 18,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  editFastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 224, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 224, 255, 0.3)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  editFastButtonText: {
    color: '#38e0ff',
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  timelineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161f26',
    borderWidth: 1,
    borderColor: '#263541',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: 6,
    marginBottom: 4,
    gap: 8,
  },
  timelineDot: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  timelinePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timelinePointText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontFamily: F.sansMedium,
  },
  timelinePointTarget: {
    color: '#e2e8f0',
    fontFamily: F.sansSemiBold,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1b232a',
    borderWidth: 1.5,
    borderColor: '#2d3b47',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  headerPillText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: F.sansSemiBold,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 2,
    overflow: 'visible',
  },
  ringWrapIdle: {
    marginTop: 0,
    marginBottom: 0,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.glow,
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    color: C.onSurface,
    fontSize: 36,
    fontFamily: F.sansExtraBold,
    letterSpacing: -1.2,
  },
  idleProtocol: {
    color: C.onSurface,
    fontSize: 26,
    fontFamily: F.sansExtraBold,
    letterSpacing: -0.7,
  },
  centerUnit: {
    color: C.primary,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 1.4,
    marginTop: 1,
  },
  elapsed: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
  },
});
