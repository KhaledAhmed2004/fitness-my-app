export type FractureRiskLevel = 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK';

export interface OsteoporosisEvaluation {
  riskLevel: FractureRiskLevel;
  riskLabelBn: string;
  riskColor: string;
  tenYearHipRiskPct: number;
  tenYearMajorFracturePct: number;
  clinicalAdviceBn: string;
  dexaScanRecommended: boolean;
}

export interface KneeExerciseItem {
  id: string;
  nameBn: string;
  instructionBn: string;
  precautionsBn: string;
  targetMuscleBn: string;
  repsBn: string;
}

export type CalciumSourceCategory =
  | 'DAIRY'
  | 'SMALL_FISH'
  | 'PLANT_SEEDS'
  | 'SUNLIGHT_D3';

export interface CalciumD3Item {
  id: string;
  nameBn: string;
  calciumMgPerServing?: string;
  sourceCategory: CalciumSourceCategory;
  categoryLabelBn: string;
  benefitBn: string;
}
