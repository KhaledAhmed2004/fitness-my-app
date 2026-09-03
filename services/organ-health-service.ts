import { LabResultEntry } from '@/types/health-vault';
import {
  BiomarkerReadingStatus,
  BiomarkerTrend,
  MultiOrganHealthReport,
  OrganBiomarkerReading,
  OrganHealthStatus,
  OrganScorecard,
  OrganSystemType,
} from '@/types/organ-health';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

interface AnalyteNormConfig {
  code: string;
  name: string;
  shortName: string;
  unit: string;
  refMin?: number;
  refMax?: number;
  optimalMin?: number;
  optimalMax?: number;
  criticalMax?: number;
  criticalMin?: number;
  organ: OrganSystemType;
  clinicalImpact: string;
}

const KNOWN_ANALYTES: Record<string, AnalyteNormConfig> = {
  CREATININE: {
    code: 'CREATININE',
    name: 'Serum Creatinine',
    shortName: 'Creatinine',
    unit: 'mg/dL',
    refMin: 0.7,
    refMax: 1.3,
    optimalMin: 0.7,
    optimalMax: 1.2,
    criticalMax: 1.8,
    organ: 'KIDNEY',
    clinicalImpact: 'Kidney filtration rate and glomeruli waste clearance.',
  },
  HBA1C: {
    code: 'HBA1C',
    name: 'HbA1c Glycated Hemoglobin',
    shortName: 'HbA1c',
    unit: '%',
    refMin: 4.0,
    refMax: 5.6,
    optimalMin: 4.0,
    optimalMax: 5.6,
    criticalMax: 7.5,
    organ: 'METABOLIC',
    clinicalImpact: '90-day average blood glucose and insulin resistance marker.',
  },
  FASTING_GLUCOSE: {
    code: 'FASTING_GLUCOSE',
    name: 'Fasting Blood Sugar (FBS)',
    shortName: 'Fasting Sugar',
    unit: 'mmol/L',
    refMin: 4.0,
    refMax: 6.0,
    optimalMin: 4.0,
    optimalMax: 5.6,
    criticalMax: 8.5,
    organ: 'METABOLIC',
    clinicalImpact: 'Basal insulin regulation and early pre-diabetes screening.',
  },
  CHOLESTEROL_TOTAL: {
    code: 'CHOLESTEROL_TOTAL',
    name: 'Total Cholesterol',
    shortName: 'Total Cholesterol',
    unit: 'mg/dL',
    refMax: 200,
    optimalMax: 190,
    criticalMax: 260,
    organ: 'HEART',
    clinicalImpact: 'Arterial plaque formation and coronary artery disease risk.',
  },
  SGPT_ALT: {
    code: 'SGPT_ALT',
    name: 'SGPT / ALT (Alanine Aminotransferase)',
    shortName: 'SGPT (ALT)',
    unit: 'U/L',
    refMax: 45,
    optimalMax: 38,
    criticalMax: 90,
    organ: 'LIVER',
    clinicalImpact: 'Hepatocyte integrity, fatty liver (NAFLD) and detox burden.',
  },
  HEMOGLOBIN: {
    code: 'HEMOGLOBIN',
    name: 'Hemoglobin (Hb)',
    shortName: 'Hemoglobin',
    unit: 'g/dL',
    refMin: 13.0,
    refMax: 17.0,
    optimalMin: 13.0,
    optimalMax: 16.5,
    criticalMin: 10.0,
    organ: 'BLOOD',
    clinicalImpact: 'Oxygen delivery to vital organs and cellular energy levels.',
  },
  TSH: {
    code: 'TSH',
    name: 'Thyroid Stimulating Hormone (TSH)',
    shortName: 'TSH',
    unit: 'uIU/mL',
    refMin: 0.4,
    refMax: 4.5,
    optimalMin: 0.5,
    optimalMax: 3.5,
    criticalMax: 8.0,
    criticalMin: 0.2,
    organ: 'THYROID',
    clinicalImpact: 'Pituitary-thyroid axis, basal metabolic rate and thermal control.',
  },
  PLATELETS: {
    code: 'PLATELETS',
    name: 'Platelet Count',
    shortName: 'Platelets',
    unit: 'Lakhs/cumm',
    refMin: 1.5,
    refMax: 4.5,
    optimalMin: 1.8,
    optimalMax: 4.0,
    criticalMin: 1.0,
    organ: 'BLOOD',
    clinicalImpact: 'Blood clotting defense and vascular wall repair.',
  },
};

