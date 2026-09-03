import {
  HearingScreenerResult,
  TremorEvaluationResult,
  TremorGrade,
  TremorType,
} from '@/types/hearing-tremor-shield';

/**
 * Evaluate 5-question HHIE-S Hearing Screen
 */
export function evaluateHearingLoss(scoreOutOf10: number): HearingScreenerResult {
  if (scoreOutOf10 >= 8) {
    return {
      scoreOutOf10,
      severity: 'SEVERE_LOSS',
      severityLabelBn: '🚨 গুরুতর শ্রবণস্বল্পতা (Severe Presbycusis)',
      severityColor: '#EF4444',
      adviceBn:
        'উচ্চমাত্রার বধিরতা সামাজিক একাকীত্ব ও ডিমেনশিয়ার ঝুঁকি দ্রুত বাড়ায়। অবিলম্বে ইএনটি (ENT) বিশেষজ্ঞ দেখিয়ে Pure Tone Audiometry (PTA) পরীক্ষা এবং ডিজিটাল হিয়ারিং এইড ট্রায়াল নিন।',
      audiometryRecommended: true,
    };
  }

  if (scoreOutOf10 >= 4) {
    return {
      scoreOutOf10,
      severity: 'MODERATE_LOSS',
      severityLabelBn: '🟡 মাঝারি মাত্রার শ্রবণ হ্রাস (Moderate Loss)',
      severityColor: '#F59E0B',
      adviceBn:
        'কোলাহল ও ফোনে কথা বুঝতে সমস্যা হচ্ছে। কানে খৈল/ওয়াক্স জমেছে কিনা দেখতে ইএনটি ডাক্তার দেখান এবং অডিওমেট্রি টেস্ট করান।',
      audiometryRecommended: true,
    };
  }

  if (scoreOutOf10 >= 2) {
    return {
      scoreOutOf10,
      severity: 'MILD_LOSS',
      severityLabelBn: '🟡 মৃদু শ্রবণ হ্রাস (Mild Loss)',
      severityColor: '#F59E0B',
      adviceBn:
        'বয়সজনিত সামান্য কম শোনার প্রাথমিক লক্ষণ। অন্যদের সাথে কথা বলার সময় সামনাসামনি স্পষ্ট উচ্চারণে কথা বলতে বলুন।',
      audiometryRecommended: false,
    };
  }

  return {
    scoreOutOf10,
    severity: 'NORMAL',
    severityLabelBn: '🟢 স্বাভাবিক শ্রবণশক্তি (Normal Hearing)',
    severityColor: '#10B981',
    adviceBn: 'আপনার শ্রবণশক্তি ভালো রয়েছে। অতিরিক্ত উচ্চ শব্দে হেডফোন ব্যবহার পরিহার করুন।',
    audiometryRecommended: false,
  };
}

/**
 * Evaluate Tremor & Parkinson's Risk Level
 */
