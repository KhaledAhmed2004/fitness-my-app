import {
  CabinetSafetyAuditResult,
  DrugInteractionResult,
  FoodInteractionItem,
  InteractionSeverity,
} from '@/types/drug-interaction';

// ==========================================
// 1. BRAND TO GENERIC DRUG MAPPINGS
// ==========================================

const BRAND_ALIASES: Record<string, string> = {
  // Paracetamol
  napa: 'paracetamol',
  'napa extra': 'paracetamol',
  fast: 'paracetamol',
  ace: 'paracetamol',
  'ace plus': 'paracetamol',
  pyralgin: 'paracetamol',
  tylenol: 'paracetamol',
  panadol: 'paracetamol',

  // NSAIDs
  torax: 'ketorolac',
  ketorolac: 'ketorolac',
  rolac: 'ketorolac',
  naprosyn: 'naproxen',
  xenapro: 'naproxen',
  naproxen: 'naproxen',
  brufen: 'ibuprofen',
  ibuprofen: 'ibuprofen',
  voltalin: 'diclofenac',
  clofranil: 'diclofenac',
  diclofenac: 'diclofenac',

  // Antiplatelet & Anticoagulants
  ecosprin: 'aspirin',
  aspirin: 'aspirin',
  cardiprin: 'aspirin',
  disprin: 'aspirin',
  plagrin: 'clopidogrel',
  anclog: 'clopidogrel',
  clopidogrel: 'clopidogrel',
  clopilet: 'clopidogrel',
  warfarin: 'warfarin',
  coumadin: 'warfarin',
  marevan: 'warfarin',
  xarelto: 'rivaroxaban',
  eliquis: 'apixaban',

  // PPIs & Antacids
  seclo: 'omeprazole',
  losectil: 'omeprazole',
  omeprazole: 'omeprazole',
  sergel: 'esomeprazole',
  maxpro: 'esomeprazole',
  esomeprazole: 'esomeprazole',
  nexum: 'esomeprazole',
  pantonix: 'pantoprazole',
  pantobex: 'pantoprazole',
  pantoprazole: 'pantoprazole',
  finix: 'rabeprazole',
  rabeprazole: 'rabeprazole',
  antacid: 'antacid',
  'antacid plus': 'antacid',
  entacyd: 'antacid',
  marlox: 'antacid',
  gelusil: 'antacid',

  // Statins (Cholesterol)
  lipicon: 'rosuvastatin',
  rosuva: 'rosuvastatin',
  rosuvastatin: 'rosuvastatin',
  atova: 'atorvastatin',
  atorvastatin: 'atorvastatin',
  lipitor: 'atorvastatin',
  torvan: 'atorvastatin',
  simvastatin: 'simvastatin',
  zocor: 'simvastatin',

  // Blood Pressure & Cardiac
  olmetec: 'olmesartan',
  olmesartan: 'olmesartan',
  angilock: 'losartan',
  losartan: 'losartan',
  camlosart: 'amlodipine+olmesartan',
  camlodin: 'amlodipine',
  amlodipine: 'amlodipine',
  norvasc: 'amlodipine',
  ramipril: 'ramipril',
  cardace: 'ramipril',
  enalapril: 'enalapril',
  renitec: 'enalapril',
  indever: 'propranolol',
  propranolol: 'propranolol',
  atenolol: 'atenolol',
  betaloc: 'metoprolol',
  metoprolol: 'metoprolol',
  spironolactone: 'spironolactone',
  aldactone: 'spironolactone',
  nitroglycerin: 'nitroglycerin',
  nitrocard: 'nitroglycerin',
  nitromint: 'nitroglycerin',
  isordil: 'isosorbide dinitrate',

  // Antibiotics & Antimicrobials
  ciprocin: 'ciprofloxacin',
  ciprofloxacin: 'ciprofloxacin',
  neofloxin: 'ciprofloxacin',
  cipro: 'ciprofloxacin',
  doxycycline: 'doxycycline',
  doxicon: 'doxycycline',
  amoxicillin: 'amoxicillin',
  moxaclav: 'amoxicillin+clavulanate',
  fimoxyl: 'amoxicillin',
  augmentin: 'amoxicillin+clavulanate',
  flamyd: 'metronidazole',
  amodis: 'metronidazole',
  filmet: 'metronidazole',
  metronidazole: 'metronidazole',
  flagyl: 'metronidazole',
  azithromycin: 'azithromycin',
  zithrox: 'azithromycin',
  tritmac: 'azithromycin',

  // Supplements & Minerals
  iron: 'iron',
  'iron polymaltose': 'iron',
  fefol: 'iron',
  'i-car': 'iron',
  ferrous: 'iron',
  calbo: 'calcium',
  'calbo-d': 'calcium+vitamin d',
  coralcal: 'calcium',
  calcium: 'calcium',
  potassium: 'potassium',
  'potassium chloride': 'potassium',
  'k-lyte': 'potassium',

  // Respiratory & Allergy
  monas: 'montelukast',
  montene: 'montelukast',
  montelukast: 'montelukast',
  singulair: 'montelukast',
  ventolin: 'salbutamol',
  asmanol: 'salbutamol',
  salbutamol: 'salbutamol',
  fexo: 'fexofenadine',
  fexofenadine: 'fexofenadine',
  allegra: 'fexofenadine',
  ebastin: 'ebastine',

  // Psychiatric & Neuro
  tramadol: 'tramadol',
  tramacaf: 'tramadol',
  anadol: 'tramadol',
  escitalopram: 'escitalopram',
  sedil: 'diazepam',
  diazepam: 'diazepam',
  rivotril: 'clonazepam',
  clonazepam: 'clonazepam',
  sertraline: 'sertraline',
  fluoxetine: 'fluoxetine',

  // Diabetes & Urological
  metformin: 'metformin',
  metfo: 'metformin',
  gluconor: 'metformin',
  glicron: 'gliclazide',
  comprid: 'gliclazide',
  sildenafil: 'sildenafil',
  viagra: 'sildenafil',
  tadalafil: 'tadalafil',
  cialis: 'tadalafil',
};

