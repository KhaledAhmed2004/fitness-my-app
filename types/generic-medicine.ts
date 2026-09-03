export type DosageForm =
  | 'TABLET'
  | 'CAPSULE'
  | 'SYRUP'
  | 'SUSPENSION'
  | 'INJECTION'
  | 'EYE_DROP'
  | 'NASAL_SPRAY'
  | 'OINTMENT'
  | 'POWDER_SACHET';

export type TherapeuticCategory =
  | 'ALL'
  | 'ANALGESIC_FEVER' // Paracetamol, NSAIDs
  | 'GASTRIC_PPI' // Omeprazole, Esomeprazole, Pantoprazole
  | 'RESPIRATORY_ALLERGY' // Montelukast, Fexofenadine, Bilastine
  | 'ANTIBIOTIC' // Azithromycin, Cefixime, Amoxicillin+Clav
  | 'DIABETES' // Metformin, Sitagliptin, Empagliflozin
  | 'CARDIOVASCULAR_BP' // Losartan, Telmisartan, Amlodipine, Statins
  | 'NEUROLOGY_MUSCLE' // Tolperisone, Pregabalin, Clonazepam
  | 'VITAMINS_SUPPLEMENT'; // Calcium+D3, Vitamin C, Iron+Folic

export interface MedicineBrandItem {
  id: string;
  brandName: string; // e.g. "Napa Extra", "Fast Plus", "Renova Extra"
  genericName: string; // e.g. "Paracetamol + Caffeine"
  genericId: string; // e.g. "gen_paracetamol_caffeine"
  manufacturer: string; // e.g. "Beximco Pharmaceuticals Ltd."
  shortCompany: string; // e.g. "Beximco", "Square", "Incepta"
  strength: string; // e.g. "500 mg + 65 mg", "20 mg"
  dosageForm: DosageForm; // e.g. 'TABLET'
  unitPriceBdt: number; // e.g. 2.50
  stripSize: number; // e.g. 10 or 14
  stripPriceBdt: number; // e.g. 25.00
  indicationsEn: string;
  indicationsBn: string; // e.g. "তীব্র জ্বর, মাথাব্যথা ও শরীর ব্যথা"
  adultDose: string; // e.g. "১-২টি ট্যাবলেট দিনে সর্বোচ্চ ৪ বার"
  safetyWarningsBn?: string; // e.g. "দৈনিক ৪,০০০ মিগ্রা-র বেশি প্যারাসিটামল গ্রহণ লিভারের ক্ষতি করতে পারে"
  isOtc: boolean; // OTC vs Prescription Only
  companyTier: 'TOP_TIER' | 'STANDARD';
}

export interface GenericMoleculeGroup {
  id: string;
  genericName: string; // e.g. "Esomeprazole Magnesium Trihydrate"
  bengaliGenericName: string; // e.g. "ইসোমিপ্রাজল ম্যাগনেসিয়াম ট্রাইহাইড্রেট"
  therapeuticClass: TherapeuticCategory;
  classLabelBn: string; // e.g. "গ্যাস্ট্রিক ও আলসার প্রতিরোধী (PPI)"
  standardStrengths: string[]; // ["20 mg", "40 mg"]
  overviewBn: string;
  brands: MedicineBrandItem[];
}

export interface AlternativeComparisonResult {
  searchedBrand?: MedicineBrandItem;
  molecule: GenericMoleculeGroup;
  matchingStrength: string;
  alternatives: MedicineBrandItem[];
  cheapestAlternative: MedicineBrandItem;
  priceSavingsPercentage: number;
}
