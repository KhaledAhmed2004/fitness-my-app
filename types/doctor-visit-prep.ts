export type CareLoopStage =
  | 'PREPARE'
  | 'VISIT'
  | 'PRESCRIPTION'
  | 'DIAGNOSTIC_TESTS'
  | 'MEDICINE_CABINET'
  | 'FOLLOW_UP_SYNC';

export interface ActiveMedicationBriefItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  indication?: string;
}

export interface RecentLabBriefItem {
  analyteCode: string;
  analyteName: string;
  latestValue: number;
  unit: string;
  testDate: string;
}

export interface DoctorVisitBrief {
  memberId: string;
  memberName: string;
  age?: number;
  bloodGroup?: string;
  targetDoctorName?: string;
  targetSpecialty?: string;
  visitDate: string;
  recentVisitsCount: number;
  recentDocumentsCount: number;
  activeMedications: ActiveMedicationBriefItem[];
  recentLabReadings: RecentLabBriefItem[];
  knownAllergies: string[];
  chronicConditions: string[];
  upcomingFollowUps: string[];
  questionsForDoctor: string[];
  generatedAt: string;
}

export interface LabComparisonRow {
  analyteCode: string;
  analyteName: string;
  category: string;
  unit: string;
  valueA?: number;
  valueB?: number;
  diffNumeric?: number;
}

export interface LabDateComparisonTable {
  memberId: string;
  memberName: string;
  dateA: string;
  dateB: string;
  rows: LabComparisonRow[];
  totalComparableMetrics: number;
}