export function normalizeDrugName(raw: string): string {
  const clean = raw.toLowerCase().trim();
  for (const [brand, generic] of Object.entries(BRAND_ALIASES)) {
    if (clean.includes(brand)) {
      return generic;
    }
  }
  return clean;
}

// ==========================================
// 2. FOOD INTERACTION KNOWLEDGE REGISTRY
// ==========================================

export const FOOD_INTERACTION_REGISTRY: FoodInteractionItem[] = [
  {
    id: 'food_grapefruit',
    foodName: 'Grapefruit & Citrus Pomelo',
    icon: 'citrus',
    category: 'CITRUS',
    description: 'Fresh grapefruit, pomelo, or grapefruit juice',
    interactingDrugClasses: ['atorvastatin', 'simvastatin', 'amlodipine', 'sildenafil', 'cyclosporine'],
    commonBrands: ['Lipicon', 'Atova', 'Lipitor', 'Camlodin', 'Norvasc', 'Torvan'],
    mechanismAndRisk:
      'Grapefruit compounds potently inhibit the intestinal CYP3A4 enzyme, blocking drug breakdown and multiplying blood drug concentrations up to 300%. This can trigger dangerous toxicities like severe muscle damage (rhabdomyolysis) or acute kidney failure.',
    patientGuideline:
      'Completely avoid grapefruit, pomelo, and bitter citrus juices while taking Statins (Atorvastatin/Simvastatin) or Calcium Blockers (Amlodipine). Standard sweet oranges and lemons are safe.',
  },
  {
    id: 'food_dairy_calcium',
    foodName: 'Milk, Yogurt & Dairy Products',
    icon: 'milk',
    category: 'DAIRY',
    description: 'Cow milk, cheese, curd, yogurt, and calcium-fortified drinks',
    interactingDrugClasses: ['ciprofloxacin', 'doxycycline', 'tetracycline', 'levofloxacin', 'iron'],
    commonBrands: ['Ciprocin', 'Neofloxin', 'Doxicon', 'Fefol', 'I-Car'],
    mechanismAndRisk:
      'Calcium and magnesium ions in dairy bind directly to antibiotics (chelation) and iron molecules, creating an unabsorbable complex. This reduces antibiotic efficacy by over 50%, risking severe infection failure.',
    patientGuideline:
      'Take Ciprofloxacin, Doxycycline, or Iron supplements at least 2 hours before or 4 hours after consuming milk, yogurt, or dairy products.',
  },
  {
    id: 'food_alcohol',
    foodName: 'Alcoholic Beverages',
    icon: 'wine',
    category: 'ALCOHOL',
    description: 'Beer, wine, spirits, and alcohol-containing tonics',
    interactingDrugClasses: ['metronidazole', 'paracetamol', 'diazepam', 'clonazepam', 'metformin', 'tramadol'],
    commonBrands: ['Flamyd', 'Amodis', 'Flagyl', 'Napa', 'Fast', 'Sedil', 'Rivotril'],
    mechanismAndRisk:
      '1) With Metronidazole: blocks aldehyde dehydrogenase causing violent vomiting, tachycardia, and facial flushing (Disulfiram reaction). 2) With Paracetamol: depletes glutathione and causes toxic liver necrosis. 3) With Sedatives: severe respiratory depression.',
    patientGuideline:
      'Strictly avoid all alcohol during Metronidazole therapy and for 48 hours after stopping. Do not combine alcohol with paracetamol or sedatives.',
  },
  {
    id: 'food_vitamin_k',
    foodName: 'Spinach, Kale & Vitamin K Rich Greens',
    icon: 'leaf',
    category: 'VITAMIN_K',
    description: 'Palong shak, spinach, broccoli, kale, green cabbage, and green tea',
    interactingDrugClasses: ['warfarin', 'coumadin', 'marevan'],
    commonBrands: ['Warfarin 2mg/5mg', 'Marevan'],
    mechanismAndRisk:
      'Vitamin K is the direct biological antidote to Warfarin. High or sudden fluctuations in dietary Vitamin K intake reverse Warfarin blood-thinning, increasing the danger of blood clots, DVT, or stroke.',
    patientGuideline:
      'Maintain a consistent, stable weekly intake of green vegetables. Avoid sudden large feasts of spinach or green tea detoxes. Check PT/INR regularly.',
  },
  {
    id: 'food_potassium',
    foodName: 'High-Potassium Foods & Salt Substitutes',
    icon: 'banana',
    category: 'POTASSIUM',
    description: 'Bananas, oranges, coconut water (Dab), dried fruits, and potassium-based low-sodium table salts',
    interactingDrugClasses: ['losartan', 'olmesartan', 'ramipril', 'enalapril', 'spironolactone', 'potassium'],
    commonBrands: ['Angilock', 'Olmetec', 'Cardace', 'Aldactone'],
    mechanismAndRisk:
      'ACE Inhibitors and ARBs reduce renal potassium excretion. Combining them with high potassium intake or potassium-sparing diuretics can trigger Hyperkalemia, leading to cardiac arrhythmias and muscle paralysis.',
    patientGuideline:
      'Avoid drinking excessive green coconut water (Dab) or taking potassium salt substitutes without physician supervision if you take BP medications like Losartan, Ramipril, or Spironolactone.',
  },
  {
    id: 'food_caffeine',
    foodName: 'Coffee, Energy Drinks & High Caffeine',
    icon: 'coffee',
    category: 'CAFFEINE',
    description: 'Espresso, black coffee, high-caffeine energy drinks, and excessive black tea',
    interactingDrugClasses: ['ciprofloxacin', 'theophylline', 'pseudoephedrine', 'salbutamol'],
    commonBrands: ['Ciprocin', 'Ventolin', 'Asmanol'],
    mechanismAndRisk:
      'Ciprofloxacin inhibits caffeine metabolism, causing caffeine accumulation. This leads to nervousness, tremors, rapid heart palpitations, and insomnia.',
    patientGuideline:
      'Limit coffee and energy drinks while taking Ciprofloxacin or bronchodilators to prevent heart palpitations and restlessness.',
  },
];

