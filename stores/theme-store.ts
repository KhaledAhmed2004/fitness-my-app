import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Appearance, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type ThemeMode = 'dark' | 'light' | 'midnight' | 'crimson' | 'amber' | 'purple';

export type ThemePresetMeta = {
  id: ThemeMode;
  name: string;
  subtitle: string;
  emoji: string;
  isDark: boolean;
  previewColors: {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
  };
};

export const THEME_PRESETS: ThemePresetMeta[] = [
  {
    id: 'dark',
    name: 'Onyx Neon',
    subtitle: 'Cyber Athletic Dark',
    emoji: '🌙',
    isDark: true,
    previewColors: {
      bg: '#101416',
      surface: '#1C2023',
      primary: '#89CEFF',
      accent: '#89FE00',
    },
  },
  {
    id: 'light',
    name: 'Sage Oasis',
    subtitle: 'Organic Fresh Light',
    emoji: '🌿',
    isDark: false,
    previewColors: {
      bg: '#F0F5EC',
      surface: '#FFFFFF',
      primary: '#0E4D34',
      accent: '#B4E876',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Cobalt',
    subtitle: 'Deep Ocean Pro',
    emoji: '🌊',
    isDark: true,
    previewColors: {
      bg: '#0B111E',
      surface: '#141E30',
      primary: '#38BDF8',
      accent: '#818CF8',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson Beast',
    subtitle: 'Iron & Heavy Power',
    emoji: '🔥',
    isDark: true,
    previewColors: {
      bg: '#140A0C',
      surface: '#221217',
      primary: '#FF4655',
      accent: '#FFB800',
    },
  },
  {
    id: 'amber',
    name: 'Solar Amber',
    subtitle: 'Warm Cardio Drive',
    emoji: '🌅',
    isDark: true,
    previewColors: {
      bg: '#16120E',
      surface: '#241C16',
      primary: '#FF922B',
      accent: '#FFD43B',
    },
  },
  {
    id: 'purple',
    name: 'Synthwave Violet',
    subtitle: 'Neon Night Vibe',
    emoji: '💜',
    isDark: true,
    previewColors: {
      bg: '#120E1C',
      surface: '#201830',
      primary: '#C084FC',
      accent: '#F43F5E',
    },
  },
];

export const isThemeDark = (mode: ThemeMode): boolean => {
  return mode !== 'light';
};

const THEME_STORAGE_KEY = 'vital_theme_mode_v2';

const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(name);
      }
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(name, value);
        return;
      }
      await SecureStore.setItemAsync(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(name);
        return;
      }
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

interface ThemeState {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      isDark: true,
      setTheme: (theme: ThemeMode) => {
        const dark = isThemeDark(theme);
        set({ theme, isDark: dark });
        Appearance.setColorScheme?.(dark ? 'dark' : 'light');
      },
      toggleTheme: () => {
        const current = get().theme;
        const index = THEME_PRESETS.findIndex((t) => t.id === current);
        const nextIndex = (index + 1) % THEME_PRESETS.length;
        const nextTheme = THEME_PRESETS[nextIndex].id;
        const dark = isThemeDark(nextTheme);

        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        set({ theme: nextTheme, isDark: dark });
        Appearance.setColorScheme?.(dark ? 'dark' : 'light');
      },
      loadTheme: async () => {
        try {
          const raw = await customStorage.getItem(THEME_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            const mode = parsed?.state?.theme;
            if (THEME_PRESETS.some((t) => t.id === mode)) {
              const dark = isThemeDark(mode);
              set({ theme: mode, isDark: dark });
              Appearance.setColorScheme?.(dark ? 'dark' : 'light');
            }
          }
        } catch {}
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => customStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isDark = isThemeDark(state.theme);
          Appearance.setColorScheme?.(state.isDark ? 'dark' : 'light');
        }
      },
    }
  )
);
