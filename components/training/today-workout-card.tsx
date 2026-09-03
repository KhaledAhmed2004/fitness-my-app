import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';

import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { TodaysPlanResult, PlanDay } from '@/repositories/plan.repository';

const T = TrainingTheme;
const F = Vital.fonts;

interface MiniMuscleAvatarProps {
  dayLabel?: string;
  targetMuscleGroups?: string | null;
  size?: number;
}

export function MiniMuscleAvatar({
  dayLabel = '',
  targetMuscleGroups,
  size = 50,
}: MiniMuscleAvatarProps) {
  const muscleList = useMemo(() => {
    if (targetMuscleGroups && targetMuscleGroups.trim()) {
      return targetMuscleGroups
        .toLowerCase()
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
    }
    const label = dayLabel.toLowerCase();
    if (label.includes('push') || label.includes('chest')) return ['chest', 'shoulder', 'triceps'];
    if (label.includes('pull') || label.includes('back')) return ['back', 'biceps', 'traps'];
    if (
      label.includes('leg') ||
      label.includes('quad') ||
      label.includes('lower') ||
      label.includes('calf')
    )
      return ['legs', 'calves', 'glutes'];
    if (label.includes('arm') || label.includes('bicep') || label.includes('tricep'))
      return ['biceps', 'triceps', 'shoulder'];
    if (label.includes('shoulder') || label.includes('delt')) return ['shoulder', 'neck'];
    if (label.includes('core') || label.includes('abs')) return ['abs'];
    if (label.includes('upper')) return ['chest', 'back', 'shoulder', 'biceps', 'triceps'];
    return ['chest', 'shoulder'];
  }, [dayLabel, targetMuscleGroups]);

  const isBackDominant = useMemo(() => {
    const label = dayLabel.toLowerCase();
    const hasBack =
      muscleList.includes('back') ||
      muscleList.includes('lats') ||
      muscleList.includes('glutes') ||
      label.includes('pull') ||
      label.includes('back');
    const hasChest =
      muscleList.includes('chest') || label.includes('push') || label.includes('chest');
    return hasBack && !hasChest;
  }, [dayLabel, muscleList]);

  const isLegFocus = useMemo(() => {
    const label = dayLabel.toLowerCase();
    return (
      muscleList.includes('legs') ||
      muscleList.includes('calves') ||
      muscleList.includes('quads') ||
      muscleList.includes('hamstrings') ||
      label.includes('leg') ||
      label.includes('lower')
    );
  }, [dayLabel, muscleList]);

  const bodyData = useMemo<ExtendedBodyPart[]>(() => {
    const activeColor = '#C8F135';
    const baseColor = '#161B21';
    const inactiveColor = '#202731';
    const strokeColor = '#303B48';

    const isSel = (m: string) => muscleList.includes(m);

    const data: ExtendedBodyPart[] = [
      { slug: 'head', color: baseColor, styles: { fill: baseColor, stroke: strokeColor, strokeWidth: 0.8 } },
      { slug: 'hair', color: '#101418', styles: { fill: '#101418', stroke: strokeColor, strokeWidth: 0.8 } },
      { slug: 'hands', color: baseColor, styles: { fill: baseColor, stroke: strokeColor, strokeWidth: 0.8 } },
      { slug: 'feet', color: baseColor, styles: { fill: baseColor, stroke: strokeColor, strokeWidth: 0.8 } },
    ];

    const add = (slug: Slug, selected: boolean) => {
      data.push({
        slug,
        color: selected ? activeColor : inactiveColor,
        intensity: selected ? 2 : 1,
        styles: {
          fill: selected ? activeColor : inactiveColor,
          stroke: selected ? activeColor : strokeColor,
          strokeWidth: selected ? 1.4 : 0.8,
        },
      });
    };

    // Deltoids
    add('deltoids', isSel('shoulder') || isSel('shoulders') || isSel('delts'));

    // Chest
    add('chest', isSel('chest') || isSel('pectorals'));

    // Arms
    add('biceps', isSel('biceps') || isSel('arms'));
    add('triceps', isSel('triceps') || isSel('arms'));

    // Neck & Traps
    add('neck', isSel('neck') || isSel('traps'));
    add('trapezius', isSel('neck') || isSel('traps') || isSel('back'));

    // Abs & Obliques
    add('abs', isSel('abs') || isSel('core'));
    add('obliques', isSel('abs') || isSel('core') || isSel('obliques'));

    // Lower Body
    const legsActive =
      isSel('legs') ||
      isSel('quads') ||
      isSel('quadriceps') ||
      isSel('hamstrings') ||
      isSel('calves');
    add('quadriceps', legsActive);
    add('hamstring', legsActive);
    add('adductors', legsActive);
    add('calves', isSel('calves') || legsActive);
    add('tibialis', isSel('calves') || legsActive);
    add('gluteal', isSel('glutes') || isSel('gluteal'));

    // Back
    const backActive = isSel('back') || isSel('lats') || isSel('upper-back') || isSel('lower-back');
    add('upper-back', backActive);
    add('lower-back', backActive);

    return data;
  }, [muscleList]);

  // Adjust vertical clipping offset so chest/torso or legs are centered
  const marginTopOffset = isLegFocus ? -20 : -4;

  return (
    <View style={[styles.miniAvatarContainer, { width: size, height: size }]}>
      <View style={[styles.miniBodyClipper, { marginTop: marginTopOffset }]} pointerEvents="none">
        <Body
          data={bodyData}
          side={isBackDominant ? 'back' : 'front'}
          gender="male"
          scale={0.24}
          defaultFill="#202731"
          defaultStroke="#303B48"
          defaultStrokeWidth={0.8}
          border="none"
        />
      </View>
    </View>
  );
}

