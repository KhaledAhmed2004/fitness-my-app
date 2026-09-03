export type AhaBpCategory =
  | 'NORMAL'
  | 'ELEVATED'
  | 'STAGE_1'
  | 'STAGE_2'
  | 'HYPERTENSIVE_CRISIS';

export type BpTimeOfDay =
  | 'MORNING_WAKEUP'
  | 'AFTERNOON'
  | 'EVENING_BEDTIME'
  | 'POST_MEDICATION';

export interface BpReading {
  id: string;
  date: string;
  timestamp: string;
  timeOfDay: BpTimeOfDay;
  timeOfDayLabelBn: string;
  systolicMmHg: number;
  diastolicMmHg: number;
  pulseBpm: number;
  category: AhaBpCategory;
  categoryLabelBn: string;
  categoryColor: string;
  pulsePressureMmHg: number;
  meanArterialPressureMmHg: number;
  isMorningSurge?: boolean;
  notes?: string;
}

export interface BpMetricsSummary {
  avgSystolic: number;
  avgDiastolic: number;
  avgPulse: number;
  latestCategory: AhaBpCategory;
  latestCategoryLabelBn: string;
  latestCategoryColor: string;
  morningSurgeDeltaMmHg: number;
  isMorningSurgeHigh: boolean;
  pulsePressureMmHg: number;
  meanArterialPressureMmHg: number;
  totalReadingsCount: number;
  clinicalAdviceBn: string;
}

export type DashFoodCategory =
  | 'POTASSIUM_RICH'
  | 'MAGNESIUM_RICH'
  | 'GARLIC_ALLICIN'
  | 'HIGH_SODIUM_AVOID';

export interface DashFoodItem {
  id: string;
  nameBn: string;
  nameEn: string;
  category: DashFoodCategory;
  categoryLabelBn: string;
  isRecommended: boolean;
  benefitsBn: string;
  servingAdviceBn: string;
}

export type StrokeFastStepKey = 'FACE' | 'ARM' | 'SPEECH' | 'TIME';

export interface StrokeFastStepDef {
  key: StrokeFastStepKey;
  stepLetter: string;
  titleBn: string;
  testInstructionBn: string;
  warningSignBn: string;
  iconName: string;
}
