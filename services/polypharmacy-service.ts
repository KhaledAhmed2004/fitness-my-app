import { BEERS_CRITERIA_LIST } from '@/services/polypharmacy-knowledge';
import {
  BeersCriteriaItem,
  PolypharmacyEvaluationResult,
  PolypharmacyLevel,
} from '@/types/polypharmacy-shield';

/**
 * Evaluate total pill burden and Beers Criteria risks
 */
export function evaluatePolypharmacyRisk(
  pillCount: number,
  selectedBeersDrugIds: string[]
): PolypharmacyEvaluationResult {
  let polypharmacyLevel: PolypharmacyLevel = 'NORMAL_LOAD';
  let levelLabelBn = '🟢 স্বাভাবিক ও নিয়ন্ত্রণযোগ্য ওষুধের সংখ্যা (Normal Pill Load)';
  let levelColor = '#10B981';
  let deprescribingAdviceBn =
    'বর্তমানে ওষুধের সংখ্যা নিয়ন্ত্রিত সীমার মধ্যে রয়েছে। নতুন কোনো ওষুধ যোগ করার পূর্বে সবসময় ড্রাগ ইন্টারঅ্যাকশন পরীক্ষা করুন।';

  if (pillCount >= 10) {
    polypharmacyLevel = 'HYPER_POLYPHARMACY';
    levelLabelBn = '🚨 হাইপার-পলিফার্মাসি (Hyper-Polypharmacy ≥১০টি ওষুধ)';
    levelColor = '#EF4444';
    deprescribingAdviceBn =
      'একসাথে ১০টির বেশি ওষুধ গ্রহণ করায় লিভার, কিডনি এবং ড্রাগ ইন্টারঅ্যাকশনের তীব্র ঝুঁকি রয়েছে। চিকিৎসকের সাথে বসে অবিলম্বে "ডি-প্রেসক্রাইবিং" (অপ্রয়োজনীয় ওষুধ বাদ দেওয়া) সম্পন্ন করুন।';
  } else if (pillCount >= 5) {
    polypharmacyLevel = 'POLYPHARMACY';
    levelLabelBn = '🟡 পলিফার্মাসি সতর্কতা (Polypharmacy ৫-৯টি ওষুধ)';
    levelColor = '#F59E0B';
    deprescribingAdviceBn =
      'মাঝারি মাত্রার ওষুধের চাপ। একাধিক ডাক্তারের দেওয়া কোনো ডুপ্লিকেট ওষুধ আছে কিনা নিয়মিত রিভিউ করুন।';
  }

  const identifiedRisks: BeersCriteriaItem[] = BEERS_CRITERIA_LIST.filter((item) =>
    selectedBeersDrugIds.includes(item.id)
  );

  const criticalWarningsCount = identifiedRisks.filter(
    (r) => r.severity === 'CRITICAL'
  ).length;

  return {
    totalPillCount: pillCount,
    polypharmacyLevel,
    levelLabelBn,
    levelColor,
    criticalWarningsCount,
    identifiedRisks,
    deprescribingAdviceBn,
  };
}

/**
 * Format Deprescribing Doctor Report for WhatsApp
 */
export function formatDeprescribingDoctorReport(
  evaluation: PolypharmacyEvaluationResult,
  patientAge: number,
  activeMedicineNames: string[]
): string {
  const medListStr =
    activeMedicineNames.length > 0
      ? activeMedicineNames.map((m) => `• ${m}`).join('\n')
      : '• বিস্তারিত প্রেসক্রিপশন সংরক্ষিত আছে';

  const beersRiskStr =
    evaluation.identifiedRisks.length > 0
      ? evaluation.identifiedRisks
          .map(
            (r) =>
              `⚠️ ${r.drugClassBn}:\n  - ঝুঁকি: ${r.adverseRiskBn}\n  - নিরাপদ বিকল্প: ${r.saferAlternativeBn}`
          )
          .join('\n\n')
      : '• Beers Criteria অনুযায়ী কোনো বিপজ্জনক ওষুধ চিহ্নিত হয়নি';

  return `💊 TrackMe Elderly Polypharmacy & Drug Safety Report
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')}
রোগীর বয়স: ${patientAge} বছর

📊 ওষুধের বোঝা ও পলিফার্মাসি স্ট্যাটাস:
• মোট দৈনিক ওষুধের সংখ্যা: ${evaluation.totalPillCount} টি
• স্ট্যাটাস: ${evaluation.levelLabelBn}
• জটিল ড্রাগ ঝুঁকি চিহ্নিত: ${evaluation.criticalWarningsCount} টি

🛑 Beers Criteria ২০২৩ ঝুঁকি ও বিকল্প:
${beersRiskStr}

💡 ডি-প্রেসক্রাইবিং পরামর্শ:
${evaluation.deprescribingAdviceBn}

📋 বর্তমান নিয়মিত ওষুধের তালিকা:
${medListStr}
============================================================
TrackMe Elderly Polypharmacy & Drug Safety Shield`;
}
