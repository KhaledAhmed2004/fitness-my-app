import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { PlanDay } from '@/repositories/plan.repository';

const T = TrainingTheme;
const F = Vital.fonts;

const WEEKDAYS = [
  { short: 'MON', index: 0 },
  { short: 'TUE', index: 1 },
  { short: 'WED', index: 2 },
  { short: 'THU', index: 3 },
  { short: 'FRI', index: 4 },
  { short: 'SAT', index: 5 },
  { short: 'SUN', index: 6 },
];

interface PlanWeekStripProps {
  days: PlanDay[];
  currentWeekdayIndex: number; // 0=Mon...6=Sun
  selectedDayId?: string | null;
  onSelectDay: (dayId: string) => void;
}

export function PlanWeekStrip({
  days,
  currentWeekdayIndex,
  selectedDayId,
  onSelectDay,
}: PlanWeekStripProps) {
  const workoutDaysCount = React.useMemo(() => {
    return days.filter((d) => d.day_of_week !== null && d.day_of_week !== undefined).length || days.length;
  }, [days]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>WEEKLY SPLIT SCHEDULE</Text>
        <Text style={styles.frequencyText}>{workoutDaysCount} DAYS / WEEK</Text>
      </View>

      <View style={styles.daysRow}>
        {WEEKDAYS.map((w) => {
          const isToday = w.index === currentWeekdayIndex;
          const assignedDay = days.find((d) => d.day_of_week === w.index);
          const isSelected = assignedDay && selectedDayId === assignedDay.id;

          // Short label extraction
          let dayDisplayLabel = 'Rest';
          if (assignedDay) {
            const raw = assignedDay.day_label;
            if (raw.toLowerCase().includes('push')) dayDisplayLabel = 'Push';
            else if (raw.toLowerCase().includes('pull')) dayDisplayLabel = 'Pull';
            else if (raw.toLowerCase().includes('leg')) dayDisplayLabel = 'Legs';
            else if (raw.toLowerCase().includes('upper')) dayDisplayLabel = 'Upper';
            else if (raw.toLowerCase().includes('lower')) dayDisplayLabel = 'Lower';
            else if (raw.toLowerCase().includes('full')) dayDisplayLabel = 'Full';
            else dayDisplayLabel = raw.split(' ')[0] || 'Train';
          }

          const hasWorkout = !!assignedDay;

          return (
            <TouchableOpacity
              key={w.index}
              activeOpacity={hasWorkout ? 0.7 : 1}
              hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
              accessibilityRole="button"
              accessibilityLabel={`${w.short}: ${dayDisplayLabel}${isToday ? ', Today' : ''}`}
              onPress={() => {
                if (assignedDay) {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onSelectDay(assignedDay.id);
                }
              }}
              style={[
                styles.dayCard,
                isToday && styles.dayCardToday,
                isSelected && !isToday && styles.dayCardSelected,
                !hasWorkout && !isToday && styles.dayCardRest,
              ]}>
              {isToday ? (
                <View style={styles.todayPillBadge}>
                  <Text style={styles.todayPillBadgeText}>TODAY</Text>
                </View>
              ) : null}

              <Text
                style={[
                  styles.dayShortText,
                  isToday && styles.dayShortTextToday,
                  isSelected && !isToday && styles.dayShortTextSelected,
                ]}>
                {w.short}
              </Text>

              <View
                style={[
                  styles.tagPill,
                  hasWorkout ? styles.tagPillWorkout : styles.tagPillRest,
                  isSelected && hasWorkout && styles.tagPillSelected,
                ]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tagText,
                    hasWorkout ? styles.tagTextWorkout : styles.tagTextRest,
                    isSelected && hasWorkout && styles.tagTextSelected,
                  ]}>
                  {dayDisplayLabel}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    color: T.textMuted,
  },
  frequencyText: {
    fontFamily: F.mono,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: T.secondary,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: T.glassFill,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: T.border,
    gap: 5,
    position: 'relative',
    minHeight: 56,
    justifyContent: 'center',
  },
  dayCardToday: {
    borderColor: T.primary,
    backgroundColor: T.surfaceActiveTint,
  },
  dayCardSelected: {
    borderColor: T.borderFocus,
    backgroundColor: T.surfaceElevated,
  },
  dayCardRest: {
    opacity: 0.65,
  },
  todayPillBadge: {
    position: 'absolute',
    top: -7,
    backgroundColor: T.primary,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  todayPillBadgeText: {
    fontFamily: F.mono,
    fontSize: 8,
    fontWeight: '800',
    color: T.onPrimary,
  },
  dayShortText: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.textSecondary,
    fontWeight: '600',
  },
  dayShortTextToday: {
    color: T.primary,
    fontWeight: '800',
  },
  dayShortTextSelected: {
    color: T.textPrimary,
    fontWeight: '700',
  },
  tagPill: {
    paddingHorizontal: 4,
    paddingVertical: 2.5,
    borderRadius: 6,
    width: '92%',
    alignItems: 'center',
  },
  tagPillWorkout: {
    backgroundColor: 'rgba(200, 241, 53, 0.12)',
  },
  tagPillSelected: {
    backgroundColor: T.primary,
  },
  tagPillRest: {
    backgroundColor: T.glassFill,
  },
  tagText: {
    fontFamily: F.sansMedium,
    fontSize: 10,
  },
  tagTextWorkout: {
    color: T.primary,
    fontFamily: F.sansBold,
  },
  tagTextSelected: {
    color: T.onPrimary,
    fontFamily: F.sansBold,
  },
  tagTextRest: {
    color: T.textMuted,
  },
});
