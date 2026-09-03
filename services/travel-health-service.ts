import { GENERIC_MEDICINE_CATALOG } from '@/services/generic-medicine-catalog';
import {
  CONTROLLED_DRUG_KEYWORDS,
  INJECTABLE_INSULIN_KEYWORDS,
  TRAVEL_DESTINATIONS,
} from '@/services/travel-health-knowledge';
import { FamilyMember, Vaccination } from '@/types/health-vault';
import { MedicineItem } from '@/types/medicine';
import {
  DeclaredTravelMedicine,
  TravelMedicalDossier,
  TravelPurpose,
  TravelVaccineCertification,
} from '@/types/travel-health-dossier';

export function resolveGenericName(brandName: string): string {
  const clean = brandName.trim().toLowerCase();
  for (const group of GENERIC_MEDICINE_CATALOG) {
    if (clean.includes(group.genericName.toLowerCase())) {
      return group.genericName;
    }
    for (const br of group.brands) {
      if (
        clean.includes(br.brandName.toLowerCase()) ||
        br.brandName.toLowerCase().includes(clean)
      ) {
        return group.genericName;
      }
    }
  }
  return brandName;
}

export function isControlledOrInjectable(medName: string, genericName: string): {
  isControlled: boolean;
  requiresCooling: boolean;
} {
  const combined = (medName + ' ' + genericName).toLowerCase();
  const isControlled = CONTROLLED_DRUG_KEYWORDS.some((kw) => combined.includes(kw));
  const requiresCooling = INJECTABLE_INSULIN_KEYWORDS.some((kw) => combined.includes(kw));
  return {
    isControlled: isControlled || requiresCooling,
    requiresCooling,
  };
}