// ==========================================
// 3. DETERMINISTIC CLINICAL PAIRING RULES
// ==========================================

interface ClinicalPairingRule {
  drugPattern1: string[];
  drugPattern2: string[];
  severity: InteractionSeverity;
  headlineEn: string;
  headlineBn: string;
  mechanismEn: string;
  mechanismBn: string;
  adviceEn: string;
  adviceBn: string;
}

const CLINICAL_RULES: ClinicalPairingRule[] = [
  // 1. Anticoagulant + NSAID / Aspirin
  {
    drugPattern1: ['warfarin', 'rivaroxaban', 'apixaban'],
    drugPattern2: ['aspirin', 'ibuprofen', 'naproxen', 'ketorolac', 'diclofenac'],
    severity: 'CRITICAL',
    headlineEn: 'Severe Major Bleeding Hazard (Gastrointestinal & Internal)',
    headlineBn: 'মারাত্মক রক্তক্ষরণের তীব্র ঝুঁকি (পাকস্থলী ও অভ্যন্তরীণ ব্লিডিং)',
    mechanismEn:
      'Dual inhibition of platelet aggregation and coagulation cascade significantly multiplies gastrointestinal ulceration and life-threatening bleeding risk.',
    mechanismBn:
      'উভয় ওষুধ একসাথে রক্ত জমাট বাঁধার ক্ষমতা মারাত্মকভাবে কমিয়ে দেয়, যার ফলে পাকস্থলীতে আলসার ও অভ্যন্তরীণ রক্তক্ষরণ হতে পারে।',
    adviceEn:
      'Avoid combination unless explicitly prescribed by a cardiologist with close monitoring. Use Paracetamol for pain relief instead of NSAIDs.',
    adviceBn:
      'কার্ডিওলজিস্টের বিশেষ পরামর্শ ছাড়া একসাথে সেবন করবেন না। ব্যথার জন্য NSAID-এর বদলে প্যারাসিটামল গ্রহণ করুন।',
  },

  // 2. ACE Inhibitors / ARBs + Potassium / Spironolactone
  {
    drugPattern1: ['losartan', 'olmesartan', 'ramipril', 'enalapril'],
    drugPattern2: ['potassium', 'spironolactone'],
    severity: 'CRITICAL',
    headlineEn: 'Severe Hyperkalemia Risk (Dangerous High Blood Potassium)',
    headlineBn: 'মারাত্মক হাইপারক্যালেমিয়া ঝুঁকি (রক্তে পটাশিয়ামের বিপজ্জনক বৃদ্ধি)',
    mechanismEn:
      'Both agents retain potassium in the body. Excessive accumulation can induce lethal cardiac arrhythmias and cardiac arrest.',
    mechanismBn:
      'উভয় ওষুধ শরীরে পটাশিয়াম জমিয়ে রাখে। রক্তে অতিরিক্ত পটাশিয়াম হার্টের ছন্দ নষ্ট করে কার্ডিয়াক অ্যারেস্ট ঘটাতে পারে।',
    adviceEn:
      'Regular serum potassium monitoring is required. Do not use over-the-counter potassium supplements.',
    adviceBn:
      'নিয়মিত রক্তের পটাশিয়াম পরীক্ষা (Serum Electrolytes) করাতে হবে। চিকিৎসকের পরামর্শ ছাড়া পটাশিয়াম সাপ্লিমেন্ট খাবেন না।',
  },

  // 3. Sildenafil / Tadalafil + Nitrates
  {
    drugPattern1: ['sildenafil', 'tadalafil'],
    drugPattern2: ['nitroglycerin', 'isosorbide dinitrate'],
    severity: 'CRITICAL',
    headlineEn: 'Fatal Hypotension & Cardiovascular Collapse',
    headlineBn: 'মারাত্মক রক্তচাপ পতন ও কার্ডিওভাসকুলার শক',
    mechanismEn:
      'Synergistic vasodilation via cyclic GMP pathway leads to sudden, catastrophic drops in systemic blood pressure and coronary perfusion.',
    mechanismBn:
      'উভয় ওষুধ রক্তনালীকে ব্যাপকভাবে প্রসারিত করে, যার ফলে রক্তচাপ অত্যন্ত বিপজ্জনকভাবে নেমে গিয়ে মৃত্যুঝুঁকি তৈরি হতে পারে।',
    adviceEn:
      'Absolute contraindication. Never take Sildenafil/Tadalafil within 24-48 hours of Nitroglycerin/Nitrates.',
    adviceBn:
      'সম্পূর্ণ নিষিদ্ধ কম্বিনেশন। নাইট্রেট বা নাইট্রোগ্লিসারিন স্প্রে/ট্যাবলেটের সাথে এটি কখনোই গ্রহণ করবেন না।',
  },

  // 4. Antacids + Iron Supplements
  {
    drugPattern1: ['antacid', 'omeprazole', 'esomeprazole', 'pantoprazole'],
    drugPattern2: ['iron'],
    severity: 'MODERATE',
    headlineEn: 'Blocked Iron Absorption & Ineffective Anemia Treatment',
    headlineBn: 'আয়রন শোষণে বাধা ও রক্তস্বল্পতার ওষুধের কার্যকারিতা হ্রাস',
    mechanismEn:
      'Antacids and PPIs raise gastric pH, neutralizing stomach acid required to convert ferric iron into absorbable ferrous ions.',
    mechanismBn:
      'অ্যান্টাসিড ও গ্যাস্ট্রিকের ওষুধ পেটের এসিড কমিয়ে দেয়, যার ফলে আয়রন ট্যাবলেট রক্তে সঠিকভাবে শোষিত হতে পারে না।',
    adviceEn:
      'Take Iron supplements at least 2 hours before or 2 hours after Antacids. Taking iron with Vitamin C (Lemon/Orange) enhances absorption.',
    adviceBn:
      'অ্যান্টাসিড খাওয়ার কমপক্ষে ২ ঘণ্টা আগে বা ২ ঘণ্টা পরে আয়রন ট্যাবলেট খান। লেবুর পানির সাথে খেলে দ্রুত শোষিত হয়।',
  },

  // 5. Calcium / Dairy / Antacids + Quinolone / Tetracycline Antibiotics
  {
    drugPattern1: ['antacid', 'calcium'],
    drugPattern2: ['ciprofloxacin', 'doxycycline'],
    severity: 'MODERATE',
    headlineEn: 'Antibiotic Inactivation via Chelation Binding',
    headlineBn: 'চিলেশনের কারণে অ্যান্টিবায়োটিকের কার্যকারিতা সম্পূর্ণ নষ্ট',
    mechanismEn:
      'Polyvalent cations (Calcium, Aluminum, Magnesium) bind to the antibiotic ring, creating insoluble precipitates that cannot enter the bloodstream.',
    mechanismBn:
      'ক্যালসিয়াম ও অ্যান্টাসিডের খনিজ উপাদান অ্যান্টিবায়োটিকের সাথে যুক্ত হয়ে অদ্রবণীয় যৌগ তৈরি করে, ফলে ইনফেকশন ভালো হয় না।',
    adviceEn:
      'Take Ciprofloxacin or Doxycycline 2 hours before or 4 hours after Calcium or Antacid supplements.',
    adviceBn:
      'ক্যালসিয়াম বা অ্যান্টাসিড গ্রহণের অন্তত ২ ঘণ্টা আগে অথবা ৪ ঘণ্টা পরে অ্যান্টিবায়োটিক সেবন করুন।',
  },

  // 6. Clopidogrel + Omeprazole / Esomeprazole
  {
    drugPattern1: ['clopidogrel'],
    drugPattern2: ['omeprazole', 'esomeprazole'],
    severity: 'MODERATE',
    headlineEn: 'Reduced Antiplatelet Efficacy (Increased Heart Attack Risk)',
    headlineBn: 'রক্ত পাতলা রাখার ক্ষমতা হ্রাস ও হার্ট অ্যাটাকের ঝুঁকি',
    mechanismEn:
      'Omeprazole inhibits CYP2C19 enzyme, which is required to convert Clopidogrel into its active platelet-blocking metabolite.',
    mechanismBn:
      'ওমেপ্রাজল লিভারের বিশেষ এনজাইমকে ব্লক করে ক্লপিডোগ্রেলকে নিষ্ক্রিয় করে ফেলে, ফলে রক্ত জমাট বাঁধার ঝুঁকি বেড়ে যায়।',
    adviceEn:
      'Switch PPI to Pantoprazole or Famotidine, which do not interfere with Clopidogrel activation.',
    adviceBn:
      'চিকিৎসকের সাথে কথা বলে ওমেপ্রাজলের বদলে প্যান্টোপ্রাজল (Pantoprazole) ব্যবহার করা নিরাপদ।',
  },

  // 7. SSRIs + Tramadol
  {
    drugPattern1: ['escitalopram', 'sertraline', 'fluoxetine'],
    drugPattern2: ['tramadol'],
    severity: 'CRITICAL',
    headlineEn: 'Life-Threatening Serotonin Syndrome',
    headlineBn: 'মারাত্মক সেরোটোনিন সিন্ড্রোম (উচ্চ জ্বর ও খিঁচুনির ঝুঁকি)',
    mechanismEn:
      'Additive serotonergic toxicity causing agitation, hyperthermia, muscle rigidity, tremors, and seizures.',
    mechanismBn:
      'মস্তিষ্কে সেরোটোনিনের মাত্রা বিপজ্জনকভাবে বৃদ্ধি পায়, যা থেকে অতিরিক্ত জ্বর, কাঁপুনি ও খিঁচুনি হতে পারে।',
    adviceEn:
      'Avoid concurrent use. If both are necessary, monitor closely for tremors, confusion, and fever.',
    adviceBn:
      'একসাথে খাওয়া এড়িয়ে চলুন। শরীরের কাঁপুনি, বিভ্রান্তি বা জ্বর দেখা দিলে সাথে সাথে হাসপাতালে যান।',
  },

  // 8. Beta Blockers + Salbutamol (Asthma)
  {
    drugPattern1: ['propranolol', 'atenolol', 'metoprolol'],
    drugPattern2: ['salbutamol'],
    severity: 'MODERATE',
    headlineEn: 'Opposing Receptor Blockade (Severe Bronchospasm in Asthmatics)',
    headlineBn: 'শ্বাসকষ্ট ও ইনহেলারের কার্যকারিতা বন্ধ হওয়ার ঝুঁকি',
    mechanismEn:
      'Non-selective Beta Blockers block beta-2 receptors in the lungs, reversing the bronchodilating effect of Salbutamol and triggering severe asthma attacks.',
    mechanismBn:
      'বেটা ব্লকার ফুসফুসের নালীকে সংকুচিত করে সালবিউটামলের কার্যকারিতা নষ্ট করে দেয়, যার ফলে তীব্র হাঁপানি হতে পারে।',
    adviceEn:
      'Asthmatic patients should avoid non-selective beta-blockers (like Propranolol). Cardioselective agents or alternative BP drugs are preferred.',
    adviceBn:
      'হাঁপানি রোগীদের ক্ষেত্রে প্রোপানোলল জাতীয় ওষুধ এড়িয়ে কার্ডিওলজিস্টের পরামর্শে নিরাপদ ওষুধ ব্যবহার করতে হবে।',
  },

  // 9. NSAIDs + SSRIs
  {
    drugPattern1: ['escitalopram', 'sertraline', 'fluoxetine'],
    drugPattern2: ['ibuprofen', 'naproxen', 'ketorolac', 'diclofenac'],
    severity: 'MODERATE',
    headlineEn: 'Elevated Gastrointestinal Bleeding Risk',
    headlineBn: 'পাকস্থলীতে রক্তক্ষরণ ও আলসারের বাড়তি ঝুঁকি',
    mechanismEn:
      'SSRIs decrease platelet serotonin uptake while NSAIDs compromise gastric mucosa, multiplying GI bleeding rates by 3 to 6 fold.',
    mechanismBn:
      'একসাথে খেলে পাকস্থলীর আস্তরণ ক্ষতিগ্রস্ত হয় এবং গ্যাস্ট্রিক রক্তক্ষরণের সম্ভাবনা কয়েক গুণ বেড়ে যায়।',
    adviceEn:
      'Add a gastroprotective agent (like Pantoprazole) or use Paracetamol for routine pain management.',
    adviceBn:
      'ব্যথার জন্য প্যারাসিটামল ব্যবহার করুন অথবা চিকিৎসকের পরামর্শে গ্যাস্ট্রিক প্রটেক্টিভ ওষুধ সেবন করুন।',
  },

  // 10. Metronidazole + Alcohol
  {
    drugPattern1: ['metronidazole'],
    drugPattern2: ['alcohol'],
    severity: 'CRITICAL',
    headlineEn: 'Severe Disulfiram-like Reaction',
    headlineBn: 'মারাত্মক ডিসালফিরাম রিঅ্যাকশন (তীব্র বমি ও বুক ধড়ফড়)',
    mechanismEn:
      'Inhibition of acetaldehyde dehydrogenase leads to accumulation of acetaldehyde, triggering flushing, severe nausea, vomiting, and tachycardia.',
    mechanismBn:
      'অ্যালকোহল হজমে বাধা দিয়ে শরীরে বিষাক্ত উপাদান জমায়, ফলে তীব্র বমি, মাথাব্যথা ও রক্তচাপ অস্বাভাবিক হতে পারে।',
    adviceEn:
      'Completely avoid alcohol during Metronidazole treatment and for at least 48 hours following the last dose.',
    adviceBn:
      'মেট্রোনিডাজল চলাকালীন এবং শেষ ডোজের অন্তত ৪৮ ঘণ্টা পর পর্যন্ত অ্যালকোহল সম্পূর্ণ পরিহার করুন।',
  },
];

