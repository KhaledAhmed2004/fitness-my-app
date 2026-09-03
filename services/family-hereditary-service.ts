import {
  AncestorConditionEntry,
  FamilyAncestorRecord,
  FamilyHereditaryReport,
  HereditaryDiseaseType,
  HereditaryRiskLevel,
  HereditaryRiskScoreResult,
  PreventiveScreeningMilestone,
} from '@/types/family-hereditary';

// ==========================================
// 1. DEFAULT SEED ANCESTORS (3 GENERATIONS)
// ==========================================

export const DEV_SEED_ANCESTORS: FamilyAncestorRecord[] = [
  {
    id: 'anc_pat_gf',
    relation: 'PATERNAL_GRANDFATHER',
    name: 'Late Abdul Karim (Dada)',
    gender: 'MALE',
    isLiving: false,
    currentAgeOrAgeAtDecease: 78,
    conditions: [
      {
        id: 'c_pat_gf_1',
        disease: 'TYPE_2_DIABETES',
        diagnosedAge: 52,
        notes: 'Managed with oral hypoglycemics',
      },
      {
        id: 'c_pat_gf_2',
        disease: 'HYPERTENSION',
        diagnosedAge: 56,
        notes: 'Long-term BP management',
      },
    ],
  },
  {
    id: 'anc_pat_gm',
    relation: 'PATERNAL_GRANDMOTHER',
    name: 'Late Rahima Begum (Dadi)',
    gender: 'FEMALE',
    isLiving: false,
    currentAgeOrAgeAtDecease: 82,
    conditions: [],
  },
  {
    id: 'anc_mat_gf',
    relation: 'MATERNAL_GRANDFATHER',
    name: 'Late Nurul Islam (Nana)',
    gender: 'MALE',
    isLiving: false,
    currentAgeOrAgeAtDecease: 74,
    conditions: [
      {
        id: 'c_mat_gf_1',
        disease: 'HYPERTENSION',
        diagnosedAge: 62,
        notes: 'Mild hypertension',
      },
    ],
  },
  {
    id: 'anc_mat_gm',
    relation: 'MATERNAL_GRANDMOTHER',
    name: 'Sufia Khatun (Nani)',
    gender: 'FEMALE',
    isLiving: true,
    currentAgeOrAgeAtDecease: 72,
    conditions: [
      {
        id: 'c_mat_gm_1',
        disease: 'THYROID_DISORDER',
        diagnosedAge: 48,
        notes: 'Hypothyroidism (Thyrox 50mcg)',
      },
      {
        id: 'c_mat_gm_2',
        disease: 'OSTEOPOROSIS',
        diagnosedAge: 65,
        notes: 'Calcium and Vitamin D supplements',
      },
    ],
  },
  {
    id: 'anc_father',
    relation: 'FATHER',
    name: 'Dr. Rafiqul Islam (Father)',
    gender: 'MALE',
    isLiving: true,
    currentAgeOrAgeAtDecease: 58,
    conditions: [
      {
        id: 'c_fat_1',
        disease: 'HYPERTENSION',
        diagnosedAge: 46, // Early onset
        notes: 'Olmesartan 20mg daily',
      },
      {
        id: 'c_fat_2',
        disease: 'DYSLIPIDEMIA_CHOLESTEROL',
        diagnosedAge: 50,
        notes: 'Rosuvastatin 10mg',
      },
    ],
  },
  {
    id: 'anc_mother',
    relation: 'MOTHER',
    name: 'Nasreen Akhter (Mother)',
    gender: 'FEMALE',
    isLiving: true,
    currentAgeOrAgeAtDecease: 52,
    conditions: [
      {
        id: 'c_mot_1',
        disease: 'TYPE_2_DIABETES',
        diagnosedAge: 49,
        notes: 'Metformin 500mg (Borderline HbA1c 6.8%)',
      },
      {
        id: 'c_mot_2',
        disease: 'THYROID_DISORDER',
        diagnosedAge: 42, // Early onset
        notes: 'Hypothyroidism (Eltroxin 25mcg)',
      },
    ],
  },
];

