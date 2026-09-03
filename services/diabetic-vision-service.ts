import {
  AmslerGridResult,
  EyeTested,
  FundoscopyStatus,
} from '@/types/diabetic-vision-shield';

/**
 * Evaluate single eye or both eyes Amsler Grid Test
 */
export function evaluateAmslerGrid(
  eye: EyeTested,
  linesDistorted: boolean,
  darkSpotsVisible: boolean
): AmslerGridResult {
  const isAbnormal = linesDistorted || darkSpotsVisible;

  if (linesDistorted && darkSpotsVisible) {
    return {
      eye,
      linesDistorted: true,
      darkSpotsVisible: true,
      isAbnormal: true,
      clinicalInterpretationBn:
        '🚨 দৃশ্যমান দৃষ্টিবিকৃতি ও অন্ধ ছোপ (Distortion & Scotoma)। এটি ডায়াবেটিক ম্যাকুলার ইডিমা (DME) বা রেটিনোপ্যাথির গুরুতর লক্ষণ। অবিলম্বে রেটিনা স্পেশালিস্ট দেখান।',
      severityColor: '#EF4444',
    };
  }

  if (linesDistorted) {
    return {
      eye,
      linesDistorted: true,
      darkSpotsVisible: false,
      isAbnormal: true,
      clinicalInterpretationBn:
        '⚠️ সোজা লাইনগুলো ঢেউ খেলানো বা বাঁকা দেখায় (Metamorphopsia)। চোখের ম্যাকুলায় তরল জমার সংকেত। দ্রুত চক্ষু পরীক্ষা করান।',
      severityColor: '#F59E0B',
    };
  }

  if (darkSpotsVisible) {
    return {
      eye,
      linesDistorted: false,
      darkSpotsVisible: true,
      isAbnormal: true,
      clinicalInterpretationBn:
        '⚠️ গ্রিডের কোনো অংশে কালো ছোপ বা ফাঁকা অংশ রয়েছে (Scotoma)। রেটিনার নির্দিষ্ট অংশে আলো প্রতিফলনে বাধা সৃষ্টি হচ্ছে।',
      severityColor: '#F59E0B',
    };
  }

  return {
    eye,
    linesDistorted: false,
    darkSpotsVisible: false,
    isAbnormal: false,
    clinicalInterpretationBn:
      '🟢 আলহামদুলিল্লাহ! আমসলার গ্রিডের লাইনগুলো সোজা ও পরিষ্কার দেখা যাচ্ছে। কোনো অন্ধ ছোপ নেই।',
    severityColor: '#10B981',
  };
}

/**
 * Evaluate Dilated Fundoscopy annual schedule
 */
export function evaluateFundoscopyDue(monthsAgo: number): FundoscopyStatus {
  if (monthsAgo >= 12) {
    return {
      monthsSinceLastExam: monthsAgo,
      isOverdue: true,
      statusLabelBn: `🚨 চক্ষু পরীক্ষা ওভারডিউ (${monthsAgo} মাস আগে হয়েছিল)`,
      statusColor: '#EF4444',
      adviceBn:
        'ডায়াবেটিস ও উচ্চ রক্তচাপের রোগীদের প্রতি ১২ মাসে অন্তত একবার চোখের ড্রপ দিয়ে রেটিনা ফান্ডোস্কোপি (Dilated Fundoscopy) করানো বাধ্যতামূলক। অতি দ্রুত চক্ষু ডাক্তারের কাছে যান।',
    };
  }

  if (monthsAgo >= 9) {
    return {
      monthsSinceLastExam: monthsAgo,
      isOverdue: false,
      statusLabelBn: `🟡 আসন্ন পরীক্ষা (${monthsAgo} মাস আগে হয়েছিল)`,
      statusColor: '#F59E0B',
      adviceBn:
        'আপনার বাৎসরিক রেটিনা পরীক্ষার সময় ঘনিয়ে এসেছে। আগামী ২-৩ মাসের মধ্যে চক্ষু বিশেষজ্ঞের অ্যাপয়েন্টমেন্ট বুক করুন।',
    };
  }

  return {
    monthsSinceLastExam: monthsAgo,
    isOverdue: false,
    statusLabelBn: `🟢 হালনাগাদ আছে (${monthsAgo} মাস আগে হয়েছে)`,
    statusColor: '#10B981',
    adviceBn:
      'আপনার রেটিনা পরীক্ষা নিয়মিত রয়েছে। ডায়াবেটিসের সুগার লেভেল ও প্রেসার নিয়ন্ত্রণে রাখুন।',
  };
}

/**
 * Format Ophthalmologist Summary for WhatsApp
 */
export function formatOphthalmologistVisionSummary(
  leftResult: AmslerGridResult,
  rightResult: AmslerGridResult,
  activeSymptoms: string[],
  fundoscopy: FundoscopyStatus
): string {
  const symptomsStr =
    activeSymptoms.length > 0
      ? activeSymptoms.map((s) => `• ${s}`).join('\n')
      : '• কোনো তীব্র দৃষ্টি সমস্যা দৃশ্যমান নেই';

  return `👁️ TrackMe Diabetic Eye & Vision Health Report
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

🏁 ডিজিটাল Amsler Grid সেলফ-টেস্ট ফলাফল:
• ডান চোখ (Right Eye): ${rightResult.isAbnormal ? '❌ দৃষ্টিবিকৃতি চিহ্নিত' : '✅ স্বাভাবিক'}
  ${rightResult.clinicalInterpretationBn}
• বাম চোখ (Left Eye): ${leftResult.isAbnormal ? '❌ দৃষ্টিবিকৃতি চিহ্নিত' : '✅ স্বাভাবিক'}
  ${leftResult.clinicalInterpretationBn}

🩺 বাৎসরিক রেটিনা ফান্ডোস্কোপি স্ট্যাটাস:
• স্থিতি: ${fundoscopy.statusLabelBn}
• উপদেশ: ${fundoscopy.adviceBn}

⚡ দৃশ্যমান চোখের লক্ষণ ও বিপদচিহ্ন:
${symptomsStr}
============================================================
TrackMe Diabetic Eye & Vision Shield`;
}
