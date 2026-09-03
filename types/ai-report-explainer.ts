/**
 * Types for AI Medical Report Explainer in Simple Bangla
 */

export type LabPanelType =
  | 'CBC'               // Complete Blood Count (রক্তকণিকা ও রক্তস্বল্পতা)
  | 'DIABETES'          // Blood Glucose & HbA1c (রক্তের সুগার প্যানেল)
  | 'LIPID'             // Lipid Profile & Cholesterol (কোলেস্টেরল ও ট্রাইগ্লিসারাইড)
  | 'KIDNEY_RFT'        // Renal Function / Creatinine (কিডনি ফাংশন ও ক্রিয়েটিনিন)
  | 'LIVER_LFT'         // Liver Enzymes / SGPT / Bilirubin (লিভার ফাংশন ও জন্ডিস)
  | 'THYROID'           // Thyroid Hormones / TSH (থাইরয়েড প্যানেল)
  | 'ELECTROLYTES_VIT'  // Electrolytes, Potassium, Vit D (ইলেক্ট্রোলাইটস ও ভিটামিন)
  | 'CUSTOM';

export type TrafficLightSeverity =
  | 'NORMAL'           // 🟢 স্বাভাবিক (Optimal / Normal)
  | 'MILD_BORDERLINE'  // 🟡 সামান্য অনিয়ম (Borderline / Mild Risk)
  | 'HIGH_ALERT'       // 🔴 উচ্চ ঝুঁকি / অতিরিক্ত (High / Low Alert)
  | 'CRITICAL';        // 🚨 তাৎক্ষণিক চিকিৎসা জরুরি (Critical)

export interface AnalyteKnowledgeDefinition {
  code: string;
  nameEn: string;
  nameBn: string;
  category: LabPanelType;
  standardUnit: string;
  normalMin: number;
  normalMax: number;
  lowAlertThreshold?: number;
  highAlertThreshold?: number;
  simpleMeaningBn: string;
  ifLowMeaningBn: string;
  ifHighMeaningBn: string;
  dietAdviceIfAbnormalBn: string;
  suggestedDoctorQuestionBn: string;
}

export interface AnalyteExplanationItem {
  id: string;
  analyteCode: string;
  analyteName: string;
  analyteNameBn: string;
  numericValue: number;
  unit: string;
  referenceRangeText: string;
  severity: TrafficLightSeverity;
  statusLabelBn: string;
  statusBadgeColor: string;
  simpleMeaningBn: string;
  clinicalImpactBn: string;
  dietAdviceBn?: string;
  suggestedDoctorQuestionBn?: string;
}

export interface ReportAnalysisResult {
  overallHealthScore: number; // 0 - 100
  overallStatusBn: string;
  executiveSummaryBn: string;
  totalAnalytesCount: number;
  normalCount: number;
  mildCount: number;
  highAlertCount: number;
  items: AnalyteExplanationItem[];
  lifestyleDietAdviceBn: string[];
  doctorQuestionsBn: string[];
}
