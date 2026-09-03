export type HearingLossSeverity =
  | 'NORMAL'
  | 'MILD_LOSS'
  | 'MODERATE_LOSS'
  | 'SEVERE_LOSS';

export interface HearingScreenerResult {
  scoreOutOf10: number;
  severity: HearingLossSeverity;
  severityLabelBn: string;
  severityColor: string;
  adviceBn: string;
  audiometryRecommended: boolean;
}

export type TremorType = 'REST_TREMOR' | 'ACTION_TREMOR' | 'MIXED_TREMOR';

export type TremorGrade = 0 | 1 | 2 | 3;

export interface TremorEvaluationResult {
  grade: TremorGrade;
  gradeLabelBn: string;
  tremorType: TremorType;
  parkinsonRiskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  severityColor: string;
  adviceBn: string;
}

export interface ParkinsonSymptomItem {
  id: string;
  nameBn: string;
  descriptionBn: string;
  isCoreMotorSign: boolean;
}

export interface AdaptiveAidItem {
  id: string;
  nameBn: string;
  category: 'TREMOR_AID' | 'HEARING_AID';
  benefitBn: string;
  tipBn: string;
}
