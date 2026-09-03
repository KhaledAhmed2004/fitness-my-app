import { RADIOLOGY_FINDINGS_KNOWLEDGE_BASE } from '@/services/ai-imaging-knowledge';
import {
  ImagingModality,
  ImagingReportAnalysis,
  ImagingSeverity,
  RadiologyFindingDefinition,
} from '@/types/ai-imaging-explainer';

export function searchRadiologyFindings(
  query: string,
  modality?: ImagingModality
): RadiologyFindingDefinition[] {
  let list = RADIOLOGY_FINDINGS_KNOWLEDGE_BASE;
  if (modality && modality !== 'GENERAL_RADIOLOGY') {
    list = list.filter((f) => f.modality === modality);
  }

  if (!query.trim()) return list;

  const lowerQuery = query.toLowerCase().trim();
  return list.filter((f) => {
    const matchEn = f.termEn.toLowerCase().includes(lowerQuery);
    const matchBn = f.termBn.toLowerCase().includes(lowerQuery);
    const matchKeyword = f.keywords.some((k) => lowerQuery.includes(k) || k.includes(lowerQuery));
    const matchRegion = f.anatomyRegionBn.toLowerCase().includes(lowerQuery);
    return matchEn || matchBn || matchKeyword || matchRegion;
  });
}

export function analyzeRadiologyImpression(
  rawText: string,
  modality?: ImagingModality
): ImagingReportAnalysis {
  const lowerText = rawText.toLowerCase();
  const matchedFindings: RadiologyFindingDefinition[] = [];

  RADIOLOGY_FINDINGS_KNOWLEDGE_BASE.forEach((finding) => {
    if (modality && modality !== 'GENERAL_RADIOLOGY' && finding.modality !== modality) {
      return;
    }

    const matches = finding.keywords.some((kw) => lowerText.includes(kw));
    if (matches && !matchedFindings.some((m) => m.id === finding.id)) {
      matchedFindings.push(finding);
    }
  });

  // Determine overall severity
  let overallSeverity: ImagingSeverity = 'NORMAL';
  let overallSeverityLabelBn = '🟢 স্বাভাবিক ইমেজিং ফাইন্ডিংস';

  if (matchedFindings.some((m) => m.severity === 'CRITICAL_URGENT')) {
    overallSeverity = 'CRITICAL_URGENT';
    overallSeverityLabelBn = '🔴 জরুরি চিকিৎসা ও বিশেষজ্ঞ মূল্যায়ন প্রয়োজন';
  } else if (matchedFindings.some((m) => m.severity === 'MODERATE_NEEDS_CARE')) {
    overallSeverity = 'MODERATE_NEEDS_CARE';
    overallSeverityLabelBn = '🟠 চিকিৎসকের পরামর্শ ও সুনির্দিষ্ট থেরাপি প্রয়োজন';
  } else if (matchedFindings.some((m) => m.severity === 'MILD_EARLY')) {
    overallSeverity = 'MILD_EARLY';
    overallSeverityLabelBn = '🟡 প্রাথমিক পর্যায় - সচেতনতা ও জীবনযাত্রায় নিরাময়যোগ্য';
  }

  const allQuestions = Array.from(
    new Set(matchedFindings.flatMap((m) => m.suggestedDoctorQuestionsBn))
  ).slice(0, 4);

  const actionableSteps: string[] = [];
  matchedFindings.forEach((m) => {
    if (m.whatHappensNextBn) actionableSteps.push(m.whatHappensNextBn);
    if (m.lifestyleDietAdviceBn) actionableSteps.push(m.lifestyleDietAdviceBn);
  });

  let summaryBn = '';
  if (matchedFindings.length === 0) {
    summaryBn =
      'আপনার রিপোর্টে উল্লেখিত পরিভাষাটির জন্য সাধারণ পর্যবেক্ষণ প্রয়োজন। মূল সমস্যাটি স্পষ্টভাবে নিশ্চিত হতে অনুগ্রহ করে আপনার চিকিৎসকের শরণাপন্ন হন।';
  } else if (matchedFindings.length === 1) {
    summaryBn = matchedFindings[0].simpleExplanationBn;
  } else {
    summaryBn = `আপনার রিপোর্টে ${matchedFindings.length}টি মূল পরিবর্তন পরিলক্ষিত হয়েছে: ${matchedFindings
      .map((m) => m.termBn)
      .join(', ')}। সামগ্রিকভাবে এটি সুচিকিৎসা ও সঠিক জীবনযাত্রায় নিরাময়যোগ্য।`;
  }

  return {
    searchedText: rawText,
    matchedFindings,
    overallSeverity,
    overallSeverityLabelBn,
    summaryBn,
    actionableStepsBn: Array.from(new Set(actionableSteps)).slice(0, 3),
    doctorQuestions: allQuestions.length > 0 ? allQuestions : [
      'স্যার, এই রেডিওলজি রিপোর্টের আলোকে আমার পরবর্তী চিকিৎসা বা কোনো রিপিট টেস্ট দরকার আছে কি?',
      'এই সমস্যার জন্য আমাকে প্রাত্যহিক খাবারে বা চলাফেরায় কী কী সতর্কতা মানতে হবে?',
    ],
  };
}
