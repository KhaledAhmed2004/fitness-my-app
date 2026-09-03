import {
  BANGLADESHI_RAMADAN_FOODS,
  RAMADAN_DRUG_CLASS_RULES,
} from '@/services/ramadan-fasting-knowledge';
import { MedicineItem } from '@/types/medicine';
import {
  IftarPlateEvaluation,
  RamadanFoodItem,
  RamadanMedicationShift,
  RamadanRiskLevel,
  SuhoorPlateEvaluation,
} from '@/types/ramadan-fasting';

export function evaluateIftarPlate(
  selectedFoodQuantities: Record<string, number>
): IftarPlateEvaluation {
  let totalCalories = 0;
  let totalCarbs = 0;
  let totalFiber = 0;
  let weightedGiSum = 0;
  let totalFoodWeight = 0;
  let hasSugarDrinkOrJilapi = false;
  let friedItemCount = 0;

  const recommendationsBn: string[] = [];
  const safeReplacementsBn: string[] = [];

  Object.entries(selectedFoodQuantities).forEach(([foodId, qty]) => {
    if (qty <= 0) return;
    const item = BANGLADESHI_RAMADAN_FOODS.find((f) => f.id === foodId);
    if (!item) return;

    totalCalories += item.caloriesPerUnit * qty;
    totalCarbs += item.carbsGrams * qty;
    totalFiber += item.fiberGrams * qty;

    const weightFactor = item.carbsGrams * qty;
    weightedGiSum += item.giValue * (weightFactor > 0 ? weightFactor : 1);
    totalFoodWeight += weightFactor > 0 ? weightFactor : 1;

    if (item.category === 'SWEET_DESSERT' || item.id === 'food_rooh_afza_tang') {
      hasSugarDrinkOrJilapi = true;
    }
    if (item.category === 'FRIED_SNACK') {
      friedItemCount += qty;
    }
  });

  const averageGi =
    totalFoodWeight > 0 ? Math.round(weightedGiSum / totalFoodWeight) : 0;

  let spikeRisk: 'SAFE' | 'MODERATE_SPIKE' | 'SEVERE_SPIKE_ALERT' = 'SAFE';
  let spikeRiskLabelBn = 'সবুজ - নিরাপদ ইফতার প্লেট (Safe Plate)';
  let spikeColor = '#20C997';

  if (hasSugarDrinkOrJilapi || averageGi > 65 || totalCarbs > 75) {
    spikeRisk = 'SEVERE_SPIKE_ALERT';
    spikeRiskLabelBn = '🚨 লাল সংকেত - তীব্র সুগার স্পাইক ঝুঁকি (Severe Spike Alert)';
    spikeColor = '#EF4444';
    recommendationsBn.push(
      'চিনির শরবত বা জিলাপি দ্রুত রক্তে সুগার ১৮+ mmol/L এ তুলতে পারে। এটি অবিলম্বে পরিহার করুন।'
    );
    safeReplacementsBn.push(
      'চিনির শরবতের বদলে লেবু-ইসুবগুলের পানি বা চিনি ছাড়া বোরহানি বেছে নিন।'
    );
  } else if (friedItemCount >= 2 || averageGi >= 45 || totalCarbs > 45) {
    spikeRisk = 'MODERATE_SPIKE';
    spikeRiskLabelBn = '⚠️ হলুদ সতর্কতা - মাঝারি সুগার ও ক্যালরি স্পাইক (Moderate Spike)';
    spikeColor = '#FF922B';
    recommendationsBn.push(
      'ডুবো তেলে ভাজা পেঁয়াজু/বেগুনি ১টির বেশি খাবেন না। বেশি ভাজাপোড়া অ্যাসিডিটি ও হার্টবার্ন তৈরি করে।'
    );
    safeReplacementsBn.push(
      'বেগুনি ও আলুর চপের পরিবর্তে শসা, টমেটো ও সেদ্ধ ছোলা দিয়ে সালাদ বানান।'
    );
  } else {
    recommendationsBn.push(
      'অসাধারণ প্লেট কম্বিনেশন! ছোলা, পানি ও ১টি খেজুরের অনুপাত রক্তে সুগার ও রক্তচাপকে স্থিতিশীল রাখবে।'
    );
  }

  if (totalFiber < 3 && totalCarbs > 30) {
    recommendationsBn.push('আঁশ (Fiber) কম থাকায় শসা, কাঁচা পেয়ারা বা ইসুবগুলের ভুসি যোগ করুন।');
  }

  return {
    totalCalories: Math.round(totalCalories),
    totalCarbs: Math.round(totalCarbs),
    totalFiber: Math.round(totalFiber * 10) / 10,
    averageGi,
    spikeRisk,
    spikeRiskLabelBn,
    spikeColor,
    recommendationsBn,
    safeReplacementsBn,
  };
}

