/**
 * Nutrition Day Service — with full offline / standalone local mock support.
 */

import {
  DEFAULT_TARGETS,
  MEAL_GROUPS,
  calculateItemNutrients,
  remainingNutrients,
  sumMealItems,
  todayDateKey,
} from '@/lib/nutrition-math';
import { logFoodSchema, macroTargetsSchema, updateItemQuantitySchema } from '@/lib/nutrition-schemas';
import { getFoodById } from '@/services/food-catalog';
import {
  fetchMyNutritionGoals,
  goalsApiToTargets,
  upsertMyNutritionGoals,
} from '@/services/nutrition-goals-api';
import type {
  DayNutrition,
  LogFoodInput,
  MacroTargets,
  Meal,
  MealGroup,
  ProcessedFoodScore,
  UpdateItemQuantityInput,
} from '@/types/nutrition';

type DayKey = string;

const store = new Map<DayKey, DayNutrition>();

function dayKey(userId: string, date: string): DayKey {
  const safeUser = userId || 'usr_demo_1';
  return `${safeUser}::${date}`;
}

function emptyMeals(userId: string, date: string): Meal[] {
  const safeUser = userId || 'usr_demo_1';
  return MEAL_GROUPS.map((group) => ({
    id: `${date}-${group}`,
    userId: safeUser,
    date,
    group,
    items: [],
  }));
}

function seedDefaultMeals(userId: string, date: string): Meal[] {
  const safeUser = userId || 'usr_demo_1';
  const meals = emptyMeals(safeUser, date);

  // Breakfast items
  const breakfast = meals.find((m) => m.group === 'breakfast');
  if (breakfast) {
    const eggs = getFoodById('food_eggs') || {
      id: 'food_eggs',
      name: 'Whole Eggs (Boiled/Scrambled)',
      servingSize: 100,
      servingUnit: 'g',
      calories: 143,
      protein: 13,
      carbs: 1,
      fat: 10,
    };
    const oats = getFoodById('food_oats') || {
      id: 'food_oats',
      name: 'Rolled Oats with Milk',
      servingSize: 100,
      servingUnit: 'g',
      calories: 180,
      protein: 7,
      carbs: 28,
      fat: 4,
    };
    breakfast.items.push(
      {
        id: 'seed_item_1',
        foodId: eggs.id,
        foodName: eggs.name,
        quantity: 2,
        unit: 'serving',
        nutrients: { calories: 286, proteinG: 26, carbsG: 2, fatG: 20 },
      },
      {
        id: 'seed_item_2',
        foodId: oats.id,
        foodName: oats.name,
        quantity: 1,
        unit: 'serving',
        nutrients: { calories: 180, proteinG: 7, carbsG: 28, fatG: 4 },
      }
    );
  }

  // Lunch items
  const lunch = meals.find((m) => m.group === 'lunch');
  if (lunch) {
    const chicken = getFoodById('food_chicken') || {
      id: 'food_chicken',
      name: 'Grilled Chicken Breast & Rice',
      servingSize: 150,
      servingUnit: 'g',
      calories: 380,
      protein: 38,
      carbs: 42,
      fat: 6,
    };
    lunch.items.push({
      id: 'seed_item_3',
      foodId: chicken.id,
      foodName: chicken.name,
      quantity: 1,
      unit: 'serving',
      nutrients: { calories: 380, proteinG: 38, carbsG: 42, fatG: 6 },
    });
  }

  return meals;
}

function rebuildDay(day: DayNutrition): DayNutrition {
  const consumed = sumMealItems(day.meals);
  return {
    ...day,
    consumed,
    remaining: remainingNutrients(day.targets, consumed),
  };
}

function ensureDay(userId: string, date: string, targets?: MacroTargets): DayNutrition {
  const safeUser = userId || 'usr_demo_1';
  const key = dayKey(safeUser, date);
  const existing = store.get(key);
  if (existing) {
    if (targets) {
      existing.targets = targets;
      const next = rebuildDay(existing);
      store.set(key, next);
      return next;
    }
    return existing;
  }

  const created: DayNutrition = {
    date,
    userId: safeUser,
    targets: targets ? { ...targets } : { ...DEFAULT_TARGETS },
    consumed: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    remaining: targets ? { ...targets } : { ...DEFAULT_TARGETS },
    meals: date === todayDateKey() ? seedDefaultMeals(safeUser, date) : emptyMeals(safeUser, date),
    processedFoodScore: {
      score: 84,
      breakdown: { WHOLE: 70, LIGHT: 18, PROCESSED: 8, ULTRA: 4 },
    },
  };
  const next = rebuildDay(created);
  store.set(key, next);
  return next;
}

