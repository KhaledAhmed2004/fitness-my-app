import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { recomputeHydrationSummary } from '@/lib/hydration-math';
import { todayDateKey } from '@/lib/nutrition-math';
import { nutritionKeys } from '@/lib/query-keys';
import {
  deleteWaterLog,
  fetchHydrationForDate,
  fetchHydrationGoal,
  logWaterIntake,
  setWaterGoalLiters,
} from '@/services/hydration-api';
import {
  addMealItem,
  getDay,
  removeMealItem,
  setTargets,
  updateMealItemQuantity,
} from '@/services/nutrition-api';
import type { HydrationSummary } from '@/types/hydration';
import type {
  LogFoodInput,
  MacroTargets,
  UpdateItemQuantityInput,
} from '@/types/nutrition';

/** Reactive local date key — rolls over on foreground / minute tick. */
export function useNutritionDate() {
  const [date, setDate] = useState(() => todayDateKey());

  useEffect(() => {
    const sync = () => {
      const next = todayDateKey();
      setDate((prev) => (prev === next ? prev : next));
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    const tick = setInterval(sync, 60_000);
    return () => {
      sub.remove();
      clearInterval(tick);
    };
  }, []);

  return date;
}

export function useNutritionDay() {
  const { user, isAuthenticated } = useAuth();
  const date = useNutritionDate();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: nutritionKeys.day(date, userId),
    queryFn: () => getDay(userId, date),
    enabled: isAuthenticated && !!userId,
  });
}

export function useHydration() {
  const { isAuthenticated } = useAuth();
  const date = useNutritionDate();

  return useQuery({
    queryKey: nutritionKeys.hydration(date),
    queryFn: () => fetchHydrationForDate(date),
    enabled: isAuthenticated,
  });
}

/** Settings reopen — GET /api/v1/hydration/goal (persisted target). */
export function useHydrationGoal(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: nutritionKeys.hydrationGoal(),
    queryFn: () => fetchHydrationGoal(),
    enabled: isAuthenticated && enabled,
    refetchOnMount: 'always',
  });
}

export function useSetTargets() {
  const { user } = useAuth();
  const date = useNutritionDate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (targets: MacroTargets) => {
      if (!user?.id) throw new Error('Authentication required.');
      return setTargets(user.id, targets, date);
    },
    onSuccess: (day) => {
      if (!user?.id) return;
      // Apply returned day (targets + remaining) — goals already persisted via PATCH
      qc.setQueryData(nutritionKeys.day(date, user.id), day);
    },
  });
}

export function useLogFood() {
  const { user } = useAuth();
  const date = useNutritionDate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogFoodInput) => {
      if (!user?.id) throw new Error('Authentication required.');
      return addMealItem(user.id, input, date);
    },
    onSuccess: () => {
      if (!user?.id) return;
      void qc.invalidateQueries({ queryKey: nutritionKeys.day(date, user.id) });
    },
  });
}

export function useEditItemQuantity() {
  const { user } = useAuth();
  const date = useNutritionDate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateItemQuantityInput) => {
      if (!user?.id) throw new Error('Authentication required.');
      return updateMealItemQuantity(user.id, input, date);
    },
    onSuccess: () => {
      if (!user?.id) return;
      void qc.invalidateQueries({ queryKey: nutritionKeys.day(date, user.id) });
    },
  });
}

export function useDeleteItem() {
  const { user } = useAuth();
  const date = useNutritionDate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealId, itemId }: { mealId: string; itemId: string }) => {
      if (!user?.id) throw new Error('Authentication required.');
      return removeMealItem(user.id, mealId, itemId, date);
    },
    onSuccess: () => {
      if (!user?.id) return;
      void qc.invalidateQueries({ queryKey: nutritionKeys.day(date, user.id) });
    },
  });
}

export function useAddWater() {
  const { user } = useAuth();
  const date = useNutritionDate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (amountMl: number) => {
      if (!user?.id) throw new Error('Authentication required.');
      return logWaterIntake(date, amountMl);
    },
    onSuccess: (result) => {
      qc.setQueryData(nutritionKeys.hydration(date), (prev: HydrationSummary | undefined) => {
        const logsFromApi = result.summary.logs;
        const logs =
          logsFromApi.length > 0
            ? logsFromApi
            : [...(prev?.logs ?? []), result.entry].filter(
                (log, i, arr) => arr.findIndex((x) => x.id === log.id) === i,
              );

        return {
          ...result.summary,
          logs,
          entryCount:
            result.summary.entryCount > 0 || logsFromApi.length > 0
              ? result.summary.entryCount
              : logs.length,
        };
      });
    },
  });
}

export function useUndoWater() {
  const { user } = useAuth();
  const date = useNutritionDate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (waterLogId: string) => {
      if (!user?.id) throw new Error('Authentication required.');
      if (!waterLogId) throw new Error('Water log id required.');
      return deleteWaterLog(waterLogId);
    },
    onSuccess: (result) => {
      qc.setQueryData(nutritionKeys.hydration(date), (prev: HydrationSummary | undefined) => {
        const logsFromApi = result.summary.logs;
        const logs =
          logsFromApi.length > 0
            ? logsFromApi
            : (prev?.logs ?? []).filter((log) => log.id !== result.deleted.id);

        return {
          ...result.summary,
          logs,
          entryCount:
            result.summary.entryCount > 0 || logsFromApi.length > 0
              ? result.summary.entryCount
              : logs.length,
        };
      });
    },
  });
}

export function useUpdateWaterGoal() {
  const { user } = useAuth();
  const date = useNutritionDate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (liters: number) => {
      if (!user?.id) throw new Error('Authentication required.');
      return setWaterGoalLiters(liters);
    },
    onSuccess: (goal) => {
      qc.setQueryData(nutritionKeys.hydrationGoal(), goal);
      qc.setQueryData(nutritionKeys.hydration(date), (prev: HydrationSummary | undefined) => {
        if (!prev) return prev;
        return recomputeHydrationSummary(prev, goal);
      });
    },
  });
}
