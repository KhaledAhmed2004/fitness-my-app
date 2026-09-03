import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type FeatureKey =
  | 'nutrition'
  | 'fasting'
  | 'running'
  | 'deepFocus'
  | 'routines'
  | 'todos'
  | 'medicine'
  | 'healthVault';

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  subtitle: string;
  category: 'Health & Wellness' | 'Productivity' | 'Lifestyle & Habits';
  icon: ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  bgColor: string;
  badge?: string;
}

export const FEATURES_METADATA: FeatureMeta[] = [
  {
    key: 'nutrition',
    label: 'Nutrition & Macros',
    subtitle: 'Meal calories, protein targets & food logging',
    category: 'Health & Wellness',
    icon: 'restaurant',
    color: '#00B4D8',
    bgColor: 'rgba(0, 180, 216, 0.15)',
  },
  {
    key: 'fasting',
    label: 'Intermittent Fasting',
    subtitle: 'Live fast countdown, stages & milestones',
    category: 'Health & Wellness',
    icon: 'timer',
    color: '#89FE00',
    bgColor: 'rgba(137, 254, 0, 0.15)',
  },
  {
    key: 'running',
    label: 'Training & Running',
    subtitle: 'GPS pace, cardio telemetry & workout sessions',
    category: 'Health & Wellness',
    icon: 'directions-run',
    color: '#FF7849',
    bgColor: 'rgba(255, 120, 73, 0.15)',
  },
  {
    key: 'medicine',
    label: 'Medicine Cabinet',
    subtitle: 'Dose schedules, cabinet stock & reminders',
    category: 'Health & Wellness',
    icon: 'medication',
    color: '#F43F5E',
    bgColor: 'rgba(244, 63, 94, 0.15)',
  },
  {
    key: 'healthVault',
    label: 'Family Health Vault & OS',
    subtitle: 'Prescriptions, care timeline, doctor directory & medical history',
    category: 'Health & Wellness',
    icon: 'health-and-safety',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
  },
  {
    key: 'deepFocus',
    label: 'Deep Focus Timer',
    subtitle: 'Pomodoro intervals, soundscapes & heatmap',
    category: 'Productivity',
    icon: 'center-focus-strong',
    color: '#FCC419',
    bgColor: 'rgba(252, 196, 25, 0.18)',
  },
  {
    key: 'todos',
    label: 'Tasks & Todos',
    subtitle: 'Priority checklist, daily matrix & task planner',
    category: 'Productivity',
    icon: 'checklist',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
  },
  {
    key: 'routines',
    label: 'Habits & Routines',
    subtitle: 'Daily rituals, streak counters & auto logs',
    category: 'Lifestyle & Habits',
    icon: 'fact-check',
    color: '#A78BFA',
    bgColor: 'rgba(167, 139, 250, 0.15)',
  },
];

export const DEFAULT_ENABLED_FEATURES: Record<FeatureKey, boolean> = {
  nutrition: true,
  fasting: true,
  running: true,
  deepFocus: true,
  routines: true,
  todos: true,
  medicine: true,
  healthVault: true,
};

const FEATURES_STORAGE_KEY = 'vital_app_enabled_features_v2';

async function getStoredFeatures(): Promise<Record<FeatureKey, boolean>> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(FEATURES_STORAGE_KEY);
    } else {
      raw = await SecureStore.getItemAsync(FEATURES_STORAGE_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ENABLED_FEATURES, ...parsed };
    }
    return { ...DEFAULT_ENABLED_FEATURES };
  } catch {
    return { ...DEFAULT_ENABLED_FEATURES };
  }
}

async function saveStoredFeatures(features: Record<FeatureKey, boolean>): Promise<void> {
  try {
    const raw = JSON.stringify(features);
    if (Platform.OS === 'web') {
      localStorage.setItem(FEATURES_STORAGE_KEY, raw);
      return;
    }
    await SecureStore.setItemAsync(FEATURES_STORAGE_KEY, raw);
  } catch (err) {
    console.warn('Failed to save features preferences to storage:', err);
  }
}

interface FeaturesState {
  features: Record<FeatureKey, boolean>;
  isLoading: boolean;

  // Actions
  loadFeatures: () => Promise<void>;
  toggleFeature: (key: FeatureKey) => void;
  setFeature: (key: FeatureKey, enabled: boolean) => void;
  enableAll: () => void;
  resetDefaults: () => void;
  isFeatureEnabled: (key: FeatureKey) => boolean;
}

export const useFeaturesStore = create<FeaturesState>((set, get) => ({
  features: { ...DEFAULT_ENABLED_FEATURES },
  isLoading: true,

  loadFeatures: async () => {
    try {
      const stored = await getStoredFeatures();
      set({ features: stored, isLoading: false });
    } catch {
      set({ features: { ...DEFAULT_ENABLED_FEATURES }, isLoading: false });
    }
  },

  toggleFeature: (key: FeatureKey) => {
    const current = get().features;
    const updated = { ...current, [key]: !current[key] };

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    set({ features: updated });
    void saveStoredFeatures(updated);
  },

  setFeature: (key: FeatureKey, enabled: boolean) => {
    const current = get().features;
    const updated = { ...current, [key]: enabled };

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    set({ features: updated });
    void saveStoredFeatures(updated);
  },

  enableAll: () => {
    const updated: Record<FeatureKey, boolean> = {
      nutrition: true,
      fasting: true,
      running: true,
      deepFocus: true,
      routines: true,
      todos: true,
      medicine: true,
      healthVault: true,
    };
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    set({ features: updated });
    void saveStoredFeatures(updated);
  },

  resetDefaults: () => {
    const updated = { ...DEFAULT_ENABLED_FEATURES };
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    set({ features: updated });
    void saveStoredFeatures(updated);
  },

  isFeatureEnabled: (key: FeatureKey) => {
    return Boolean(get().features[key]);
  },
}));
