import { useThemeStore } from '@/stores/theme-store';

export function useColorScheme(): 'dark' | 'light' {
  return useThemeStore((s) => (s.isDark ? 'dark' : 'light'));
}