// ==========================================
// 4. CORE INTERACTION CHECKING ENGINE
// ==========================================

export function checkDrugPair(
  rawDrug1: string,
  rawDrug2: string,
  languageCode: string = 'en'
): DrugInteractionResult | null {
  const norm1 = normalizeDrugName(rawDrug1);
  const norm2 = normalizeDrugName(rawDrug2);
  const isBn = languageCode === 'bn';

  if (!norm1 || !norm2 || norm1 === norm2) return null;

  for (const rule of CLINICAL_RULES) {
    const matchDirect =
      rule.drugPattern1.some((p) => norm1.includes(p)) &&
      rule.drugPattern2.some((p) => norm2.includes(p));

    const matchReverse =
      rule.drugPattern1.some((p) => norm2.includes(p)) &&
      rule.drugPattern2.some((p) => norm1.includes(p));

    if (matchDirect || matchReverse) {
      return {
        id: `int_${norm1}_${norm2}_${Date.now()}`,
        type: 'DRUG_DRUG',
        drug1: rawDrug1,
        drug2: rawDrug2,
        severity: rule.severity,
        headline: isBn ? rule.headlineBn : rule.headlineEn,
        mechanism: isBn ? rule.mechanismBn : rule.mechanismEn,
        clinicalConsequence: isBn ? rule.headlineBn : rule.headlineEn,
        actionableAdvice: isBn ? rule.adviceBn : rule.adviceEn,
        scientificEvidenceLevel: 'ESTABLISHED',
        tags: ['Clinical Rule Engine', 'Pharmacology Certified'],
      };
    }
  }

  return null;
}