// ==========================================
// 2. DISEASE METADATA & GUIDELINES
// ==========================================

export const DISEASE_METADATA: Record<
  HereditaryDiseaseType,
  {
    nameEn: string;
    nameBn: string;
    icon: string;
    earlyOnsetCutoffAge: number;
    descriptionEn: string;
    descriptionBn: string;
  }
> = {
  TYPE_2_DIABETES: {
    nameEn: 'Type 2 Diabetes & Insulin Resistance',
    nameBn: 'টাইপ-২ ডায়াবেটিস ও ইনসুলিন রেজিস্ট্যান্স',
    icon: 'water-drop',
    earlyOnsetCutoffAge: 45,
    descriptionEn: 'High polygenic heritability; risk is multiplied if both maternal and paternal lines are affected.',
    descriptionBn: 'উভয় বংশীয় ধারায় ডায়াবেটিস থাকলে সন্তানদের আক্রান্ত হওয়ার সম্ভাবনা উল্লেখযোগ্যভাবে বৃদ্ধি পায়।',
  },
  HYPERTENSION: {
    nameEn: 'Essential Hypertension (High BP)',
    nameBn: 'উচ্চ রক্তচাপ (এসেনশিয়াল হাইপারটেনশন)',
    icon: 'favorite',
    earlyOnsetCutoffAge: 50,
    descriptionEn: 'Arterial stiffness and renal sodium sensitivity exhibit 30-50% familial transmission.',
    descriptionBn: 'পারিবারিক রক্তচাপের ইতিহাস থাকলে রক্তনালীর স্থিতিস্থাপকতা দ্রুত হ্রাস পেতে পারে।',
  },
  CORONARY_CAD: {
    nameEn: 'Coronary Artery Disease & Heart Attack',
    nameBn: 'হৃদরোগ ও আর্টারি ব্লকেজ (CAD / Heart Attack)',
    icon: 'monitor-heart',
    earlyOnsetCutoffAge: 55,
    descriptionEn: 'Early cardiovascular events in 1st-degree relatives warrant early baseline lipid and cardiac screening.',
    descriptionBn: 'পরিবারে কম বয়সে হার্ট অ্যাটাকের ইতিহাস থাকলে সন্তানদের বয়স ২০ থেকেই লিপিড স্ক্রিনিং আবশ্যক।',
  },
  THYROID_DISORDER: {
    nameEn: 'Thyroid Disorders (Hypothyroidism)',
    nameBn: 'থাইরয়েড সমস্যা (হাইপো/হাইপারথাইরয়েডিজম)',
    icon: 'biotech',
    earlyOnsetCutoffAge: 45,
    descriptionEn: 'Autoimmune thyroiditis demonstrates strong maternal lineage clustering (up to 60% transmission).',
    descriptionBn: 'মা বা নানীর থাইরয়েড সমস্যা থাকলে মেয়ে ও সন্তানদের থাইরয়েড হরমোন অস্বাভাবিক হওয়ার ঝুঁকি থাকে।',
  },
  DYSLIPIDEMIA_CHOLESTEROL: {
    nameEn: 'Familial High Cholesterol & Triglycerides',
    nameBn: 'উচ্চ কোলেস্টেরল ও ট্রাইগ্লিসারাইড',
    icon: 'opacity',
    earlyOnsetCutoffAge: 45,
    descriptionEn: 'Genetic mutations in LDL clearance cause silent plaque accumulation from early adulthood.',
    descriptionBn: 'বংশগত উচ্চ কোলেস্টেরল নীরবে রক্তনালীতে চর্বি জমায়, যা দ্রুত প্রতিরোধ করা সম্ভব।',
  },
  COLORECTAL_RISK: {
    nameEn: 'Familial Colorectal & GI Polyps Risk',
    nameBn: 'পাকস্থলী ও অন্ত্রের পলিপ/ক্যান্সার ঝুঁকি',
    icon: 'health-and-safety',
    earlyOnsetCutoffAge: 50,
    descriptionEn: 'Clinical guidelines recommend starting screening 10 years prior to the youngest affected relative.',
    descriptionBn: 'পরিবারে অন্ত্রের সমস্যা থাকলে সর্বকনিষ্ঠ আক্রান্ত সদস্যের চেয়ে ১০ বছর আগেই স্ক্রিনিং শুরু করা উচিত।',
  },
  GLAUCOMA: {
    nameEn: 'Glaucoma & High Intraocular Eye Pressure',
    nameBn: 'গ্লুকোমা ও চোখের উচ্চ প্রেশার',
    icon: 'visibility',
    earlyOnsetCutoffAge: 50,
    descriptionEn: 'First-degree family history increases glaucoma risk up to 9-fold; early tonometry prevents optic damage.',
    descriptionBn: 'পরিবারে গ্লুকোমার ইতিহাস থাকলে দৃষ্টিশক্তি রক্ষায় নিয়মিত চোখের প্রেশার মাপা জরুরি।',
  },
  OSTEOPOROSIS: {
    nameEn: 'Osteoporosis & Bone Density Loss',
    nameBn: 'অস্টিওপোরোসিস ও হাড়ের ক্ষয় রোগ',
    icon: 'accessibility',
    earlyOnsetCutoffAge: 55,
    descriptionEn: 'Peak bone mass and density rate of loss is strongly genetically determined.',
    descriptionBn: 'পারিবারিক হাড় ক্ষয়ের ইতিহাস থাকলে পর্যাপ্ত ক্যালসিয়াম ও হাড়ের ঘনত্ব পরীক্ষা দরকার।',
  },
};

