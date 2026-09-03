import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTINE_TIME_BLOCKS } from '@/constants/default-routines';
import { Vital } from '@/constants/vital-theme';
import { useRoutineStore } from '@/stores/routine-store';
import { RoutineTimeOfDay } from '@/types/routine';

import { AddRoutineModal } from './add-routine-modal';
import { RoutineItemRow } from './routine-item-row';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

type FilterTimeTab = 'ALL' | RoutineTimeOfDay;

function getWeekDays(centerDateStr?: string) {
  const d = centerDateStr ? new Date(centerDateStr) : new Date();
  const dayOfWeek = d.getDay(); // 0 = Sunday
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);

    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][cur.getDay()];
    days.push({
      dateStr,
      dayName,
      dayNum: cur.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

export function RoutineTimelineModal({ visible, onClose }: Props) {
  const {
    routines,
    selectedDate,
    setSelectedDate,
    isHabitCompleted,
    toggleHabit,
    deleteHabit,
    resetToDefaults,
    getProgressForDate,
    getStreakStats,
  } = useRoutineStore();

  const [activeTab, setActiveTab] = useState<FilterTimeTab>('ALL');
  const [addModalVisible, setAddModalVisible] = useState(false);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const { total, completed, percentage } = getProgressForDate(selectedDate);
  const { currentStreak, bestStreak, totalDaysLogged } = getStreakStats();

  const filteredBlocks = useMemo(() => {
    if (activeTab === 'ALL') {
      return ROUTINE_TIME_BLOCKS;
    }
    return ROUTINE_TIME_BLOCKS.filter((b) => b.key === activeTab);
  }, [activeTab]);

  const handleReset = () => {
    Alert.alert(
      'Reset Daily Routines',
      'Do you want to reset all daily habits back to the default seed protocols?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => void resetToDefaults(),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Daily Routine Timeline</Text>
            <Text style={styles.headerSubtitle}>
              Habits & circadian protocol schedule
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleReset}
              hitSlop={8}
              style={styles.resetBtn}>
              <MaterialIcons name="restart-alt" size={18} color={C.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}>
          {/* 7-DAY WEEKLY CALENDAR STRIP */}
          <View style={styles.weekStrip}>
            {weekDays.map((item) => {
              const isSelected = selectedDate === item.dateStr;
              const dayProgress = getProgressForDate(item.dateStr);
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  onPress={() => setSelectedDate(item.dateStr)}
                  style={[
                    styles.weekDayChip,
                    isSelected && styles.weekDayChipSelected,
                    item.isToday && !isSelected && styles.weekDayChipToday,
                  ]}>
                  <Text
                    style={[
                      styles.weekDayName,
                      isSelected && { color: C.background },
                    ]}>
                    {item.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.weekDayNum,
                      isSelected && { color: C.background, fontWeight: '800' },
                    ]}>
                    {item.dayNum}
                  </Text>
                  {dayProgress.completed > 0 && (
                    <View
                      style={[
                        styles.dayDot,
                        {
                          backgroundColor:
                            isSelected
                              ? C.background
                              : dayProgress.percentage === 100
                              ? '#89FE00'
                              : C.primary,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PROGRESS & STREAK HERO CARD */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.progressCol}>
                <Text style={styles.statsLabel}>TODAY'S COMPLETION</Text>
                <Text style={styles.progressVal}>
                  {percentage}%{' '}
                  <Text style={styles.progressFraction}>
                    ({completed}/{total} habits)
                  </Text>
                </Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          percentage === 100 ? '#89FE00' : C.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.streakCol}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakNumber}>{currentStreak}d</Text>
                <Text style={styles.streakSub}>Streak</Text>
              </View>
            </View>
          </View>

          {/* TIME OF DAY FILTER TABS */}
          <View style={styles.filterTabsRow}>
            {(['ALL', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'] as FilterTimeTab[]).map(
              (tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[
                      styles.filterTabChip,
                      isActive && styles.filterTabChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterTabChipText,
                        isActive && styles.filterTabChipTextActive,
                      ]}>
                      {tab === 'ALL'
                        ? 'All'
                        : tab === 'MORNING'
                        ? '🌅 Morning'
                        : tab === 'AFTERNOON'
                        ? '☀️ Noon'
                        : tab === 'EVENING'
                        ? '🌆 Evening'
                        : '🌙 Night'}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* TIME BLOCKS ACCORDION LIST */}
          {filteredBlocks.map((block) => {
            const blockHabits = routines.filter((r) => r.timeOfDay === block.key);
            const blockCompleted = blockHabits.filter((r) =>
              isHabitCompleted(r.id, selectedDate)
            ).length;

            return (
              <View key={block.key} style={styles.blockSection}>
                {/* SECTION HEADER */}
                <View style={styles.blockHeader}>
                  <View style={styles.blockTitleRow}>
                    <Text style={styles.blockEmoji}>{block.emoji}</Text>
                    <View>
                      <Text style={styles.blockLabel}>{block.label}</Text>
                      <Text style={styles.blockHours}>{block.hours}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.blockBadge,
                      {
                        backgroundColor:
                          blockCompleted === blockHabits.length &&
                          blockHabits.length > 0
                            ? 'rgba(137, 254, 0, 0.15)'
                            : 'rgba(255, 255, 255, 0.06)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.blockBadgeText,
                        {
                          color:
                            blockCompleted === blockHabits.length &&
                            blockHabits.length > 0
                              ? '#89FE00'
                              : C.onSurfaceVariant,
                        },
                      ]}>
                      {blockCompleted}/{blockHabits.length}
                    </Text>
                  </View>
                </View>

                {/* HABIT ROWS */}
                <View style={styles.habitsGroup}>
                  {blockHabits.map((item) => (
                    <RoutineItemRow
                      key={item.id}
                      item={item}
                      isCompleted={isHabitCompleted(item.id, selectedDate)}
                      onToggle={() => void toggleHabit(item.id, selectedDate)}
                      onDelete={
                        !item.isSystem
                          ? () => void deleteHabit(item.id)
                          : undefined
                      }
                    />
                  ))}
                  {blockHabits.length === 0 && (
                    <View style={styles.emptyBlock}>
                      <Text style={styles.emptyBlockText}>
                        No habits configured for this protocol.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* FLOATING ACTION BUTTON */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAddModalVisible(true)}
            style={styles.fabBtn}>
            <MaterialIcons name="add" size={20} color={C.background} />
            <Text style={styles.fabBtnText}>+ Add Custom Habit</Text>
          </TouchableOpacity>
        </View>

        {/* ADD HABIT MODAL */}
        <AddRoutineModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101416',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontFamily: F.sansBold,
    fontSize: 20,
    color: C.onSurface,
  },
  headerSubtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  weekDayChip: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 4,
    minWidth: 42,
  },
  weekDayChipSelected: {
    backgroundColor: C.primary,
  },
  weekDayChipToday: {
    borderWidth: 1,
    borderColor: C.primary,
  },
  weekDayName: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  weekDayNum: {
    fontFamily: F.mono,
    fontSize: 15,
    color: C.onSurface,
    fontWeight: '700',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statsCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressCol: {
    flex: 1,
    gap: 6,
  },
  statsLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.onSurfaceVariant,
  },
  progressVal: {
    fontFamily: F.sansExtraBold,
    fontSize: 22,
    color: C.onSurface,
  },
  progressFraction: {
    fontSize: 13,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  streakCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.25)',
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakNumber: {
    fontFamily: F.sansExtraBold,
    fontSize: 16,
    color: '#FFB020',
  },
  streakSub: {
    fontFamily: F.sansSemiBold,
    fontSize: 10,
    color: '#FFB020',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterTabChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  filterTabChipActive: {
    backgroundColor: C.onSurface,
    borderColor: C.onSurface,
  },
  filterTabChipText: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  filterTabChipTextActive: {
    color: C.background,
  },
  blockSection: {
    gap: 10,
    marginBottom: 8,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 2,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockEmoji: {
    fontSize: 20,
  },
  blockLabel: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: C.onSurface,
  },
  blockHours: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  blockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  blockBadgeText: {
    fontFamily: F.mono,
    fontSize: 11,
    fontWeight: '700',
  },
  habitsGroup: {
    gap: 6,
  },
  emptyBlock: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
  },
  emptyBlockText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
  },
  fabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabBtnText: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: C.background,
  },
});
