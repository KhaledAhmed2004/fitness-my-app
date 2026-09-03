export type DemographicGroup =
  | 'MALE'
  | 'FEMALE_NON_PREGNANT'
  | 'PREGNANT_WOMAN'
  | 'CHILD';

export type AnemiaSeverity =
  | 'NORMAL'
  | 'MILD_ANEMIA'
  | 'MODERATE_ANEMIA'
  | 'SEVERE_ANEMIA';

export interface HemoglobinEvaluation {
  hbValue: number;
  group: DemographicGroup;
  groupLabelBn: string;
  severity: AnemiaSeverity;
  severityLabelBn: string;
  severityColor: string;
  normalRangeBn: string;
  clinicalAdviceBn: string;
  isEmergencyTransfusionCandidate: boolean;
}

export type IronFoodCategory =
  | 'HEME_ANIMAL'
  | 'NON_HEME_PLANT'
  | 'ABSORPTION_BOOSTER'
  | 'ABSORPTION_BLOCKER';

export interface IronFoodItem {
  id: string;
  nameBn: string;
  nameEn: string;
  ironMgPer100g?: string;
  category: IronFoodCategory;
  categoryLabelBn: string;
  synergyTipBn: string;
}

export interface AnemiaSymptom {
  id: string;
  nameBn: string;
  descriptionBn: string;
  isSevereRedFlag: boolean;
}
