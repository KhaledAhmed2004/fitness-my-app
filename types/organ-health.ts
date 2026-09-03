export type OrganSystemType =
  | 'KIDNEY'
  | 'HEART'
  | 'METABOLIC'
  | 'LIVER'
  | 'BLOOD'
  | 'THYROID';

export type OrganHealthStatus = 'OPTIMAL' | 'FAIR' | 'NEEDS_ATTENTION' | 'NO_DATA';

export type BiomarkerReadingStatus = 'NORMAL' | 'ELEVATED' | 'LOW' | 'CRITICAL';

export type BiomarkerTrend = 'IMPROVING' | 'STABLE' | 'DETERIORATING';

export interface OrganBiomarkerReading {
  analyteCode: string; // e.g. "CREATININE", "SGPT_ALT", "HBA1C", "CHOLESTEROL_TOTAL", "TSH", "HEMOGLOBIN"
  name: string;
  shortName: string;
  latestValue: number;
  unit: string;
  refMin?: number;
  refMax?: number;
  refText?: string;
  testDate: string;
  status: BiomarkerReadingStatus;
  trend: BiomarkerTrend;
  clinicalImpact: string;
}

export interface OrganScorecard {
  organ: OrganSystemType;
  title: string;
  bengaliTitle: string;
  icon: string;
  score: number; // 0 - 100
  status: OrganHealthStatus;
  primaryBiomarkers: OrganBiomarkerReading[];
  clinicalSummary: string;
  bengaliSummary: string;
  lifestyleRecommendations: string[];
  bengaliRecommendations: string[];
}

export interface MultiOrganHealthReport {
  memberId: string;
  memberName: string;
  overallVitalityIndex: number; // 0 - 100
  overallStatus: OrganHealthStatus;
  organCards: OrganScorecard[];
  aiClinicalSynthesis?: string;
  testedBiomarkersCount: number;
  missingCriticalTests: string[];
  generatedAt: string;
}
