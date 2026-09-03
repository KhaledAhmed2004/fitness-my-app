import { BANGLA_FOOD_CATALOG } from '@/services/bangla-food-gi-catalog';
import {
  BanglaFoodCategory,
  BanglaFoodItem,
  ConditionHealthFilter,
  GiLevel,
  MealPlateAnalysis,
  PlateSimulationItem,
} from '@/types/bangla-food-gi';

/**
 * Filter and search Bangladeshi foods
 */
export function getBanglaFoods(options?: {
  category?: BanglaFoodCategory | 'ALL';
  conditionFilter?: ConditionHealthFilter;
  giFilter?: GiLevel | 'ALL';
  searchQuery?: string;
}): BanglaFoodItem[] {
  const {
    category = 'ALL',
    conditionFilter = 'ALL',
    giFilter = 'ALL',
    searchQuery = '',
  } = options || {};

  const q = searchQuery.trim().toLowerCase();

  return BANGLA_FOOD_CATALOG.filter((item) => {
    // 1. Category Filter
    if (category !== 'ALL' && item.category !== category) {
      return false;
    }

    // 2. GI Filter
    if (giFilter !== 'ALL' && item.giLevel !== giFilter) {
      return false;
    }

    // 3. Condition Safety Filter
    if (conditionFilter !== 'ALL') {
      if (conditionFilter === 'DIABETES_FRIENDLY') {
        if (item.diabetesRating === 'AVOID') return false;
      } else if (conditionFilter === 'FATTY_LIVER') {
        if (item.fattyLiverRating === 'AVOID') return false;
      } else if (conditionFilter === 'URIC_ACID_SAFE') {
        if (item.uricAcidRating === 'AVOID') return false;
      } else if (conditionFilter === 'KIDNEY_FRIENDLY') {
        if (item.kidneySafetyRating === 'AVOID') return false;
      } else if (conditionFilter === 'LOW_GI') {
        if (item.giLevel !== 'LOW') return false;
      }
    }

    // 4. Search Filter
    if (q) {
      const matchBn = item.nameBn.toLowerCase().includes(q);
      const matchEn = item.nameEn.toLowerCase().includes(q);
      const matchNotes = item.clinicalNotesBn.toLowerCase().includes(q);
      const matchSwap = item.smartSwapBn?.toLowerCase().includes(q) || false;
      return matchBn || matchEn || matchNotes || matchSwap;
    }

    return true;
  });
}

/**
 * Get Food by ID
 */
export function getBanglaFoodById(id: string): BanglaFoodItem | undefined {
  return BANGLA_FOOD_CATALOG.find((item) => item.id === id);
}

/**
 * Meal Plate Glycemic Load & Sugar Spike Simulator
 */
