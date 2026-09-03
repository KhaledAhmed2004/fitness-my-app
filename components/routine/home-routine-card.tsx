import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ROUTINE_TIME_BLOCKS } from '@/constants/default-routines';
import { Vital } from '@/constants/vital-theme';
import { calculateCurrentTimeOfDay, useRoutineStore } from '@/stores/routine-store';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  onOpenFullRoutine: () => void;
  onOpenAddRoutine?: () => void;
};

export function HomeRoutineCard({ onOpenFullRoutine }: Props) {
  const {
    routines,
    isHabitCompleted,
    toggleHabit,
    getProgressForDate,
    getStreakStats,
  } = useRoutineStore();

  const currentTimeOfDay = calculateCurrentTimeOfDay();
  const currentBlock =
    ROUTINE_TIME_BLOCKS.find((b) => b.key === currentTimeOfDay) ||
    ROUTINE_TIME_BLOCKS[0];

  const { total, completed, percentage } = getProgressForDate();
  const { currentStreak } = getStreakStats();

  // Get habits for current block
  const currentBlockRoutines = routines.filter(
    (r) => r.timeOfDay === currentTimeOfDay
  );
  const pendingInBlock = currentBlockRoutines.filter(
    (r) => !isHabitCompleted(r.id)
  );

  // If all done in current block, show completed or next pending
  const displayHabits =
    pendingInBlock.length > 0
      ? pendingInBlock.slice(0, 3)
      : currentBlockRoutines.slice(0, 3);

  const isAllBlockDone =
    currentBlockRoutines.length > 0 && pendingInBlock.length === 0;

  return (
    <View style={styles.card}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <View style={styles.timeTag}>
          <Text style={styles.timeEmoji}>{currentBlock.emoji}</Text>
          <View>
            <Text style={styles.timeTitle}>{currentBlock.label}</Text>
            <Text style={styles.timeSubtitle}>{currentBlock.hours}</Text>
          </View>
        </View>

        {/* STREAK BADGE */}
        <View style={styles.streakBadge}>
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={styles.streakCount}>
            {currentStreak > 0 ? `${currentStreak}d streak` : 'Start streak'}
          </Text>
        </View>
      </View>

      {/* PROGRESS BAR & SUMMARY */}
      <View style={styles.progressSection}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>Daily Habits Mastery</Text>
          <Text style={styles.progressNumbers}>
            <Text style={{ color: percentage === 100 ? '#89FE00' : C.primary }}>
              {completed}
            </Text>
            <Text style={{ color: C.onSurfaceVariant }}> / {total} done</Text>
          </Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: percentage === 100 ? '#89FE00' : C.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* PENDING / TOP HABITS QUICK LIST */}
      <View style={styles.habitsList}>
        {displayHabits.map((item) => {
          const done = isHabitCompleted(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => void toggleHabit(item.id)}
              style={[styles.habitRow, done && styles.habitRowDone]}>
              <View
                style={[
                  styles.checkbox,
                  done && { backgroundColor: C.secondaryContainer, borderColor: C.secondaryContainer },
                ]}>
                {done && <MaterialIcons name="check" size={14} color={C.background} />}
              </View>

              <View
                style={[
                  styles.habitIconBox,
                  { backgroundColor: done ? 'rgba(255,255,255,0.05)' : `${item.color}15` },
                ]}>
                <MaterialIcons
                  name={(item.icon || 'star') as any}
                  size={15}
                  color={done ? C.outline : item.color}
                />
              </View>

              <Text
                numberOfLines={1}
                style={[styles.habitTitle, done && styles.habitTitleDone]}>
                {item.title}
              </Text>

              <Text style={styles.habitTargetTime}>{item.targetTime}</Text>
            </TouchableOpacity>
          );
        })}

        {isAllBlockDone && (
          <View style={styles.allDoneBanner}>
            <Text style={styles.allDoneEmoji}>✨</Text>
            <Text style={styles.allDoneText}>
              All {currentBlock.label} habits crushed!
            </Text>
          </View>
        )}
      </View>

      {/* FOOTER CTA */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenFullRoutine}
        style={styles.footerBtn}>
        <Text style={styles.footerBtnText}>View Full Routine Timeline</Text>
        <MaterialIcons name="chevron-right" size={18} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 18,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeEmoji: {
    fontSize: 26,
  },
  timeTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: C.onSurface,
  },
  timeSubtitle: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.25)',
  },
  streakFlame: {
    fontSize: 13,
  },
  streakCount: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#FFB020',
  },
  progressSection: {
    gap: 8,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressNumbers: {
    fontFamily: F.mono,
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  habitsList: {
    gap: 6,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  habitRowDone: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    flex: 1,
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: C.onSurface,
  },
  habitTitleDone: {
    textDecorationLine: 'line-through',
    color: C.onSurfaceVariant,
  },
  habitTargetTime: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(137, 254, 0, 0.08)',
    borderRadius: 12,
  },
  allDoneEmoji: {
    fontSize: 14,
  },
  allDoneText: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: '#89FE00',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.primaryAlpha10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(137, 206, 255, 0.2)',
  },
  footerBtnText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: C.primary,
  },
});