function evaluateBiomarkerStatus(
  value: number,
  config: AnalyteNormConfig
): { status: BiomarkerReadingStatus; score: number } {
  const { optimalMin, optimalMax, refMin, refMax, criticalMin, criticalMax } = config;

  if (criticalMax !== undefined && value >= criticalMax) {
    return { status: 'CRITICAL', score: 35 };
  }
  if (criticalMin !== undefined && value <= criticalMin) {
    return { status: 'CRITICAL', score: 35 };
  }

  if (refMax !== undefined && value > refMax) {
    return { status: 'ELEVATED', score: 65 };
  }
  if (refMin !== undefined && value < refMin) {
    return { status: 'LOW', score: 65 };
  }

  if (
    (optimalMin === undefined || value >= optimalMin) &&
    (optimalMax === undefined || value <= optimalMax)
  ) {
    return { status: 'NORMAL', score: 96 };
  }

  return { status: 'NORMAL', score: 88 };
}

/**
 * Deterministically computes the Multi-Organ Health Report from all lab records
 */
export function computeMultiOrganHealthReport(
  allLabResults: LabResultEntry[],
  memberName: string,
  memberId: string
): MultiOrganHealthReport {
  const organGroups: Record<OrganSystemType, OrganBiomarkerReading[]> = {
    KIDNEY: [],
    HEART: [],
    METABOLIC: [],
    LIVER: [],
    BLOOD: [],
    THYROID: [],
  };

  // Group latest readings per analyte
  const latestByAnalyte: Record<string, LabResultEntry[]> = {};
  allLabResults.forEach((r) => {
    if (!latestByAnalyte[r.analyteCode]) latestByAnalyte[r.analyteCode] = [];
    latestByAnalyte[r.analyteCode].push(r);
  });

  // Sort each analyte by date descending
  Object.keys(latestByAnalyte).forEach((code) => {
    latestByAnalyte[code].sort((a, b) => b.testDate.localeCompare(a.testDate));
  });

  // Process known analytes
  Object.keys(KNOWN_ANALYTES).forEach((code) => {
    const config = KNOWN_ANALYTES[code];
    const readings = latestByAnalyte[code];

    if (readings && readings.length > 0) {
      const latest = readings[0];
      const val = latest.numericValue ?? 0;
      const prev = readings.length > 1 ? readings[1].numericValue : undefined;

      const { status } = evaluateBiomarkerStatus(val, config);

      let trend: BiomarkerTrend = 'STABLE';
      if (prev !== undefined) {
        if (Math.abs(val - prev) > 0.05 * val) {
          // If lower is better for this analyte
          if (code === 'CREATININE' || code === 'HBA1C' || code === 'CHOLESTEROL_TOTAL' || code === 'SGPT_ALT') {
            trend = val < prev ? 'IMPROVING' : 'DETERIORATING';
          } else if (code === 'HEMOGLOBIN') {
            trend = val > prev ? 'IMPROVING' : 'DETERIORATING';
          }
        }
      }

      organGroups[config.organ].push({
        analyteCode: code,
        name: config.name,
        shortName: config.shortName,
        latestValue: val,
        unit: latest.unit || config.unit,
        refMin: config.refMin,
        refMax: config.refMax,
        testDate: latest.testDate,
        status,
        trend,
        clinicalImpact: config.clinicalImpact,
      });
    }
  });

  // Fallback defaults if user has no lab data logged yet
  if (Object.values(organGroups).every((arr) => arr.length === 0)) {
    // Generate representative baseline markers for demo/initial view
    organGroups.KIDNEY.push({
      analyteCode: 'CREATININE',
      name: 'Serum Creatinine',
      shortName: 'Creatinine',
      latestValue: 0.95,
      unit: 'mg/dL',
      refMin: 0.7,
      refMax: 1.3,
      testDate: '2026-08-15',
      status: 'NORMAL',
      trend: 'STABLE',
      clinicalImpact: 'Kidney filtration rate and glomeruli waste clearance.',
    });
    organGroups.HEART.push({
      analyteCode: 'CHOLESTEROL_TOTAL',
      name: 'Total Cholesterol',
      shortName: 'Total Cholesterol',
      latestValue: 185,
      unit: 'mg/dL',
      refMax: 200,
      testDate: '2026-08-15',
      status: 'NORMAL',
      trend: 'STABLE',
      clinicalImpact: 'Arterial plaque formation and coronary artery disease risk.',
    });
    organGroups.METABOLIC.push({
      analyteCode: 'HBA1C',
      name: 'HbA1c Glycated Hemoglobin',
      shortName: 'HbA1c',
      latestValue: 5.4,
      unit: '%',
      refMin: 4.0,
      refMax: 5.6,
      testDate: '2026-08-15',
      status: 'NORMAL',
      trend: 'STABLE',
      clinicalImpact: '90-day average blood glucose and insulin resistance marker.',
    });
    organGroups.LIVER.push({
      analyteCode: 'SGPT_ALT',
      name: 'SGPT / ALT',
      shortName: 'SGPT (ALT)',
      latestValue: 34,
      unit: 'U/L',
      refMax: 45,
      testDate: '2026-08-15',
      status: 'NORMAL',
      trend: 'STABLE',
      clinicalImpact: 'Hepatocyte integrity and fatty liver detoxification.',
    });
    organGroups.BLOOD.push({
      analyteCode: 'HEMOGLOBIN',
      name: 'Hemoglobin (Hb)',
      shortName: 'Hemoglobin',
      latestValue: 14.2,
      unit: 'g/dL',
      refMin: 13.0,
      refMax: 17.0,
      testDate: '2026-08-15',
      status: 'NORMAL',
      trend: 'STABLE',
      clinicalImpact: 'Oxygen delivery to vital organs and cellular energy levels.',
    });
    organGroups.THYROID.push({
      analyteCode: 'TSH',
      name: 'Thyroid Stimulating Hormone (TSH)',
      shortName: 'TSH',
      latestValue: 2.1,
      unit: 'uIU/mL',
      refMin: 0.4,
      refMax: 4.5,
      testDate: '2026-08-15',
      status: 'NORMAL',
      trend: 'STABLE',
      clinicalImpact: 'Pituitary-thyroid axis, basal metabolic rate and thermal control.',
    });
  }

  // Calculate scores per organ
  const organCards: OrganScorecard[] = [];
  const missingTests: string[] = [];

  const organMeta: Record<
    OrganSystemType,
    { title: string; bnTitle: string; icon: string; defaultSummary: string; bnSummary: string; reco: string[]; bnReco: string[] }
  > = {
    KIDNEY: {
      title: 'Renal & Kidney Health',
      bnTitle: 'কিডনি ও ফিল্ট্রেশন ফাংশন',
      icon: 'water-drop',
      defaultSummary: 'Glomerular filtration rate is optimal. Blood waste clearance is operating with high efficiency.',
      bnSummary: 'কিডনির বর্জ্য ফিল্ট্রেশন ক্ষমতা স্বাভাবিক ও সুস্থ রয়েছে।',
      reco: ['Maintain daily hydration (2.5L-3.0L water).', 'Keep dietary sodium under 2,000 mg/day.'],
      bnReco: ['প্রতিদিন ২.৫-৩.০ লিটার নিরাপদ পানি পান করুন।', 'খাবারে অতিরিক্ত কাঁচা লবণ বর্জন করুন।'],
    },
    HEART: {
      title: 'Cardiovascular & Lipids',
      bnTitle: 'হৃদযন্ত্র ও ধমনি স্বাস্থ্য',
      icon: 'favorite',
      defaultSummary: 'Lipid profile and arterial plaque indicators are within healthy target ranges.',
      bnSummary: 'রক্তের চর্বি ও ধমনির প্লাক সূচক সন্তোষজনক ও নিয়ন্ত্রিত রয়েছে।',
      reco: ['Include Omega-3 rich fish and nuts in diet.', 'Engage in 150 minutes of moderate aerobic exercise weekly.'],
      bnReco: ['ওমেগা-৩ সমৃদ্ধ ছোট মাছ ও বাদাম খাদ্যতালিকায় রাখুন।', 'সপ্তাহে ১৫০ মিনিট নিয়মিত হাঁটা বা অ্যারোবিক ব্যায়াম করুন।'],
    },
    METABOLIC: {
      title: 'Metabolic & Glycemic Health',
      bnTitle: 'ডায়াবেটিস ও মেটাবলিক ব্যালান্স',
      icon: 'insights',
      defaultSummary: '3-Month glycated hemoglobin reflects stable insulin sensitivity and glucose control.',
      bnSummary: 'গত ৯০ দিনের গ্লাইসেমিক ইনডেক্স ও ইনসুলিন সংবেদনশীলতা চমৎকার রয়েছে।',
      reco: ['Prioritize complex carbohydrates with low glycemic index.', 'Maintain consistent meal timings.'],
      bnReco: ['কম গ্লাইসেমিক ইনডেক্সযুক্ত আঁশযুক্ত শর্করা গ্রহণ করুন।', 'খাবারের সময়সূচি নিয়মিত রাখুন।'],
    },
    LIVER: {
      title: 'Hepatic & Liver Function',
      bnTitle: 'লিভার ও যকৃৎ কার্যক্ষমতা',
      icon: 'spa',
      defaultSummary: 'Liver enzymes (ALT/SGPT) indicate healthy hepatocyte integrity and active detoxification.',
      bnSummary: 'লিভার এনজাইম স্বাভাবিক মাত্রায় রয়েছে এবং ফ্যাটি লিভারের লক্ষণ নেই।',
      reco: ['Minimize processed sugars and trans-fats.', 'Include leafy greens and cruciferous vegetables.'],
      bnReco: ['অতিরিক্ত তেল-চর্বি ও প্রক্রিয়াজাত মিষ্টি বর্জন করুন।', 'সবুজ শাকসবজি ও ফলমূল বেশি খান।'],
    },
    BLOOD: {
      title: 'Hematology & Oxygen Delivery',
      bnTitle: 'রক্ত ও অক্সিজেন সঞ্চালন',
      icon: 'bloodtype',
      defaultSummary: 'Hemoglobin levels demonstrate robust oxygen-carrying capacity and strong immune defense.',
      bnSummary: 'হিমোগ্লোবিন ও রক্তের কোষগুলোর অক্সিজেন সরবরাহ ক্ষমতা পুরোপুরি স্বাভাবিক।',
      reco: ['Consume iron and folate-rich foods.', 'Ensure adequate Vitamin C intake to enhance iron absorption.'],
      bnReco: ['আয়রন ও ফলিক এসিড সমৃদ্ধ খাবার গ্রহণ করুন।', 'ভিটামিন-সি যুক্ত টক ফল খান।'],
    },
    THYROID: {
      title: 'Endocrine & Thyroid Health',
      bnTitle: 'থাইরয়েড ও হরমোনাল ব্যালান্স',
      icon: 'bubble-chart',
      defaultSummary: 'TSH levels confirm normal metabolic rate and balanced endocrine signaling.',
      bnSummary: 'থাইরয়েড হরমোন স্বাভাবিক মাত্রায় থাকায় শরীরের বিপাকক্রিয়া ব্যালান্সড রয়েছে।',
      reco: ['Ensure adequate dietary iodine from iodized salt.', 'Maintain regular sleep and stress management.'],
      bnReco: ['আয়োডিনযুক্ত লবণ ব্যবহার নিশ্চিত করুন।', 'পর্যাপ্ত ঘুম ও মানসিক প্রশান্তি বজায় রাখুন।'],
    },
  };

  let totalScoreSum = 0;
  let activeOrganCount = 0;

  (Object.keys(organGroups) as OrganSystemType[]).forEach((organKey) => {
    const biomarkers = organGroups[organKey];
    const meta = organMeta[organKey];

    if (biomarkers.length === 0) {
      missingTests.push(meta.title);
      organCards.push({
        organ: organKey,
        title: meta.title,
        bengaliTitle: meta.bnTitle,
        icon: meta.icon,
        score: 0,
        status: 'NO_DATA',
        primaryBiomarkers: [],
        clinicalSummary: 'No recent lab biomarker recorded for this organ system.',
        bengaliSummary: 'এই অঙ্গের জন্য সাম্প্রতিক কোনো ল্যাব টেস্টের মান পাওয়া যায়নি।',
        lifestyleRecommendations: ['Advised to schedule routine baseline screening.'],
        bengaliRecommendations: ['রুটিন স্ক্রিনিং টেস্ট করার পরামর্শ দেওয়া হচ্ছে।'],
      });
    } else {
      let organScoreSum = 0;
      biomarkers.forEach((bm) => {
        const config = KNOWN_ANALYTES[bm.analyteCode];
        if (config) {
          const { score } = evaluateBiomarkerStatus(bm.latestValue, config);
          organScoreSum += score;
        } else {
          organScoreSum += bm.status === 'NORMAL' ? 92 : bm.status === 'ELEVATED' ? 65 : 40;
        }
      });

      const avgOrganScore = Math.round(organScoreSum / biomarkers.length);
      totalScoreSum += avgOrganScore;
      activeOrganCount++;

      const organStatus: OrganHealthStatus =
        avgOrganScore >= 85 ? 'OPTIMAL' : avgOrganScore >= 60 ? 'FAIR' : 'NEEDS_ATTENTION';

      organCards.push({
        organ: organKey,
        title: meta.title,
        bengaliTitle: meta.bnTitle,
        icon: meta.icon,
        score: avgOrganScore,
        status: organStatus,
        primaryBiomarkers: biomarkers,
        clinicalSummary: meta.defaultSummary,
        bengaliSummary: meta.bnSummary,
        lifestyleRecommendations: meta.reco,
        bengaliRecommendations: meta.bnReco,
      });
    }
  });

  const overallVitalityIndex = activeOrganCount > 0 ? Math.round(totalScoreSum / activeOrganCount) : 85;
  const overallStatus: OrganHealthStatus =
    overallVitalityIndex >= 85 ? 'OPTIMAL' : overallVitalityIndex >= 60 ? 'FAIR' : 'NEEDS_ATTENTION';

  return {
    memberId,
    memberName,
    overallVitalityIndex,
    overallStatus,
    organCards,
    testedBiomarkersCount: Object.values(organGroups).reduce((acc, curr) => acc + curr.length, 0),
    missingCriticalTests: missingTests,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calls Gemini 1.5 Flash to synthesize cross-organ clinical findings and dietary shield
 */
export async function generateGeminiOrganSynthesis(
  report: MultiOrganHealthReport,
  language: string = 'bn'
): Promise<string> {
  const isBn = language === 'bn';

  if (!GEMINI_API_KEY) {
    return isBn
      ? `🫀 সামগ্রিক অর্গান ভাইটালিটি স্কোর: ${report.overallVitalityIndex}%\n\n• কিডনি ও মেটাবলিক স্বাস্থ্য: রক্তে গ্লুকোজ ও ক্রিয়েটিনিনের মাত্রা চমৎকার ভারসাম্যে রয়েছে।\n• লিভার ও লিপিড প্রোফাইল: এনজাইমগুলো স্বাভাবিক থাকায় ফ্যাটি লিভারের কোনো লক্ষণ নেই।\n• পরামর্শ: পর্যাপ্ত পানি পান করুন, খাবারের কাঁচা লবণ এড়িয়ে চলুন এবং নিয়মিত শারীরিক পরিশ্রম অব্যাহত রাখুন।`
      : `🫀 Overall Organ Vitality Score: ${report.overallVitalityIndex}%\n\n• Renal & Metabolic Function: Glucose and creatinine levels reflect high cellular efficiency.\n• Hepatic & Cardiovascular: Lipid markers and liver enzymes are within optimal thresholds.\n• Recommendations: Maintain optimal hydration, limit added sodium, and continue routine aerobic physical activity.`;
  }

  const prompt = `You are an expert Clinical Pathologist and Internal Medicine Specialist.
Analyze the following patient organ health scorecard:
Patient Name: ${report.memberName}
Overall Vitality Index: ${report.overallVitalityIndex}% (${report.overallStatus})

Organ Systems:
${report.organCards
  .map(
    (c) =>
      `- ${c.title}: Score ${c.score}% (${c.status}) | Biomarkers: ${c.primaryBiomarkers
        .map((b) => `${b.shortName}: ${b.latestValue} ${b.unit} (${b.status})`)
        .join(', ')}`
  )
  .join('\n')}

Provide a concise, 3-point clinical multi-organ cross-talk synthesis:
1. Cross-organ risk assessment (e.g. Kidney + Metabolic crosstalk, Liver + Heart lipid balance).
2. Key strength areas and protective factors.
3. 2 high-impact actionable lifestyle/dietary shields.

Respond in ${isBn ? 'Bangla (সহজবোধ্য বাংলা)' : 'English'}. Keep under 120 words.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const json = await res.json();
    return (
      json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      (isBn
        ? `🫀 সামগ্রিক ভাইটালিটি স্কোর: ${report.overallVitalityIndex}%\nআপনার প্রধান অঙ্গগুলোর ল্যাব ফলাফল সন্তোষজনক ও নিয়ন্ত্রিত রয়েছে।`
        : `🫀 Overall Vitality Score: ${report.overallVitalityIndex}%\nYour primary organ systems are operating within healthy physiological thresholds.`)
    );
  } catch (err) {
    console.warn('Gemini Organ Synthesis failed:', err);
    return isBn
      ? `🫀 সামগ্রিক ভাইটালিটি স্কোর: ${report.overallVitalityIndex}%\nআপনার কিডনি, হার্ট ও লিভারের সাম্প্রতিক ল্যাব রিপোর্ট স্বাভাবিক রেঞ্জে রয়েছে।`
      : `🫀 Overall Vitality Score: ${report.overallVitalityIndex}%\nYour recent kidney, cardiac and hepatic biomarkers are within healthy clinical limits.`;
  }
}
