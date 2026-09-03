export type EyeTested = 'LEFT_EYE' | 'RIGHT_EYE' | 'BOTH';

export interface AmslerGridResult {
  eye: EyeTested;
  linesDistorted: boolean;
  darkSpotsVisible: boolean;
  isAbnormal: boolean;
  clinicalInterpretationBn: string;
  severityColor: string;
}

export type VisionConditionTarget =
  | 'DIABETIC_RETINOPATHY'
  | 'GLAUCOMA'
  | 'CATARACT'
  | 'DRY_EYE';

export interface VisionSymptomItem {
  id: string;
  nameBn: string;
  descriptionBn: string;
  conditionTarget: VisionConditionTarget;
  isEmergencyRedFlag: boolean;
}

export interface EyeNutrientItem {
  id: string;
  nameBn: string;
  nutrientBn: string;
  benefitBn: string;
  sourceFoodBn: string;
}

export interface FundoscopyStatus {
  monthsSinceLastExam: number;
  isOverdue: boolean;
  statusLabelBn: string;
  statusColor: string;
  adviceBn: string;
}
