export type GoutStage =
  | 'OPTIMAL'
  | 'BORDERLINE'
  | 'HYPERURICEMIA'
  | 'SEVERE_GOUT_RISK';

export type GenderType = 'MALE' | 'FEMALE';

export interface UricAcidStageDef {
  stage: GoutStage;
  labelBn: string;
  color: string;
  thresholdMale: string;
  thresholdFemale: string;
  descriptionBn: string;
  clinicalAdviceBn: string;
}

export interface UricAcidReading {
  id: string;
  valueMgDl: number;
  gender: GenderType;
  date: string;
  painScale10: number; // 0 (No pain) to 10 (Worst pain)
  jointLocationBn: string;
  notes?: string;
}

export type PurineRating =
  | 'HIGH_PURINE_AVOID'
  | 'MODERATE_PURINE_LIMIT'
  | 'LOW_PURINE_SAFE';

export interface PurineFoodItem {
  id: string;
  nameBn: string;
  nameEn: string;
  purineMgPer100g: number;
  rating: PurineRating;
  ratingLabelBn: string;
  ratingColor: string;
  categoryBn: string;
  clinicalAdviceBn: string;
}

export interface GoutFirstAidStep {
  stepNumber: number;
  titleBn: string;
  actionBn: string;
  cautionBn: string;
  icon: string;
}
