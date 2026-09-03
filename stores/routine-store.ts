import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { DEFAULT_ROUTINES } from '@/constants/default-routines';
import {
  AutoActionType,
  RoutineItem,
  RoutineProgress,
  RoutineStreakStats,
  RoutineTimeOfDay,
} from '@/types/routine';

const ROUTINES_STORAGE_KEY = 'vital_routines_items_v1';
const ROUTINES_LOGS_KEY = 'vital_routines_completed_logs_v1';

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateCurrentTimeOfDay(): RoutineTimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
}

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

interface RoutineState {
  routines: RoutineItem[];
  completedLogs: Record<string, string[]>; // { '2026-08-24': ['sys_morning_water', ...] }
  selectedDate: string;
  isLoading: boolean;

  // Actions
  loadData: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  toggleHabit: (habitId: string, date?: string) => Promise<boolean>;
  autoCompleteByAction: (action: AutoActionType) => Promise<void>;
  addCustomHabit: (habit: Omit<RoutineItem, 'id' | 'isSystem' | 'createdAt'>) => Promise<RoutineItem>;
  updateHabit: (id: string, updates: Partial<RoutineItem>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;

  // Getters
  isHabitCompleted: (habitId: string, date?: string) => boolean;
  getProgressForDate: (date?: string) => RoutineProgress;
  getStreakStats: () => RoutineStreakStats;
  getRoutinesForTimeOfDay: (timeOfDay: RoutineTimeOfDay) => RoutineItem[];
  getPendingRoutinesForNow: () => RoutineItem[];
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: DEFAULT_ROUTINES,
  completedLogs: {},
  selectedDate: getTodayKey(),
  isLoading: false,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const storedRoutinesJson = await getStorageItem(ROUTINES_STORAGE_KEY);
      const storedLogsJson = await getStorageItem(ROUTINES_LOGS_KEY);

      let routines = DEFAULT_ROUTINES;
      let completedLogs: Record<string, string[]> = {};

      if (storedRoutinesJson) {
        try {
          const parsed = JSON.parse(storedRoutinesJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            routines = parsed;
          }
        } catch {}
      }

      if (storedLogsJson) {
        try {
          const parsed = JSON.parse(storedLogsJson);
          if (typeof parsed === 'object' && parsed !== null) {
            completedLogs = parsed;
          }
        } catch {}
      }

      set({
        routines,
        completedLogs,
        selectedDate: getTodayKey(),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  toggleHabit: async (habitId: string, dateParam?: string) => {
    const date = dateParam || get().selectedDate || getTodayKey();
    const currentCompleted = get().completedLogs[date] || [];
    const isCompleted = currentCompleted.includes(habitId);

    const updatedDateLogs = isCompleted
      ? currentCompleted.filter((id) => id !== habitId)
      : [...currentCompleted, habitId];

    const updatedLogs = {
      ...get().completedLogs,
      [date]: updatedDateLogs,
    };

    void Haptics.impactAsync(
      isCompleted
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    ).catch(() => {});

    set({ completedLogs: updatedLogs });
    await setStorageItem(ROUTINES_LOGS_KEY, JSON.stringify(updatedLogs));
    return !isCompleted;
  },

  autoCompleteByAction: async (action: AutoActionType) => {
    const today = getTodayKey();
    const currentCompleted = get().completedLogs[today] || [];
    const matchedHabits = get().routines.filter(
      (r) => r.linkedAction === action && !currentCompleted.includes(r.id)
    );

    if (matchedHabits.length === 0) return;

    const newCompleted = [...currentCompleted, ...matchedHabits.map((h) => h.id)];
    const updatedLogs = {
      ...get().completedLogs,
      [today]: newCompleted,
    };

    set({ completedLogs: updatedLogs });
    await setStorageItem(ROUTINES_LOGS_KEY, JSON.stringify(updatedLogs));
  },

  addCustomHabit: async (habitData) => {
    const newHabit: RoutineItem = {
      ...habitData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isSystem: false,
      createdAt: Date.now(),
    };

    const updated = [...get().routines, newHabit];
    set({ routines: updated });
    await setStorageItem(ROUTINES_STORAGE_KEY, JSON.stringify(updated));
    return newHabit;
  },

  updateHabit: async (id: string, updates: Partial<RoutineItem>) => {
    const updated = get().routines.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    set({ routines: updated });
    await setStorageItem(ROUTINES_STORAGE_KEY, JSON.stringify(updated));
  },

  deleteHabit: async (id: string) => {
    const updated = get().routines.filter((r) => r.id !== id);
    set({ routines: updated });
    await setStorageItem(ROUTINES_STORAGE_KEY, JSON.stringify(updated));
  },

  resetToDefaults: async () => {
    set({ routines: DEFAULT_ROUTINES });
    await setStorageItem(
      ROUTINES_STORAGE_KEY,
      JSON.stringify(DEFAULT_ROUTINES)
    );
  },

  isHabitCompleted: (habitId: string, dateParam?: string) => {
    const date = dateParam || get().selectedDate || getTodayKey();
    const completed = get().completedLogs[date] || [];
    return completed.includes(habitId);
  },

  getProgressForDate: (dateParam?: string) => {
    const date = dateParam || get().selectedDate || getTodayKey();
    const activeRoutines = get().routines;
    const completed = get().completedLogs[date] || [];

    const total = activeRoutines.length;
    const completedCount = completed.filter((id) =>
      activeRoutines.some((r) => r.id === id)
    ).length;

    const percentage =
      total > 0 ? Math.min(100, Math.round((completedCount / total) * 100)) : 0;

    return {
      total,
      completed: completedCount,
      percentage,
    };
  },

  getStreakStats: () => {
    const logs = get().completedLogs;
    const totalHabits = get().routines.length;
    if (totalHabits === 0) {
      return { currentStreak: 0, bestStreak: 0, totalDaysLogged: 0 };
    }

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let totalDaysLogged = 0;

    // Check dates sequentially backwards starting today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = getTodayKey();
    const todayCompleted = (logs[todayStr] || []).length;
    const todayDone = todayCompleted >= Math.ceil(totalHabits * 0.5);

    // Calculate current streak
    let cursor = new Date(today);
    if (!todayDone) {
      // Check if yesterday was active
      cursor.setDate(cursor.getDate() - 1);
    }

    while (true) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const count = (logs[key] || []).length;
      if (count >= Math.ceil(totalHabits * 0.5)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    // Best streak calculation across all keys
    const dates = Object.keys(logs).sort();
    totalDaysLogged = dates.filter(
      (d) => (logs[d] || []).length >= Math.ceil(totalHabits * 0.3)
    ).length;

    bestStreak = Math.max(currentStreak, totalDaysLogged > 0 ? 1 : 0);

    return {
      currentStreak,
      bestStreak,
      totalDaysLogged,
    };
  },

  getRoutinesForTimeOfDay: (timeOfDay: RoutineTimeOfDay) => {
    return get().routines.filter((r) => r.timeOfDay === timeOfDay);
  },

  getPendingRoutinesForNow: () => {
    const currentTimeOfDay = calculateCurrentTimeOfDay();
    const today = getTodayKey();
    const completed = get().completedLogs[today] || [];

    const currentBlockRoutines = get().routines.filter(
      (r) => r.timeOfDay === currentTimeOfDay
    );
    const pendingInCurrent = currentBlockRoutines.filter(
      (r) => !completed.includes(r.id)
    );

    if (pendingInCurrent.length > 0) {
      return pendingInCurrent;
    }

    // If current block is all done, return any pending from other blocks
    return get().routines.filter((r) => !completed.includes(r.id));
  },
}));
