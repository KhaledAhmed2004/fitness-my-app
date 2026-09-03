/**
 * MENTOR: Nutrition domain types — single source of truth for meals & macros.
 */

export type Nutrients = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type ProcessingLevel = 'WHOLE' | 'LIGHT' | 'PROCESSED' | 'ULTRA';

export type ProcessedFoodScore = {
  score: number; // 0-100, higher = healthier
  breakdown: {
    WHOLE: number;   // % of calories from whole foods
    LIGHT: number;   // % from lightly processed
    PROCESSED: number; // % from processed
    ULTRA: number;   // % from ultra-processed
  };
};

export type MacroTargets = Nutrients;

export type QuantityUnit = 'g' | 'serving';

export type MealGroup = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Food = {
  id: string;
  name: string;
  /** Scale: per100g * (grams / 100) */
  per100g?: Nutrients;
  /** Scale: perServing * quantity (eggs, pieces) */
  perServing?: Nutrients;
  servingLabel?: string;
};

export type MealItem = {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  unit: QuantityUnit;
  nutrients: Nutrients;
};

export type Meal = {
  id: string;
  userId: string;
  date: string;
  group: MealGroup;
  items: MealItem[];
};

export type DayNutrition = {
  date: string;
  userId: string;
  targets: MacroTargets;
  consumed: Nutrients;
  remaining: Nutrients;
  meals: Meal[];
  processedFoodScore?: ProcessedFoodScore;
};

export type LogFoodInput = {
  foodId: string;
  quantity: number;
  unit: QuantityUnit;
  group: MealGroup;
};

export type UpdateItemQuantityInput = {
  mealId: string;
  itemId: string;
  quantity: number;
};
