/**
 * Types for Post-Surgery & Discharge Home Recovery
 */

export type SurgeryCategory =
  | 'C_SECTION'          // 👶 সিজারিয়ান সেকশন ও প্রসব পরবর্তী যত্ন
  | 'LAPAROSCOPY_CHOLE'   // 🔬 ল্যাপারোস্কোপিক পিত্তথলি ও পেট সার্জারি
  | 'APPENDECTOMY'        // 🩺 এপেন্ডিসেক্টমি / এপেন্ডিক্স অপারেশন
  | 'HERNIA_REPAIR'       // 🛡️ হার্নিয়া ও মেশ রিপেয়ার সার্জারি
  | 'ORTHOPEDIC_JOINT'    // 🦴 হাড় ভাঙা ও জয়েন্ট রিপ্লেসমেন্ট সার্জারি
  | 'GENERAL_SURGERY';    // 🩹 জেনারেল ও মাইনর সার্জারি

export type StitchType =
  | 'NON_ABSORBABLE_STITCH' // কাটার মতো সাধারণ সুতার সেলাই (Removal required)
  | 'ABSORBABLE_STITCH'     // গলে যাওয়া সুতা (Self-dissolving, no cut needed)
  | 'SURGICAL_STAPLES'      // মেটাল স্ট্যাপলার পিন (Staple removal tool required)
  | 'DERMABOND_GLUE';       // মেডিকেল স্কিন গ্লু / আঠা (No stitches)

export type WoundStatusGrade =
  | 'HEALTHY_HEALING'       // ✅ স্বাভাবিক নিরাময় প্রক্রিয়া
  | 'MILD_REDNESS'          // 🟡 মৃদু লালভাব বা হালকা অস্বস্তি (Close monitor)
  | 'POSSIBLE_INFECTION'    // 🟠 ইনফেকশনের প্রাথমিক লক্ষণ (Contact clinic)
  | 'CRITICAL_RED_FLAG';    // 🚨 জরুরি সার্জিক্যাল রেড-ফ্ল্যাগ (Immediate ER / Surgeon visit)

export interface DailyRecoveryMilestone {
  dayNumber: number; // 1 to 14
  phaseTitleBn: string; // e.g. "প্রাথমিক বিশ্রাম ও ব্যথা নিয়ন্ত্রণ"
  keyFocusBn: string; // e.g. "ব্যান্ডেজ সম্পূর্ণ শুকনো রাখা ও ওষুধ সেবন"
  painExpectationBn: string; // e.g. "মাঝারি থেকে তীব্র ব্যথা স্বাভাবিক, ব্যথানাশকে কমবে"
  dressingAndShowerRuleBn: string; // e.g. "গোসল নিষেধ, স্পঞ্জ বাথ নিন"
  activityLevelBn: string; // e.g. "বিছানায় বিশ্রাম, ঘরে হালকা ২ মিনিট হাঁটা"
  nutritionTipBn: string; // e.g. "প্রোটিন ও ভিটামিন সি সমৃদ্ধ খাবার গ্রহণ"
  isCurrentDay?: boolean;
}

export interface SurgeryRecoveryPlan {
  id: string;
  memberId: string;
  surgeryCategory: SurgeryCategory;
  surgeryName: string;
  surgeryDate: string; // YYYY-MM-DD
  dischargeDate: string; // YYYY-MM-DD
  hospitalName: string;
  surgeonName: string;
  surgeonPhone?: string;
  stitchType: StitchType;
  recommendedStitchDay: number; // e.g. Day 10
  stitchRemovalDate: string; // Calculated YYYY-MM-DD
  isStitchRemoved: boolean;
  notes?: string;
}

export interface WoundSymptomLog {
  hasPusOrDischarge: boolean;
  hasSpreadingRedness: boolean;
  hasFeverOver100_4F: boolean;
  hasWoundGapingOrPopping: boolean;
  hasSevereThrobbingPain: boolean;
  patientTemperatureF?: number;
  painScore: number; // 1 to 10
}

export interface WoundAssessmentResult {
  grade: WoundStatusGrade;
  titleBn: string;
  summaryBn: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionRecommendationsBn: string[];
  requiresEmergencyVisit: boolean;
}
