export type RamadanRiskLevel =
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'VERY_HIGH_DO_NOT_FAST';

export type RamadanFoodCategory =
  | 'IFTAR_CORE'
  | 'FRIED_SNACK'
  | 'SWEET_DESSERT'
  | 'BEVERAGE'
  | 'SUHOOR_CARB'
  | 'SUHOOR_PROTEIN'
  | 'VEGETABLE_FIBER';

export interface RamadanFoodItem {
  id: string;
  nameEn: string;
  nameBn: string;
  category: RamadanFoodCategory;
  servingUnitBn: string; // e.g. '১ বাটি', '১টি', '১ গ্লাস'
  defaultQuantity: number;
  caloriesPerUnit: number;
  carbsGrams: number;
  proteinGrams: number;
  fatGrams: number;
  fiberGrams: number;
  giValue: number; // Glycemic Index (0 - 100)
  spikeFactor: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  healthTipBn: string;
  safeLimitBn: string;
}

export interface IftarPlateEvaluation {
  totalCalories: number;
  totalCarbs: number;
  totalFiber: number;
  averageGi: number;
  spikeRisk: 'SAFE' | 'MODERATE_SPIKE' | 'SEVERE_SPIKE_ALERT';
  spikeRiskLabelBn: string;
  spikeColor: string;
  recommendationsBn: string[];
  safeReplacementsBn: string[];
}

export interface SuhoorPlateEvaluation {
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFiber: number;
  hydrationEnduranceHours: number; // e.g. 12-14 hours
  slowEnergyRating: 'EXCELLENT' | 'GOOD' | 'POOR';
  ratingLabelBn: string;
  ratingColor: string;
  thirstRiskBn: string;
  recommendationsBn: string[];
}

export type RamadanDoseShiftTiming =
  | 'AT_IFTAR'
  | 'AT_SUHOOR'
  | 'AFTER_TARAWIH'
  | 'SKIP_CONSULT_DOCTOR';

export interface RamadanMedicationShift {
  medicineId: string;
  medicineName: string;
  originalDailyDoses: string; // e.g. "Morning 1 tab + Night 1 tab"
  recommendedShiftBn: string;
  iftarDoseBn: string;
  suhoorDoseBn: string;
  specialTimingBn: string;
  warningLevel: 'INFO' | 'CAUTION' | 'CRITICAL_DOCTOR_ALERT';
  clinicalPrecautionBn: string;
}

export interface SixPointSugarCheckSlot {
  id: string;
  slotNameEn: string;
  slotNameBn: string;
  timeWindowBn: string; // e.g. "সেহরির ঠিক আগে (ভোর ৪:০০)"
  targetRangeBn: string; // e.g. "৫.০ - ৭.০ mmol/L"
  criticalThresholdMin: number; // e.g. 3.9 mmol/L
  criticalThresholdMax: number; // e.g. 16.7 mmol/L
  whyImportantBn: string;
}