// ==========================================
// 3. SCIENTIFIC SCREENING MILESTONES RULES
// ==========================================

function getScreeningMilestonesForDisease(
  disease: HereditaryDiseaseType,
  riskLevel: HereditaryRiskLevel,
  isEarlyOnset: boolean
): PreventiveScreeningMilestone[] {
  switch (disease) {
    case 'TYPE_2_DIABETES':
      return [
        {
          id: 'ms_dm_1',
          disease: 'TYPE_2_DIABETES',
          targetAge: isEarlyOnset || riskLevel === 'HIGH' ? 22 : 28,
          testName: 'Baseline Fasting Blood Glucose (FBS) & HbA1c',
          frequency: riskLevel === 'HIGH' ? 'Every 6-12 months' : 'Every 2-3 years',
          priority: riskLevel === 'HIGH' ? 'CRITICAL' : 'RECOMMENDED',
          clinicalObjective: 'Detect pre-diabetes early before microvascular insulin damage occurs.',
        },
        {
          id: 'ms_dm_2',
          disease: 'TYPE_2_DIABETES',
          targetAge: 35,
          testName: 'Comprehensive Metabolic Panel + Urine Microalbumin',
          frequency: 'Annual (Every 12 months)',
          priority: 'RECOMMENDED',
          clinicalObjective: 'Screen for early diabetic nephropathy and kidney filtration status.',
        },
      ];

    case 'HYPERTENSION':
      return [
        {
          id: 'ms_htn_1',
          disease: 'HYPERTENSION',
          targetAge: 20,
          testName: 'Quarterly Resting Blood Pressure Baseline',
          frequency: 'Every 3 months',
          priority: 'RECOMMENDED',
          clinicalObjective: 'Establish normal resting baseline (target < 120/80 mmHg).',
        },
        {
          id: 'ms_htn_2',
          disease: 'HYPERTENSION',
          targetAge: isEarlyOnset ? 30 : 35,
          testName: 'Cardiovascular Risk Panel (ECG + Serum Creatinine + Electrolytes)',
          frequency: 'Every 1-2 years',
          priority: riskLevel === 'HIGH' ? 'CRITICAL' : 'RECOMMENDED',
          clinicalObjective: 'Detect silent left ventricular hypertrophy or vascular stiffness.',
        },
      ];

    case 'CORONARY_CAD':
      return [
        {
          id: 'ms_cad_1',
          disease: 'CORONARY_CAD',
          targetAge: 20,
          testName: 'Fasting Lipid Profile (Total Chol, LDL, HDL, Triglycerides)',
          frequency: 'Every 12 months',
          priority: 'CRITICAL',
          clinicalObjective: 'Maintain optimal LDL cholesterol (< 100 mg/dL) to prevent plaque deposition.',
        },
        {
          id: 'ms_cad_2',
          disease: 'CORONARY_CAD',
          targetAge: isEarlyOnset ? 35 : 40,
          testName: '12-Lead ECG + Echocardiography with Color Doppler',
          frequency: 'Every 2 years',
          priority: 'RECOMMENDED',
          clinicalObjective: 'Evaluate cardiac wall motion and baseline ejection fraction.',
        },
      ];

    case 'THYROID_DISORDER':
      return [
        {
          id: 'ms_thy_1',
          disease: 'THYROID_DISORDER',
          targetAge: isEarlyOnset ? 22 : 28,
          testName: 'Serum TSH & Free T4 (Thyroid Panel)',
          frequency: 'Every 1-2 years',
          priority: 'RECOMMENDED',
          clinicalObjective: 'Detect subclinical hypothyroidism, unexplained fatigue, or metabolic slowing.',
        },
      ];

    case 'DYSLIPIDEMIA_CHOLESTEROL':
      return [
        {
          id: 'ms_lip_1',
          disease: 'DYSLIPIDEMIA_CHOLESTEROL',
          targetAge: 20,
          testName: 'Full Lipid Profile + Apolipoprotein B',
          frequency: 'Annual (Every 12 months)',
          priority: 'CRITICAL',
          clinicalObjective: 'Check for inherited familial hypercholesterolemia.',
        },
      ];

    case 'COLORECTAL_RISK':
      return [
        {
          id: 'ms_crc_1',
          disease: 'COLORECTAL_RISK',
          targetAge: isEarlyOnset ? 35 : 45,
          testName: 'Fecal Immunochemical Test (FIT) / Screening Colonoscopy',
          frequency: 'Every 1-2 years (FIT) or 5 years (Colonoscopy)',
          priority: 'RECOMMENDED',
          clinicalObjective: 'Identify and remove pre-cancerous polyps a decade before symptom onset.',
        },
      ];

    case 'GLAUCOMA':
      return [
        {
          id: 'ms_glc_1',
          disease: 'GLAUCOMA',
          targetAge: 35,
          testName: 'Comprehensive Eye Exam & Non-Contact Tonometry (IOP)',
          frequency: 'Every 1-2 years',
          priority: 'RECOMMENDED',
          clinicalObjective: 'Monitor intraocular fluid pressure to preserve optic nerve fibers.',
        },
      ];

    case 'OSTEOPOROSIS':
      return [
        {
          id: 'ms_ost_1',
          disease: 'OSTEOPOROSIS',
          targetAge: 40,
          testName: 'DEXA Bone Mineral Density Scan + Serum 25-OH Vitamin D',
          frequency: 'Every 2-3 years',
          priority: 'ROUTINE',
          clinicalObjective: 'Measure lumbar spine and femoral neck T-score to prevent silent fractures.',
        },
      ];
  }
}

