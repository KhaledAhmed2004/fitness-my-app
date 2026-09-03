/**
 * Daily Routine & Habit Mastery Types
 */

export type RoutineTimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export type RoutineCategory =
  | 'HEALTH'
  | 'FITNESS'
  | 'NUTRITION'
  | 'MIND'
  | 'FINANCE'
  | 'REST';

export type AutoActionType =
  | 'HYDRATION'
  | 'FASTING'
  | 'WORKOUT'
  | 'RUN'
  | 'MEDICINE'
  | 'EXPENSE'
  | 'LOG_SUGAR'
  | 'LOG_BP';

export interface RoutineItem {
  id: string;
  title: string;
  description?: string;
  timeOfDay: RoutineTimeOfDay;
  targetTime: string; // e.g. "07:30 AM"
  category: RoutineCategory;
  icon: string; // MaterialIcons name
  color: string;
  isSystem: boolean;
  linkedAction?: AutoActionType;
  daysOfWeek: number[]; // [0,1,2,3,4,5,6] (0 = Sun, 6 = Sat)
  createdAt: number;
}

export interface RoutineProgress {
  total: number;
  completed: number;
  percentage: number;
}

export interface RoutineStreakStats {
  currentStreak: number;
  bestStreak: number;
  totalDaysLogged: number;
}
