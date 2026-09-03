import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusActivityChart } from '@/components/focus/focus-activity-chart';
import { FocusSettingsModal } from '@/components/focus/focus-settings-modal';
import { AddTodoModal } from '@/components/todo/add-todo-modal';
import { TodoItemRow } from '@/components/todo/todo-item-row';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { FocusMode, useFocusStore } from '@/stores/focus-store';
import { useTodoStore } from '@/stores/todo-store';
import { TodoCategory, TodoItem, TodoPriority } from '@/types/todo';

const C = Vital.colors;
const F = Vital.fonts;

type FocusTab = 'ALL_TODAY' | 'HIGH_FOCUS' | 'COMPLETED';

export default function TodayFocusScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();

  // Todo Store
  const todos = useTodoStore((s) => s.todos);
  const loadTodoData = useTodoStore((s) => s.loadData);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const toggleSubtask = useTodoStore((s) => s.toggleSubtask);

  // Focus Store
  const {
    settings,
    currentMode,
    currentRound,
    activeTaskId,
    totalFocusMinutesToday,
    strayThoughts,
    loadData: loadFocusData,
    switchMode,
    advanceToNextMode,
    setActiveTaskId,
    addStrayThought,
    removeStrayThought,
  } = useFocusStore();

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<FocusTab>('ALL_TODAY');
  const [strayInput, setStrayInput] = useState('');
  const [showBrainDump, setShowBrainDump] = useState(false);

  // Timer State (in Seconds)
  const getModeDurationSeconds = (mode: FocusMode) => {
    if (mode === 'FOCUS') return settings.focusDuration * 60;
    if (mode === 'SHORT_BREAK') return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60;
  };

  const [timerSeconds, setTimerSeconds] = useState(getModeDurationSeconds(currentMode));
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadTodoData();
    loadFocusData();
  }, [loadTodoData, loadFocusData]);

  // Sync Timer when mode or settings change and timer is paused
  useEffect(() => {
    if (!isRunning) {
      setTimerSeconds(getModeDurationSeconds(currentMode));
    }
  }, [currentMode, settings]);

  // Pomodoro Ticking Interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timerSeconds === 0) {
      setIsRunning(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const nextMode = advanceToNextMode();
      setTimerSeconds(getModeDurationSeconds(nextMode));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerSeconds]);

  const toggleTimer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsRunning(false);
    setTimerSeconds(getModeDurationSeconds(currentMode));
  };

  const skipToNextCycle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsRunning(false);
    const nextMode = advanceToNextMode();
    setTimerSeconds(getModeDurationSeconds(nextMode));
  };

  const handleSelectMode = (mode: FocusMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsRunning(false);
    switchMode(mode);
    setTimerSeconds(getModeDurationSeconds(mode));
  };

  const handleAddStray = () => {
    if (!strayInput.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addStrayThought(strayInput);
    setStrayInput('');
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Get Mode Theme
  const getModeVisual = () => {
    switch (currentMode) {
      case 'FOCUS':
        return {
          title: 'DEEP WORK FOCUS',
          color: '#FCC419',
          bg: 'rgba(252, 196, 25, 0.1)',
          border: 'rgba(252, 196, 25, 0.25)',
          icon: 'track-changes',
          tip: 'Lock in and crush your active objective.',
        };
      case 'SHORT_BREAK':
        return {
          title: 'HYDRATE & STRETCH',
          color: '#20C997',
          bg: 'rgba(32, 201, 151, 0.1)',
          border: 'rgba(32, 201, 151, 0.25)',
          icon: 'spa',
          tip: 'Step away, grab water, and breathe.',
        };
      case 'LONG_BREAK':
        return {
          title: 'RECHARGE & RESTORE',
          color: '#89CEFF',
          bg: 'rgba(137, 206, 255, 0.1)',
          border: 'rgba(137, 206, 255, 0.25)',
          icon: 'wb-sunny',
          tip: 'Great round cycle completed! Take a walk.',
        };
    }
  };

  const modeVisual = getModeVisual();

  // Tasks Filter
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todayTodos = useMemo(() => {
    return todos.filter((t) => {
      if (!t.dueDate) return true;
      return t.dueDate === todayStr;
    });
  }, [todos, todayStr]);

  const activeLockedTask = useMemo(() => {
    if (!activeTaskId) return null;
    return todos.find((t) => t.id === activeTaskId) || null;
  }, [todos, activeTaskId]);

  const displayedTodos = useMemo(() => {
    let result = [...todayTodos];

    if (activeTab === 'HIGH_FOCUS') {
      result = result.filter(
        (t) => !t.isCompleted && (t.priority === 'URGENT' || t.priority === 'HIGH')
      );
    } else if (activeTab === 'ALL_TODAY') {
      result = result.filter((t) => !t.isCompleted);
    } else if (activeTab === 'COMPLETED') {
      result = result.filter((t) => t.isCompleted);
    }

    const priorityWeight: Record<TodoPriority, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };
    return result.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }, [todayTodos, activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* 1. TOP NAV HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.back();
          }}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* 3-MODE PILL SWITCHER */}
        <View style={[styles.modeSwitcherPill, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectMode('FOCUS')}
            style={[
              styles.modePillBtn,
              currentMode === 'FOCUS' && styles.modePillBtnActiveFocus,
            ]}>
            <Text
              style={[
                styles.modePillText,
                { color: currentMode === 'FOCUS' ? '#001A26' : colors.textSecondary },
                currentMode === 'FOCUS' && styles.modePillTextActive,
              ]}>
              Focus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectMode('SHORT_BREAK')}
            style={[
              styles.modePillBtn,
              currentMode === 'SHORT_BREAK' && styles.modePillBtnActiveShort,
            ]}>
            <Text
              style={[
                styles.modePillText,
                { color: currentMode === 'SHORT_BREAK' ? '#002018' : colors.textSecondary },
                currentMode === 'SHORT_BREAK' && styles.modePillTextActive,
              ]}>
              Short
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectMode('LONG_BREAK')}
            style={[
              styles.modePillBtn,
              currentMode === 'LONG_BREAK' && styles.modePillBtnActiveLong,
            ]}>
            <Text
              style={[
                styles.modePillText,
                { color: currentMode === 'LONG_BREAK' ? '#2A1800' : colors.textSecondary },
                currentMode === 'LONG_BREAK' && styles.modePillTextActive,
              ]}>
              Long
            </Text>
          </TouchableOpacity>
        </View>

        {/* SETTINGS GEAR */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setSettingsModalVisible(true);
          }}
          style={[styles.settingsBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <MaterialIcons name="tune" size={19} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* 2. HERO MONOLITHIC FLOW HUD */}
        <View style={[styles.heroCard, { borderColor: modeVisual.border }]}>
          {/* ROUNDS & MODE BADGE */}
          <View style={styles.heroTopRow}>
            <View style={[styles.protocolBadge, { backgroundColor: modeVisual.bg, borderColor: modeVisual.border }]}>
              <MaterialIcons name={modeVisual.icon as any} size={13} color={modeVisual.color} />
              <Text style={[styles.protocolBadgeText, { color: modeVisual.color }]}>
                {modeVisual.title}
              </Text>
            </View>

            {/* ROUNDS DOTS */}
            <View style={styles.roundsBox}>
              <Text style={styles.roundsLabel}>
                Round {currentRound} of {settings.roundsBeforeLongBreak}
              </Text>
              <View style={styles.roundsDotsRow}>
                {Array.from({ length: settings.roundsBeforeLongBreak }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.roundDot,
                      i < currentRound && { backgroundColor: modeVisual.color },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* GIANT TIME DISPLAY */}
          <View style={styles.timerCenterCol}>
            <Text style={[styles.giantTimeText, { color: isRunning ? modeVisual.color : '#FFFFFF' }]}>
              {formatTime(timerSeconds)}
            </Text>
            <Text style={styles.timerTipText}>{modeVisual.tip}</Text>
          </View>

          {/* CONTROLS ROW */}
          <View style={styles.controlsRow}>
            {/* RESET BUTTON */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={resetTimer}
              style={styles.circleCtrlBtn}>
              <MaterialIcons name="replay" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>

            {/* MAIN PLAY / PAUSE BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={toggleTimer}
              style={[
                styles.mainPlayBtn,
                { backgroundColor: isRunning ? 'rgba(255, 107, 107, 0.15)' : modeVisual.color },
                isRunning && { borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.35)' },
              ]}>
              <MaterialIcons
                name={isRunning ? 'pause' : 'play-arrow'}
                size={30}
                color={isRunning ? '#FF6B6B' : '#101416'}
              />
            </TouchableOpacity>

            {/* SKIP CYCLE BUTTON */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={skipToNextCycle}
              style={styles.circleCtrlBtn}>
              <MaterialIcons name="skip-next" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* LOCKED FOCUS TARGET CARD */}
          {activeLockedTask ? (
            <View style={styles.lockedTaskBox}>
              <View style={styles.lockedTaskHeader}>
                <Text style={styles.lockedTaskTag}>🎯 LOCKED FOCUS TARGET</Text>
                <TouchableOpacity onPress={() => setActiveTaskId(null)}>
                  <MaterialIcons name="close" size={16} color={C.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <Text style={styles.lockedTaskTitle}>{activeLockedTask.title}</Text>
              {activeLockedTask.description ? (
                <Text style={styles.lockedTaskDesc}>{activeLockedTask.description}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.noLockedTaskBox}>
              <Text style={styles.noLockedTaskText}>
                💡 Tap any task below to lock it into this focus session!
              </Text>
            </View>
          )}
        </View>

        {/* 3. DAILY FLOW STATE ACCUMULATOR */}
        <View style={styles.flowBankRow}>
          <View style={styles.flowBankCol}>
            <Text style={styles.flowBankLabel}>FLOW STATE TIME TODAY</Text>
            <View style={styles.flowBankValueRow}>
              <RollingNumber
                value={totalFocusMinutesToday}
                style={styles.flowBankValue}
              />
              <Text style={styles.flowBankUnit}>mins conquered</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowBrainDump(!showBrainDump)}
            style={styles.brainDumpToggleBtn}>
            <MaterialIcons name="edit-note" size={18} color="#FCC419" />
            <Text style={styles.brainDumpToggleText}>
              Brain Dump ({strayThoughts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. BRAIN DUMP / STRAY THOUGHTS DRAWER */}
        {showBrainDump && (
          <View style={styles.brainDumpCard}>
            <Text style={styles.brainDumpTitle}>🧠 Stray Thoughts Parking Lot</Text>
            <Text style={styles.brainDumpDesc}>
              Quickly jot down distracting thoughts so your mind stays clear.
            </Text>

            <View style={styles.brainDumpInputRow}>
              <TextInput
                style={styles.brainDumpInput}
                placeholder="Write a stray thought..."
                placeholderTextColor={C.onSurfaceVariant}
                value={strayInput}
                onChangeText={setStrayInput}
                onSubmitEditing={handleAddStray}
              />
              <TouchableOpacity
                onPress={handleAddStray}
                style={styles.brainDumpAddBtn}>
                <MaterialIcons name="add" size={18} color="#101416" />
              </TouchableOpacity>
            </View>

            {strayThoughts.map((thought, idx) => (
              <View key={idx} style={styles.strayThoughtItem}>
                <Text style={styles.strayThoughtText}>• {thought}</Text>
                <TouchableOpacity onPress={() => removeStrayThought(idx)}>
                  <MaterialIcons name="check" size={16} color="#20C997" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 5. FOCUS ACTIVITY BAR CHART & FLOW HEATMAP */}
        <FocusActivityChart />

        {/* 6. TODAY'S TASK QUEUE SECTION */}
        <View style={styles.tasksSectionHeader}>
          <View style={styles.tasksTitleGroup}>
            <Text style={styles.tasksSectionTitle}>TODAY'S OBJECTIVES</Text>
            <Text style={styles.tasksSectionCount}>{displayedTodos.length} Tasks</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAddModalVisible(true)}
            style={styles.quickAddBtn}>
            <MaterialIcons name="add" size={16} color="#101416" />
            <Text style={styles.quickAddBtnText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* TAB FILTER PILLS */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('ALL_TODAY')}
            style={[styles.filterChip, activeTab === 'ALL_TODAY' && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, activeTab === 'ALL_TODAY' && styles.filterChipTextActive]}>
              All Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('HIGH_FOCUS')}
            style={[styles.filterChip, activeTab === 'HIGH_FOCUS' && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, activeTab === 'HIGH_FOCUS' && styles.filterChipTextActive]}>
              🔥 High Priority
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('COMPLETED')}
            style={[styles.filterChip, activeTab === 'COMPLETED' && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, activeTab === 'COMPLETED' && styles.filterChipTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* TASK STREAM */}
        <View style={styles.tasksList}>
          {displayedTodos.map((todo) => {
            const isLocked = activeTaskId === todo.id;
            return (
              <View key={todo.id} style={[styles.taskItemWrapper, isLocked && styles.taskItemLocked]}>
                <TodoItemRow
                  item={todo}
                  onToggle={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    toggleTodo(todo.id);
                  }}
                  onDelete={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    deleteTodo(todo.id);
                  }}
                  onToggleSubtask={(subId) => toggleSubtask(todo.id, subId)}
                />
                {!todo.isCompleted && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setActiveTaskId(isLocked ? null : todo.id);
                    }}
                    style={[styles.lockTargetBtn, isLocked && styles.lockTargetBtnActive]}>
                    <MaterialIcons
                      name={isLocked ? 'check-circle' : 'track-changes'}
                      size={14}
                      color={isLocked ? '#101416' : '#FCC419'}
                    />
                    <Text style={[styles.lockTargetBtnText, isLocked && styles.lockTargetBtnTextActive]}>
                      {isLocked ? 'Locked in Focus' : 'Lock Target'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {displayedTodos.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>No tasks in this view</Text>
              <Text style={styles.emptySubtitle}>
                Add focus targets to lock into flow state.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAddModalVisible(true)}
                style={styles.emptyAddBtn}>
                <Text style={styles.emptyAddBtnText}>+ Add New Objective</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FOCUS SETTINGS MODAL */}
      <FocusSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />

      {/* ADD TASK MODAL */}
      <AddTodoModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1315',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeSwitcherPill: {
    flexDirection: 'row',
    backgroundColor: '#141A1D',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  modePillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 11,
  },
  modePillBtnActiveFocus: {
    backgroundColor: '#FCC419',
  },
  modePillBtnActiveShort: {
    backgroundColor: '#20C997',
  },
  modePillBtnActiveLong: {
    backgroundColor: '#89CEFF',
  },
  modePillText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  modePillTextActive: {
    color: '#101416',
    fontWeight: '800',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 18,
  },
  heroCard: {
    backgroundColor: '#141A1D',
    borderRadius: 26,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  protocolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  protocolBadgeText: {
    fontFamily: F.sansBold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  roundsBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  roundsLabel: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  roundsDotsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  roundDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  timerCenterCol: {
    alignItems: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  giantTimeText: {
    fontFamily: F.sansExtraBold || F.sansBold,
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timerTipText: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    opacity: 0.85,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  circleCtrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mainPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  lockedTaskBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 25, 0.2)',
    gap: 4,
  },
  lockedTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedTaskTag: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: '#FCC419',
    letterSpacing: 0.5,
  },
  lockedTaskTitle: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  lockedTaskDesc: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  noLockedTaskBox: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  noLockedTaskText: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: C.onSurfaceVariant,
    opacity: 0.7,
  },
  flowBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141A1D',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  flowBankCol: {
    gap: 2,
  },
  flowBankLabel: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  flowBankValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  flowBankValue: {
    fontFamily: F.sansBold,
    fontSize: 20,
    color: '#FCC419',
    fontWeight: '800',
  },
  flowBankUnit: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  brainDumpToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(252, 196, 25, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 25, 0.2)',
  },
  brainDumpToggleText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#FCC419',
  },
  brainDumpCard: {
    backgroundColor: '#141A1D',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  brainDumpTitle: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  brainDumpDesc: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  brainDumpInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  brainDumpInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  brainDumpAddBtn: {
    backgroundColor: '#FCC419',
    width: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strayThoughtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  strayThoughtText: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.onSurface,
    flex: 1,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tasksTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tasksSectionTitle: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tasksSectionCount: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FCC419',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  quickAddBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#101416',
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(252, 196, 25, 0.15)',
    borderColor: 'rgba(252, 196, 25, 0.3)',
  },
  filterChipText: {
    fontFamily: F.sansSemiBold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: '#FCC419',
    fontWeight: '700',
  },
  tasksList: {
    gap: 10,
  },
  taskItemWrapper: {
    gap: 6,
  },
  taskItemLocked: {
    borderLeftWidth: 3,
    borderLeftColor: '#FCC419',
    paddingLeft: 8,
  },
  lockTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(252, 196, 25, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 25, 0.2)',
    marginLeft: 4,
  },
  lockTargetBtnActive: {
    backgroundColor: '#FCC419',
    borderColor: '#FCC419',
  },
  lockTargetBtnText: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: '#FCC419',
  },
  lockTargetBtnTextActive: {
    color: '#101416',
  },
  emptyCard: {
    backgroundColor: '#141A1D',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: C.onSurface,
  },
  emptySubtitle: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyAddBtn: {
    marginTop: 8,
    backgroundColor: '#FCC419',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#101416',
    fontWeight: '700',
  },
});
