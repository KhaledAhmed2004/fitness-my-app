export type PolypharmacyLevel =
  | 'NORMAL_LOAD'
  | 'POLYPHARMACY'
  | 'HYPER_POLYPHARMACY';

export type BeersCriteriaCategory =
  | 'AVOID_IN_ELDERLY'
  | 'DOSE_ADJUST_RENAL'
  | 'HIGH_FALL_RISK'
  | 'DUPLICATE_OVERLAP';

export interface BeersCriteriaItem {
  id: string;
  drugClassEn: string;
  drugClassBn: string;
  genericExamplesBn: string[];
  category: BeersCriteriaCategory;
  adverseRiskBn: string;
  saferAlternativeBn: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface PolypharmacyEvaluationResult {
  totalPillCount: number;
  polypharmacyLevel: PolypharmacyLevel;
  levelLabelBn: string;
  levelColor: string;
  criticalWarningsCount: number;
  identifiedRisks: BeersCriteriaItem[];
  deprescribingAdviceBn: string;
}

export interface RenalSafeDoseGuideline {
  id: string;
  drugNameBn: string;
  eGfrThresholdBn: string;
  riskBn: string;
  safeAdjustmentBn: string;
}
