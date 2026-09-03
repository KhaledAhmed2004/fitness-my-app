import {
  AsthmaControlSummary,
  CityAqiInfo,
  InhalerPuffLog,
  PeakFlowMeasurement,
  PeakFlowZone,
} from '@/types/aqi-asthma-shield';

/**
 * Calculate Peak Flow Zone and Traffic-Light Status
 */
export function calculatePeakFlowZone(
  measuredLpm: number,
  personalBestLpm: number = 500
): PeakFlowMeasurement {
  const safeBest = personalBestLpm > 0 ? personalBestLpm : 500;
  const percent = Math.min(100, Math.round((measuredLpm / safeBest) * 100));

  let zone: PeakFlowZone = 'GREEN_SAFE';
  let zoneLabelBn = '🟢 সবুজ জোন (নিরাপদ - ৮০-১০০%)';
  let zoneColor = '#10B981';
  let clinicalActionBn =
    'ফুসফুসের ক্ষমতা স্বাভাবিক। আপনার নিয়মিত প্রেসক্রাইব করা প্রিভেন্টার ইনহেলার ও নিয়মমাফিক ওষুধ চালিয়ে যান।';

  if (percent < 50) {
    zone = 'RED_DANGER';
    zoneLabelBn = '🔴 লাল জোন (বিপদজনক - ৫০% এর নিচে)';
    zoneColor = '#EF4444';
    clinicalActionBn =
      '🚨 তীব্র অ্যাজমা অ্যাটাক! তৎক্ষণাৎ ৪ পাফ রিলিভার ইনহেলার নিন এবং বিলম্ব না করে হাসপাতালে বা চিকিৎসকের জরুরি বিভাগে যান।';
  } else if (percent < 80) {
    zone = 'YELLOW_CAUTION';
    zoneLabelBn = '🟡 হলুদ জোন (সতর্কতা - ৫০-৭৯%)';
    zoneColor = '#F59E0B';
    clinicalActionBn =
      '⚠️ শ্বাসনালী সংকুচিত হচ্ছে। চিকিৎসকের পরামর্শ অনুযায়ী রিলিভার ইনহেলার এবং প্রিভেন্টারের অতিরিক্ত ডোজ নিন। ধুলোবালি এড়িয়ে চলুন।';
  }

  return {
    measuredLpm,
    personalBestLpm: safeBest,
    percentOfPersonalBest: percent,
    zone,
    zoneLabelBn,
    zoneColor,
    clinicalActionBn,
  };
}

/**
 * Evaluate Daily Asthma Control & AQI Risk Summary
 */
export function evaluateDailyAsthmaControl(
  city: CityAqiInfo,
  puffLogs: InhalerPuffLog[],
  peakFlow?: PeakFlowMeasurement
): AsthmaControlSummary {
  const todayRelieverPuffs = puffLogs
    .filter((l) => l.type === 'RELIEVER_SOS')
    .reduce((sum, l) => sum + l.puffsCount, 0);

  const todayPreventerPuffs = puffLogs
    .filter((l) => l.type === 'CONTROLLER_PREVENTER' || l.type === 'COMBINATION_MAINTENANCE')
    .reduce((sum, l) => sum + l.puffsCount, 0);

  const isRelieverOverused = todayRelieverPuffs >= 4; // GINA guideline: >3-4 puffs/day signals uncontrolled asthma
  const isPeakFlowRed = peakFlow && peakFlow.zone === 'RED_DANGER';

  const emergencyAlert = isPeakFlowRed || (todayRelieverPuffs >= 6 && city.currentAqi >= 200);

  let asthmaControlStatusBn = 'অ্যাজমা নিয়ন্ত্রণে রয়েছে।';
  if (emergencyAlert) {
    asthmaControlStatusBn =
      '🚨 তীব্র শ্বাসকষ্ট ও অ্যাজমা অ্যাটাক সতর্কতা! অবিলম্বে চিকিৎসকের সাথে যোগাযোগ করুন।';
  } else if (isRelieverOverused) {
    asthmaControlStatusBn =
      '⚠️ আজ ৪ পাফের বেশি রিলিভার ইনহেলার ব্যবহার হয়েছে। অ্যাজমা অনিয়ন্ত্রিত হয়ে পড়ছে, প্রিভেন্টার বাড়াতে হতে পারে।';
  } else if (peakFlow && peakFlow.zone === 'YELLOW_CAUTION') {
    asthmaControlStatusBn =
      'হলুদ জোনে অবস্থান করছেন। বাড়তি সতর্কতা নিন ও মাস্ক পরিধান করুন।';
  }

  return {
    selectedCity: city,
    todayRelieverPuffs,
    todayPreventerPuffs,
    isRelieverOverused,
    peakFlowStatus: peakFlow,
    asthmaControlStatusBn,
    emergencyAlert,
  };
}

/**
 * Format complete Doctor Asthma & AQI Report for WhatsApp
 */
export function formatAsthmaSummaryReport(
  summary: AsthmaControlSummary,
  puffLogs: InhalerPuffLog[],
  patientName = 'Patient'
): string {
  const puffLines =
    puffLogs.length > 0
      ? puffLogs
          .map(
            (p) =>
              `• ${p.timestamp} - ${p.inhalerName} (${p.puffsCount} পাফ) [কারণ: ${p.triggerReason}]`
          )
          .join('\n')
      : '• আজ কোনো ইনহেলার পাফ নেওয়া হয়নি';

  return `🫁 অ্যাজমা কন্ট্রোল ও বায়ু দূষণ রিপোর্ট (Asthma & AQI Care Log)
============================================================
রোগীর নাম: ${patientName}
তারিখ: ${new Date().toLocaleDateString('bn-BD')}
অবস্থান: ${summary.selectedCity.cityNameBn} (AQI: ${summary.selectedCity.currentAqi} - ${summary.selectedCity.categoryLabelBn})

💨 আজকের ইনহেলার ব্যবহারের হিসাব:
• রিলিভার (জরুরি সালবুটামল): ${summary.todayRelieverPuffs} পাফ ${summary.isRelieverOverused ? '⚠️ [অতিরিক্ত ব্যবহার]' : '✅ [স্বাভাবিক]'}
• প্রিভেন্টার (নিয়মিত স্টেরয়েড): ${summary.todayPreventerPuffs} পাফ
• ইনহেলার হিস্ট্রি:
${puffLines}

📊 পিক ফ্লো মিটার (PEFR):
${summary.peakFlowStatus ? `• পরিমাপকৃত: ${summary.peakFlowStatus.measuredLpm} L/min / বেস্ট ${summary.peakFlowStatus.personalBestLpm} L/min (${summary.peakFlowStatus.percentOfPersonalBest}% - ${summary.peakFlowStatus.zoneLabelBn})` : '• পিক ফ্লো মাপা হয়নি'}

💡 বর্তমান পরামর্শ ও অবস্থা:
${summary.asthmaControlStatusBn}
============================================================
TrackMe Live AQI & Asthma Shield • হেলথ ভল্ট`;
}
