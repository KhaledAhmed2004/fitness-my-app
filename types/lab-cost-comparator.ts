/**
 * Types for Lab Test Cost & Diagnostic Center Comparator
 */

export type DiagnosticCenterId =
  | 'POPULAR'
  | 'IBN_SINA'
  | 'LABAID'
  | 'PRAAVA'
  | 'MEDINOVA'
  | 'THYROCARE'
  | 'SQUARE'
  | 'BIRDEM'
  | 'BSMMU_GOVT';

export type DiagnosticTier =
  | 'PREMIUM_CORPORATE'
  | 'HIGH_ACCURACY_STANDARD'
  | 'AFFORDABLE_MASS'
  | 'SPECIALIZED_ENDOCRINE'
  | 'GOVT_SUBSIDIZED';

export interface DiagnosticCenterInfo {
  id: DiagnosticCenterId;
  nameEn: string;
  nameBn: string;
  shortName: string;
  tier: DiagnosticTier;
  branchCountBn: string; // e.g. "৩০+ ব্রাঞ্চ (ঢাকা ও সারা দেশ)"
  homeSampleAvailable: boolean;
  homeSampleFeeBn: string; // e.g. "৳ ২০০ (ফ্রি ৫০০০+ টেস্টে)"
  hotline: string;
  website?: string;
  discountNoteBn: string; // e.g. "সন্ধ্যায় বা কার্ডে ১০-১৫% ছাড়"
  rating: number; // e.g. 4.8
  color: string;
}

export type LabTestCategory =
  | 'ALL'
  | 'BLOOD_ROUTINE'     // সিবিসি, ইএসআর, ব্লাড গ্রুপিং
  | 'DIABETES_GLUCOSE'   // HbA1c, ফাস্টিং সুগার, ওজিটিটি
  | 'KIDNEY_LIVER'       // ক্রিয়েটিনিন, এসজিপিটি, ইউরিয়া, বিলিরুবিন
  | 'HEART_LIPID'        // লিপিড প্রোফাইল, ট্রপোনিন, ইসিজি
  | 'THYROID_HORMONE'    // TSH, FT4, ভিটামিন ডি, ভিটামিন বি১২
  | 'IMAGING_ULTRASOUND' // আল্ট্রাসনোগ্রাম, এক্স-রে, সিটি স্ক্যান
  | 'URINE_STOOL';       // ইউরিন আর/ই, কালচার, স্টুল ওবিটি

export type SpecimenType = 'BLOOD' | 'URINE' | 'STOOL' | 'IMAGING' | 'SWAB';

export interface LabTestPriceItem {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string;
  shortDescriptionBn: string;
  category: LabTestCategory;
  specimenType: SpecimenType;
  fastingHours: number; // 0, 8, 10, 12
  preparationRuleBn: string;
  prices: Record<DiagnosticCenterId, number>; // Price in BDT
  averagePrice: number;
}

export interface CenterTotalEstimate {
  center: DiagnosticCenterInfo;
  totalCost: number;
  savingsVsHighest: number;
  isCheapest: boolean;
  isHighest: boolean;
}

export interface BasketComparisonResult {
  selectedTests: LabTestPriceItem[];
  centerTotals: CenterTotalEstimate[];
  cheapestCenter: DiagnosticCenterInfo;
  highestCenter: DiagnosticCenterInfo;
  maxSavingsAmount: number;
  averageTotal: number;
}
