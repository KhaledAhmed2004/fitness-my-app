import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

const FOCUS_STORAGE_KEY = 'vital_focus_settings_v1';

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

function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type FocusMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

export interface FocusSettings {
  focusDuration: number; // in minutes (default 25)
  shortBreakDuration: number; // in minutes (default 5)
  longBreakDuration: number; // in minutes (default 15)
  roundsBeforeLongBreak: number; // (default 4)
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export interface FocusDailyPoint {
  date: string;
  dayLabel: string;
  minutes: number;
  rounds: number;
  isToday: boolean;
}

export interface FocusHeatmapCell {
  date: string;
  dayNumber: number;
  minutes: number;
  rounds: number;
  level: 0 | 1 | 2 | 3;
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface FocusState {
  // Settings
  settings: FocusSettings;

  // Runtime State
  currentMode: FocusMode;
  currentRound: number;
  activeTaskId: string | null;
  totalFocusMinutesToday: number;
  strayThoughts: string[];
  history: Record<string, { minutes: number; rounds: number }>;
  isLoading: boolean;

  // Actions
  loadData: () => Promise<void>;
  updateSettings: (newSettings: Partial<FocusSettings>) => Promise<void>;
  switchMode: (mode: FocusMode) => void;
  advanceToNextMode: () => FocusMode;
  setActiveTaskId: (id: string | null) => void;
  addFocusMinutes: (minutes: number) => void;
  addStrayThought: (thought: string) => void;
  removeStrayThought: (index: number) => void;
  clearStrayThoughts: () => void;
  resetRounds: () => void;

  // Analytical Getters
  getWeeklyFocusSeries: (days?: number) => FocusDailyPoint[];
  getFocusHeatmapCells: () => FocusHeatmapCell[];
  getFocusStats: () => {
    weeklyTotalMinutes: number;
    dailyAverageMinutes: number;
    peakDayName: string;
    peakDayMinutes: number;
    streakDays: number;
  };
}

const DEFAULT_SETTINGS: FocusSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  roundsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

// Seed realistic focus logs for past days so chart looks alive immediately
const SEED_HISTORY: Record<string, { minutes: number; rounds: number }> = (() => {
  const map: Record<string, { minutes: number; rounds: number }> = {};
  const today = new Date();
  const sampleMinutes = [50, 75, 45, 100, 60, 25, 90, 50, 80, 45, 120, 75, 30, 95];

  for (let i = 1; i <= 28; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const mins = sampleMinutes[i % sampleMinutes.length] || 45;
    map[dateStr] = {
      minutes: mins,
      rounds: Math.round(mins / 25),
    };
  }
  return map;
})();

export const useFocusStore = create<FocusState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  currentMode: 'FOCUS',
  currentRound: 1,
  activeTaskId: null,
  totalFocusMinutesToday: 75,
  strayThoughts: [],
  history: SEED_HISTORY,
  isLoading: false,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const stored = await getStorageItem(FOCUS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const todayStr = getTodayStr();
        const historyData = parsed.history || SEED_HISTORY;
        const todayMinutes = historyData[todayStr]?.minutes ?? (parsed.totalFocusMinutesToday || 75);

        set({
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          totalFocusMinutesToday: todayMinutes,
          strayThoughts: Array.isArray(parsed.strayThoughts) ? parsed.strayThoughts : [],
          history: historyData,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    await setStorageItem(
      FOCUS_STORAGE_KEY,
      JSON.stringify({
        settings: updated,
        totalFocusMinutesToday: get().totalFocusMinutesToday,
        strayThoughts: get().strayThoughts,
        history: get().history,
      })
    );
  },

  switchMode: (mode) => {
    set({ currentMode: mode });
  },

  advanceToNextMode: () => {
    const { currentMode, currentRound, settings, totalFocusMinutesToday, history } = get();

    if (currentMode === 'FOCUS') {
      const todayStr = getTodayStr();
      const updatedTotal = totalFocusMinutesToday + settings.focusDuration;
      const todayHistory = history[todayStr] || { minutes: 0, rounds: 0 };
      const updatedHistory = {
        ...history,
        [todayStr]: {
          minutes: todayHistory.minutes + settings.focusDuration,
          rounds: todayHistory.rounds + 1,
        },
      };

      set({
        totalFocusMinutesToday: updatedTotal,
        history: updatedHistory,
      });

      if (currentRound >= settings.roundsBeforeLongBreak) {
        set({ currentMode: 'LONG_BREAK' });
        return 'LONG_BREAK';
      } else {
        set({ currentMode: 'SHORT_BREAK' });
        return 'SHORT_BREAK';
      }
    } else if (currentMode === 'SHORT_BREAK') {
      const nextRound = currentRound + 1;
      set({ currentMode: 'FOCUS', currentRound: nextRound });
      return 'FOCUS';
    } else {
      set({ currentMode: 'FOCUS', currentRound: 1 });
      return 'FOCUS';
    }
  },

  setActiveTaskId: (id) => {
    set({ activeTaskId: id });
  },

  addFocusMinutes: (minutes) => {
    const todayStr = getTodayStr();
    const { totalFocusMinutesToday, history } = get();
    const updatedTotal = totalFocusMinutesToday + minutes;
    const todayHistory = history[todayStr] || { minutes: 0, rounds: 0 };
    const updatedHistory = {
      ...history,
      [todayStr]: {
        minutes: todayHistory.minutes + minutes,
        rounds: todayHistory.rounds + 1,
      },
    };
    set({ totalFocusMinutesToday: updatedTotal, history: updatedHistory });
  },

  addStrayThought: (thought) => {
    if (!thought.trim()) return;
    set((state) => ({ strayThoughts: [thought.trim(), ...state.strayThoughts] }));
  },

  removeStrayThought: (index) => {
    set((state) => ({
      strayThoughts: state.strayThoughts.filter((_, i) => i !== index),
    }));
  },

  clearStrayThoughts: () => {
    set({ strayThoughts: [] });
  },

  resetRounds: () => {
    set({ currentRound: 1, currentMode: 'FOCUS' });
  },

  getWeeklyFocusSeries: (daysCount = 7) => {
    const { history, totalFocusMinutesToday } = get();
    const today = new Date();
    const todayStr = getTodayStr();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: FocusDailyPoint[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const isToday = dateStr === todayStr;

      const mins = isToday
        ? totalFocusMinutesToday
        : history[dateStr]?.minutes || 0;
      const r = isToday
        ? Math.round(totalFocusMinutesToday / 25)
        : history[dateStr]?.rounds || 0;

      result.push({
        date: dateStr,
        dayLabel: dayNames[d.getDay()],
        minutes: mins,
        rounds: r,
        isToday,
      });
    }

    return result;
  },

  getFocusHeatmapCells: () => {
    const { history, totalFocusMinutesToday } = get();
    const today = new Date();
    const todayStr = getTodayStr();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDay.getDate();

    let startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon...
    // Adjust so Monday is 0, Sunday is 6
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const cells: FocusHeatmapCell[] = [];

    // Padding for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, 0 - (startingDayOfWeek - 1 - i));
      const pYear = prevDate.getFullYear();
      const pMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
      const pDay = String(prevDate.getDate()).padStart(2, '0');
      const dateStr = `${pYear}-${pMonth}-${pDay}`;
      const mins = history[dateStr]?.minutes || 0;
      const level: 0 | 1 | 2 | 3 =
        mins >= 60 ? 3 : mins >= 35 ? 2 : mins > 0 ? 1 : 0;

      cells.push({
        date: dateStr,
        dayNumber: prevDate.getDate(),
        minutes: mins,
        rounds: history[dateStr]?.rounds || 0,
        level,
        isToday: false,
        isCurrentMonth: false,
      });
    }

    // Days in Current Month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const cYear = curDate.getFullYear();
      const cMonth = String(curDate.getMonth() + 1).padStart(2, '0');
      const cDay = String(curDate.getDate()).padStart(2, '0');
      const dateStr = `${cYear}-${cMonth}-${cDay}`;
      const isToday = dateStr === todayStr;

      const mins = isToday ? totalFocusMinutesToday : history[dateStr]?.minutes || 0;
      const rounds = isToday
        ? Math.round(totalFocusMinutesToday / 25)
        : history[dateStr]?.rounds || 0;

      const level: 0 | 1 | 2 | 3 =
        mins >= 60 ? 3 : mins >= 35 ? 2 : mins > 0 ? 1 : 0;

      cells.push({
        date: dateStr,
        dayNumber: d,
        minutes: mins,
        rounds,
        level,
        isToday,
        isCurrentMonth: true,
      });
    }

    // Trailing padding to make full 7xN grid
    const remainingCells = 7 - (cells.length % 7);
    if (remainingCells < 7) {
      for (let j = 1; j <= remainingCells; j++) {
        const nextDate = new Date(year, month + 1, j);
        const nYear = nextDate.getFullYear();
        const nMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nDay = String(nextDate.getDate()).padStart(2, '0');
        const dateStr = `${nYear}-${nMonth}-${nDay}`;
        const mins = history[dateStr]?.minutes || 0;
        const level: 0 | 1 | 2 | 3 =
          mins >= 60 ? 3 : mins >= 35 ? 2 : mins > 0 ? 1 : 0;

        cells.push({
          date: dateStr,
          dayNumber: j,
          minutes: mins,
          rounds: history[dateStr]?.rounds || 0,
          level,
          isToday: false,
          isCurrentMonth: false,
        });
      }
    }

    return cells;
  },

  getFocusStats: () => {
    const series = get().getWeeklyFocusSeries(7);
    const weeklyTotalMinutes = series.reduce((acc, curr) => acc + curr.minutes, 0);
    const dailyAverageMinutes = Math.round(weeklyTotalMinutes / 7);

    let peakDayName = 'None';
    let peakDayMinutes = 0;

    series.forEach((s) => {
      if (s.minutes > peakDayMinutes) {
        peakDayMinutes = s.minutes;
        peakDayName = s.dayLabel;
      }
    });

    // Count consecutive days with focus
    let streakDays = 0;
    const sortedDesc = [...series].reverse();
    for (const day of sortedDesc) {
      if (day.minutes > 0) {
        streakDays += 1;
      } else {
        break;
      }
    }

    return {
      weeklyTotalMinutes,
      dailyAverageMinutes,
      peakDayName,
      peakDayMinutes,
      streakDays: Math.max(1, streakDays),
    };
  },
}));