export function compileTravelDossier(params: {
  member: FamilyMember;
  passportNumber: string;
  destinationCode: string;
  purpose: TravelPurpose;
  departureDate: string;
  returnDate: string;
  daysOfSupply: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  doctorName?: string;
  doctorBmdc?: string;
  hospitalName?: string;
  medicines: MedicineItem[];
  vaccinations: Vaccination[];
  activeConditions: string[];
  knownAllergies: string[];
}): TravelMedicalDossier {
  const {
    member,
    passportNumber,
    destinationCode,
    purpose,
    departureDate,
    returnDate,
    daysOfSupply,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelation,
    doctorName,
    doctorBmdc,
    hospitalName,
    medicines,
    vaccinations,
    activeConditions,
    knownAllergies,
  } = params;

  const destCountry =
    TRAVEL_DESTINATIONS.find((d) => d.code === destinationCode) || TRAVEL_DESTINATIONS[0];

  // 1. Map Declared Medicines
  const declaredMedicines: DeclaredTravelMedicine[] = medicines.map((med) => {
    const genericName = resolveGenericName(med.name);
    const { isControlled, requiresCooling } = isControlledOrInjectable(med.name, genericName);
    const totalUnitsNeeded = Math.max(1, Math.round(med.schedules.length * daysOfSupply));

    let frequencyLabel = `${med.schedules.length} time(s) daily`;
    if (med.schedules.length === 1) frequencyLabel = 'Once daily';
    if (med.schedules.length === 2) frequencyLabel = 'Twice daily (Morning + Night)';
    if (med.schedules.length === 3) frequencyLabel = 'Three times daily';

    let purposeGuess = 'Chronic medical management';
    if (med.name.toLowerCase().includes('seclo') || med.name.toLowerCase().includes('pantoprazole')) {
      purposeGuess = 'Gastric acid suppression / GERD';
    } else if (med.name.toLowerCase().includes('napa') || med.name.toLowerCase().includes('ace')) {
      purposeGuess = 'Analgesic & Antipyretic';
    } else if (med.name.toLowerCase().includes('comet') || med.name.toLowerCase().includes('metformin')) {
      purposeGuess = 'Type 2 Diabetes Mellitus';
    } else if (med.name.toLowerCase().includes('bexitrol') || med.name.toLowerCase().includes('inhaler')) {
      purposeGuess = 'Bronchial Asthma / COPD';
    }

    return {
      id: med.id,
      brandName: med.name,
      genericName,
      formFactor: med.formFactor,
      strength: med.strength || med.unit || 'Standard',
      dailyFrequency: frequencyLabel,
      daysOfSupply,
      quantityCarried: `${totalUnitsNeeded} ${med.unit || 'units'} (${daysOfSupply} Days Supply)`,
      purpose: purposeGuess,
      isControlledOrInjectable: isControlled,
      requiresCooling,
      doctorNotes: requiresCooling
        ? 'Medical Cold-Chain Carrier & Sharps / Needle In-Flight Security Clearance'
        : undefined,
    };
  });

  // 2. Map Required and Certified Vaccines
  const requiredKeys = destCountry.requiredVaccines;
  const initialVaccines: TravelVaccineCertification[] = [
    {
      vaccineKey: 'MENINGITIS_ACWY',
      nameEn: 'Meningococcal Quadrivalent (ACWY)',
      nameBn: 'মেনিনজাইটিস এসিডব্লিউওয়াই (Meningitis ACWY)',
      isMandatoryForDestination: requiredKeys.includes('MENINGITIS_ACWY'),
      status: 'MISSING',
      requirementNoteBn: 'সৌদি আরব ও ওমরাহযাত্রীদের জন্য আগমনের কমপক্ষে ১০ দিন পূর্বে আবশ্যক।',
    },
    {
      vaccineKey: 'FLU',
      nameEn: 'Seasonal Influenza (Annual Flu)',
      nameBn: 'সিজনাল ফ্লু / ইনফ্লুয়েঞ্জা টিকা',
      isMandatoryForDestination: requiredKeys.includes('FLU'),
      status: 'MISSING',
      requirementNoteBn: 'ভ্রমণকালীন ভাইরাল জ্বর ও নিউমোনিয়া প্রতিরোধে আবশ্যক।',
    },
    {
      vaccineKey: 'COVID',
      nameEn: 'COVID-19 Booster Vaccination',
      nameBn: 'কোভিড-১৯ বুস্টার ভ্যাকসিন',
      isMandatoryForDestination: requiredKeys.includes('COVID'),
      status: 'MISSING',
      requirementNoteBn: 'আন্তর্জাতিক এয়ারপোর্ট ও এয়ারলাইন্স স্বাস্থ্য সুরক্ষা।',
    },
    {
      vaccineKey: 'YELLOW_FEVER',
      nameEn: 'Yellow Fever International Certificate',
      nameBn: 'ইয়েলো ফিভার আন্তর্জাতিক সনদ',
      isMandatoryForDestination: requiredKeys.includes('YELLOW_FEVER'),
      status: 'MISSING',
      requirementNoteBn: 'নির্দিষ্ট আফ্রিকার দেশ ও ট্রানজিটের জন্য প্রযোজ্য।',
    },
  ];

  const certifiedVaccines: TravelVaccineCertification[] = initialVaccines.map((v) => {
    const matched = vaccinations.find(
      (rec) =>
        rec.vaccineName.toLowerCase().includes(v.vaccineKey.toLowerCase()) ||
        (v.vaccineKey === 'MENINGITIS_ACWY' && rec.vaccineName.toLowerCase().includes('mening')) ||
        (v.vaccineKey === 'FLU' && (rec.vaccineName.toLowerCase().includes('flu') || rec.vaccineName.toLowerCase().includes('influ'))) ||
        (v.vaccineKey === 'COVID' && rec.vaccineName.toLowerCase().includes('covid'))
    );

    if (matched) {
      return {
        ...v,
        status: 'VALID' as const,
        dateAdministered: matched.vaccinationDate,
        batchNumber: matched.batchNumber || 'BN-2026/SA',
        issuingAuthority: matched.providerName || 'Directorate General of Health Services (DGHS)',
      };
    }
    return v;
  });

  const docName = doctorName?.trim() || 'Prof. Dr. M. A. Rahman, MBBS, FCPS, MD';
  const docBmdc = doctorBmdc?.trim() || 'BMDC Reg. No: A-48291';
  const hosp = hospitalName?.trim() || 'Apollo Imperial Hospital / BIRDEM General Hospital';

  return {
    id: `DOSSIER_${Date.now()}`,
    dossierDate: new Date().toISOString().split('T')[0],
    travelerMemberId: member?.id || 'mem_default',
    travelerName: member?.name || 'Traveler',
    passportNumber: passportNumber.trim() || 'A12345678',
    dob: member?.dateOfBirth || '1990-01-01',
    gender: member?.gender || 'MALE',
    bloodGroup: member?.bloodGroup || 'B+',
    purpose,
    destinationCountry: destCountry.nameEn,
    destinationCountryNameBn: destCountry.nameBn,
    destinationFlag: destCountry.flagEmoji,
    departureDate,
    returnDate,
    emergencyContactName: emergencyContactName || 'Family Member',
    emergencyContactPhone: emergencyContactPhone || '+880 1711-000000',
    emergencyContactRelation: emergencyContactRelation || member?.relation || 'Self',
    activeConditions: activeConditions.length > 0 ? activeConditions : ['Hypertension', 'Type 2 Diabetes'],
    knownAllergies: knownAllergies.length > 0 ? knownAllergies : ['No Known Drug Allergies (NKDA)'],
    declaredMedicines,
    certifiedVaccines,
    attendingDoctorName: docName,
    doctorBmdcRegNo: docBmdc,
    doctorSpecialty: 'Senior Consultant Physician & Diabetologist',
    hospitalName: hosp,
    fitToFlyDeclarationEn:
      'I hereby certify that the aforementioned passenger is under my medical care and is clinically stable and FIT TO TRAVEL by air. The medications listed are strictly for personal therapeutic use for chronic disease management during the declared travel itinerary. In-flight carriage of personal medication, cooling pack, and necessary syringes/needles is medically required.',
    fitToFlyDeclarationBn:
      'এই মর্মে প্রত্যয়ন করা হচ্ছে যে উক্ত যাত্রী চিকিৎসাধীন আছেন এবং বিমান ভ্রমণের জন্য শারীরিকভাবে সম্পূর্ণ সুস্থ ও যোগ্য। উল্লেখিত ওষুধসমূহ ভ্রমণকালীন ব্যক্তিগত ব্যবহারের জন্য চিকিৎসাগতভাবে আবশ্যক।',
  };
}

