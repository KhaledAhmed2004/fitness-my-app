import { z } from 'zod';

export const macroTargetsSchema = z.object({
  calories: z.number().min(500).max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(1000),
});

export const logFoodSchema = z.object({
  foodId: z.string().min(1, 'Pick a food'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.enum(['g', 'serving']),
  group: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

export const updateItemQuantitySchema = z.object({
  mealId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().positive('Quantity must be greater than 0'),
});

export type LogFoodFormValues = z.infer<typeof logFoodSchema>;
export type MacroTargetsFormValues = z.infer<typeof macroTargetsSchema>;