export function evaluateTremorAndParkinsons(
  tremorGrade: TremorGrade,
  tremorType: TremorType,
  parkinsonSignsCount: number
): TremorEvaluationResult {
  let gradeLabelBn = 'গ্রেড ০: কোনো কাঁপুনি নেই';
  if (tremorGrade === 1) gradeLabelBn = 'গ্রেড ১: সামান্য মৃদু কম্পন (Mild Tremor)';
  if (tremorGrade === 2) gradeLabelBn = 'গ্রেড ২: মাঝারি কাঁপুনি / খাবার উপচে পড়া (Moderate)';
  if (tremorGrade === 3) gradeLabelBn = 'গ্রেড ৩: তীব্র কাঁপুনি / স্বাবলম্বীহীনতা (Severe)';

  const isRest = tremorType === 'REST_TREMOR' || tremorType === 'MIXED_TREMOR';

  if ((isRest && tremorGrade >= 2) || (isRest && parkinsonSignsCount >= 2)) {
    return {
      grade: tremorGrade,
      gradeLabelBn,
      tremorType,
      parkinsonRiskLevel: 'HIGH',
      severityColor: '#EF4444',
      adviceBn:
        'বিশ্রামে হাত কাঁপা এবং মোটর লক্ষণগুলো পারকিনসন্স ডিজিজের (Parkinson\'s Disease) বৈশিষ্ট্য বহন করে। অতি দ্রুত একজন নিউরোলজিস্ট বা স্নায়ুরোগ বিশেষজ্ঞের কাছে ক্লিনিক্যাল ইভ্যালুয়েশন ও ওষুধ (যেমন: Levodopa) সমন্বয়ের পরামর্শ নিন।',
    };
  }

  if (tremorGrade >= 1 && (isRest || parkinsonSignsCount >= 1)) {
    return {
      grade: tremorGrade,
      gradeLabelBn,
      tremorType,
      parkinsonRiskLevel: 'MODERATE',
      severityColor: '#F59E0B',
      adviceBn:
        'প্রাথমিক ট্রেমর ও চলাফেরার ধীরগতির লক্ষণ দেখা যাচ্ছে। থাইরয়েড ও ওষুধজনিত পার্শ্বপ্রতিক্রিয়া যাচাই করতে নিউরো বিশেষজ্ঞের সাথে পরামর্শ করুন।',
    };
  }

  if (tremorGrade >= 1 && tremorType === 'ACTION_TREMOR') {
    return {
      grade: tremorGrade,
      gradeLabelBn,
      tremorType,
      parkinsonRiskLevel: 'LOW',
      severityColor: '#06B6D4',
      adviceBn:
        'কাজ করার সময় বা চামচ তুললে হাত কাঁপা সাধারণত এসেনশিয়াল ট্রেমর (Essential Tremor)। ভারী চামচ ও দুই হাতলযুক্ত পাত্র ব্যবহারে দৈনন্দিন সুবিধা পাওয়া যায়।',
    };
  }

  return {
    grade: tremorGrade,
    gradeLabelBn,
    tremorType,
    parkinsonRiskLevel: 'LOW',
    severityColor: '#10B981',
    adviceBn: 'হাতে কোনো অস্বাভাবিক কম্পন পরিলক্ষিত হয়নি। নিয়মিত হাত ও আঙুলের হালকা ব্যায়াম অব্যাহত রাখুন।',
  };
}

/**
 * Format Neurologist / ENT Summary for WhatsApp
 */
export function formatNeurologistHearingReport(
  hearing: HearingScreenerResult,
  tremor: TremorEvaluationResult,
  activeParkinsonSigns: string[]
): string {
  const parkinsonStr =
    activeParkinsonSigns.length > 0
      ? activeParkinsonSigns.map((s) => `• ${s}`).join('\n')
      : '• কোনো পারকিনসন্স মোটর লক্ষণ চিহ্নিত নেই';

  let typeStr = 'বিশ্রামে হাত কাঁপা (Rest Tremor)';
  if (tremor.tremorType === 'ACTION_TREMOR') typeStr = 'কাজের সময় কাঁপা (Action Tremor)';
  if (tremor.tremorType === 'MIXED_TREMOR') typeStr = 'মিশ্র কাঁপুনি (Mixed Tremor)';

  return `🧏 TrackMe Hearing & Tremor / Parkinson's Report
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

🦻 শ্রবণশক্তি স্ক্রিনিং (HHIE-S Model):
• স্কোর: ${hearing.scoreOutOf10}/১০
• স্ট্যাটাস: ${hearing.severityLabelBn}
• অডিওমেট্রি (PTA) পরীক্ষা প্রয়োজন: ${hearing.audiometryRecommended ? '✅ হ্যাঁ' : '❌ না'}
• উপদেশ: ${hearing.adviceBn}

🖐️ হাতের কাঁপুনি ও পারকিনসন্স ট্র্যাকার:
• ট্রেমরের ধরন: ${typeStr}
• তীব্রতা: ${tremor.gradeLabelBn}
• পারকিনসন্স ঝুঁকি লেভেল: ${tremor.parkinsonRiskLevel}
• বিশেষজ্ঞ মতামত: ${tremor.adviceBn}

🚶‍♂️ চিহ্নিত পারকিনসন্স লক্ষণসমূহ:
${parkinsonStr}
============================================================
TrackMe Senior Hearing & Tremor Guard`;
}