// ==========================================
// 4. CORE RISK ASSESSMENT ENGINE
// ==========================================

export function evaluateDiseaseHereditaryRisk(
  ancestors: FamilyAncestorRecord[],
  disease: HereditaryDiseaseType,
  languageCode: string = 'en'
): HereditaryRiskScoreResult {
  const isBn = languageCode === 'bn';
  const meta = DISEASE_METADATA[disease];

  const firstDegreeRelations = ['FATHER', 'MOTHER', 'SIBLING', 'CHILD'];
  const paternalRelations = ['PATERNAL_GRANDFATHER', 'PATERNAL_GRANDMOTHER', 'FATHER'];
  const maternalRelations = ['MATERNAL_GRANDFATHER', 'MATERNAL_GRANDMOTHER', 'MOTHER'];

  let hasPaternalLine = false;
  let hasMaternalLine = false;
  let hasEarlyOnset = false;
  let rawScore = 10; // Baseline population risk

  const contributingAncestors: HereditaryRiskScoreResult['contributingAncestors'] = [];

  for (const anc of ancestors) {
    const matchingCond = anc.conditions.find((c) => c.disease === disease);
    if (matchingCond) {
      const isFirstDegree = firstDegreeRelations.includes(anc.relation);
      const isEarly =
        matchingCond.diagnosedAge &&
        matchingCond.diagnosedAge <= meta.earlyOnsetCutoffAge;

      if (isEarly) hasEarlyOnset = true;
      if (paternalRelations.includes(anc.relation)) hasPaternalLine = true;
      if (maternalRelations.includes(anc.relation)) hasMaternalLine = true;

      // Add weighted score
      if (isFirstDegree) {
        rawScore += isEarly ? 35 : 28;
      } else {
        rawScore += isEarly ? 18 : 12;
      }

      contributingAncestors.push({
        name: anc.name,
        relation: anc.relation.replace(/_/g, ' '),
        diagnosedAge: matchingCond.diagnosedAge,
        isFirstDegree,
      });
    }
  }

  const isBilateral = hasPaternalLine && hasMaternalLine;
  if (isBilateral) {
    rawScore *= 1.4; // Bilateral inheritance multiplier
  }

  const finalScore = Math.min(95, Math.max(10, Math.round(rawScore)));

  let riskLevel: HereditaryRiskLevel = 'LOW';
  if (finalScore >= 65) riskLevel = 'HIGH';
  else if (finalScore >= 40) riskLevel = 'MODERATE';
  else if (finalScore >= 25) riskLevel = 'AVERAGE';

  // Generate rationale
  let clinicalRationale = '';
  if (contributingAncestors.length === 0) {
    clinicalRationale = isBn
      ? 'আপনার ৩-প্রজন্মের পারিবারে এই রোগের কোনো প্রত্যক্ষ পূর্বসূরী রেকর্ড পাওয়া যায়নি। সাধারণ জীবনযাপন ও রুটিন স্বাস্থ্য পরীক্ষা যথেষ্ট।'
      : 'No direct ancestral history detected across 3 generations. Standard age-appropriate screening is recommended.';
  } else if (isBilateral) {
    clinicalRationale = isBn
      ? `উভয় বংশীয় ধারায় (পিতা ও মাতা) আক্রান্ত পূর্বসূরী রয়েছে (${contributingAncestors.length} জন)। বংশগত ঝুঁকি উচ্চ এবং নির্ধারিত বয়সের আগেই নিয়মিত পরীক্ষা শুরু করা আবশ্যক।`
      : `Bilateral transmission detected with ${contributingAncestors.length} affected ancestor(s) across both maternal and paternal branches. Accelerated preventive screening is strongly advised.`;
  } else {
    clinicalRationale = isBn
      ? `${contributingAncestors.length} জন পারিবারিক পূর্বসূরীর মধ্যে এই রোগের ইতিহাস রয়েছে (${contributingAncestors.map((c) => c.relation).join(', ')})${hasEarlyOnset ? ' এবং কম বয়সে আক্রান্ত হওয়ার প্রমাণ রয়েছে' : ''}।`
      : `Identified in ${contributingAncestors.length} ancestor(s) (${contributingAncestors.map((c) => c.relation).join(', ')})${hasEarlyOnset ? ' with early-onset presentation' : ''}. Moderate hereditary predisposition.`;
  }

  // Lifestyle shield
  const lifestyleShield: string[] = [];
  if (disease === 'TYPE_2_DIABETES') {
    lifestyleShield.push(
      isBn ? '🥗 প্রক্রিয়াজাত চিনি ও অতিরিক্ত কার্বোহাইড্রেট পরিহার করুন' : '🥗 Restrict refined sugar & ultra-processed carbohydrates',
      isBn ? '🏃‍♂️ সপ্তাহে অন্তত ১৫০ মিনিট মাঝারি ব্যায়াম / হাঁটা' : '🏃‍♂️ 150 mins/week brisk walking or aerobic exercise',
      isBn ? '⚖️ আদর্শ শারীরিক ওজন ও বেলি ফ্যাট নিয়ন্ত্রণে রাখুন' : '⚖️ Maintain healthy visceral fat and BMI < 24'
    );
  } else if (disease === 'HYPERTENSION' || disease === 'CORONARY_CAD') {
    lifestyleShield.push(
      isBn ? '🧂 খাবারে বাড়তি কাঁচা লবণ ও অতিরিক্ত লবণাক্ত স্ন্যাকস বর্জন করুন' : '🧂 Restrict table salt and sodium to < 2000mg/day',
      isBn ? '🫒 ওমেগা-৩ ও স্বাস্থ্যকর ফ্যাট (অলিভ অয়েল, বাদাম, মাছ) খান' : '🫒 Favor heart-healthy fats (Olive oil, walnuts, fish)',
      isBn ? '🧘 নিয়মিত পর্যাপ্ত ঘুম ও মানসিক চাপ নিয়ন্ত্রণ' : '🧘 Maintain 7-8 hrs quality sleep and stress management'
    );
  } else if (disease === 'THYROID_DISORDER') {
    lifestyleShield.push(
      isBn ? '🧂 পরিমিত আয়োডিনযুক্ত খাবার ও সেলেনিয়ামসমৃদ্ধ খাদ্য গ্রহণ' : '🧂 Adequate dietary iodine and selenium intake',
      isBn ? '🩺 বছরে অন্তত ১ বার TSH ও হরমোন প্রোফাইল পরীক্ষা' : '🩺 Annual TSH checkup for early detection'
    );
  } else {
    lifestyleShield.push(
      isBn ? '🥗 সুষম পুষ্টিকর খাদ্যাভ্যাস বজায় রাখুন' : '🥗 Balanced whole-food Mediterranean-style diet',
      isBn ? '🚭 ধূমপান ও অ্যালকোহল সম্পূর্ণ পরিহার করুন' : '🚭 Avoid smoking and environmental toxins'
    );
  }

  const milestones = getScreeningMilestonesForDisease(disease, riskLevel, hasEarlyOnset);

  return {
    disease,
    diseaseName: isBn ? meta.nameBn : meta.nameEn,
    icon: meta.icon,
    riskScore: finalScore,
    riskLevel,
    contributingAncestors,
    earlyOnsetDetected: hasEarlyOnset,
    bilateralTransmission: isBilateral,
    clinicalRationale,
    lifestyleShield,
    preventiveScreeningMilestones: milestones,
  };
}

