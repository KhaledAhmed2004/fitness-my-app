export type CognitiveRiskCategory =
  | 'LOW_RISK_NORMAL'
  | 'MODERATE_MCI'
  | 'HIGH_RISK_DEMENTIA';

export interface MiniCogResult {
  recalledWordsCount: number;
  clockDrawingPassed: boolean;
  dementiaRiskScore: number;
  riskCategory: CognitiveRiskCategory;
  riskLabelBn: string;
  riskColor: string;
  clinicalGuidelineBn: string;
}

export interface CognitiveObservationItem {
  id: string;
  category: string;
  titleBn: string;
  descriptionBn: string;
  isHighConcern: boolean;
}

export interface BrainExerciseItem {
  id: string;
  titleBn: string;
  typeBn: string;
  instructionBn: string;
  benefitBn: string;
}

export interface SafeIdCardData {
  elderName: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyPhone: string;
  addressBn: string;
  allergiesMedications: string;
}
