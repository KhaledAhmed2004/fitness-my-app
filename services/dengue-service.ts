import {
  DailyDengueLog,
  DengueAssessmentSummary,
  DenguePhase,
  DengueSeverityGrade,
  PlateletRiskTier,
} from '@/types/dengue-fluid-monitor';

/**
 * Calculate phase of Dengue illness based on day of fever onset
 */
export function calculateDenguePhase(feverDay: number): {
  phase: DenguePhase;
  titleBn: string;
  descriptionBn: string;
} {
  if (feverDay <= 3) {
    return {
      phase: 'FEBRILE_DAY_1_3',
      titleBn: '১. ফেবরাইল ফেজ / তীব্র জ্বরের ধাপ (দিন ১ - ৩)',
      descriptionBn:
        'এই ধাপে তীব্র জ্বর (১০২°-১০৪°F), তীব্র মাথাব্যথা, চোখের পেছনে ব্যথা ও শরীর ব্যথা থাকে। এ সময় পর্যাপ্ত ওআরএস, ডাবের পানি ও তরল খাবার পান করতে হবে।',
    };
  } else if (feverDay <= 6) {
    return {
      phase: 'CRITICAL_DAY_4_6',
      titleBn: '২. ক্রিটিক্যাল ফেজ / বিপদজনক ধাপ (দিন ৪ - ৬)',
      descriptionBn:
        '🚨 সবচেয়ে ঝুঁকিপূর্ণ সময়! এ সময়ে জ্বর কমতে শুরু করে কিন্তু প্লাজমা লিকেজ, প্লাটিলেট ড্রপ ও ইন্টারনাল ব্লিডিংয়ের ঝুঁকি সবচেয়ে বেশি থাকে। সতর্ক নজরদারি আবশ্যক।',
    };
  } else {
    return {
      phase: 'RECOVERY_DAY_7_PLUS',
      titleBn: '৩. কনভালেসেন্ট / সুস্থতার ধাপ (দিন ৭+)',
      descriptionBn:
        '🎉 রোগীর ক্ষুধা বৃদ্ধি পায়, সাধারণ দুর্বলতা কমে এবং ত্বকে হালকা লালচে ফুসকুড়ি (Recovery Rash) দেখা দিতে পারে। প্লাটিলেট ও রক্তের ঘনত্ব স্বাভাবিক হতে থাকে।',
    };
  }
}

/**
 * Calculate daily maintenance oral fluid requirement based on weight (Holliday-Segar method for Dengue)
 */
export function calculateTargetFluidIntake(weightKg: number = 60): number {
  if (weightKg <= 10) {
    return weightKg * 100;
  } else if (weightKg <= 20) {
    return 1000 + (weightKg - 10) * 50;
  } else {
    // Adults & above 20kg: 1500 + 20ml for each kg above 20
    const maintenance = 1500 + (weightKg - 20) * 20;
    // Cap safe daily oral limit at ~2500 - 3000 ml for adults to avoid fluid overload
    return Math.min(3000, Math.max(2000, Math.round(maintenance)));
  }
}

/**
 * Comprehensive Dengue Assessment and Triage Engine
 */
