import { BanglaFoodItem } from '@/types/bangla-food-gi';

export type MealSlotType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SEHRI' | 'IFTAR';

export type BloodSugarSlot = 'FASTING' | 'POST_MEAL_2H' | 'BEDTIME';

export type BloodSugarStatus = 'NORMAL' | 'PREDIABETIC' | 'ELEVATED' | 'CRITICAL_HIGH' | 'CRITICAL_LOW';

export interface BloodSugarLogEntry {
  id: string;
  slot: BloodSugarSlot;
  valueMmol: number;
  measuredAt: string;
  notesBn?: string;
}

export interface DiabeticMealSlotSelection {
  slot: MealSlotType;
  labelBn: string;
  icon: string;
  recommendedTimeBn: string;
  selectedFoods: Array<{
    food: BanglaFoodItem;
    quantity: number; // serving multiplier (e.g. 1 = 1 serving)
  }>;
}

export interface DiabeticSuperfoodItem {
  id: string;
  nameBn: string;
  nameEn: string;
  giValue: number;
  bestTimeBn: string;
  preparationRecipeBn: string;
  clinicalBenefitBn: string;
  iconName: string;
}

export interface RamadanDiabeticMenuPreset {
  id: string;
  type: 'IFTAR' | 'SEHRI';
  titleBn: string;
  subtitleBn: string;
  itemsBn: string[];
  totalCalories: number;
  estimatedGi: 'LOW' | 'MEDIUM';
  hydrationTipBn: string;
  insulinOrMedsWarningBn: string;
}