export function evaluateSuhoorPlate(
  selectedFoodQuantities: Record<string, number>
): SuhoorPlateEvaluation {
  let totalCalories = 0;
  let totalCarbs = 0;
  let totalProtein = 0;
  let totalFiber = 0;
  let hasComplexCarb = false;
  let hasHighWaterFood = false;

  const recommendationsBn: string[] = [];

  Object.entries(selectedFoodQuantities).forEach(([foodId, qty]) => {
    if (qty <= 0) return;
    const item = BANGLADESHI_RAMADAN_FOODS.find((f) => f.id === foodId);
    if (!item) return;

    totalCalories += item.caloriesPerUnit * qty;
    totalCarbs += item.carbsGrams * qty;
    totalProtein += item.proteinGrams * qty;
    totalFiber += item.fiberGrams * qty;

    if (item.category === 'SUHOOR_CARB') hasComplexCarb = true;
    if (item.id === 'food_deshi_fish_jhol' || item.id === 'food_tok_doi_borhani') {
      hasHighWaterFood = true;
    }
  });

  let slowEnergyRating: 'EXCELLENT' | 'GOOD' | 'POOR' = 'GOOD';
  let ratingLabelBn = 'ভালো - মাঝারি স্থায়িত্বের শক্তি';
  let ratingColor = '#FF922B';
  let hydrationHours = 10;
  let thirstRiskBn = 'মাঝারি তৃষ্ণা ঝুঁকি';

  if (hasComplexCarb && totalProtein >= 15 && totalFiber >= 4) {
    slowEnergyRating = 'EXCELLENT';
    ratingLabelBn = '🌟 প্রিমিয়াম - ১৪+ ঘণ্টা দীর্ঘস্থায়ী শক্তি ও কম ক্ষুধা';
    ratingColor = '#20C997';
    hydrationHours = 14;
    thirstRiskBn = 'খুব কম তৃষ্ণা (Water Retaining Plate)';
    recommendationsBn.push(
      'লাল চালের ভাত/ওটস ও মাছ-ডিমের প্রোটিন সারাদিন দুর্বলতা ও মাথা ঘোরা প্রতিরোধ করবে।'
    );
  } else if (!hasComplexCarb && totalCarbs < 15) {
    slowEnergyRating = 'POOR';
    ratingLabelBn = '⚠️ অপর্যাপ্ত শর্করা - দুপুরের আগেই দুর্বল হয়ে যাওয়ার ঝুঁকি';
    ratingColor = '#EF4444';
    hydrationHours = 7;
    thirstRiskBn = 'তীব্র দুর্বলতা ঝুঁকি';
    recommendationsBn.push(
      'সেহরিতে একদম ভাত বা রুটি না খেলে বেলা ১২টায় মারাত্মক হাইপোগ্লাইসেমিয়া হতে পারে।'
    );
  } else {
    recommendationsBn.push('সেহরিতে অতিরিক্ত ঝাল ও লবণযুক্ত তরকারি পরিহার করুন, এতে পিপাসা বেশি পায়।');
  }

  if (hasHighWaterFood) {
    recommendationsBn.push('লাউ বা টক দই থাকায় সারাদিন পানিশূন্যতা ও মুখের শুষ্কতা কমে যাবে।');
  } else {
    recommendationsBn.push('সেহরির শেষ ১০ মিনিটে অন্তত ৫০০ মিলি পানি ও ১ চামচ চিয়াসীড পান করুন।');
  }

  return {
    totalCalories: Math.round(totalCalories),
    totalCarbs: Math.round(totalCarbs),
    totalProtein: Math.round(totalProtein),
    totalFiber: Math.round(totalFiber * 10) / 10,
    hydrationEnduranceHours: hydrationHours,
    slowEnergyRating,
    ratingLabelBn,
    ratingColor,
    thirstRiskBn,
    recommendationsBn,
  };
}