export function evaluateDengueRisk(
  log: DailyDengueLog,
  weightKg: number = 60,
  baselineHct: number = 40
): DengueAssessmentSummary {
  const phaseInfo = calculateDenguePhase(log.dayNumber);
  const targetFluid = calculateTargetFluidIntake(weightKg);

  const totalFluidIntakeToday = log.hourlyFluids.reduce(
    (sum, f) => sum + f.amountMl,
    0
  );
  const fluidProgressPercent = Math.min(
    100,
    Math.round((totalFluidIntakeToday / targetFluid) * 100)
  );

  // Platelet Evaluation
  let plateletRisk: PlateletRiskTier = 'NORMAL';
  let plateletDropMessageBn = 'প্লাটিলেট রিপোর্ট এখনো এন্ট্রি করা হয়নি।';
  if (log.plateletCount !== undefined) {
    if (log.plateletCount >= 150000) {
      plateletRisk = 'NORMAL';
      plateletDropMessageBn = `প্লাটিলেট ${log.plateletCount.toLocaleString('bn-BD')} /uL (স্বাভাবিক নিরাপদ রেঞ্জ)।`;
    } else if (log.plateletCount >= 100000) {
      plateletRisk = 'MILD_DROP';
      plateletDropMessageBn = `প্লাটিলেট ${log.plateletCount.toLocaleString('bn-BD')} /uL (মৃদু হ্রাস - সতর্ক থাকুন)।`;
    } else if (log.plateletCount >= 50000) {
      plateletRisk = 'MODERATE_RISK';
      plateletDropMessageBn = `প্লাটিলেট ${log.plateletCount.toLocaleString('bn-BD')} /uL (ঝুঁকিপূর্ণ - প্রতিদিন CBC রিপিট করুন)।`;
    } else {
      plateletRisk = 'CRITICAL_DANGER';
      plateletDropMessageBn = `🚨 প্লাটিলেট ${log.plateletCount.toLocaleString('bn-BD')} /uL (বিপদসীমা ৫০ হাজারের নিচে! হাসপাতালে ভর্তি প্রয়োজন)।`;
    }
  }

  // Hematocrit Evaluation (Plasma Leakage Indicator)
  let isHematocritElevated = false;
  let hematocritMessageBn = 'হেমাটোক্রিট রিপোর্ট এখনো এন্ট্রি করা হয়নি।';
  if (log.hematocritPercent !== undefined) {
    const risePercent = ((log.hematocritPercent - baselineHct) / baselineHct) * 100;
    if (risePercent >= 20 || log.hematocritPercent >= 46) {
      isHematocritElevated = true;
      hematocritMessageBn = `⚠️ হেমাটোক্রিট ${log.hematocritPercent}% (রক্ত অতিরিক্ত ঘন বা প্লাজমা লিকেজের স্পষ্ট সংকেত!)।`;
    } else {
      hematocritMessageBn = `হেমাটোক্রিট ${log.hematocritPercent}% (রক্তের ঘনত্ব গ্রহণযোগ্য সীমার মধ্যে রয়েছে)।`;
    }
  }

  const warningSignsCount = log.warningSymptomsChecked.length;

  // Severity Grade & Triage Recommendation
  let triageGrade: DengueSeverityGrade = 'MILD_FEBRILE';
  let triageRecommendationBn = '';
  let emergencyActionRequired = false;

  if (
    warningSignsCount > 0 ||
    plateletRisk === 'CRITICAL_DANGER' ||
    isHematocritElevated
  ) {
    triageGrade = 'WARNING_SIGNS_PRESENT';
    emergencyActionRequired = true;
    triageRecommendationBn =
      '🚨 রোগীর শরীরে ডেঙ্গুর মারাত্মক বিপদচিহ্ন দেখা দিয়েছে। বিলম্ব না করে অবিলম্বে নিকটস্থ হাসপাতালের জরুরি বিভাগে বা চিকিৎসকের কাছে নিয়ে যান!';
  } else if (phaseInfo.phase === 'CRITICAL_DAY_4_6') {
    triageGrade = 'MILD_FEBRILE';
    triageRecommendationBn =
      'রোগী বর্তমানে বিপদজনক ক্রিটিক্যাল ফেজে আছেন। প্রতি ঘণ্টায় তরল পান নিশ্চিত করুন এবং দিনে অন্তত ১ বার সিবিসি (CBC) টেস্ট করান।';
  } else {
    triageGrade = 'MILD_FEBRILE';
    triageRecommendationBn =
      'রোগীর সার্বিক অবস্থা স্থিতিশীল। ঘরে বিশ্রামে রাখুন, ওআরএস-ডাবের পানি খাওয়ান এবং প্যারাসিটামল ছাড়া অন্য কোনো ব্যথানাশক ওষুধ দেওয়া থেকে বিরত থাকুন।';
  }

  return {
    currentPhase: phaseInfo.phase,
    phaseTitleBn: phaseInfo.titleBn,
    phaseDescriptionBn: phaseInfo.descriptionBn,
    targetDailyFluidMl: targetFluid,
    totalFluidIntakeTodayMl: totalFluidIntakeToday,
    fluidProgressPercent,
    plateletRisk,
    plateletDropMessageBn,
    isHematocritElevated,
    hematocritMessageBn,
    warningSignsCount,
    triageGrade,
    triageRecommendationBn,
    emergencyActionRequired,
  };
}

/**
 * Format a complete Dengue Patient Summary for Doctor Consultation / WhatsApp
 */
export function formatDengueDoctorSummaryText(
  summary: DengueAssessmentSummary,
  log: DailyDengueLog,
  patientName: string = 'Patient'
): string {
  const fluidLines =
    log.hourlyFluids.length > 0
      ? log.hourlyFluids
          .map(
            (f) =>
              `• ${f.timestamp} - ${f.fluidType === 'ORAL_SALINE_ORS' ? 'ORS স্যালাইন' : f.fluidType === 'COCONUT_WATER' ? 'ডাবের পানি' : f.fluidType === 'WATER' ? 'পানি' : 'অন্যান্য'}: ${f.amountMl} ml`
          )
          .join('\n')
      : '• আজ এখনো কোনো তরল এন্ট্রি নেই';

  return `🦟 ডেঙ্গু রোগী মনিটরিং ও ফ্লুইড সামারি রিপোর্ট (Dengue Care Log)
============================================================
রোগীর নাম: ${patientName}
জ্বরের দিন: ডেঙ্গু ডে #${log.dayNumber} (${summary.phaseTitleBn})
তারিখ: ${log.date}

🩸 ল্যাব টেস্টের মান:
• প্লাটিলেট কাউন্ট: ${log.plateletCount ? `${log.plateletCount.toLocaleString('bn-BD')} /uL` : 'রিপোর্ট নেই'}
• হেমাটোক্রিট (HCT): ${log.hematocritPercent ? `${log.hematocritPercent}%` : 'রিপোর্ট নেই'}
• শরীরের তাপমাত্রা: ${log.temperatureF ? `${log.temperatureF}°F` : 'পরিমাপ হয়নি'}

💧 ফ্লুইড ইনটেক ও হাইড্রেশন স্ট্যাটাস:
• আজকের মোট তরল গ্রহণ: ${summary.totalFluidIntakeTodayMl} ml / দৈনিক টার্গেট ${summary.targetDailyFluidMl} ml (${summary.fluidProgressPercent}%)
• তরল গ্রহণের বিস্তারিত:
${fluidLines}

🚨 বিপদচিহ্ন স্ক্রিনিং (Warning Signs):
• সক্রিয় বিপদচিহ্ন: ${summary.warningSignsCount}টি ${summary.warningSignsCount > 0 ? `(${log.warningSymptomsChecked.join(', ')})` : 'চিহ্নিত হয়নি'}

💡 বর্তমান সুপারিশ:
${summary.triageRecommendationBn}
============================================================
TrackMe Dengue Fluid Guard • হেলথ ভল্ট`;
}
