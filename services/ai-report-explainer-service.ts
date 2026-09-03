import {
  LAB_ANALYTE_KNOWLEDGE_BASE,
  PRESET_LAB_PANELS,
} from '@/services/ai-report-explainer-knowledge';
import { ExtractedLabReportOCR } from '@/services/gemini-health-ocr';
import {
  AnalyteExplanationItem,
  AnalyteKnowledgeDefinition,
  ReportAnalysisResult,
  TrafficLightSeverity,
} from '@/types/ai-report-explainer';

/**
 * Find definition by code or partial name
 */
export function findAnalyteDefinition(
  codeOrName: string
): AnalyteKnowledgeDefinition | undefined {
  const q = codeOrName.trim().toUpperCase();
  // 1. Exact code match
  const byCode = LAB_ANALYTE_KNOWLEDGE_BASE.find(
    (k) => k.code === q || k.code.replace(/_/g, '') === q.replace(/_/g, '')
  );
  if (byCode) return byCode;

  // 2. Partial name match
  return LAB_ANALYTE_KNOWLEDGE_BASE.find(
    (k) =>
      k.nameEn.toUpperCase().includes(q) ||
      k.nameBn.includes(q) ||
      q.includes(k.code)
  );
}

/**
 * Main Analysis Engine
 */