interface TodayWorkoutCardProps {
  planData: TodaysPlanResult | null;
  isLoading?: boolean;
  onStartWorkout: (planDayId: string) => void;
  onOpenPlanManager: () => void;
  onOpenDayPicker: () => void;
  onOpenWizard?: () => void;
}

export function TodayWorkoutCard({
  planData,
  isLoading,
  onStartWorkout,
  onOpenPlanManager,
  onOpenDayPicker,
  onOpenWizard,
}: TodayWorkoutCardProps) {
  // Case 1: No active plan created yet
  if (!planData || !planData.plan) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <Text style={styles.headerTitle}>TODAY'S WORKOUT</Text>
          </View>
        </View>

        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="auto-awesome" size={28} color={T.primary} />
          </View>
          <Text style={styles.emptyTitle}>Build from Your Equipment</Text>
          <Text style={styles.emptySubtitle}>
            Select your gym gear (Dumbbells, Barbells, or Bodyweight) to get a custom tailored routine.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open Smart Plan Wizard"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              if (onOpenWizard) onOpenWizard();
              else onOpenPlanManager();
            }}
            style={styles.createPlanBtn}>
            <MaterialIcons name="auto-awesome" size={18} color={T.onPrimary} />
            <Text style={styles.createPlanBtnText}>Smart Plan Wizard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Case 2: Today is a scheduled REST Day
  if (planData.isRestDay) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <Text style={[styles.headerTitle, { color: T.secondary }]}>RECOVERY DAY</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Open plan details"
            onPress={onOpenPlanManager}
            style={styles.planBadgeBtn}>
            <Text style={styles.planBadgeText}>{planData.plan.name}</Text>
            <MaterialIcons name="chevron-right" size={16} color={T.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Clean Recovery Row */}
        <View style={styles.recoveryFlatRow}>
          <View style={styles.restIconBox}>
            <MaterialIcons name="nightlight-round" size={22} color={T.secondary} />
          </View>
          <View style={styles.restTextCol}>
            <Text style={styles.restTitle}>Muscle Recovery & Growth</Text>
            <Text style={styles.restSubtitle}>
              Muscles repair & rebuild during rest. Prioritize protein & quality sleep.
            </Text>
          </View>
        </View>

        {/* Next workout hint & Action */}
        <View style={styles.restFooterRow}>
          {planData.day ? (
            <View style={styles.nextHintCol}>
              <Text style={styles.nextLabel}>NEXT UP</Text>
              <Text style={styles.nextUpText} numberOfLines={1}>
                {planData.day.day_label}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Train anyway and choose a workout"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onOpenDayPicker();
            }}
            style={styles.trainAnywayBtn}>
            <MaterialIcons name="bolt" size={16} color={T.primary} />
            <Text style={styles.trainAnywayBtnText}>Train Anyway</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Case 3: Standard Active Scheduled Workout Day
  const day = planData.day!;
  const exercises = planData.exercises || [];
  const totalSets = exercises.reduce((acc, ex) => acc + (ex.default_sets || 3), 0);
  const estimatedMin = Math.round(exercises.length * 8 + totalSets * 1.5);

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Text style={styles.headerTitle}>TODAY'S WORKOUT</Text>
        </View>

        <View style={styles.topActionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Swap workout day"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onOpenDayPicker();
            }}
            style={styles.swapBtn}>
            <MaterialIcons name="swap-horiz" size={16} color={T.textPrimary} />
            <Text style={styles.swapBtnText}>Swap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Open plan manager"
            onPress={onOpenPlanManager}
            style={styles.planBadgeBtn}>
            <MaterialIcons name="tune" size={16} color={T.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Routine Main Row */}
      <View style={styles.routineMainRow}>
        {/* Dynamic Target Muscle Visualizer Avatar */}
        <MiniMuscleAvatar
          dayLabel={day.day_label}
          targetMuscleGroups={day.target_muscle_groups}
          size={50}
        />

        <View style={styles.routineMetaCol}>
          <Text style={styles.routineTitle} numberOfLines={1}>
            {day.day_label}
          </Text>

          <View style={styles.routineSubBadges}>
            <View style={styles.planPill}>
              <MaterialIcons name="auto-awesome" size={11} color={T.secondary} />
              <Text style={styles.planPillText}>Plan</Text>
            </View>

            <Text style={styles.routineMetaText}>
              {exercises.length} exercises · ~{estimatedMin} min · {totalSets} sets
            </Text>
          </View>
        </View>
      </View>

      {/* Exercises Preview Strip */}
      {exercises.length > 0 ? (
        <View style={styles.exercisesGrid}>
          {exercises.slice(0, 4).map((ex) => (
            <View key={ex.id} style={styles.exerciseChip}>
              <Text style={styles.exerciseChipName} numberOfLines={1}>
                {ex.exercise_name}
              </Text>
              <Text style={styles.exerciseChipSets}>
                {ex.default_sets}×{ex.default_reps}
              </Text>
            </View>
          ))}
          {exercises.length > 4 ? (
            <View style={styles.moreExercisesChip}>
              <Text style={styles.moreExercisesText}>+{exercises.length - 4} more</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Primary Action Button (Volt Neon Lime - Dominant Focal Point) */}
      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Start workout: ${day.day_label}`}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          onStartWorkout(day.id);
        }}
        style={styles.startWorkoutBtn}>
        <MaterialIcons name="play-arrow" size={22} color={T.onPrimary} />
        <Text style={styles.startWorkoutBtnText}>START WORKOUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: T.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: T.border,
    gap: 14,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: T.textMuted,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.glassFill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    minHeight: 34,
  },
  swapBtnText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: T.textPrimary,
  },
  planBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.glassFill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    minHeight: 34,
  },
  planBadgeText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: T.textSecondary,
  },
  miniAvatarContainer: {
    borderRadius: 14,
    backgroundColor: '#14181D',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniBodyClipper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  routineMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routineAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: T.surfaceActiveTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineMetaCol: {
    flex: 1,
    gap: 4,
  },
  routineTitle: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: T.textPrimary,
    letterSpacing: 0.2,
  },
  routineSubBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planPillText: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: T.secondary,
  },
  routineMetaText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
  },
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exerciseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.glassFill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  exerciseChipName: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: T.textPrimary,
    maxWidth: 110,
  },
  exerciseChipSets: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.primary,
  },
  moreExercisesChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: T.glassFill,
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
  },
  moreExercisesText: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: T.textMuted,
  },
  startWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.primary,
    paddingVertical: 15,
    borderRadius: 16,
    minHeight: 52,
  },
  startWorkoutBtnText: {
    fontFamily: F.sansBold,
    fontSize: 15,
    fontWeight: '800',
    color: T.onPrimary,
    letterSpacing: 0.6,
  },
  // Empty State Styles
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.surfaceActiveTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: T.textPrimary,
  },
  emptySubtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 17,
  },
  createPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
    minHeight: 46,
  },
  createPlanBtnText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    fontWeight: '700',
    color: T.onPrimary,
  },
  // Rest Day Styles
  recoveryFlatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  restIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTextCol: {
    flex: 1,
    gap: 3,
  },
  restTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: T.textPrimary,
  },
  restSubtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    lineHeight: 16,
  },
  restFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 12,
  },
  nextHintCol: {
    flex: 1,
    gap: 2,
  },
  nextLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: T.textMuted,
  },
  nextUpText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: T.textPrimary,
  },
  trainAnywayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.glassFill,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 36,
  },
  trainAnywayBtnText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: T.textPrimary,
  },
});
