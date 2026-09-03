/**
 * Nutrition Goals Service — with offline standalone fallback.
 */

import { apiRequest } from '@/services/api-client';
import type { MacroTargets } from '@/types/nutrition';

export type NutritionGoalsApi = {
  id?: string;
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt?: string;
  updatedAt?: string;
};

let localNutritionGoals: NutritionGoalsApi = {
  dailyCalories: 2200,
  protein: 160,
  carbs: 220,
  fat: 65,
};

export function goalsApiToTargets(goals: NutritionGoalsApi): MacroTargets {
  return {
    calories: Number(goals.dailyCalories || 2200),
    proteinG: Number(goals.protein || 160),
    carbsG: Number(goals.carbs || 220),
    fatG: Number(goals.fat || 65),
  };
}

export function targetsToGoalsApi(targets: MacroTargets): {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return {
    dailyCalories: Math.round(targets.calories),
    protein: Math.round(targets.proteinG),
    carbs: Math.round(targets.carbsG),
    fat: Math.round(targets.fatG),
  };
}

export async function fetchMyNutritionGoals(): Promise<NutritionGoalsApi> {
  try {
    const data = await apiRequest<NutritionGoalsApi>({
      method: 'GET',
      path: '/api/v1/nutrition-goals/me',
      auth: true,
      timeoutMs: 8000,
    });
    if (data && typeof data.dailyCalories === 'number') {
      localNutritionGoals = data;
      return data;
    }
  } catch {
    /* fallback */
  }
  return localNutritionGoals;
}

export async function upsertMyNutritionGoals(
  targets: MacroTargets,
): Promise<NutritionGoalsApi> {
  localNutritionGoals = targetsToGoalsApi(targets);
  try {
    const data = await apiRequest<NutritionGoalsApi>({
      method: 'PATCH',
      path: '/api/v1/nutrition-goals/me',
      auth: true,
      body: localNutritionGoals,
      timeoutMs: 8000,
    });
    if (data) return data;
  } catch {
    /* fallback */
  }
  return localNutritionGoals;
}