export function checkDrugWithFoods(
  rawDrug: string,
  languageCode: string = 'en'
): DrugInteractionResult[] {
  const norm = normalizeDrugName(rawDrug);
  const isBn = languageCode === 'bn';
  const warnings: DrugInteractionResult[] = [];

  for (const food of FOOD_INTERACTION_REGISTRY) {
    const matchesDrug = food.interactingDrugClasses.some((d) => norm.includes(d));
    if (matchesDrug) {
      warnings.push({
        id: `food_int_${food.id}_${norm}`,
        type: 'DRUG_FOOD',
        drug1: rawDrug,
        foodOrBeverage: food.foodName,
        severity: food.category === 'CITRUS' || food.category === 'ALCOHOL' ? 'CRITICAL' : 'MODERATE',
        headline: isBn
          ? `খাবার সতর্কতা: ${food.foodName}-এর সাথে সাবধানতা`
          : `Diet Warning: Avoid / Space with ${food.foodName}`,
        mechanism: food.mechanismAndRisk,
        clinicalConsequence: food.description,
        actionableAdvice: food.patientGuideline,
        scientificEvidenceLevel: 'ESTABLISHED',
        tags: [food.category, 'Dietary Guidance'],
      });
    }
  }

  return warnings;
}

export async function auditMedicineCabinet(
  rawDrugList: string[],
  languageCode: string = 'en'
): Promise<CabinetSafetyAuditResult> {
  const isBn = languageCode === 'bn';
  const cleanList = rawDrugList.filter((d) => d && d.trim().length > 1);

  const criticalPairings: DrugInteractionResult[] = [];
  const moderatePairings: DrugInteractionResult[] = [];
  const foodWarnings: DrugInteractionResult[] = [];
  const safeCombinations: { drug1: string; drug2: string }[] = [];

  // 1. Combinatorial pairwise check
  for (let i = 0; i < cleanList.length; i++) {
    // Food check for each drug
    const foods = checkDrugWithFoods(cleanList[i], languageCode);
    for (const f of foods) {
      if (!foodWarnings.some((w) => w.drug1 === f.drug1 && w.foodOrBeverage === f.foodOrBeverage)) {
        foodWarnings.push(f);
      }
    }

    for (let j = i + 1; j < cleanList.length; j++) {
      const drugA = cleanList[i];
      const drugB = cleanList[j];
      const result = checkDrugPair(drugA, drugB, languageCode);

      if (result) {
        if (result.severity === 'CRITICAL') {
          criticalPairings.push(result);
        } else {
          moderatePairings.push(result);
        }
      } else {
        safeCombinations.push({ drug1: drugA, drug2: drugB });
      }
    }
  }

  // Calculate overall safety score (0 - 100)
  let score = 100;
  score -= criticalPairings.length * 35;
  score -= moderatePairings.length * 15;
  score -= foodWarnings.length * 5;
  score = Math.max(10, Math.min(100, score));

  return {
    totalDrugsAnalyzed: cleanList.length,
    overallSafetyScore: score,
    criticalPairings,
    moderatePairings,
    foodWarnings,
    safeCombinations,
    scannedAt: new Date().toISOString(),
  };
}

