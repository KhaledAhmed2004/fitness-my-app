/**
 * Bangladeshi Food Glycemic Index & Clinical Nutrition Types
 */

export type BanglaFoodCategory =
  | 'RICE_GRAINS'       // ভাত, রুটি, খিচুড়ি ও খাদ্যশস্য
  | 'FISH_MEAT'         // দেশি মাছ, মাংস ও ডিম
  | 'VEGETABLES'        // দেশি শাকসবজি ও ভর্তা
  | 'FRUITS'            // দেশি ফলমূল
  | 'LENTILS_BEANS'     // ডাল, শুঁটি ও ছোলা
  | 'SNACKS_SWEETS'     // মিষ্টি, পিঠা, বিরিয়ানি ও স্ট্রিট ফুড
  | 'BEVERAGES';        // ডাবের পানি, বোরহানি, চা

export type GiLevel = 'LOW' | 'MEDIUM' | 'HIGH';
// LOW: GI <= 55 (নিরাপদ, ধীরগতিতে সুগার বাড়ে)
// MEDIUM: GI 56 - 69 (পরিমিত খাওয়া প্রয়োজন)
// HIGH: GI >= 70 (সুগার স্পাইকের তীব্র ঝুঁকি)

export type GlLevel = 'LOW' | 'MEDIUM' | 'HIGH';
// LOW: GL <= 10
// MEDIUM: GL 11 - 19
// HIGH: GL >= 20

export type ConditionSafety = 'SAFE' | 'MODERATE' | 'AVOID' | 'RECOMMENDED';

export type ConditionHealthFilter =
  | 'ALL'
  | 'DIABETES_FRIENDLY'
  | 'FATTY_LIVER'
  | 'URIC_ACID_SAFE'
  | 'KIDNEY_FRIENDLY'
  | 'LOW_GI';

export interface NutrientsPer100g {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  potassiumMg?: number;
  sodiumMg?: number;
}

export interface BanglaFoodItem {
  id: string;
  nameBn: string;
  nameEn: string;
  category: BanglaFoodCategory;
  servingSizeBn: string; // e.g. "১ কাপ (১৫০ গ্রাম)"
  servingWeightG: number; // e.g. 150
  
  // Glycemic Profile
  giValue: number;       // e.g. 54
  giLevel: GiLevel;
  glPerServing: number;  // Calculated: (giValue * netCarbsPerServing) / 100
  glLevel: GlLevel;

  // Macro & Micro Nutrients per 100g
  nutrientsPer100g: NutrientsPer100g;

  // Clinical Safety Flags
  diabetesRating: ConditionSafety;
  fattyLiverRating: ConditionSafety;
  uricAcidRating: ConditionSafety; // e.g. High Purine Alert for mutton/red meat/pui shak
  kidneySafetyRating: ConditionSafety; // Low Potassium/Phosphorus vs High Risk
  hypertensionRating: ConditionSafety; // Low Sodium vs High Sodium (e.g. shutki)

  // Insights & Swaps
  smartSwapBn?: string;       // e.g. "সাদা ভাতের বদলে লাল চালের ভাত বেছে নিন"
  clinicalNotesBn: string;    // e.g. "লেবুর রস ও শসার সাথে খেলে সুগার স্পাইক ৩০% পর্যন্ত কমে"
  isTraditionalSuperfood?: boolean; // e.g. পেয়ারা, আমলকী, সজিনা পাতা
}

export interface PlateSimulationItem {
  food: BanglaFoodItem;
  quantity: number; // multiplier of servingWeightG (e.g. 1 = 1 serving, 1.5 = 1.5 serving)
}

export interface MealPlateAnalysis {
  totalCalories: number;
  totalCarbsG: number;
  totalProteinG: number;
  totalFatG: number;
  totalFiberG: number;
  weightedGi: number;
  totalGl: number;
  overallSpikeRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  spikeRiskBn: string;
  recommendationsBn: string[];
  smartSwapsAvailable: Array<{
    original: string;
    replacement: string;
    benefitBn: string;
  }>;
}
