import { apiRequest } from './api-client';

export type TMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export type TMealFoodSuggestion = {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type TMealSuggestion = {
  mealType: TMealType;
  name: string;
  foods: TMealFoodSuggestion[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  prepTime: string;
  difficulty: 'easy' | 'medium';
  tip: string;
};

export type IMealPlan = {
  date: string;
  meals: TMealSuggestion[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  summary: string;
};

export async function generateMealPlan(opts?: { preferences?: string }): Promise<IMealPlan> {
  const response = await apiRequest<IMealPlan>({
    method: 'POST',
    path: '/api/v1/meal-planner/generate',
    body: opts,
    auth: true,
    timeoutMs: 60000, // LLM generation can take > 15s
  });
  return response;
}
