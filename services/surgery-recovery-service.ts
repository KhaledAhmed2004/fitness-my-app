import {
  get14DayMilestones,
  SURGERY_CATEGORIES,
} from '@/services/surgery-recovery-knowledge';
import {
  DailyRecoveryMilestone,
  StitchType,
  SurgeryCategory,
  SurgeryRecoveryPlan,
  WoundAssessmentResult,
  WoundStatusGrade,
  WoundSymptomLog,
} from '@/types/surgery-recovery';

export function calculatePostOpDay(surgeryDateStr: string): number {
  try {
    const surg = new Date(surgeryDateStr);
    const today = new Date();
    // Normalize both to start of day
    surg.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - surg.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1); // Surgery day is Day 1
  } catch {
    return 1;
  }
}

export function calculateStitchRemovalSchedule(
  category: SurgeryCategory,
  surgeryDateStr: string,
  stitchType: StitchType
): {
  recommendedDay: number;
  targetDateStr: string;
  daysRemaining: number;
  isPassed: boolean;
  requiresRemoval: boolean;
} {
  const requiresRemoval =
    stitchType === 'NON_ABSORBABLE_STITCH' || stitchType === 'SURGICAL_STAPLES';

  const catMeta =
    SURGERY_CATEGORIES.find((c) => c.category === category) || SURGERY_CATEGORIES[0];
  const recommendedDay = catMeta.defaultStitchDay;

  try {
    const surg = new Date(surgeryDateStr);
    const targetDate = new Date(surg);
    targetDate.setDate(surg.getDate() + (recommendedDay - 1));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const targetDateStr = targetDate.toISOString().split('T')[0];

    return {
      recommendedDay,
      targetDateStr,
      daysRemaining: diffDays,
      isPassed: diffDays < 0,
      requiresRemoval,
    };
  } catch {
    return {
      recommendedDay,
      targetDateStr: surgeryDateStr,
      daysRemaining: 0,
      isPassed: false,
      requiresRemoval,
    };
  }
}