export function calculateMedicationShift(
  medicines: MedicineItem[]
): RamadanMedicationShift[] {
  return medicines.map((med) => {
    const lowerName = med.name.toLowerCase();

    // Match against rules
    const matchedRule = RAMADAN_DRUG_CLASS_RULES.find((rule) =>
      rule.keywords.some((k) => lowerName.includes(k))
    );

    const morningDose = med.schedules.find((s) => s.timeCategory === 'morning');
    const nightDose = med.schedules.find((s) => s.timeCategory === 'night');
    const baseDose = morningDose?.doseAmount ?? med.schedules[0]?.doseAmount ?? 1;
    const unitLabel = med.strength || med.unit || 'ট্যাবলেট';

    let originalDailyDoses = `${baseDose} ${unitLabel} (${med.schedules.length} বার)`;
    if (morningDose && nightDose) {
      originalDailyDoses = `সকালে ১টি + রাতে ১টি (${med.schedules.length} বার)`;
    } else if (morningDose) {
      originalDailyDoses = `সকালে ১টি (${morningDose.time})`;
    } else if (nightDose) {
      originalDailyDoses = `রাতে ১টি (${nightDose.time})`;
    }

    let recommendedShiftBn = 'ইফতারের খাবারের সময় গ্রহণ করুন';
    let iftarDoseBn = `${baseDose} ${unitLabel} (ইফতারে)`;
    let suhoorDoseBn = '-';
    let specialTimingBn = 'ইফতারের মূল খাবারের সাথে';
    let warningLevel: 'INFO' | 'CAUTION' | 'CRITICAL_DOCTOR_ALERT' = 'INFO';
    let clinicalPrecautionBn =
      'রমজানে ওষুধের সময় পরিবর্তনের বিষয়ে আপনার চিকিৎসকের চূড়ান্ত অনুমোদন নিন।';

    if (matchedRule) {
      warningLevel = matchedRule.warningLevel;
      clinicalPrecautionBn = matchedRule.precautionBn;

      if (matchedRule.classKey === 'METFORMIN') {
        if (morningDose && nightDose) {
          iftarDoseBn = `${baseDose} ${unitLabel} (সকালের ডোজ ইফতারে)`;
          suhoorDoseBn = `${nightDose.doseAmount ?? baseDose} ${unitLabel} (রাতের ডোজ সেহরিতে)`;
          recommendedShiftBn = 'সকালের ডোজ ইফতারে, রাতের ডোজ সেহরিতে';
        } else {
          iftarDoseBn = `${baseDose} ${unitLabel} (ইফতারে)`;
          recommendedShiftBn = 'ইফতারের মূল খাবারের মাঝখানে গ্রহণ করুন';
        }
      } else if (matchedRule.classKey === 'SULFONYLUREA') {
        iftarDoseBn = `${baseDose} ${unitLabel} (সকালের মূল ডোজ ইফতারে)`;
        suhoorDoseBn = 'অর্ধেক (৫০%) বা বন্ধ (চিকিৎসকের পরামর্শে)';
        recommendedShiftBn = 'সকালের ডোজ ইফতারে; সেহরির ডোজ ৫০% হ্রাস';
        specialTimingBn = 'ইফতারের প্রথম লোকমার সাথে';
      } else if (matchedRule.classKey === 'SGLT2') {
        iftarDoseBn = `${baseDose} ${unitLabel} (ইফতারে)`;
        suhoorDoseBn = 'কখনোই সেহরিতে নয়';
        recommendedShiftBn = 'অবশ্যই ইফতারের সময় পর্যাপ্ত পানি সহ';
        specialTimingBn = 'ইফতারের পর ২ গ্লাস পানি সহ';
      } else if (matchedRule.classKey === 'INSULIN_PREMIX') {
        iftarDoseBn = 'সকালের সম্পূর্ণ ডোজ ইফতারে';
        suhoorDoseBn = 'রাতের ডোজ ২৫%-৫০% কমিয়ে সেহরিতে';
        recommendedShiftBn = 'ইফতারে পূর্ণ ডোজ, সেহরিতে ২৫-৫০% হ্রাসকৃত ডোজ';
        specialTimingBn = 'ইফতার ও সেহরি খাওয়ার ঠিক আগে';
      } else if (matchedRule.classKey === 'ANTIHYPERTENSIVE') {
        iftarDoseBn = 'ইফতারের ১ ঘণ্টা পর বা তারাবীহর পর';
        recommendedShiftBn = 'রাতে ঘুমানোর আগে বা ইফতারের পর';
        specialTimingBn = 'তারাবীহর নামাজ শেষে রাতে';
      }
    }

    return {
      medicineId: med.id,
      medicineName: med.name,
      originalDailyDoses,
      recommendedShiftBn,
      iftarDoseBn,
      suhoorDoseBn,
      specialTimingBn,
      warningLevel,
      clinicalPrecautionBn,
    };
  });
}

