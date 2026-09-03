import {
  MiniCogResult,
  SafeIdCardData,
} from '@/types/memory-dementia-shield';

/**
 * Validated Mini-Cog Scoring Algorithm:
 * - 0 words recalled: High Risk (Dementia screen positive)
 * - 1-2 words recalled:
 *      If clock drawing abnormal -> High Risk (Dementia screen positive)
 *      If clock drawing normal -> Low Risk / Mild Cognitive Impairment (MCI)
 * - 3 words recalled: Low Risk / Screen Negative
 */
export function evaluateMiniCog(
  recalledCount: number,
  clockPassed: boolean
): MiniCogResult {
  const count = Math.max(0, Math.min(3, recalledCount));

  if (count === 0) {
    return {
      recalledWordsCount: count,
      clockDrawingPassed: clockPassed,
      dementiaRiskScore: 0,
      riskCategory: 'HIGH_RISK_DEMENTIA',
      riskLabelBn: '🚨 উচ্চ ডিমেনশিয়া ঝুঁকি (Screen Positive)',
      riskColor: '#EF4444',
      clinicalGuidelineBn:
        '৩টি শব্দের কোনোটিই মনে রাখতে পারেননি। এটি উল্লেখযোগ্য স্মৃতিভ্রমের লক্ষণ। অতি দ্রুত একজন নিউরোলজিস্ট বা জেরিয়াট্রিশিয়ানকে দেখিয়ে বিস্তারিত MoCA বা MMSE পরীক্ষা করান।',
    };
  }

  if (count <= 2) {
    if (!clockPassed) {
      return {
        recalledWordsCount: count,
        clockDrawingPassed: false,
        dementiaRiskScore: count,
        riskCategory: 'HIGH_RISK_DEMENTIA',
        riskLabelBn: '🚨 সম্ভাব্য ডিমেনশিয়া ঝুঁকি (Abnormal CDT)',
        riskColor: '#EF4444',
        clinicalGuidelineBn:
          'শব্দ মনে রাখার ঘাটতি এবং ঘড়ির কাঁটার অস্বাভাবিক অবস্থান নির্দেশ করে মস্তিষ্কের ভিজুওস্প্যাটিয়াল ও এক্সিকিউটিভ কার্যাবলীতে ব্যাঘাত ঘটছে। বিশেষজ্ঞ ডাক্তারের পরামর্শ নিন।',
      };
    } else {
      return {
        recalledWordsCount: count,
        clockDrawingPassed: true,
        dementiaRiskScore: count + 2,
        riskCategory: 'MODERATE_MCI',
        riskLabelBn: '🟡 মৃদু কগনিটিভ সমস্যা (Mild Cognitive Impairment - MCI)',
        riskColor: '#F59E0B',
        clinicalGuidelineBn:
          'ঘড়ির কাঁটা স্বাভাবিক হলেও কিছু শব্দ ভুলে গেছেন। এটি বয়সজনিত স্বাভাবিক স্মৃতিভ্রম বা প্রাথমিক MCI হতে পারে। নিয়মিত ব্রেন এক্সারসাইজ ও পুষ্টিকর খাবার চালু রাখুন।',
      };
    }
  }

  // 3 words recalled
  return {
    recalledWordsCount: 3,
    clockDrawingPassed: clockPassed,
    dementiaRiskScore: 5,
    riskCategory: 'LOW_RISK_NORMAL',
    riskLabelBn: '🟢 স্বাভাবিক মেমরি ও কগনিশন (Screen Negative)',
    riskColor: '#10B981',
    clinicalGuidelineBn:
      'আলহামদুলিল্লাহ! মেমরি রিকল এবং ব্রেনের এক্সিকিউটিভ ফাংশন চমৎকার ও স্বাভাবিক রয়েছে।',
  };
}

/**
 * Format Doctor Summary for Neurologist / Geriatrician over WhatsApp
 */
export function formatNeurologistDementiaSummary(
  miniCog: MiniCogResult,
  activeObservations: string[],
  safeId?: Partial<SafeIdCardData>
): string {
  const obsStr =
    activeObservations.length > 0
      ? activeObservations.map((o) => `• ${o}`).join('\n')
      : '• কোনো উল্লেখযোগ্য অস্বাভাবিক আচরণ পরিলক্ষিত হয়নি';

  const elderInfo = safeId?.elderName
    ? `\n👤 প্রবীণ সদস্য: ${safeId.elderName} (জরুরি যোগাযোগ: ${safeId.emergencyPhone || 'N/A'})`
    : '';

  return `🧠 TrackMe Memory & Dementia Cognitive Report
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')}${elderInfo}

📊 Mini-Cog ৩-মিনিটের মেমরি স্ক্রিনিং ফলাফল:
• স্মরণ রাখা শব্দের সংখ্যা: ${miniCog.recalledWordsCount}/৩ টি
• ঘড়ির কাঁটা পরীক্ষা (Clock Drawing): ${miniCog.clockDrawingPassed ? '✅ স্বাভাবিক (Normal)' : '❌ অস্বাভাবিক (Abnormal)'}
• কগনিটিভ স্ট্যাটাস: ${miniCog.riskLabelBn}
• ক্লিনিক্যাল গাইডলাইন: ${miniCog.clinicalGuidelineBn}

🔍 কেয়ারগিভারের দৈনিক পর্যবেক্ষণ ও আচরণগত পরিবর্তন:
${obsStr}
============================================================
TrackMe Memory & Dementia Early Screener`;
}