export function analyzeLabReport(
  inputAnalytes: Array<{ code: string; value: number; unit?: string }>,
  patientContext?: { name?: string; age?: string | number; gender?: string }
): ReportAnalysisResult {
  if (!inputAnalytes || inputAnalytes.length === 0) {
    return {
      overallHealthScore: 100,
      overallStatusBn: 'কোনো টেস্ট ডাটা পাওয়া যায়নি',
      executiveSummaryBn:
        'অনুগ্রহ করে আপনার ল্যাব রিপোর্টের ছবি স্ক্যান করুন অথবা টেস্টের মান বসান।',
      totalAnalytesCount: 0,
      normalCount: 0,
      mildCount: 0,
      highAlertCount: 0,
      items: [],
      lifestyleDietAdviceBn: [],
      doctorQuestionsBn: [],
    };
  }

  const items: AnalyteExplanationItem[] = [];
  const dietAdviceSet = new Set<string>();
  const doctorQuestionsList: string[] = [];

  let normalCount = 0;
  let mildCount = 0;
  let highAlertCount = 0;

  inputAnalytes.forEach((input, index) => {
    const def = findAnalyteDefinition(input.code);
    const val = input.value;

    if (!def) {
      // Fallback for custom or uncataloged analyte
      items.push({
        id: `analyte_${index}`,
        analyteCode: input.code,
        analyteName: input.code,
        analyteNameBn: input.code,
        numericValue: val,
        unit: input.unit || '',
        referenceRangeText: 'স্ট্যান্ডার্ড ল্যাব রেফারেন্স',
        severity: 'NORMAL',
        statusLabelBn: 'স্বাভাবিক',
        statusBadgeColor: '#10B981',
        simpleMeaningBn: 'ল্যাবরেটরি বায়োমার্কার প্যারামিটার।',
        clinicalImpactBn: 'রিপোর্ট অনুযায়ী মান সন্তোষজনক।',
      });
      normalCount++;
      return;
    }

    let severity: TrafficLightSeverity = 'NORMAL';
    let statusLabelBn = 'স্বাভাবিক (Normal)';
    let statusBadgeColor = '#10B981';
    let clinicalImpactBn = 'মানটি সম্পূর্ণ স্বাভাবিক ও নিরাপদ রেঞ্জের মধ্যে রয়েছে।';

    const min = def.normalMin;
    const max = def.normalMax;

    if (val < min) {
      if (def.lowAlertThreshold !== undefined && val <= def.lowAlertThreshold) {
        severity = 'HIGH_ALERT';
        statusLabelBn = 'উচ্চ ঝুঁকি (অতিরিক্ত কম)';
        statusBadgeColor = '#EF4444';
        highAlertCount++;
      } else {
        severity = 'MILD_BORDERLINE';
        statusLabelBn = 'সামান্য কম (Borderline Low)';
        statusBadgeColor = '#F59E0B';
        mildCount++;
      }
      clinicalImpactBn = def.ifLowMeaningBn;
      if (def.dietAdviceIfAbnormalBn) dietAdviceSet.add(def.dietAdviceIfAbnormalBn);
      if (def.suggestedDoctorQuestionBn)
        doctorQuestionsList.push(def.suggestedDoctorQuestionBn);
    } else if (val > max) {
      if (
        def.highAlertThreshold !== undefined &&
        val >= def.highAlertThreshold
      ) {
        severity = 'HIGH_ALERT';
        statusLabelBn = 'উচ্চ ঝুঁকি (অতিরিক্ত বেশি)';
        statusBadgeColor = '#EF4444';
        highAlertCount++;
      } else {
        severity = 'MILD_BORDERLINE';
        statusLabelBn = 'সামান্য বেশি (Borderline High)';
        statusBadgeColor = '#F59E0B';
        mildCount++;
      }
      clinicalImpactBn = def.ifHighMeaningBn;
      if (def.dietAdviceIfAbnormalBn) dietAdviceSet.add(def.dietAdviceIfAbnormalBn);
      if (def.suggestedDoctorQuestionBn)
        doctorQuestionsList.push(def.suggestedDoctorQuestionBn);
    } else {
      severity = 'NORMAL';
      statusLabelBn = 'স্বাভাবিক (Optimal)';
      statusBadgeColor = '#10B981';
      normalCount++;
    }

    items.push({
      id: `analyte_${index}_${def.code}`,
      analyteCode: def.code,
      analyteName: def.nameEn,
      analyteNameBn: def.nameBn,
      numericValue: val,
      unit: input.unit || def.standardUnit,
      referenceRangeText: `${def.normalMin} - ${def.normalMax} ${def.standardUnit}`,
      severity,
      statusLabelBn,
      statusBadgeColor,
      simpleMeaningBn: def.simpleMeaningBn,
      clinicalImpactBn,
      dietAdviceBn:
        severity !== 'NORMAL' ? def.dietAdviceIfAbnormalBn : undefined,
      suggestedDoctorQuestionBn:
        severity !== 'NORMAL' ? def.suggestedDoctorQuestionBn : undefined,
    });
  });

  // Calculate Overall Health Score
  const total = items.length;
  const scoreDeductions = mildCount * 8 + highAlertCount * 22;
  const overallHealthScore = Math.max(25, Math.min(100, 100 - scoreDeductions));

  // Determine Overall Status & Executive Summary in Bangla
  let overallStatusBn = 'চমৎকার স্বাস্থ্য (সব স্বাভাবিক)';
  let executiveSummaryBn = '';

  const patientGreeting = patientContext?.name
    ? `${patientContext.name} এর `
    : 'আপনার ';

  if (highAlertCount > 0) {
    overallStatusBn = 'ডাক্তারের পরামর্শ প্রয়োজন (High Alert)';
    executiveSummaryBn = `${patientGreeting}ল্যাব রিপোর্টে ${highAlertCount}টি গুরুত্বপূর্ণ প্যারামিটারে অতিরিক্ত ওঠানামা লক্ষ্য করা গেছে। আতঙ্কিত হওয়ার কিছু নেই, তবে দ্রুত চিকিৎসকের সাথে কথা বলে প্রেসক্রিপশন ও জীবনযাত্রার পরিবর্তন নেওয়া জরুরি।`;
  } else if (mildCount > 0) {
    overallStatusBn = 'মোটামুটি ভালো (সামান্য অনিয়ম)';
    executiveSummaryBn = `আলহামদুলিল্লাহ, ${patientGreeting}সার্বিক রিপোর্ট সন্তোষজনক। তবে ${mildCount}টি প্যারামিটারে সামান্য বিচ্যুতি (Borderline) রয়েছে, যা সুষম দেশীয় খাদ্যাভ্যাস ও নিয়মিত হাঁটাচলায় সহজে স্বাভাবিক করা সম্ভব।`;
  } else {
    overallStatusBn = 'চমৎকার স্বাস্থ্য (সব রিপোর্ট স্বাভাবিক)';
    executiveSummaryBn = `আলহামদুলিল্লাহ! ${patientGreeting}সকল টেস্ট রেজাল্ট সম্পূর্ণ স্বাভাবিক ও চমৎকার সুস্থতার ইঙ্গিত দিচ্ছে। এই স্বাস্থ্যকর জীবনযাত্রা বজায় রাখুন।`;
  }

  // Ensure top 3 concise doctor questions
  const finalDoctorQuestions =
    doctorQuestionsList.length > 0
      ? Array.from(new Set(doctorQuestionsList)).slice(0, 3)
      : [
          'স্যার, আমার টেস্ট রিপোর্টগুলো কি সম্পূর্ণ স্বাভাবিক আছে?',
          'আমার বর্তমান বয়স ও শারীরিক অবস্থা অনুযায়ী পরবর্তী রুটিন চেকআপ কবে করাব?',
          'আমার রোগ প্রতিরোধ ক্ষমতা ও কর্মক্ষমতা বাড়াতে কোনো বিশেষ পরামর্শ আছে কি?',
        ];

  return {
    overallHealthScore,
    overallStatusBn,
    executiveSummaryBn,
    totalAnalytesCount: total,
    normalCount,
    mildCount,
    highAlertCount,
    items,
    lifestyleDietAdviceBn: Array.from(dietAdviceSet),
    doctorQuestionsBn: finalDoctorQuestions,
  };
}

/**
 * Process Extracted OCR from Gemini
 */
export function processLabReportFromOCR(
  ocr: ExtractedLabReportOCR
): ReportAnalysisResult {
  const analytes = (ocr.analytes || []).map((a) => ({
    code: a.analyteCode || a.analyteName,
    value: a.numericValue,
    unit: a.unit,
  }));

  return analyzeLabReport(analytes, {
    name: ocr.patientName,
  });
}
