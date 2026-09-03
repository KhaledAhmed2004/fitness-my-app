import {
  DailyCheckInStatus,
  FallRiskItem,
  ParentProfile,
  SeniorSafetyEvaluation,
} from '@/types/elderly-care';

/**
 * Calculate home fall safety audit score
 */
export function calculateFallSafetyScore(items: FallRiskItem[]): number {
  if (!items || items.length === 0) return 100;
  const completedCount = items.filter((i) => i.isCompleted).length;
  return Math.round((completedCount / items.length) * 100);
}

/**
 * Evaluate daily safety status
 */
export function evaluateDailySeniorSafety(
  checkIn: DailyCheckInStatus,
  items: FallRiskItem[]
): SeniorSafetyEvaluation {
  const fallScore = calculateFallSafetyScore(items);
  const isFullyCheckedIn = checkIn.isMorningMedTaken && checkIn.isNightMedTaken;

  let safetyLabel = '🟢 চমৎকার ও সুরক্ষিত';
  let safetyColor = '#10B981';

  if (fallScore < 50 || checkIn.moodLevel === 'UNWELL') {
    safetyLabel = '🚨 বিশেষ সতর্কতা ও পর্যবেক্ষণ প্রয়োজন';
    safetyColor = '#EF4444';
  } else if (fallScore < 75 || checkIn.moodLevel === 'A_BIT_TIRED' || !checkIn.isMorningMedTaken) {
    safetyLabel = '🟡 সন্তোষজনক (কিছু সতর্কতা বাকি)';
    safetyColor = '#F59E0B';
  }

  const recommendations: string[] = [];
  if (!checkIn.isMorningMedTaken) {
    recommendations.push('সকালের নির্ধারিত ডায়াবেটিস/প্রেসারের ওষুধ এখনো গ্রহণ করা হয়নি।');
  }
  if (checkIn.glassesOfWater < 5) {
    recommendations.push('আজকের পানির পরিমাণ কম। মা-বাবাকে আরও পানি বা তরল খাবার খেতে বলুন।');
  }
  if (fallScore < 100) {
    recommendations.push('হোম সেফটি চেকলিস্টের বাকি আইটেমগুলো (যেমন: বাথরুম ম্যাট বা নাইট লাইট) দ্রুত সম্পন্ন করুন।');
  }

  return {
    safetyScorePercent: fallScore,
    safetyStatusLabelBn: safetyLabel,
    safetyStatusColor: safetyColor,
    isFullyCheckedInToday: isFullyCheckedIn,
    recommendationsBn: recommendations,
  };
}

/**
 * Format complete WhatsApp update for distant / expatriate children
 */
export function formatParentRemoteUpdateReport(
  parent: ParentProfile,
  checkIn: DailyCheckInStatus,
  fallScore: number
): string {
  const morningText = checkIn.isMorningMedTaken
    ? `✅ সকালের ওষুধ খাওয়া হয়েছে (${checkIn.morningTime || 'সকালে'})`
    : '❌ সকালের ওষুধ এখনো খাওয়া হয়নি';

  const nightText = checkIn.isNightMedTaken
    ? `✅ রাতের ওষুধ খাওয়া হয়েছে (${checkIn.nightTime || 'রাতে'})`
    : '⏳ রাতের ওষুধ এখনো বাকি';

  const moodEmoji =
    checkIn.moodLevel === 'FEELING_GOOD'
      ? '😊 আলহামদুলিল্লাহ ভালো আছেন'
      : checkIn.moodLevel === 'A_BIT_TIRED'
      ? '😐 কিছুটা ক্লান্ত/দুর্বল'
      : '🤒 শরীর খারাপ / অস্বস্তি লাগছে';

  return `👴👵 মা-বাবার দৈনিক স্বাস্থ্য ও নিরাপত্তা আপডেট (Parent Care Log)
============================================================
প্রোফাইল: ${parent.nameBn} (বয়স: ${parent.age} বছর)
তারিখ: ${new Date().toLocaleDateString('bn-BD')} (${checkIn.lastCheckedInDate})

💊 আজকের ওষুধ ও চেক-ইন স্ট্যাটাস:
• ${morningText}
• ${nightText}
• আজকের শারীরিক অবস্থা: ${moodEmoji}
• পানি গ্রহণ: ${checkIn.glassesOfWater} গ্লাস

🩺 সাম্প্রতিক ভাইটালস:
• ব্লাড প্রেসার: ${parent.bloodPressureRecent || 'পরিমাপ হয়নি'}
• রক্তের সুগার: ${parent.bloodSugarRecent || 'পরিমাপ হয়নি'}

🛁 বাসা ও বাথরুম সেফটি স্কোর: ${fallScore}% সুরক্ষিত
============================================================
TrackMe Senior Shield • প্রবাসী সন্তানের জন্য শান্তিময় আপডেট`;
}
