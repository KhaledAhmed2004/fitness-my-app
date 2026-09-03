export type PregnancyTrimester =
  | 'FIRST_TRIMESTER'
  | 'SECOND_TRIMESTER'
  | 'THIRD_TRIMESTER';

export interface WeekMilestoneInfo {
  weekNumber: number; // 1 to 40
  trimester: PregnancyTrimester;
  babyFruitSizeBn: string;
  babyFruitSizeEn: string;
  babyWeightGrams: number;
  babyLengthCm: number;
  babyHighlightsBn: string;
  momChangesBn: string;
  dietAdviceBn: string;
  recommendedTestsBn: string;
}

export type KickSessionStatus = 'HEALTHY_ACTIVE' | 'PROLONGED' | 'LOW_MOVEMENT_WARNING';

export interface KickSession {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  kickCount: number; // target 10
  isCompleted: boolean;
  status: KickSessionStatus;
  statusLabelBn: string;
}

export interface GdmBpScreening {
  fastingSugarMgDl?: number;
  twoHourSugarMgDl?: number;
  systolicBp?: number;
  diastolicBp?: number;
  isGdmAlert: boolean;
  gdmMessageBn: string;
  isPreEclampsiaAlert: boolean;
  bpMessageBn: string;
  riskGradeBn: string;
}

export type HospitalBagCategory = 'MOM_ESSENTIALS' | 'BABY_ESSENTIALS' | 'MEDICAL_DOCS';

export interface HospitalBagItem {
  id: string;
  category: HospitalBagCategory;
  titleBn: string;
  isChecked: boolean;
}

export type PregnancyEmergencySignKey =
  | 'HEAVY_VAGINAL_BLEEDING'
  | 'SEVERE_HEADACHE_BLURRED_VISION'
  | 'SUDDEN_FLUID_LEAKAGE'
  | 'SEVERE_ABDOMINAL_PAIN'
  | 'NO_KICKS_IN_12_HOURS'
  | 'HIGH_FEVER_CHILLS';

export interface PregnancyEmergencySignDef {
  key: PregnancyEmergencySignKey;
  titleBn: string;
  descriptionBn: string;
}