export function evaluateWoundInfectionRisk(
  symptoms: WoundSymptomLog
): WoundAssessmentResult {
  const {
    hasPusOrDischarge,
    hasSpreadingRedness,
    hasFeverOver100_4F,
    hasWoundGapingOrPopping,
    hasSevereThrobbingPain,
    painScore,
    patientTemperatureF,
  } = symptoms;

  // Critical Red Flags
  const criticalCount = [
    hasPusOrDischarge,
    hasFeverOver100_4F || (patientTemperatureF !== undefined && patientTemperatureF >= 101),
    hasWoundGapingOrPopping,
  ].filter(Boolean).length;

  const warningCount = [
    hasSpreadingRedness,
    hasSevereThrobbingPain || painScore >= 8,
  ].filter(Boolean).length;

  if (criticalCount >= 2 || hasWoundGapingOrPopping || (hasPusOrDischarge && hasFeverOver100_4F)) {
    return {
      grade: 'CRITICAL_RED_FLAG',
      titleBn: '🚨 জরুরি সার্জিক্যাল রেড-ফ্ল্যাগ (Emergency Red-Flag)',
      summaryBn:
        'ক্ষতে পুঁজ বা গভীর ইনফেকশন / সেলাই ছুটে যাওয়ার লক্ষণ রয়েছে। দেরি না করে তাৎক্ষণিক হাসপাতালে অথবা আপনার সার্জনকে দেখান।',
      urgencyLevel: 'CRITICAL',
      requiresEmergencyVisit: true,
      actionRecommendationsBn: [
        'তাৎক্ষণিকভাবে আপনার সার্জন বা সার্জারি ইমার্জেন্সিতে যোগাযোগ করুন।',
        'ক্ষতের উপর কোনো ব্যান্ডেজ চেপে বাঁধবেন না বা নিজে থেকে পুঁজ চিপবেন না।',
        'হাসপাতালে যাওয়ার আগ পর্যন্ত ক্ষতে কোনো মলম বা তেল লাগাবেন না।',
        'আপনার প্রেসক্রিপশন ও ওষুধের তালিকা সাথে নিয়ে যান।',
      ],
    };
  }

  if (criticalCount === 1 || warningCount >= 2) {
    return {
      grade: 'POSSIBLE_INFECTION',
      titleBn: '🟠 সম্ভাব্য ইনফেকশন সতর্কতা (Possible Infection Warning)',
      summaryBn:
        'ক্ষতের আশেপাশে অতিরিক্ত লালচে ভাব, ফোলা বা তাপমাত্রা বেশি রয়েছে। এটি প্রাথমিক ইনফেকশনের লক্ষণ হতে পারে।',
      urgencyLevel: 'HIGH',
      requiresEmergencyVisit: false,
      actionRecommendationsBn: [
        'আজই আপনার সার্জনের চেম্বারে বা ক্লিনিকে ফোন করে আপডেট জানান।',
        'ব্যান্ডেজ পরিবর্তন করার প্রয়োজন হলে ক্লিনিক্যাল স্টেরাইল গজ ব্যবহার করুন।',
        'নির্ধারিত অ্যান্টিবায়োটিক সময়মতো ও সঠিক ডোজে খাচ্ছেন কি না নিশ্চিত করুন।',
        'প্রতি ৪ ঘণ্টা পর পর শরীরের তাপমাত্রা মেপে চার্টে লিখে রাখুন।',
      ],
    };
  }

  if (warningCount === 1 || painScore >= 5) {
    return {
      grade: 'MILD_REDNESS',
      titleBn: '🟡 মৃদু অস্বস্তি ও নিরাময় পর্যবেক্ষণ (Mild Healing Irritation)',
      summaryBn:
        'ক্ষতে হালকা লালচে ভাব বা সাধারণ টান লাগার মতো ব্যথা রয়েছে, যা হিলিং স্টেজে সাধারণ। তবে লক্ষণ বাড়ে কি না খেয়াল রাখুন।',
      urgencyLevel: 'MEDIUM',
      requiresEmergencyVisit: false,
      actionRecommendationsBn: [
        'ব্যান্ডেজ সম্পূর্ণ শুকনো ও পরিচ্ছন্ন রাখুন।',
        'চুলকানি হলে হাত দিয়ে ক্ষতের চামড়া খোঁটাখুঁটি করবেন না।',
        'প্রোটিনসমৃদ্ধ খাবার ও প্রচুর পানি পান করুন।',
        'আগামী ২৪ ঘণ্টায় লালচে ভাব বা ব্যথা বাড়লে পুনরায় স্ক্রিনার টেস্ট করুন।',
      ],
    };
  }

  return {
    grade: 'HEALTHY_HEALING',
    titleBn: '✅ স্বাভাবিক ও নিরাপদ নিরাময় (Healthy Wound Healing)',
    summaryBn:
      'আপনার ক্ষতে কোনো ইনফেকশন বা ভয়ের লক্ষণ নেই। নির্ধারিত রুটিন কেয়ার ও বিশ্রাম বজায় রাখুন।',
    urgencyLevel: 'LOW',
    requiresEmergencyVisit: false,
    actionRecommendationsBn: [
      'নির্ধারিত তারিখে সেলাই কাটার শিডিউল বজায় রাখুন।',
      'ভারী কাজ ও পেটে চাপ পড়া থেকে বিরত থাকুন।',
      'ডাক্তারের নির্দেশিত ওষুধ সময়মতো গ্রহণ করুন।',
    ],
  };
}

export function compile14DayRoadmap(
  category: SurgeryCategory,
  surgeryDateStr: string
): DailyRecoveryMilestone[] {
  const milestones = get14DayMilestones(category);
  const currentPostOpDay = calculatePostOpDay(surgeryDateStr);

  return milestones.map((m) => ({
    ...m,
    isCurrentDay: m.dayNumber === currentPostOpDay,
  }));
}
