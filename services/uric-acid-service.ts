import { URIC_ACID_STAGES } from '@/services/uric-acid-knowledge';
import {
  GenderType,
  GoutStage,
  UricAcidReading,
  UricAcidStageDef,
} from '@/types/uric-acid-gout-shield';

/**
 * Classify serum uric acid level by gender
 * Male:
 *   < 6.0 => OPTIMAL
 *   6.0 - 6.9 => BORDERLINE
 *   7.0 - 8.5 => HYPERURICEMIA
 *   > 8.5 => SEVERE_GOUT_RISK
 *
 * Female:
 *   < 5.0 => OPTIMAL
 *   5.0 - 5.9 => BORDERLINE
 *   6.0 - 7.5 => HYPERURICEMIA
 *   > 7.5 => SEVERE_GOUT_RISK
 */
export function classifyUricAcid(valueMgDl: number, gender: GenderType): UricAcidStageDef {
  const val = Math.max(1, valueMgDl || 6.0);

  let matchedStage: GoutStage = 'OPTIMAL';

  if (gender === 'MALE') {
    if (val > 8.5) {
      matchedStage = 'SEVERE_GOUT_RISK';
    } else if (val >= 7.0) {
      matchedStage = 'HYPERURICEMIA';
    } else if (val >= 6.0) {
      matchedStage = 'BORDERLINE';
    } else {
      matchedStage = 'OPTIMAL';
    }
  } else {
    // FEMALE
    if (val > 7.5) {
      matchedStage = 'SEVERE_GOUT_RISK';
    } else if (val >= 6.0) {
      matchedStage = 'HYPERURICEMIA';
    } else if (val >= 5.0) {
      matchedStage = 'BORDERLINE';
    } else {
      matchedStage = 'OPTIMAL';
    }
  }

  const found = URIC_ACID_STAGES.find((s) => s.stage === matchedStage);
  return found || URIC_ACID_STAGES[0];
}

/**
 * Format complete Rheumatologist / Orthopedic Summary Report
 */
export function formatRheumatologistGoutSummary(
  reading: UricAcidReading,
  stageDef: UricAcidStageDef,
  highPurineFoods: string[]
): string {
  const genderBn = reading.gender === 'MALE' ? 'পুরুষ' : 'নারী';
  const foodWarningText =
    highPurineFoods.length > 0
      ? highPurineFoods.map((f) => `• ${f}`).join('\n')
      : '• কোনো উচ্চ-পিউরিন খাবার সাম্প্রতিক সময়ে খাওয়া হয়নি';

  return `🦶 TrackMe Uric Acid & Gout Rheumatology Report
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')} (${reading.date})
রোগীর লিঙ্গ: ${genderBn}

🧪 সিরাম ইউরিক এসিড পরিমাপ:
• মান: ${reading.valueMgDl.toFixed(1)} mg/dL
• স্টেজ মূল্যায়ন: ${stageDef.labelBn}
• ক্লিনিক্যাল পরামর্শ: ${stageDef.clinicalAdviceBn}

⚡ জয়েন্ট ব্যথা ও আক্রান্ত স্থান:
• ব্যথা মাত্রা: ${reading.painScale10}/১০ (ভ্যাস স্কেল)
• আক্রান্ত জয়েন্ট: ${reading.jointLocationBn || 'পায়ের বুড়ো আঙুল (Podagra)'}

🥩 সাম্প্রতিক পিউরিন খাদ্যতালিকা:
${foodWarningText}

💡 জরুরি নির্দেশনা: তীব্র ব্যথায় আক্রান্ত জয়েন্টে ১৫-২০ মিনিট বরফের সেঁক দিন এবং পা উঁচুতে রাখুন।
============================================================
TrackMe Uric Acid & Gout Joint Pain Shield`;
}
