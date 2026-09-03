export type JaundiceZoneLevel = 1 | 2 | 3 | 4 | 5;

export type JaundiceSeverity = 'MILD_PHYSIOLOGICAL' | 'MODERATE' | 'SIGNIFICANT' | 'CRITICAL_DANGER';

export interface KramerJaundiceZone {
  zoneNumber: JaundiceZoneLevel;
  bodyAreaBn: string;
  bodyAreaEn: string;
  estimatedBilirubinMgDl: string;
  severity: JaundiceSeverity;
  severityLabelBn: string;
  severityColor: string;
  clinicalExplanationBn: string;
  actionAdviceBn: string;
  isEmergencyRedFlag: boolean;
}

export type PostpartumDietCategory =
  | 'GALACTAGOGUE_MILK'
  | 'WOUND_HEALING'
  | 'FLUID_HYDRATION';

export interface PostpartumDietItem {
  id: string;
  category: PostpartumDietCategory;
  categoryLabelBn: string;
  nameBn: string;
  scientificBenefitBn: string;
  howToPrepareBn: string;
}

export interface EpdsOption {
  score: number;
  textBn: string;
}

export interface EpdsQuestion {
  id: string;
  questionBn: string;
  options: EpdsOption[];
}

export interface EpdsEvaluation {
  totalScore: number;
  riskLevelBn: string;
  riskColor: string;
  actionAdviceBn: string;
}

export interface NewbornDailyLog {
  date: string;
  feedingsCount: number;
  wetDiapersCount: number;
  dirtyDiapersCount: number;
  isAdequatelyHydrated: boolean;
  notes?: string;
}
