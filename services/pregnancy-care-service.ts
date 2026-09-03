import { PREGNANCY_WEEKS_DATA } from '@/services/pregnancy-care-knowledge';
import {
  GdmBpScreening,
  KickSession,
  KickSessionStatus,
  PregnancyTrimester,
  WeekMilestoneInfo,
} from '@/types/pregnancy-care';

export function calculateTrimester(week: number): PregnancyTrimester {
  if (week <= 12) return 'FIRST_TRIMESTER';
  if (week <= 27) return 'SECOND_TRIMESTER';
  return 'THIRD_TRIMESTER';
}

export function getWeekMilestone(week: number): WeekMilestoneInfo {
  const found = PREGNANCY_WEEKS_DATA.find((w) => w.weekNumber === week);
  if (found) return found;

  // Closest fallback
  const sorted = [...PREGNANCY_WEEKS_DATA].sort(
    (a, b) => Math.abs(a.weekNumber - week) - Math.abs(b.weekNumber - week)
  );
  return sorted[0];
}

/**
 * Evaluate Cardiff Count-to-10 Kick Session
 */
export function evaluateKickSession(
  kickCount: number,
  durationMinutes: number
): {
  status: KickSessionStatus;
  labelBn: string;
  adviceBn: string;
} {
  if (kickCount >= 10) {
    if (durationMinutes <= 60) {
      return {
        status: 'HEALTHY_ACTIVE',
        labelBn: '🟢 শিশু অত্যন্ত চঞ্চল ও সুস্থ (Active Fetus)',
        adviceBn:
          'বাচ্চা ১ ঘণ্টার মধ্যেই ১০টি কিক সম্পন্ন করেছে। এটি একটি চমৎকার ও সুস্থ লক্ষণ।',
      };
    } else if (durationMinutes <= 120) {
      return {
        status: 'PROLONGED',
        labelBn: '🟡 স্বাভাবিক কিন্তু ধীর নড়াচড়া (Moderate Activity)',
        adviceBn:
          '২ ঘণ্টার মধ্যে ১০টি কিক হয়েছে। মা পর্যাপ্ত তরল ও পুষ্টিকর খাবার খেয়ে বাম কাত হয়ে বিশ্রাম নিন।',
      };
    } else {
      return {
        status: 'LOW_MOVEMENT_WARNING',
        labelBn: '⚠️ সময় বেশি লেগেছে (Delayed 10 Kicks)',
        adviceBn:
          '১০টি কিক দিতে ২ ঘণ্টার বেশি লেগেছে। একটু মিষ্টি শরবত বা দুধ খেয়ে পুনরায় ট্র্যাকিং করুন।',
      };
    }
  } else {
    // Under 10 kicks
    if (durationMinutes >= 120) {
      return {
        status: 'LOW_MOVEMENT_WARNING',
        labelBn: '🚨 কম নড়াচড়া সতর্কতা (Reduced Fetal Movement)',
        adviceBn:
          'টানা ২ ঘণ্টা বাম কাত হয়ে শুয়ে থাকার পরও ১০টি কিক পাওয়া যায়নি। অবিলম্বে চিকিৎসকের সাথে যোগাযোগ করে বাচ্চার হার্টবিট (NST / USG) পরীক্ষা করুন।',
      };
    }
    return {
      status: 'PROLONGED',
      labelBn: 'গণনা চলছে...',
      adviceBn: '১০টি কিক না হওয়া পর্যন্ত গণনা চালিয়ে যান।',
    };
  }
}

/**
 * Evaluate Gestational Diabetes (GDM) and Pre-Eclampsia
 */