export function calculateMealPlateSpike(items: PlateSimulationItem[]): MealPlateAnalysis {
  if (items.length === 0) {
    return {
      totalCalories: 0,
      totalCarbsG: 0,
      totalProteinG: 0,
      totalFatG: 0,
      totalFiberG: 0,
      weightedGi: 0,
      totalGl: 0,
      overallSpikeRisk: 'LOW',
      spikeRiskBn: 'কোনো খাবার যোগ করা হয়নি',
      recommendationsBn: ['আপনার থালায় ভাত, তরকারি ও ডাল যোগ করে পরীক্ষা করুন।'],
      smartSwapsAvailable: [],
    };
  }

  let totalCalories = 0;
  let totalCarbsG = 0;
  let totalProteinG = 0;
  let totalFatG = 0;
  let totalFiberG = 0;
  let totalGl = 0;
  let totalCarbXGi = 0;

  const smartSwapsAvailable: Array<{
    original: string;
    replacement: string;
    benefitBn: string;
  }> = [];

  const recommendationsBn: string[] = [];

  let hasHighGiRice = false;
  let hasHighFatMeat = false;
  let hasSweet = false;
  let hasVegetable = false;

  items.forEach(({ food, quantity }) => {
    const totalGrams = food.servingWeightG * quantity;
    const factor = totalGrams / 100;

    const cals = food.nutrientsPer100g.calories * factor;
    const carbs = food.nutrientsPer100g.carbsG * factor;
    const protein = food.nutrientsPer100g.proteinG * factor;
    const fat = food.nutrientsPer100g.fatG * factor;
    const fiber = food.nutrientsPer100g.fiberG * factor;

    totalCalories += cals;
    totalCarbsG += carbs;
    totalProteinG += protein;
    totalFatG += fat;
    totalFiberG += fiber;

    // Glycemic Load for this item: (GI * Net Carbs) / 100
    const netCarbs = Math.max(0, carbs - fiber);
    const itemGl = (food.giValue * netCarbs) / 100;
    totalGl += itemGl;
    totalCarbXGi += food.giValue * carbs;

    // Track dietary flags
    if (food.id === 'bf_white_rice_miniket' || food.id === 'bf_maida_paratha') {
      hasHighGiRice = true;
      if (food.smartSwapBn) {
        smartSwapsAvailable.push({
          original: food.nameBn,
          replacement: 'লাল চালের ভাত / লাল আটার রুটি',
          benefitBn: 'গ্লাইসেমিক লোড ৫০% কমাবে এবং আঁশ দ্বিগুণ করবে।',
        });
      }
    }

    if (food.category === 'SNACKS_SWEETS' && food.giLevel === 'HIGH') {
      hasSweet = true;
      if (food.smartSwapBn) {
        smartSwapsAvailable.push({
          original: food.nameBn,
          replacement: 'টক দই বা দেশি পেয়ারা',
          benefitBn: 'চিনির বিপজ্জনক সুগার স্পাইক থেকে বাঁচাবে।',
        });
      }
    }

    if (food.id === 'bf_beef_bhuna' || food.id === 'bf_mutton_rezala') {
      hasHighFatMeat = true;
      smartSwapsAvailable.push({
        original: food.nameBn,
        replacement: 'দেশি মুরগির ঝোল বা রুই মাছ',
        benefitBn: 'ফ্যাটি লিভার ও ইউরিক এসিড নিয়ন্ত্রণে অত্যন্ত সহায়ক।',
      });
    }

    if (food.category === 'VEGETABLES' || food.category === 'LENTILS_BEANS') {
      hasVegetable = true;
    }
  });

  const weightedGi = totalCarbsG > 0 ? Math.round(totalCarbXGi / totalCarbsG) : 0;

  // Determine Overall Spike Risk
  let overallSpikeRisk: MealPlateAnalysis['overallSpikeRisk'] = 'LOW';
  let spikeRiskBn = 'নিরাপদ (সুগার নিয়ন্ত্রণে থাকবে)';

  if (totalGl > 45) {
    overallSpikeRisk = 'EXTREME';
    spikeRiskBn = 'বিপজ্জনক সুগার স্পাইকের ঝুঁকি (Extreme Spike)';
  } else if (totalGl >= 30) {
    overallSpikeRisk = 'HIGH';
    spikeRiskBn = 'উচ্চ সুগার স্পাইক ঝুঁকি (High GL)';
  } else if (totalGl >= 15) {
    overallSpikeRisk = 'MODERATE';
    spikeRiskBn = 'মাঝারি ঝুঁকি (পরিমিত খান)';
  } else {
    overallSpikeRisk = 'LOW';
    spikeRiskBn = 'ডায়াবেটিস বান্ধব ও নিরাপদ (Low GL)';
  }

  // Clinical Recommendations Generation
  if (hasHighGiRice && !hasVegetable) {
    recommendationsBn.push(
      '⚠️ আপনার থালায় শুধু উচ্চ-কার্ব ভাত রয়েছে। সাথে ১ বাটি শাকসবজি বা ডাল যোগ করলে সুগার স্পাইক ৩০% পর্যন্ত হ্রাস পাবে।'
    );
  }

  if (hasSweet) {
    recommendationsBn.push(
      '🍯 মিষ্টিজাতীয় খাবার খাওয়ার পর ১৫ মিনিট হালকা হাঁটা রক্তে ইনসুলিন সেনসিটিভিটি বাড়াতে সাহায্য করে।'
    );
  }

  if (hasHighFatMeat) {
    recommendationsBn.push(
      '🥩 লাল মাংসের সাথে বেশি করে লেবু ও শসার সালাদ খেলে চর্বি শোষণ কিছুটা কমে এবং লিভার সুরক্ষিত থাকে।'
    );
  }

  if (totalFiberG >= 8) {
    recommendationsBn.push(
      '🌿 চমৎকার! আপনার থালায় পর্যাপ্ত আঁশ (ফাইবার) রয়েছে যা গ্লুকোজ নিঃসরণ অত্যন্ত ধীর রাখবে।'
    );
  } else if (totalCarbsG > 50 && totalFiberG < 4) {
    recommendationsBn.push(
      '🥗 আঁশের পরিমাণ কম (Fiber < 4g)। খাবারের আগে শসা, টমেটো বা পেয়ারা খেলে খাবার দ্রুত সুগারে পরিণত হতে পারে না।'
    );
  }

  return {
    totalCalories: Math.round(totalCalories),
    totalCarbsG: Math.round(totalCarbsG * 10) / 10,
    totalProteinG: Math.round(totalProteinG * 10) / 10,
    totalFatG: Math.round(totalFatG * 10) / 10,
    totalFiberG: Math.round(totalFiberG * 10) / 10,
    weightedGi,
    totalGl: Math.round(totalGl * 10) / 10,
    overallSpikeRisk,
    spikeRiskBn,
    recommendationsBn,
    smartSwapsAvailable,
  };
}
