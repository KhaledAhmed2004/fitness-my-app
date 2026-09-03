import {
  ARMSTRONG_URINE_SHADES,
  UTI_SYMPTOMS_LIST,
} from '@/services/urine-hydration-knowledge';
import {
  HydrationGoal,
  UrineColorDef,
  UtiRiskEvaluation,
  UtiSymptom,
} from '@/types/urine-hydration-shield';

/**
 * Get definition by shade number 1 to 8
 */
export function getUrineColorDef(shade: number): UrineColorDef {
  const found = ARMSTRONG_URINE_SHADES.find((s) => s.shade === shade);
  return found || ARMSTRONG_URINE_SHADES[1]; // default pale straw
}

/**
 * Calculate personalized daily hydration goal
 * Baseline: 35 mL per kg body weight
 * Hot Weather: +500 mL
 * Physical Activity: +500 mL
 */
export function calculateDailyHydration(
  weightKg: number,
  isHotWeather: boolean,
  isHighActivity: boolean
): HydrationGoal {
  const safeWeight = Math.max(30, Math.min(150, weightKg || 60));
  let totalMl = safeWeight * 35;

  if (isHotWeather) totalMl += 500;
  if (isHighActivity) totalMl += 500;

  // Round to nearest 100mL
  totalMl = Math.round(totalMl / 100) * 100;
  const glasses = Math.round(totalMl / 250);

  const schedule: string[] = [
    '🌅 সকালে ঘুম থেকে উঠে: ১ গ্লাস (২৫০ মিলি)',
    '🍳 সকালের নাস্তার পর: ১ গ্লাস (২৫০ মিলি)',
    '☀️ দুপুর ১২:০০ টার দিকে: ১-২ গ্লাস (৫০০ মিলি)',
    '🍛 দুপুরের খাবারের ৩০ মিনিট পর: ১ গ্লাস (২৫০ মিলি)',
    '🌆 বিকেলে (৪:০০-৫:০০ PM): ১-২ গ্লাস (৫০০ মিলি)',
    '🌙 রাতের খাবারের ৩০ মিনিট পর: ১ গ্লাস (২৫০ মিলি)',
    '🛏️ ঘুমানোর ১ ঘণ্টা আগে: ১/২ গ্লাস (১২৫ মিলি)',
  ];

  return {
    weightKg: safeWeight,
    isHotWeather,
    isHighActivity,
    dailyWaterMl: totalMl,
    dailyGlasses: glasses,
    hourlyScheduleBn: schedule,
  };
}

/**
 * Evaluate UTI 6-point risk score
 */
export function evaluateUtiRisk(symptoms: UtiSymptom[]): UtiRiskEvaluation {
  const selected = symptoms.filter((s) => s.isSelected);
  const hasRedFlag = selected.some((s) => s.isSevereRedFlag);

  if (selected.length === 0) {
    return {
      riskScorePercent: 0,
      riskLevelBn: '🟢 ইনফেকশনের কোনো লক্ষণ নেই (নিরাপদ)',
      riskColor: '#10B981',
      hasRedFlag: false,
      actionGuidanceBn: 'প্রস্রাবে কোনো ইনফেকশনের লক্ষণ নেই। পর্যাপ্ত পানি পান বজায় রাখুন।',
    };
  }

  const scorePercent = Math.min(100, Math.round((selected.length / symptoms.length) * 100));

  if (hasRedFlag) {
    return {
      riskScorePercent: Math.max(85, scorePercent),
      riskLevelBn: '🚨 উচ্চ ঝুঁকি ও বিপদচিহ্ন (কিডনি ইনফেকশন / হেমাটুরিয়া)',
      riskColor: '#DC2626',
      hasRedFlag: true,
      actionGuidanceBn:
        'কাঁপুনি দিয়ে তীব্র জ্বর বা প্রস্রাবে রক্ত আসা কিডনিতে ইনফেকশনের (Pyelonephritis) গুরুতর লক্ষণ। আজই ইউরিন কালচার (Urine C/S) ও বিশেষজ্ঞ চিকিৎসকের কাছে যান।',
    };
  }

  if (selected.length >= 2) {
    return {
      riskScorePercent: scorePercent,
      riskLevelBn: '🟠 সম্ভাব্য মূত্রনালীর ইনফেকশন (UTI / Cystitis)',
      riskColor: '#F97316',
      hasRedFlag: false,
      actionGuidanceBn:
        'প্রস্রাবে জ্বালাপোড়া ও ঘন ঘন বেগ ব্যাকটেরিয়াল ইনফেকশনের ইঙ্গিত দেয়। প্রচুর পানি, ডাবের পানি বা লেবুর শরবত খান এবং একটি Urine R/E পরীক্ষা করান।',
    };
  }

  return {
    riskScorePercent: scorePercent,
    riskLevelBn: '🟡 মৃদু অস্বস্তি / ডিহাইড্রেশন জনিত জ্বালা',
    riskColor: '#F59E0B',
    hasRedFlag: false,
    actionGuidanceBn:
      'পানি কম খাওয়ার কারণে প্রস্রাবের কড়া এসিডে হালকা জ্বালাপোড়া হতে পারে। আগামী ৩ ঘণ্টায় ৩ গ্লাস পানি পান করে পর্যবেক্ষণ করুন।',
  };
}

/**
 * Format complete Urologist / Nephrologist Report
 */
export function formatUrologistHydrationSummary(
  shade: UrineColorDef,
  goal: HydrationGoal,
  utiEval: UtiRiskEvaluation,
  selectedSymptoms: string[]
): string {
  const symptomText =
    selectedSymptoms.length > 0
      ? selectedSymptoms.map((s) => `• ${s}`).join('\n')
      : '• কোনো সক্রিয় অস্বস্তি বা ইনফেকশনের লক্ষণ নেই';

  return `🚰 TrackMe Renal & Hydration Health Summary
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

🎨 প্রস্রাবের রঙ ও হাইড্রেশন স্ট্যাটাস:
• ইউরিন শেড: ${shade.nameBn}
• স্ট্যাটাস ক্যাটাগরি: ${shade.categoryLabelBn}
• ক্লিনিক্যাল পরামর্শ: ${shade.clinicalAdviceBn}

💧 দৈনিক পানি পানের টার্গেট:
• শারীরিক ওজন: ${goal.weightKg} কেজি
• দৈনিক পানির লক্ষ্যমাত্রা: ${goal.dailyWaterMl} mL (${goal.dailyGlasses} গ্লাস)
• আবহাওয়া / গরম: ${goal.isHotWeather ? 'তীব্র গরম (+৫০০ mL যোগ)' : 'স্বাভাবিক'}

🦠 ইউটিআই (UTI) ও কিডনি স্বাস্থ্য স্ক্রিনিং:
• ঝুঁকি মূল্যায়ন: ${utiEval.riskLevelBn} (${utiEval.riskScorePercent}%)
• বর্তমান লক্ষণসমূহ:
${symptomText}
• অ্যাকশন গাইডলাইন: ${utiEval.actionGuidanceBn}
============================================================
TrackMe Urine Color Hydration & Kidney Stone Guard`;
}
