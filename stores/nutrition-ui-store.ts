import { create } from 'zustand';

import type { MealGroup } from '@/types/nutrition';

type NutritionUiState = {
  openLogOnMount: boolean;
  preferredLogGroup: MealGroup | null;
  requestOpenLog: (group?: MealGroup) => void;
  consumeOpenLogRequest: () => void;
  reset: () => void;
};

/**
 * MENTOR: Client UI intents only — never put day/hydration API cache here.
 */
export const useNutritionUiStore = create<NutritionUiState>((set) => ({
  openLogOnMount: false,
  preferredLogGroup: null,
  requestOpenLog: (group) =>
    set({
      preferredLogGroup: group ?? null,
      openLogOnMount: true,
    }),
  consumeOpenLogRequest: () => set({ openLogOnMount: false }),
  reset: () =>
    set({
      openLogOnMount: false,
      preferredLogGroup: null,
    }),
}));