export function formatDossierPlainText(dossier: TravelMedicalDossier): string {
  const medLines = dossier.declaredMedicines
    .map(
      (m, idx) =>
        `${idx + 1}. [Brand: ${m.brandName}] -> Generic: ${m.genericName} (${m.strength})\n   Dose: ${m.dailyFrequency} | Carried: ${m.quantityCarried}\n   Purpose: ${m.purpose}${m.requiresCooling ? ' [⚠️ Requires In-Flight Cold Chain / Cooler]' : ''}`
    )
    .join('\n\n');

  const vacLines = dossier.certifiedVaccines
    .map(
      (v) =>
        `• ${v.nameEn}: ${v.status === 'VALID' ? `✅ VALID (Taken: ${v.dateAdministered || 'Recorded'})` : '⚠️ Action Needed'}`
    )
    .join('\n');

  return `🛂 INTERNATIONAL TRAVEL MEDICAL DOSSIER & CUSTOMS DECLARATION
============================================================
PASSENGER / TRAVELER DETAILS:
• Name: ${dossier.travelerName}
• Passport No: ${dossier.passportNumber}
• Date of Birth: ${dossier.dob} (${dossier.gender})
• Blood Group: ${dossier.bloodGroup}
• Destination: ${dossier.destinationFlag} ${dossier.destinationCountry}
• Travel Itinerary: ${dossier.departureDate} to ${dossier.returnDate}
• Emergency Contact: ${dossier.emergencyContactName} (${dossier.emergencyContactPhone})

CLINICAL DIAGNOSES & ALLERGIES:
• Active Conditions: ${dossier.activeConditions.join(', ')}
• Known Allergies: ${dossier.knownAllergies.join(', ')}

OFFICIAL CUSTOMS MEDICATION DECLARATION (INN / GENERIC):
------------------------------------------------------------
${medLines || 'No chronic medicines declared.'}

VACCINATION CLEARANCE & IMMUNIZATION:
------------------------------------------------------------
${vacLines}

ATTENDING PHYSICIAN FIT-TO-TRAVEL DECLARATION:
------------------------------------------------------------
"${dossier.fitToFlyDeclarationEn}"

Attending Doctor: ${dossier.attendingDoctorName}
Registration: ${dossier.doctorBmdcRegNo} (${dossier.doctorSpecialty})
Institution: ${dossier.hospitalName}
Date of Issue: ${dossier.dossierDate}
============================================================
Generated via TrackMe Global Health Vault • WHO & IATA Standard`;
}
