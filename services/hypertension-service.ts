import {
  AHA_BP_CATEGORIES,
  AhaCategoryDef,
} from '@/services/hypertension-knowledge';
import {
  AhaBpCategory,
  BpMetricsSummary,
  BpReading,
} from '@/types/hypertension-heart-shield';

/**
 * Classify blood pressure according to AHA & ESC 2024 Guidelines
 */
export function classifyBloodPressure(
  systolic: number,
  diastolic: number
): AhaCategoryDef {
  if (systolic > 180 || diastolic > 120) {
    return AHA_BP_CATEGORIES.HYPERTENSIVE_CRISIS;
  }
  if (systolic >= 140 || diastolic >= 90) {
    return AHA_BP_CATEGORIES.STAGE_2;
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return AHA_BP_CATEGORIES.STAGE_1;
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return AHA_BP_CATEGORIES.ELEVATED;
  }
  return AHA_BP_CATEGORIES.NORMAL;
}

/**
 * Compute Blood Pressure Analytics: Average BP, Pulse Pressure, MAP, and Morning Surge
 */
export function calculateBpMetrics(readings: BpReading[]): BpMetricsSummary {
  if (!readings || readings.length === 0) {
    return {
      avgSystolic: 120,
      avgDiastolic: 80,
      avgPulse: 72,
      latestCategory: 'NORMAL',
      latestCategoryLabelBn: '🟢 স্বাভাবিক রক্তচাপ',
      latestCategoryColor: '#10B981',
      morningSurgeDeltaMmHg: 0,
      isMorningSurgeHigh: false,
      pulsePressureMmHg: 40,
      meanArterialPressureMmHg: 93,
      totalReadingsCount: 0,
      clinicalAdviceBn: 'নিয়মিত ব্লাড প্রেসার রেকর্ড করে হার্ট সুরক্ষিত রাখুন।',
    };
  }

  const sumSys = readings.reduce((acc, r) => acc + r.systolicMmHg, 0);
  const sumDia = readings.reduce((acc, r) => acc + r.diastolicMmHg, 0);
  const sumPulse = readings.reduce((acc, r) => acc + r.pulseBpm, 0);

  const avgSys = Math.round(sumSys / readings.length);
  const avgDia = Math.round(sumDia / readings.length);
  const avgPulse = Math.round(sumPulse / readings.length);

  const latest = readings[0];
  const pulsePressure = latest.systolicMmHg - latest.diastolicMmHg;
  const map = Math.round((2 * latest.diastolicMmHg + latest.systolicMmHg) / 3);

  // Calculate Morning Surge
  // Find latest morning reading and latest previous evening reading
  const morningReading = readings.find((r) => r.timeOfDay === 'MORNING_WAKEUP');
  const eveningReading = readings.find((r) => r.timeOfDay === 'EVENING_BEDTIME');

  let morningSurgeDelta = 0;
  let isMorningSurgeHigh = false;

  if (morningReading && eveningReading) {
    morningSurgeDelta = Math.max(0, morningReading.systolicMmHg - eveningReading.systolicMmHg);
    if (morningSurgeDelta >= 35) {
      isMorningSurgeHigh = true;
    }
  }

  const categoryDef = classifyBloodPressure(latest.systolicMmHg, latest.diastolicMmHg);

  return {
    avgSystolic: avgSys,
    avgDiastolic: avgDia,
    avgPulse: avgPulse,
    latestCategory: categoryDef.category,
    latestCategoryLabelBn: categoryDef.labelBn,
    latestCategoryColor: categoryDef.color,
    morningSurgeDeltaMmHg: morningSurgeDelta,
    isMorningSurgeHigh: isMorningSurgeHigh,
    pulsePressureMmHg: pulsePressure,
    meanArterialPressureMmHg: map,
    totalReadingsCount: readings.length,
    clinicalAdviceBn: categoryDef.clinicalAdviceBn,
  };
}

/**
 * Format 1-Tap Doctor BP Log Summary Report for WhatsApp / Cardiologist
 */
export function formatCardiologistBpReport(
  readings: BpReading[],
  metrics: BpMetricsSummary,
  patientName = 'রোগী'
): string {
  const recentLogsText = readings
    .slice(0, 5)
    .map(
      (r, idx) =>
        `${idx + 1}. [${r.date} ${r.timestamp}] (${r.timeOfDayLabelBn}): ${r.systolicMmHg}/${r.diastolicMmHg} mmHg, Pulse ${r.pulseBpm} bpm - ${r.categoryLabelBn.split('(')[0].trim()}`
    )
    .join('\n');

  const morningSurgeText = metrics.morningSurgeDeltaMmHg > 0
    ? `• মর্নিং স্পাইক (Surge Delta): +${metrics.morningSurgeDeltaMmHg} mmHg (${metrics.isMorningSurgeHigh ? '🚨 বিপজ্জনক স্পাইক! স্ট্রোক সতর্কতা' : 'স্বাভাবিক সীমার মধ্যে'})`
    : '• মর্নিং স্পাইক: অপরিমাপিত';

  return `🩸 রক্তচাপ ও কার্ডিওভাস্কুলার স্বাস্থ্য রিপোর্ট (Blood Pressure Log)
============================================================
রোগীর নাম: ${patientName}
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

📊 সামগ্রিক বিশ্লেষণ (Overall Metrics):
• সর্বশেষ রক্তচাপ: ${readings[0] ? `${readings[0].systolicMmHg}/${readings[0].diastolicMmHg} mmHg (Pulse ${readings[0].pulseBpm})` : '-'}
• বর্তমান অবস্থা: ${metrics.latestCategoryLabelBn}
• গড় রক্তচাপ: ${metrics.avgSystolic}/${metrics.avgDiastolic} mmHg (গড় পালস: ${metrics.avgPulse} bpm)
• পালস প্রেশার (Pulse Pressure): ${metrics.pulsePressureMmHg} mmHg (স্বাভাবিক: ৩০-৫০)
• মিন আর্টারিয়াল প্রেশার (MAP): ${metrics.meanArterialPressureMmHg} mmHg (স্বাভাবিক: ৭০-১০০)
${morningSurgeText}

📋 সর্বশেষ ৫টি বিপি রেকর্ড (Recent Readings):
${recentLogsText || 'কোনো রেকর্ড সংরক্ষিত নেই'}

💡 চিকিৎসকের জন্য বিশেষ দ্রষ্টব্য:
${metrics.clinicalAdviceBn}
============================================================
TrackMe Hypertension Shield • হেলথ ভল্ট`;
}