export function assessFastingRisk(score: number): {
  level: RamadanRiskLevel;
  levelLabelBn: string;
  badgeBg: string;
  textColor: string;
  adviceBn: string;
} {
  if (score >= 6) {
    return {
      level: 'VERY_HIGH_DO_NOT_FAST',
      levelLabelBn: '🚨 অত্যন্ত উচ্চ ঝুঁকি - রোজা রাখা চিকিৎসাগতভাবে নিষেধ',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      textColor: '#EF4444',
      adviceBn:
        'বিগত ৩ মাসে মারাত্মক হাইপো, ডায়ালিসিস, গর্ভাবস্থা বা অনিয়ন্ত্রিত সুগারে রোজা রাখা জীবনের জন্য ঝুঁকিপূর্ণ। চিকিৎসকের লিখিত অনুমতি ছাড়া রোজা রাখবেন না।',
    };
  } else if (score >= 3.5) {
    return {
      level: 'HIGH',
      levelLabelBn: '⚠️ উচ্চ ঝুঁকি - বিশেষ সতর্কতা ও চিকিৎসকের পরামর্শ প্রয়োজন',
      badgeBg: 'rgba(255, 146, 43, 0.15)',
      textColor: '#FF922B',
      adviceBn:
        'ইনসুলিন বা দুটি ডায়াবেটিসের ওষুধে থাকলে দিনে ৩-৪ বার সুগার মনিটর করুন। সুগার < ৩.৯ হলে রোজা ভাঙতে দ্বিধা করবেন না।',
    };
  } else {
    return {
      level: 'LOW',
      levelLabelBn: '✅ কম ঝুঁকি - নিয়ম মেনে নিরাপদে রোজা রাখা সম্ভব',
      badgeBg: 'rgba(32, 201, 151, 0.15)',
      textColor: '#20C997',
      adviceBn:
        'পরিমিত ইফতার, লাল চালের সেহরি এবং নিয়মিত ওষুধ সেবনে আপনি সুস্থভাবে পুরো রমজানের রোজা পালন করতে পারবেন।',
    };
  }
}
