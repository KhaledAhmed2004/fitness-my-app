import { OsteoporosisEvaluation } from '@/types/osteoporosis-joint-shield';

/**
 * Simplified FRAX-based Fracture Risk Calculation
 */
export function evaluateFractureRisk(
  age: number,
  isFemale: boolean,
  isPostMenopausal: boolean,
  weightKg: number,
  hasPriorFracture: boolean,
  hasSteroidHistory: boolean
): OsteoporosisEvaluation {
  let hipRisk = 1.0;
  let majorRisk = 3.0;

  // Age weighting
  if (age >= 75) {
    hipRisk += 4.5;
    majorRisk += 8.0;
  } else if (age >= 65) {
    hipRisk += 3.0;
    majorRisk += 5.5;
  } else if (age >= 50) {
    hipRisk += 1.5;
    majorRisk += 3.0;
  }

  // Gender & Menopause
  if (isFemale) {
    majorRisk += 2.0;
    if (isPostMenopausal) {
      hipRisk += 2.0;
      majorRisk += 3.5;
    }
  }

  // Low BMI / Underweight (< 50kg for adult)
  if (weightKg < 48) {
    hipRisk += 2.0;
    majorRisk += 3.0;
  }

  // Prior fracture (huge multiplier)
  if (hasPriorFracture) {
    hipRisk += 5.0;
    majorRisk += 8.5;
  }

  // Steroid history
  if (hasSteroidHistory) {
    hipRisk += 2.5;
    majorRisk += 4.0;
  }

  const finalHipPct = Number(Math.min(25, hipRisk).toFixed(1));
  const finalMajorPct = Number(Math.min(40, majorRisk).toFixed(1));

  if (finalHipPct >= 5.0 || finalMajorPct >= 20.0 || hasPriorFracture) {
    return {
      riskLevel: 'HIGH_RISK',
      riskLabelBn: '🚨 উচ্চ হাড় ভাঙার ঝুঁকি (High Fracture Risk)',
      riskColor: '#EF4444',
      tenYearHipRiskPct: finalHipPct,
      tenYearMajorFracturePct: finalMajorPct,
      clinicalAdviceBn:
        'হাড়ের ঘনত্ব অত্যন্ত ভঙ্গুর সীমার মধ্যে থাকতে পারে। অতি দ্রুত অর্থোপেডিক বা রিউমাটোলজিস্ট দেখান এবং DEXA Scan (BMD Test) করিয়ে বিসফসফোনেট/ক্যালসিয়াম থেরাপি শুরু করুন।',
      dexaScanRecommended: true,
    };
  }

  if (finalHipPct >= 3.0 || finalMajorPct >= 10.0 || (isFemale && isPostMenopausal && age >= 60)) {
    return {
      riskLevel: 'MODERATE_RISK',
      riskLabelBn: '🟡 মাঝারি অস্টিওপেনিয়া ঝুঁকি (Moderate / Osteopenia)',
      riskColor: '#F59E0B',
      tenYearHipRiskPct: finalHipPct,
      tenYearMajorFracturePct: finalMajorPct,
      clinicalAdviceBn:
        'হাড়ের ক্ষয়রোধে প্রতিদিন সকালের রোদ, ছোট মাছের নরম কাঁটা ও তিল খান। চিকিৎসকের পরামর্শে ডেক্সা স্ক্যান (DEXA) বিবেচনা করুন।',
      dexaScanRecommended: true,
    };
  }

  return {
    riskLevel: 'LOW_RISK',
    riskLabelBn: '🟢 নিরাপদ ও স্বাভাবিক হাড়ের স্বাস্থ্য (Low Fracture Risk)',
    riskColor: '#10B981',
    tenYearHipRiskPct: finalHipPct,
    tenYearMajorFracturePct: finalMajorPct,
    clinicalAdviceBn:
      'আপনার হাড়ের ফ্র্যাকচার ঝুঁকি বর্তমানে স্বাভাবিক সীমার মধ্যে। পুষ্টিকর ক্যালসিয়াম খাদ্যাভ্যাস ও নিয়মিত ফিজিওথেরাপি ব্যায়াম অব্যাহত রাখুন।',
    dexaScanRecommended: false,
  };
}

/**
 * Format Orthopedic Summary for WhatsApp
 */
export function formatOrthopedicBoneSummary(
  evalResult: OsteoporosisEvaluation,
  painScore: number,
  stiffnessMins: number,
  affectedJoints: string[]
): string {
  const jointsStr =
    affectedJoints.length > 0 ? affectedJoints.join(', ') : 'হাঁটু জয়েন্ট';

  return `🦴 TrackMe Osteoporosis & Joint Pain Report
============================================================
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

🦴 ১০ বছরের হাড় ভাঙার ঝুঁকি (FRAX Model):
• ঝুঁকি স্ট্যাটাস: ${evalResult.riskLabelBn}
• হিপ ফ্র্যাকচার ঝুঁকি: ${evalResult.tenYearHipRiskPct}%
• মেজর অস্টিওপোরোটিক ফ্র্যাকচার ঝুঁকি: ${evalResult.tenYearMajorFracturePct}%
• DEXA স্ক্যান প্রয়োজন: ${evalResult.dexaScanRecommended ? '✅ হ্যাঁ, অবিলম্বে পরামর্শিত' : '❌ না, প্রয়োজন নেই'}

🦿 জয়েন্ট পেইন ও স্টিফনেস পর্যবেক্ষণ:
• আক্রান্ত জয়েন্ট: ${jointsStr}
• ব্যথার তীব্রতা (VAS Scale): ${painScore}/১০
• সকালের জয়েন্ট জ্যাম (Morning Stiffness): ${stiffnessMins} মিনিট

💡 বিশেষজ্ঞ পরামর্শ:
${evalResult.clinicalAdviceBn}
============================================================
TrackMe Osteoporosis & Joint Pain Shield`;
}
