import { KRAMER_JAUNDICE_ZONES } from '@/services/postpartum-knowledge';
import {
  EpdsEvaluation,
  JaundiceZoneLevel,
  KramerJaundiceZone,
} from '@/types/postpartum-newborn-shield';

/**
 * Get Kramer Jaundice Zone definition
 */
export function evaluateKramerJaundice(zone: JaundiceZoneLevel): KramerJaundiceZone {
  const found = KRAMER_JAUNDICE_ZONES.find((z) => z.zoneNumber === zone);
  return found || KRAMER_JAUNDICE_ZONES[0];
}

/**
 * Evaluate EPDS 5-question score
 * Max score = 15
 */
export function evaluateEpdsScore(answers: number[]): EpdsEvaluation {
  const totalScore = answers.reduce((sum, val) => sum + (val || 0), 0);

  if (totalScore <= 3) {
    return {
      totalScore,
      riskLevelBn: '🟢 স্বাভাবিক ও মানসিকভাবে সুস্থ (Normal Adaptation)',
      riskColor: '#10B981',
      actionAdviceBn:
        'আলহামদুলিল্লাহ! আপনার মানসিক অবস্থা স্বাভাবিক। পর্যাপ্ত বিশ্রাম ও পরিবারের সহায়তা বজায় রাখুন।',
    };
  }

  if (totalScore <= 7) {
    return {
      totalScore,
      riskLevelBn: '🟡 প্রসবোত্তর ক্লান্তি ও বেবি ব্লুজ (Baby Blues / Fatigue)',
      riskColor: '#F59E0B',
      actionAdviceBn:
        'ঘুমের ঘাটতি ও হরমোন পরিবর্তনের কারণে মৃদু অবসাদ। পরিবারকে বাচ্চার যত্নে অংশ নিতে বলুন এবং নিজে বিশ্রামের সুযোগ নিন।',
    };
  }

  return {
    totalScore,
    riskLevelBn: '🚨 প্রসবোত্তর বিষণ্ণতা ঝুঁকি (Postpartum Depression - PPD)',
    riskColor: '#EF4444',
    actionAdviceBn:
      'আপনার অতিরিক্ত মানসিক চাপ ও বিষণ্ণতা অনুভূত হচ্ছে। অবিলম্বে আপনার স্ত্রীরোগ বিশেষজ্ঞ (Gynecologist) বা কাউন্সিলরের সাথে কথা বলুন। এটি সম্পূর্ণ নিরাময়যোগ্য।',
  };
}

/**
 * Evaluate Newborn hydration by wet diaper count
 * Gold standard: 6+ wet diapers in 24 hours
 */
export function evaluateNewbornHydration(wetDiapers: number): {
  isSafe: boolean;
  messageBn: string;
  color: string;
} {
  if (wetDiapers >= 6) {
    return {
      isSafe: true,
      messageBn: `✅ চমৎকার! ২৪ ঘণ্টায় ${wetDiapers} বার ভেজা ডায়াপার নিশ্চিত করে বাচ্চা পর্যাপ্ত বুকের দুধ পাচ্ছে।`,
      color: '#10B981',
    };
  }

  if (wetDiapers >= 4) {
    return {
      isSafe: true,
      messageBn: `⚠️ পর্যবেক্ষণ প্রয়োজন: ${wetDiapers} বার ভেজা ডায়াপার হয়েছে। দুধ পানের ফ্রিকোয়েন্সি বাড়িয়ে প্রতি ২ ঘণ্টায় বুকের দুধ দিন।`,
      color: '#F59E0B',
    };
  }

  return {
    isSafe: false,
    messageBn: `🚨 পানিশূন্যতার ঝুঁকি: দিনে মাত্র ${wetDiapers} বার প্রস্রাব হয়েছে। বাচ্চা পর্যাপ্ত দুধ পাচ্ছে না। অবিলম্বে ল্যাচিং ঠিক করুন বা শিশু ডাক্তার দেখান।`,
    color: '#EF4444',
  };
}

/**
 * Format complete Pediatrician / Gynecologist Report
 */
export function formatPostpartumPediatricSummary(
  jaundice: KramerJaundiceZone,
  diaperCount: number,
  feedsCount: number,
  epdsEval: EpdsEvaluation
): string {
  const hydrationStatus = evaluateNewbornHydration(diaperCount);

  return `👶🤱 TrackMe Postpartum & Newborn Health Summary
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

🟡 নবজাতকের জন্ডিস মূল্যায়ন (Kramer Rule):
• হলুদ হওয়ার স্থান: ${jaundice.bodyAreaBn} (জোন ${jaundice.zoneNumber})
• আনুমানিক সিরাম বিলিরুবিন: ${jaundice.estimatedBilirubinMgDl}
• স্ট্যাটাস: ${jaundice.severityLabelBn}
• ক্লিনিক্যাল উপদেশ: ${jaundice.actionAdviceBn}

🧷 নবজাতক ফিডিং ও ডায়াপার আউটপুট:
• ২৪ ঘণ্টায় দুধ পান: ${feedsCount} বার
• ২৪ ঘণ্টায় ভেজা ডায়াপার: ${diaperCount} বার
• হাইড্রেশন মূল্যায়ন: ${hydrationStatus.messageBn}

🌸 প্রসবোত্তর মায়ের মানসিক স্বাস্থ্য (EPDS):
• স্কোর: ${epdsEval.totalScore}/১৫ (${epdsEval.riskLevelBn})
• ক্লিনিক্যাল গাইডলাইন: ${epdsEval.actionAdviceBn}
============================================================
TrackMe Postpartum Care & Newborn Growth Shield`;
}
