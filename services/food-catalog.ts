/**
 * MENTOR: Food catalog — known nutrients so meal calories scale from quantity.
 */

import type { Food } from '@/types/nutrition';

export const FOOD_CATALOG: Food[] = [
  {
    id: 'eggs',
    name: 'Whole egg',
    servingLabel: 'egg',
    perServing: {
      calories: 72,
      proteinG: 6.3,
      carbsG: 0.4,
      fatG: 4.8,
    },
    per100g: {
      calories: 143,
      proteinG: 12.6,
      carbsG: 0.7,
      fatG: 9.5,
    },
  },
  {
    id: 'salmon',
    name: 'Salmon',
    servingLabel: 'fillet',
    per100g: {
      calories: 208,
      proteinG: 20,
      carbsG: 0,
      fatG: 13,
    },
    perServing: {
      calories: 280,
      proteinG: 27,
      carbsG: 0,
      fatG: 18,
    },
  },
  {
    id: 'chicken-breast',
    name: 'Chicken breast',
    servingLabel: 'breast',
    per100g: {
      calories: 165,
      proteinG: 31,
      carbsG: 0,
      fatG: 3.6,
    },
  },
  {
    id: 'white-rice',
    name: 'White rice (cooked)',
    servingLabel: 'cup',
    per100g: {
      calories: 130,
      proteinG: 2.7,
      carbsG: 28,
      fatG: 0.3,
    },
    perServing: {
      calories: 205,
      proteinG: 4.3,
      carbsG: 44.5,
      fatG: 0.4,
    },
  },
  {
    id: 'banana',
    name: 'Banana',
    servingLabel: 'banana',
    perServing: {
      calories: 105,
      proteinG: 1.3,
      carbsG: 27,
      fatG: 0.4,
    },
    per100g: {
      calories: 89,
      proteinG: 1.1,
      carbsG: 23,
      fatG: 0.3,
    },
  },
  {
    id: 'greek-yogurt',
    name: 'Greek yogurt',
    servingLabel: 'cup',
    per100g: {
      calories: 97,
      proteinG: 9,
      carbsG: 3.6,
      fatG: 5,
    },
    perServing: {
      calories: 146,
      proteinG: 13.5,
      carbsG: 5.4,
      fatG: 7.5,
    },
  },
];

export function getFoodById(id: string) {
  return FOOD_CATALOG.find((f) => f.id === id);
}

export function searchFoods(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return FOOD_CATALOG;
  return FOOD_CATALOG.filter((f) => f.name.toLowerCase().includes(q));
}

export function defaultUnitForFood(food: Food): 'g' | 'serving' {
  if (food.perServing && !food.per100g) return 'serving';
  if (food.perServing && food.id === 'eggs') return 'serving';
  if (food.per100g) return 'g';
  return 'serving';
}

export async function fetchFoodByBarcode(barcode: string): Promise<Food | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return null;
    }
    const p = data.product;
    const n = p.nutriments;
    if (!n) return null;

    // Create a Food object from the API response
    const food: Food = {
      id: `off-${barcode}`,
      name: p.product_name || 'Unknown Food',
      servingLabel: p.serving_size ? p.serving_size : undefined,
    };

    if (n['energy-kcal_100g'] !== undefined) {
      food.per100g = {
        calories: Number(n['energy-kcal_100g']) || 0,
        proteinG: Number(n.proteins_100g) || 0,
        carbsG: Number(n.carbohydrates_100g) || 0,
        fatG: Number(n.fat_100g) || 0,
      };
    }

    if (n['energy-kcal_serving'] !== undefined) {
      food.perServing = {
        calories: Number(n['energy-kcal_serving']) || 0,
        proteinG: Number(n.proteins_serving) || 0,
        carbsG: Number(n.carbohydrates_serving) || 0,
        fatG: Number(n.fat_serving) || 0,
      };
    }

    // If no nutritional data was found, return null
    if (!food.per100g && !food.perServing) {
      return null;
    }

    return food;
  } catch (err) {
    console.error('Failed to fetch food by barcode:', err);
    return null;
  }
}