// ==========================================
// 5. GEMINI AI CLINICAL PHARMACOLOGY MODEL
// ==========================================

export async function queryGeminiPharmacistDeepAnalysis(
  drugs: string[],
  languageCode: string = 'en'
): Promise<DrugInteractionResult[]> {
  const isBn = languageCode === 'bn';
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!apiKey || drugs.length < 2) {
    // Fallback: Run standard rule engine on all pairs
    const { criticalPairings, moderatePairings } = await auditMedicineCabinet(drugs, languageCode);
    return [...criticalPairings, ...moderatePairings];
  }

  try {
    const prompt = `
You are an expert Clinical Pharmacologist and Drug Safety AI.
Analyze the following list of medications for:
1) Major Drug-to-Drug Interactions (Contraindications, Pharmacokinetic/Pharmacodynamic clashes)
2) Drug-to-Food Interactions
3) Patient safety advice.

Medication List:
${drugs.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Target Language: ${isBn ? 'Bengali (বাংলা)' : 'English'}

Return ONLY a valid JSON array conforming to this exact TypeScript structure without markdown code fences:
[
  {
    "id": "gemini_int_1",
    "type": "DRUG_DRUG",
    "drug1": "Drug A",
    "drug2": "Drug B",
    "severity": "CRITICAL",
    "headline": "Short title of the interaction in ${isBn ? 'Bengali' : 'English'}",
    "mechanism": "Clinical mechanism explaining the interaction in ${isBn ? 'Bengali' : 'English'}",
    "clinicalConsequence": "Potential symptoms or risks in ${isBn ? 'Bengali' : 'English'}",
    "actionableAdvice": "Concrete instructions for patient/doctor in ${isBn ? 'Bengali' : 'English'}",
    "scientificEvidenceLevel": "ESTABLISHED"
  }
]
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed: DrugInteractionResult[] = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Gemini Pharmacist AI deep check fallback:', err);
  }

  // Fallback to local rule engine
  const { criticalPairings, moderatePairings } = await auditMedicineCabinet(drugs, languageCode);
  return [...criticalPairings, ...moderatePairings];
}
