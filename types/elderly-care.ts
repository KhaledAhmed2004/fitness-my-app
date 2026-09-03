export type SeniorMoodLevel = 'FEELING_GOOD' | 'A_BIT_TIRED' | 'UNWELL';

export interface DailyCheckInStatus {
  isMorningMedTaken: boolean;
  morningTime?: string;
  isNightMedTaken: boolean;
  nightTime?: string;
  moodLevel: SeniorMoodLevel;
  moodLabelBn: string;
  glassesOfWater: number;
  lastCheckedInDate: string;
  notes?: string;
}

export type FallRiskCategory =
  | 'BATHROOM_SAFETY'
  | 'BEDROOM_LIGHTING'
  | 'FLOOR_HAZARDS'
  | 'MEDICATION_EFFECTS';

export interface FallRiskItem {
  id: string;
  category: FallRiskCategory;
  categoryLabelBn: string;
  titleBn: string;
  importanceBn: string;
  isCompleted: boolean;
}

export interface ParentProfile {
  id: string;
  nameBn: string;
  relationBn: string;
  age: number;
  bloodPressureRecent?: string;
  bloodSugarRecent?: string;
  emergencyPhone: string;
  doctorPhone?: string;
}

export interface SeniorSafetyEvaluation {
  safetyScorePercent: number;
  safetyStatusLabelBn: string;
  safetyStatusColor: string;
  isFullyCheckedInToday: boolean;
  recommendationsBn: string[];
}
