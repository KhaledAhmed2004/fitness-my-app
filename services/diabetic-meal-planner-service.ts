import { BANGLA_FOOD_CATALOG } from '@/services/bangla-food-gi-catalog';
import { calculateMealPlateSpike } from '@/services/bangla-food-gi-service';
import { BLOOD_SUGAR_TARGETS_ADA } from '@/services/diabetic-meal-planner-knowledge';
import { BanglaFoodItem, MealPlateAnalysis, PlateSimulationItem } from '@/types/bangla-food-gi';
import {
  BloodSugarLogEntry,
  BloodSugarSlot,
  BloodSugarStatus,
  DiabeticMealSlotSelection,
} from '@/types/diabetic-meal-planner';

/**
 * Get all diabetes-friendly Bangladeshi foods
 */
export function getDiabeticSafeFoods(category?: string): BanglaFoodItem[] {
  return BANGLA_FOOD_CATALOG.filter((item) => {
    if (item.diabetesRating === 'AVOID') return false;
    if (category && category !== 'ALL' && item.category !== category) return false;
    return true;
  });
}

/**
 * Classify blood sugar mmol/L according to ADA (American Diabetes Association) guidelines
 */
export function classifyBloodSugar(
  valueMmol: number,
  slot: BloodSugarSlot
): {
  status: BloodSugarStatus;
  labelBn: string;
  color: string;
  feedbackBn: string;
} {
  if (valueMmol < 3.9) {
    return {
      status: 'CRITICAL_LOW',
      labelBn: '🚨 হাইপোগ্লাইসেমিয়া (মারাত্মক লো সুগার)',
      color: '#EF4444',
      feedbackBn: 'অবিলম্বে ১৫ গ্রাম দ্রুত কার্যকরী চিনি/গ্লুকোজ বা আধা কাপ ফলের রস খান এবং ১৫ মিনিট পর আবার মাপুন।',
    };
  }

  const targets = BLOOD_SUGAR_TARGETS_ADA[slot];

  if (valueMmol <= targets.targetMax) {
    return {
      status: 'NORMAL',
      labelBn: '✅ পারফেক্ট টার্গেটের মধ্যে',
      color: '#10B981',
      feedbackBn: 'চমৎকার সুগার নিয়ন্ত্রণ! বর্তমান খাদ্যাভ্যাস ও হাঁটার নিয়ম বজায় রাখুন।',
    };
  }

  if (valueMmol <= targets.elevatedMax) {
    return {
      status: 'ELEVATED',
      labelBn: '⚠️ কিছুটা বেশি (Moderate Spike)',
      color: '#F59E0B',
      feedbackBn: 'খাবারে শর্করার পরিমাণ কিছুটা বেশি ছিল। ১৫–২০ মিনিট দ্রুত হাঁটুন এবং প্রচুর পানি পান করুন।',
    };
  }

  return {
    status: 'CRITICAL_HIGH',
    labelBn: '🚨 অতি উচ্চ শর্করা (Severe Hyperglycemia)',
    color: '#DC2626',
    feedbackBn: 'রক্তে শর্করা বিপজ্জনক মাত্রায় বেশি। ডাক্তারের পরামর্শে ওষুধের ডোজ পরীক্ষা করুন ও মিষ্টি সম্পূর্ণ বন্ধ রাখুন।',
  };
}

/**
 * Analyze an entire diabetic meal slot
 */
export function analyzeDiabeticMealSlot(
  items: Array<{ food: BanglaFoodItem; quantity: number }>
): MealPlateAnalysis {
  const simulationItems: PlateSimulationItem[] = items.map((i) => ({
    food: i.food,
    quantity: i.quantity,
  }));

  return calculateMealPlateSpike(simulationItems);
}

/**
 * Format Blood Sugar & Meal Plan Report for WhatsApp / Doctor
 */
export function formatDiabeticPlanWhatsAppReport(
  sugarLogs: BloodSugarLogEntry[],
  mealSlots: DiabeticMealSlotSelection[]
): string {
  const dateStr = new Date().toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let text = `🩺 *ডায়াবেটিক মিল প্ল্যান ও ব্লাড সুগার অডিট রিপোর্ট*\n`;
  text += `📅 তারিখ: ${dateStr}\n`;
  text += `📱 TrackMe Health Vault Platform\n\n`;

  text += `📊 *রক্তে শর্করার রিডিং (Blood Sugar Log):*\n`;
  if (sugarLogs.length === 0) {
    text += `  • কোনো সাম্প্রতিক রিডিং লগ করা হয়নি।\n`;
  } else {
    sugarLogs.forEach((log) => {
      const slotName =
        log.slot === 'FASTING'
          ? 'খালি পেটে (Fasting)'
          : log.slot === 'POST_MEAL_2H'
          ? 'খাবারের ২ ঘণ্টা পর'
          : 'ঘুমানোর আগে (Bedtime)';
      const cls = classifyBloodSugar(log.valueMmol, log.slot);
      text += `  • ${slotName}: ${log.valueMmol.toFixed(1)} mmol/L (${cls.labelBn})\n`;
    });
  }

  text += `\n🍽️ *আজকের পরিকল্পিত দেশি খাদ্যতালিকা (Meal Plan):*\n`;
  mealSlots.forEach((slot) => {
    if (slot.selectedFoods.length > 0) {
      text += `\n📌 *${slot.labelBn} (${slot.recommendedTimeBn}):*\n`;
      slot.selectedFoods.forEach((f) => {
        text += `  - ${f.food.nameBn} (${f.quantity}x ${f.food.servingSizeBn}) [GI: ${f.food.giValue}]\n`;
      });
    }
  });

  text += `\n🚶 *লাইফস্টাইল নির্দেশিকা:*\n`;
  text += `  • প্রতি প্রধান খাবারের ২০ মিনিট পর ১৫ মিনিট ধীরগতির পায়চারি।\n`;
  text += `  • দিনে পর্যাপ্ত পানি ও মিষ্টি ফল পরিমিত খাওয়ার অভ্যাস।\n\n`;
  text += `_চিকিৎসকের সাথে পরামর্শের জন্য প্রস্তুতকৃত।_`;

  return text;
}