export function generateCompleteFamilyHereditaryReport(
  ancestors: FamilyAncestorRecord[],
  childName: string = 'Khaled',
  languageCode: string = 'en'
): FamilyHereditaryReport {
  const allDiseases: HereditaryDiseaseType[] = [
    'TYPE_2_DIABETES',
    'HYPERTENSION',
    'CORONARY_CAD',
    'THYROID_DISORDER',
    'DYSLIPIDEMIA_CHOLESTEROL',
    'COLORECTAL_RISK',
    'GLAUCOMA',
    'OSTEOPOROSIS',
  ];

  const assessments = allDiseases.map((d) =>
    evaluateDiseaseHereditaryRisk(ancestors, d, languageCode)
  );

  // Aggregate all milestones and sort by target age ascending
  const allMilestones: PreventiveScreeningMilestone[] = [];
  for (const a of assessments) {
    for (const m of a.preventiveScreeningMilestones) {
      if (!allMilestones.some((existing) => existing.testName === m.testName)) {
        allMilestones.push(m);
      }
    }
  }
  allMilestones.sort((a, b) => a.targetAge - b.targetAge);

  // Overall family hereditary index (average of top 3 risks)
  const topRisks = [...assessments].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
  const avgTopScore = Math.round(
    topRisks.reduce((sum, r) => sum + r.riskScore, 0) / topRisks.length
  );

  return {
    generatedAt: new Date().toISOString(),
    targetChildName: childName,
    totalAncestorsRecorded: ancestors.length,
    overallFamilyHereditaryIndex: avgTopScore,
    riskAssessments: assessments,
    upcomingMilestonesSortedByAge: allMilestones,
  };
}

