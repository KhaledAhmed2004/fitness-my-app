export type PedigreeRelation =
  | 'PATERNAL_GRANDFATHER'
  | 'PATERNAL_GRANDMOTHER'
  | 'MATERNAL_GRANDFATHER'
  | 'MATERNAL_GRANDMOTHER'
  | 'FATHER'
  | 'MOTHER'
  | 'SELF'
  | 'SIBLING'
  | 'CHILD';

export type HereditaryDiseaseType =
  | 'TYPE_2_DIABETES'
  | 'HYPERTENSION'
  | 'CORONARY_CAD'
  | 'THYROID_DISORDER'
  | 'DYSLIPIDEMIA_CHOLESTEROL'
  | 'COLORECTAL_RISK'
  | 'GLAUCOMA'
  | 'OSTEOPOROSIS';

export type HereditaryRiskLevel = 'HIGH' | 'MODERATE' | 'AVERAGE' | 'LOW';

export type MilestonePriority = 'CRITICAL' | 'RECOMMENDED' | 'ROUTINE';

export interface AncestorConditionEntry {
  id: string;
  disease: HereditaryDiseaseType;
  diagnosedAge?: number; // e.g. 42 (Early onset) vs 65
  notes?: string;
}

export interface FamilyAncestorRecord {
  id: string;
  relation: PedigreeRelation;
  name: string;
  isLiving: boolean;
  gender: 'MALE' | 'FEMALE';
  currentAgeOrAgeAtDecease?: number;
  conditions: AncestorConditionEntry[];
  avatarIcon?: string;
}

export interface PreventiveScreeningMilestone {
  id: string;
  disease: HereditaryDiseaseType;
  targetAge: number; // e.g. 20, 25, 30, 35, 40
  testName: string; // e.g. "Fasting Blood Sugar + HbA1c", "Lipid Profile & ECG"
  frequency: string; // e.g. "Annual (Every 12 months)", "Every 6 months"
  priority: MilestonePriority;
  clinicalObjective: string;
  isScheduled?: boolean;
}

export interface HereditaryRiskScoreResult {
  disease: HereditaryDiseaseType;
  diseaseName: string;
  icon: string;
  riskScore: number; // 0 - 100%
  riskLevel: HereditaryRiskLevel;
  contributingAncestors: {
    name: string;
    relation: string;
    diagnosedAge?: number;
    isFirstDegree: boolean;
  }[];
  earlyOnsetDetected: boolean;
  bilateralTransmission: boolean; // Both maternal and paternal sides affected
  clinicalRationale: string;
  lifestyleShield: string[];
  preventiveScreeningMilestones: PreventiveScreeningMilestone[];
}

export interface FamilyHereditaryReport {
  generatedAt: string;
  targetChildName: string;
  totalAncestorsRecorded: number;
  overallFamilyHereditaryIndex: number; // 0 - 100
  riskAssessments: HereditaryRiskScoreResult[];
  upcomingMilestonesSortedByAge: PreventiveScreeningMilestone[];
  aiGenomicSynthesis?: string;
}
