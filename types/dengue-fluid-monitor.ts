export type DenguePhase =
  | 'FEBRILE_DAY_1_3'
  | 'CRITICAL_DAY_4_6'
  | 'RECOVERY_DAY_7_PLUS';

export type DengueSeverityGrade =
  | 'MILD_FEBRILE'
  | 'WARNING_SIGNS_PRESENT'
  | 'SEVERE_DENGUE_SHOCK';

export type FluidItemType =
  | 'ORAL_SALINE_ORS'
  | 'COCONUT_WATER'
  | 'WATER'
  | 'SOUP_JUICE'
  | 'MILK_OTHER';

export interface HourlyFluidEntry {
  id: string;
  timestamp: string; // ISO or HH:mm
  fluidType: FluidItemType;
  amountMl: number;
  note?: string;
}

export type UrineOutputStatus = 'NORMAL' | 'LOW' | 'NONE_IN_6_HOURS';
export type UrineColorStatus = 'CLEAR_PALE' | 'DARK_YELLOW' | 'REDDISH_BROWN';

export interface UrineOutputEntry {
  id: string;
  timestamp: string;
  status: UrineOutputStatus;
  color: UrineColorStatus;
}

export type DengueWarningSymptomKey =
  | 'SEVERE_ABDOMINAL_PAIN'
  | 'PERSISTENT_VOMITING'
  | 'MUCOSAL_BLEEDING'
  | 'LETHARGY_RESTLESSNESS'
  | 'DECREASED_URINE_OUTPUT'
  | 'COLD_CLAMMY_SKIN'
  | 'SUDDEN_DROP_IN_FEVER_WITH_WEAKNESS'
  | 'RAPID_BREATHING_BREATHLESSNESS';

export interface DengueWarningSymptomDef {
  key: DengueWarningSymptomKey;
  titleBn: string;
  descriptionBn: string;
  severity: 'CRITICAL_RED_FLAG';
}

export interface DailyDengueLog {
  dayNumber: number; // 1 to 10
  date: string;
  temperatureF?: number;
  plateletCount?: number; // e.g. 120000 (/uL)
  hematocritPercent?: number; // e.g. 42 (%)
  hourlyFluids: HourlyFluidEntry[];
  urineEntries: UrineOutputEntry[];
  warningSymptomsChecked: DengueWarningSymptomKey[];
}

export type PlateletRiskTier = 'NORMAL' | 'MILD_DROP' | 'MODERATE_RISK' | 'CRITICAL_DANGER';

export interface DengueAssessmentSummary {
  currentPhase: DenguePhase;
  phaseTitleBn: string;
  phaseDescriptionBn: string;
  targetDailyFluidMl: number;
  totalFluidIntakeTodayMl: number;
  fluidProgressPercent: number;
  plateletRisk: PlateletRiskTier;
  plateletDropMessageBn: string;
  isHematocritElevated: boolean;
  hematocritMessageBn: string;
  warningSignsCount: number;
  triageGrade: DengueSeverityGrade;
  triageRecommendationBn: string;
  emergencyActionRequired: boolean;
}
