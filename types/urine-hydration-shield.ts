export type UrineShadeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type UrineCategory =
  | 'OPTIMAL'
  | 'GOOD'
  | 'MILD_DEHYDRATION'
  | 'SEVERE_DEHYDRATION'
  | 'CRITICAL_MEDICAL_ALERT';

export interface UrineColorDef {
  shade: UrineShadeLevel;
  hexColor: string;
  nameBn: string;
  nameEn: string;
  category: UrineCategory;
  categoryLabelBn: string;
  categoryColor: string;
  descriptionBn: string;
  clinicalAdviceBn: string;
  immediateWaterDoseGlasses: number;
}

export interface HydrationGoal {
  weightKg: number;
  isHotWeather: boolean;
  isHighActivity: boolean;
  dailyWaterMl: number;
  dailyGlasses: number;
  hourlyScheduleBn: string[];
}

export interface UtiSymptom {
  id: string;
  nameBn: string;
  descriptionBn: string;
  isSevereRedFlag: boolean;
  isSelected: boolean;
}

export interface UtiRiskEvaluation {
  riskScorePercent: number;
  riskLevelBn: string;
  riskColor: string;
  hasRedFlag: boolean;
  actionGuidanceBn: string;
}

export type StoneDietCategory = 'CITRATE_PROTECTIVE' | 'HIGH_OXALATE_LIMIT' | 'HYDRATION_RULE';

export interface KidneyStoneDietItem {
  id: string;
  category: StoneDietCategory;
  categoryLabelBn: string;
  nameBn: string;
  actionBn: string;
  scientificReasonBn: string;
}
