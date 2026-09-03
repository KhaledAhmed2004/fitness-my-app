import {
  DEMOGRAPHIC_THRESHOLDS,
  DemographicThreshold,
} from '@/services/anemia-knowledge';
import {
  DemographicGroup,
  HemoglobinEvaluation,
} from '@/types/anemia-hemoglobin-shield';

/**
 * Classify Hemoglobin value based on WHO criteria by demographic group
 */
export function evaluateHemoglobin(
  hbValue: number,
  group: DemographicGroup
): HemoglobinEvaluation {
  const threshold: DemographicThreshold =
    DEMOGRAPHIC_THRESHOLDS.find((t) => t.group === group) ||
    DEMOGRAPHIC_THRESHOLDS[0];

  const val = Number(hbValue.toFixed(1));

  if (val >= threshold.normalMin) {
    return {
      hbValue: val,
      group,
      groupLabelBn: threshold.labelBn,
      severity: 'NORMAL',
      severityLabelBn: '🟢 স্বাভাবিক হিমোগ্লোবিন (Optimal Hb)',
      severityColor: '#10B981',
      normalRangeBn: threshold.normalRangeTextBn,
      clinicalAdviceBn:
        'চমৎকার! আপনার হিমোগ্লোবিনের মাত্রা স্বাভাবিক ও স্বাস্থ্যকর। বর্তমান পুষ্টিকর খাদ্যাভ্যাস বজায় রাখুন।',
      isEmergencyTransfusionCandidate: false,
    };
  }

  if (val >= threshold.mildMin) {
    return {
      hbValue: val,
      group,
      groupLabelBn: threshold.labelBn,
      severity: 'MILD_ANEMIA',
      severityLabelBn: '🟡 মৃদু রক্তস্বল্পতা (Mild Anemia)',
      severityColor: '#F59E0B',
      normalRangeBn: threshold.normalRangeTextBn,
      clinicalAdviceBn:
        'হিমোগ্লোবিন কিছুটা কম। খাদ্যতালিকায় নিয়মিত কচুশাক, কলিজা, ছোট মাছ ও লেবু রাখুন। প্রয়োজনে ডাক্তারের পরামর্শে আয়রন সাপ্লিমেন্ট শুরু করুন।',
      isEmergencyTransfusionCandidate: false,
    };
  }

  if (val >= threshold.moderateMin) {
    return {
      hbValue: val,
      group,
      groupLabelBn: threshold.labelBn,
      severity: 'MODERATE_ANEMIA',
      severityLabelBn: '🟠 মাঝারি রক্তস্বল্পতা (Moderate Anemia)',
      severityColor: '#F97316',
      normalRangeBn: threshold.normalRangeTextBn,
      clinicalAdviceBn:
        'গুরুত্বপূর্ণ রক্তস্বল্পতা। ক্লান্তি ও শ্বাসকষ্ট হতে পারে। অবিলম্বে মেডিসিন বা হেমাটোলজি বিশেষজ্ঞের পরামর্শ নিয়ে পূর্ণাঙ্গ CBC ও Serum Ferritin টেস্ট করান।',
      isEmergencyTransfusionCandidate: false,
    };
  }

  return {
    hbValue: val,
    group,
    groupLabelBn: threshold.labelBn,
    severity: 'SEVERE_ANEMIA',
    severityLabelBn: '🚨 তীব্র রক্তস্বল্পতা (Severe Anemia - Danger)',
    severityColor: '#EF4444',
    normalRangeBn: threshold.normalRangeTextBn,
    clinicalAdviceBn:
      'চরম বিপজ্জনক মাত্রা! হৃৎপিণ্ডে অতিরিক্ত চাপ ও হার্ট ফেইলিউরের ঝুঁকি তৈরি হতে পারে। জরুরি ভিত্তিতে হাসপাতালে গিয়ে রক্ত পরিসঞ্চালন (Blood Transfusion) বা আইভি আয়রনের জন্য ডাক্তারের শরণাপন্ন হোন।',
    isEmergencyTransfusionCandidate: true,
  };
}

/**
 * Format complete Doctor Summary for Hematologist / Physician over WhatsApp
 */
export function formatHematologistAnemiaSummary(
  evalResult: HemoglobinEvaluation,
  activeSymptoms: string[]
): string {
  const symptomsStr =
    activeSymptoms.length > 0
      ? activeSymptoms.map((s) => `• ${s}`).join('\n')
      : '• কোনো তীব্র শারীরিক উপসর্গ নেই';

  return `🩸 TrackMe Anemia & Hemoglobin Health Summary
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

👤 গ্রুপ: ${evalResult.groupLabelBn}
🩸 সিরাম হিমোগ্লোবিন: ${evalResult.hbValue} g/dL
📊 ফলাফল: ${evalResult.severityLabelBn}
🎯 স্বাভাবিক রেঞ্জ: ${evalResult.normalRangeBn}

⚡ দৃশ্যমান শারীরিক উপসর্গ:
${symptomsStr}

💡 ক্লিনিক্যাল পরামর্শ:
${evalResult.clinicalAdviceBn}
${evalResult.isEmergencyTransfusionCandidate ? '\n🚨 সতর্কতা: ইমার্জেন্সি ব্লাড ট্রান্সফিউশন / স্পেশালিস্ট ভর্তি প্রয়োজন!' : ''}
============================================================
TrackMe Anemia & Iron-Deficiency Hemoglobin Shield`;
}
