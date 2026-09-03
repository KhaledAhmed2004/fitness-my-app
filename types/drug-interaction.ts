export type InteractionSeverity = 'CRITICAL' | 'MODERATE' | 'MINOR' | 'SAFE';

export type InteractionType = 'DRUG_DRUG' | 'DRUG_FOOD' | 'DRUG_CONDITION';

export type ScientificEvidenceLevel = 'ESTABLISHED' | 'PROBABLE' | 'THEORETICAL';

export interface DrugInteractionResult {
  id: string;
  type: InteractionType;
  drug1: string; // e.g. "Warfarin" or "Aspirin 75mg"
  drug2?: string; // e.g. "Ibuprofen"
  foodOrBeverage?: string; // e.g. "Grapefruit Juice", "Milk & Dairy", "Alcohol"
  conditionName?: string; // e.g. "Asthma", "Peptic Ulcer", "Pregnancy"
  severity: InteractionSeverity;
  headline: string; // Short summary
  mechanism: string; // Pharmacokinetic or pharmacodynamic mechanism
  clinicalConsequence: string; // Risks and patient symptoms
  actionableAdvice: string; // What the patient/caregiver should do
  scientificEvidenceLevel: ScientificEvidenceLevel;
  tags?: string[];
}

export interface FoodInteractionItem {
  id: string;
  foodName: string; // e.g. "Grapefruit & Citrus Juice", "Milk, Cheese & Dairy", "Alcoholic Beverages", "Coffee & High Caffeine", "Spinach & Vitamin K Greens", "High Potassium Foods (Bananas, Oranges)"
  icon: string;
  category: 'CITRUS' | 'DAIRY' | 'ALCOHOL' | 'CAFFEINE' | 'VITAMIN_K' | 'POTASSIUM' | 'TYRAMINE' | 'OTHER';
  description: string;
  interactingDrugClasses: string[]; // Generic drug classes or names
  commonBrands: string[]; // Bangladeshi / Global brand names
  mechanismAndRisk: string;
  patientGuideline: string;
}

export interface CabinetSafetyAuditResult {
  totalDrugsAnalyzed: number;
  overallSafetyScore: number; // 0 - 100
  criticalPairings: DrugInteractionResult[];
  moderatePairings: DrugInteractionResult[];
  foodWarnings: DrugInteractionResult[];
  safeCombinations: { drug1: string; drug2: string }[];
  scannedAt: string;
}