export function evaluateGdmAndBp(
  fastingSugar?: number,
  twoHourSugar?: number,
  systolic?: number,
  diastolic?: number
): GdmBpScreening {
  let isGdmAlert = false;
  let gdmMessageBn = 'সুগারের মান স্বাভাবিক।';

  if (fastingSugar !== undefined || twoHourSugar !== undefined) {
    if ((fastingSugar && fastingSugar >= 92) || (twoHourSugar && twoHourSugar >= 140)) {
      isGdmAlert = true;
      gdmMessageBn = `⚠️ গর্ভকালীন ডায়াবেটিস (GDM) সংকেত: Fasting ${fastingSugar || '-'} mg/dL, 2h ${twoHourSugar || '-'} mg/dL (স্বাভাবিক সীমার বেশি)।`;
    }
  }

  let isPreEclampsiaAlert = false;
  let bpMessageBn = 'রক্তচাপ স্বাভাবিক।';

  if (systolic !== undefined && diastolic !== undefined) {
    if (systolic >= 140 || diastolic >= 90) {
      isPreEclampsiaAlert = true;
      bpMessageBn = `🚨 প্রিক্ল্যাম্পসিয়া সতর্কতা: ব্লাড প্রেসার ${systolic}/${diastolic} mmHg (উচ্চ ঝুঁকিপূর্ণ!)।`;
    } else if (systolic >= 130 || diastolic >= 85) {
      bpMessageBn = `ব্লাড প্রেসার ${systolic}/${diastolic} mmHg (বর্ডারলাইন - লবণ পরিহার করুন)।`;
    }
  }

  let riskGradeBn = 'গর্ভকালীন ভাইটালস স্বাভাবিক ও নিরাপদ।';
  if (isPreEclampsiaAlert || isGdmAlert) {
    riskGradeBn = '🚨 সতর্কতা: ডাক্তারের পরামর্শ অনুযায়ী ডায়েট ও চিকিৎসা নিয়ন্ত্রণ আবশ্যক!';
  }

  return {
    fastingSugarMgDl: fastingSugar,
    twoHourSugarMgDl: twoHourSugar,
    systolicBp: systolic,
    diastolicBp: diastolic,
    isGdmAlert,
    gdmMessageBn,
    isPreEclampsiaAlert,
    bpMessageBn,
    riskGradeBn,
  };
}

/**
 * Format complete Doctor Pregnancy & Kick Summary for WhatsApp
 */
export function formatPregnancyDoctorReport(
  weekNumber: number,
  milestone: WeekMilestoneInfo,
  lastKickSession: KickSession | null,
  gdmBp: GdmBpScreening,
  patientName = 'মম'
): string {
  const kickText = lastKickSession
    ? `• সর্বশেষ কিক সেশন: ${lastKickSession.kickCount}টি কিক (${lastKickSession.durationMinutes} মিনিটে) - ${lastKickSession.statusLabelBn}`
    : '• কিক সেশন এখনো রেকর্ড করা হয়নি';

  return `🤰 গর্ভকালীন স্বাস্থ্য ও বাচ্চার কিক সামারি রিপোর্ট (Maternal Care Log)
============================================================
রোগীর নাম: ${patientName}
বর্তমান গর্ভকালীন সপ্তাহ: সপ্তাহ #${weekNumber} (${milestone.trimester === 'FIRST_TRIMESTER' ? '১ম ট্রাইমেস্টার' : milestone.trimester === 'SECOND_TRIMESTER' ? '২য় ট্রাইমেস্টার' : '৩য় ট্রাইমেস্টার'})
বাচ্চার আনুমানিক ওজন: ~${milestone.babyWeightGrams} গ্রাম (সাইজ: ${milestone.babyFruitSizeBn})
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

🦶 বাচ্চার নড়াচড়া (Fetal Kick Count):
${kickText}

🩸 মেটারনাল ভাইটালস ও সুগার স্ক্রিনিং:
• ব্লাড প্রেসার: ${gdmBp.systolicBp && gdmBp.diastolicBp ? `${gdmBp.systolicBp}/${gdmBp.diastolicBp} mmHg` : 'পরিমাপ হয়নি'} (${gdmBp.bpMessageBn})
• রক্তের সুগার: Fasting ${gdmBp.fastingSugarMgDl || '-'} mg/dL, 2HABF ${gdmBp.twoHourSugarMgDl || '-'} mg/dL (${gdmBp.gdmMessageBn})

💡 চিকিৎসকের পরামর্শের জন্য অবস্থা:
${gdmBp.riskGradeBn}
============================================================
TrackMe Maternal Guardian • হেলথ ভল্ট`;
}
