/**
 * Types for AI Medical Imaging & Radiology Report Explainer
 */

export type ImagingModality =
  | 'XRAY_CHEST'           // বুকের এক্স-রে (Chest X-Ray)
  | 'XRAY_BONE_JOINT'      // হাড় ও জয়েন্টের এক্স-রে (Knee, Spine, Bone)
  | 'USG_ABDOMEN'          // পেটের আল্ট্রাসনোগ্রাম (Whole Abdomen USG)
  | 'MRI_CT_SPINE_BRAIN'   // এমআরআই ও সিটি স্ক্যান (Spine & Brain MRI/CT)
  | 'ECG_ECHO'             // ইসিজি ও ইকোকার্ডিওগ্রাম (Heart ECG & Echo)
  | 'GENERAL_RADIOLOGY';

export type ImagingSeverity =
  | 'NORMAL'               // 🟢 সম্পূর্ণ স্বাভাবিক (Normal / Clear)
  | 'MILD_EARLY'           // 🟡 মৃদু / প্রাথমিক পর্যায় (Mild / Grade 1)
  | 'MODERATE_NEEDS_CARE'  // 🟠 মাঝারি / চিকিৎসকের পরামর্শ জরুরি (Moderate)
  | 'CRITICAL_URGENT';     // 🔴 জরুরি চিকিৎসা প্রয়োজন (Urgent / Red Alert)

export interface RadiologyFindingDefinition {
  id: string;
  modality: ImagingModality;
  modalityNameBn: string;
  termEn: string;
  termBn: string;
  keywords: string[]; // for regex matching in impression text
  severity: ImagingSeverity;
  severityLabelBn: string;
  badgeBg: string;
  badgeColor: string;
  simpleExplanationBn: string;
  isItDangerousBn: string;
  whatHappensNextBn: string;
  suggestedDoctorQuestionsBn: string[];
  lifestyleDietAdviceBn?: string;
  anatomyRegionBn: string;
}

export interface ImagingReportAnalysis {
  searchedText: string;
  matchedFindings: RadiologyFindingDefinition[];
  overallSeverity: ImagingSeverity;
  overallSeverityLabelBn: string;
  summaryBn: string;
  actionableStepsBn: string[];
  doctorQuestions: string[];
}