async function resolveTargets(userId: string): Promise<MacroTargets> {
  try {
    const goals = await fetchMyNutritionGoals();
    return goalsApiToTargets(goals);
  } catch {
    return { ...DEFAULT_TARGETS };
  }
}

export async function getDay(userId: string, date = todayDateKey()): Promise<DayNutrition> {
  const safeUser = userId || 'usr_demo_1';
  const targets = await resolveTargets(safeUser);
  const day = ensureDay(safeUser, date, targets);

  // Attempt backend fetch if live, otherwise silently retain local
  try {
    const { apiRequest } = await import('./api-client');
    const res = await apiRequest<{ processedFoodScore?: ProcessedFoodScore }>({
      method: 'GET',
      path: `/api/v1/nutrition/daily?date=${date}`,
      auth: true,
      timeoutMs: 2000,
    });
    if (res?.processedFoodScore) {
      day.processedFoodScore = res.processedFoodScore;
    }
  } catch {
    // Non-critical offline fallback
  }

  return day;
}

export async function setTargets(
  userId: string,
  targets: MacroTargets,
  date = todayDateKey(),
): Promise<DayNutrition> {
  const safeUser = userId || 'usr_demo_1';
  const parsed = macroTargetsSchema.safeParse(targets);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid targets.');
  }

  const saved = await upsertMyNutritionGoals(parsed.data);
  const nextTargets = goalsApiToTargets(saved);
  return ensureDay(safeUser, date, nextTargets);
}

export async function addMealItem(
  userId: string,
  input: LogFoodInput,
  date = todayDateKey(),
): Promise<DayNutrition> {
  const safeUser = userId || 'usr_demo_1';
  const parsed = logFoodSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid meal payload.');
  }

  const food = getFoodById(parsed.data.foodId);
  if (!food) {
    throw new Error('Food not found in catalog.');
  }

  const nutrients = calculateItemNutrients(food, parsed.data.quantity, parsed.data.unit);
  const day = ensureDay(safeUser, date);
  const meal = day.meals.find((m) => m.group === parsed.data.group);
  if (!meal) {
    throw new Error('Meal group not found.');
  }

  meal.items.push({
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    foodId: food.id,
    foodName: food.name,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    nutrients,
  });

  const next = rebuildDay(day);
  store.set(dayKey(safeUser, date), next);
  return next;
}

export async function updateMealItemQuantity(
  userId: string,
  input: UpdateItemQuantityInput,
  date = todayDateKey(),
): Promise<DayNutrition> {
  const safeUser = userId || 'usr_demo_1';
  const parsed = updateItemQuantitySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid update payload.');
  }

  const day = ensureDay(safeUser, date);
  const meal = day.meals.find((m) => m.id === parsed.data.mealId);
  if (!meal) {
    throw new Error('Meal not found.');
  }

  const item = meal.items.find((i) => i.id === parsed.data.itemId);
  if (!item) {
    throw new Error('Meal item not found.');
  }

  const food = getFoodById(item.foodId);
  if (!food) {
    throw new Error('Food not found in catalog.');
  }

  item.quantity = parsed.data.quantity;
  item.nutrients = calculateItemNutrients(food, parsed.data.quantity, item.unit);

  const next = rebuildDay(day);
  store.set(dayKey(safeUser, date), next);
  return next;
}

export async function removeMealItem(
  userId: string,
  mealId: string,
  itemId: string,
  date = todayDateKey(),
): Promise<DayNutrition> {
  const safeUser = userId || 'usr_demo_1';
  const day = ensureDay(safeUser, date);
  const meal = day.meals.find((m) => m.id === mealId);
  if (!meal) {
    throw new Error('Meal not found.');
  }

  meal.items = meal.items.filter((i) => i.id !== itemId);
  const next = rebuildDay(day);
  store.set(dayKey(safeUser, date), next);
  return next;
}

export function mealForGroup(day: DayNutrition, group: MealGroup) {
  return day.meals.find((m) => m.group === group);
}