// ==========================================
// 5. GEMINI AI CLINICAL GENOMICS SYNTHESIZER
// ==========================================

export async function generateGeminiGenomicForecast(
  ancestors: FamilyAncestorRecord[],
  childName: string = 'Khaled',
  languageCode: string = 'en'
): Promise<string> {
  const isBn = languageCode === 'bn';
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  const report = generateCompleteFamilyHereditaryReport(ancestors, childName, languageCode);
  const highRisks = report.riskAssessments.filter((r) => r.riskLevel === 'HIGH' || r.riskLevel === 'MODERATE');

  if (!apiKey) {
    // Return high quality deterministic synthesis
    if (isBn) {
      return `পারিবারিক পেডিগ্রি বিশ্লেষণে ${highRisks.map((h) => h.diseaseName).join(', ')}-এর বংশগত প্রবণতা লক্ষ্য করা গেছে। সময়মতো বয়স-ভিত্তিক স্ক্রিনিং টেস্ট ও স্বাস্থ্যকর খাদ্যাভ্যাস বজায় রাখলে এই রোগগুলোর ঝুঁকি ৮০% পর্যন্ত হ্রাস করা সম্ভব।`;
    }
    return `Family lineage analysis indicates hereditary predisposition towards ${highRisks.map((h) => h.diseaseName).join(', ')}. Initiating baseline preventive screening at the recommended ages along with targeted lifestyle shielding can delay or prevent onset by up to 80%.`;
  }

  try {
    const prompt = `
You are an expert Clinical Geneticist and Preventive Healthcare Physician.
Analyze the following multi-generational family health pedigree for patient "${childName}":

Pedigree History:
${ancestors
  .map(
    (a) =>
      `• ${a.name} (${a.relation}): ${
        a.conditions.length > 0
          ? a.conditions.map((c) => `${c.disease} (Diagnosed age: ${c.diagnosedAge || 'Unknown'})`).join(', ')
          : 'No major chronic illness recorded'
      }`
  )
  .join('\n')}

High & Moderate Risks Identified:
${highRisks.map((h) => `- ${h.diseaseName} (Score: ${h.riskScore}%, Bilateral: ${h.bilateralTransmission})`).join('\n')}

Target Language: ${isBn ? 'Bengali (বাংলা)' : 'English'}

Write a compassionate, highly authoritative 3-4 sentence clinical geneticist synthesis and preventive roadmap for ${childName}. Do not use technical jargon without clear explanations. Focus on empowering the patient through timely age-based screenings.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 20) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('Gemini Genomic forecast fallback:', err);
  }

  if (isBn) {
    return `পারিবারিক পেডিগ্রি বিশ্লেষণে ${highRisks.map((h) => h.diseaseName).join(', ')}-এর বংশগত প্রবণতা লক্ষ্য করা গেছে। সময়মতো বয়স-ভিত্তিক স্ক্রিনিং টেস্ট ও স্বাস্থ্যকর খাদ্যাভ্যাস বজায় রাখলে এই রোগগুলোর ঝুঁকি ৮০% পর্যন্ত হ্রাস করা সম্ভব।`;
  }
  return `Family lineage analysis indicates hereditary predisposition towards ${highRisks.map((h) => h.diseaseName).join(', ')}. Initiating baseline preventive screening at the recommended ages along with targeted lifestyle shielding can delay or prevent onset by up to 80%.`;
}
