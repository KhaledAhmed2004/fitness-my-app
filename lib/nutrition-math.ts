/**
 * MENTOR: Pure nutrition math — no React, no I/O. Easy to reason about & test.
 */

import type { Food, Meal, MealGroup, Nutrients, QuantityUnit } from '@/types/nutrition';

export const ZERO_NUTRIENTS: Nutrients = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
};

export const DEFAULT_TARGETS: Nutrients = {
  calories: 2200,
  proteinG: 160,
  carbsG: 220,
  fatG: 70,
};

export const MEAL_GROUPS: MealGroup[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_GROUP_LABELS: Record<MealGroup, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function scaleNutrients(base: Nutrients, factor: number): Nutrients {
  return {
    calories: round1(base.calories * factor),
    proteinG: round1(base.proteinG * factor),
    carbsG: round1(base.carbsG * factor),
    fatG: round1(base.fatG * factor),
  };
}

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    calories: round1(a.calories + b.calories),
    proteinG: round1(a.proteinG + b.proteinG),
    carbsG: round1(a.carbsG + b.carbsG),
    fatG: round1(a.fatG + b.fatG),
  };
}

export function remainingNutrients(targets: Nutrients, consumed: Nutrients): Nutrients {
  return {
    calories: Math.max(0, round1(targets.calories - consumed.calories)),
    proteinG: Math.max(0, round1(targets.proteinG - consumed.proteinG)),
    carbsG: Math.max(0, round1(targets.carbsG - consumed.carbsG)),
    fatG: Math.max(0, round1(targets.fatG - consumed.fatG)),
  };
}

/**
 * Calculate nutrients for a quantity from the food catalog.
 * Throws if the payload cannot produce complete calorie math.
 */
export function calculateItemNutrients(
  food: Food,
  quantity: number,
  unit: QuantityUnit,
): Nutrients {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Quantity must be greater than 0.');
  }

  if (unit === 'g') {
    if (!food.per100g) {
      throw new Error(`${food.name} has no per-100g nutrients.`);
    }
    return scaleNutrients(food.per100g, quantity / 100);
  }

  if (unit === 'serving') {
    if (!food.perServing) {
      throw new Error(`${food.name} has no per-serving nutrients.`);
    }
    return scaleNutrients(food.perServing, quantity);
  }

  throw new Error('Invalid quantity unit.');
}

export function sumMealItems(meals: Meal[]): Nutrients {
  return meals.reduce((total, meal) => {
    return meal.items.reduce((inner, item) => addNutrients(inner, item.nutrients), total);
  }, ZERO_NUTRIENTS);
}

export function mealGroupCalories(meal: Meal | undefined): number {
  if (!meal) return 0;
  return meal.items.reduce((sum, item) => sum + item.nutrients.calories, 0);
}

export function formatQty(quantity: number, unit: QuantityUnit, servingLabel?: string) {
  if (unit === 'g') return `${round1(quantity)} g`;
  const label = servingLabel ?? 'serving';
  return `${round1(quantity)} × ${label}`;
}

export function todayDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * MENTOR: Time-of-day meal suggestion reduces choice load on Log food CTA.
 * Windows are soft defaults, not hard rules.
 */
export function suggestedMealGroup(d = new Date()): MealGroup {
  const hour = d.getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 21) return 'dinner';
  return 'snack';
}

export function progressRatio(consumed: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(1, consumed / target);
}
