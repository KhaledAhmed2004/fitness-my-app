export type HydrationPresetKey = 'GLASS' | 'BOTTLE' | 'LARGE';

export type HydrationStatus = 'UNDER' | 'ON_TRACK' | 'MET' | 'OVER';

export type HydrationPreset = {
  preset: HydrationPresetKey;
  amountMl: number;
  amountLiters: number;
  label: string;
};

export type HydrationSummary = {
  /** YYYY-MM-DD from API resolvedDate */
  date: string;
  /** Alias of consumedMl for existing UI */
  amountMl: number;
  consumedMl: number;
  consumedLiters: number;
  goalMl: number;
  goalLiters: number;
  remainingMl: number;
  remainingLiters: number;
  progressPercent: number;
  status: HydrationStatus;
  entryCount: number;
  presets: HydrationPreset[];
  logs: WaterLogEntry[];
};

export type WaterLogEntry = {
  id: string;
  amountMl: number;
  preset?: HydrationPresetKey | null;
  date?: string;
  createdAt?: string;
};

export type QuickAddResult = {
  entry: WaterLogEntry;
  summary: HydrationSummary;
};

export type DeleteWaterResult = {
  deleted: WaterLogEntry;
  summary: HydrationSummary;
};

export type HydrationGoalPayload = {
  goalMl: number;
  goalLiters: number;
};

/** @deprecated Prefer nutrition goals only if needed elsewhere */
export type NutritionGoalsPayload = {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterLiters: number;
};

export const DEFAULT_WATER_GOAL_LITERS = 2.5;
export const DEFAULT_WATER_GOAL_ML = DEFAULT_WATER_GOAL_LITERS * 1000;

export const DEFAULT_HYDRATION_PRESETS: HydrationPreset[] = [
  { preset: 'GLASS', amountMl: 250, amountLiters: 0.25, label: 'Glass' },
  { preset: 'BOTTLE', amountMl: 500, amountLiters: 0.5, label: 'Bottle' },
  { preset: 'LARGE', amountMl: 750, amountLiters: 0.75, label: 'Large' },
];

export const QUICK_WATER_ML = [250, 500, 750] as const;

export const ML_TO_PRESET: Partial<Record<number, HydrationPresetKey>> = {
  250: 'GLASS',
  500: 'BOTTLE',
  750: 'LARGE',
};

export function emptyHydrationSummary(date: string): HydrationSummary {
  return {
    date,
    amountMl: 0,
    consumedMl: 0,
    consumedLiters: 0,
    goalMl: DEFAULT_WATER_GOAL_ML,
    goalLiters: DEFAULT_WATER_GOAL_LITERS,
    remainingMl: DEFAULT_WATER_GOAL_ML,
    remainingLiters: DEFAULT_WATER_GOAL_LITERS,
    progressPercent: 0,
    status: 'UNDER',
    entryCount: 0,
    presets: DEFAULT_HYDRATION_PRESETS,
    logs: [],
  };
}
