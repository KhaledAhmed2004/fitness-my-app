/**
 * Types for Travel Health & Customs Medical Dossier
 */

export type TravelPurpose =
  | 'HAJJ_UMRAH'        // 🕋 পবিত্র হজ্ব ও ওমরাহ পালন
  | 'MEDICAL_TOURISM'   // 🏥 ভারত / ব্যাংকক / সিঙ্গাপুরে চিকিৎসা
  | 'VACATION'          // 🏖️ অবকাশ ও পর্যটন ভ্রমণ
  | 'BUSINESS_WORK'     // 💼 অফিশিয়াল ও ব্যবসায়িক ভ্রমণ
  | 'STUDENT_MIGRATION'; // 🎓 উচ্চশিক্ষা ও অভিবাসন

export interface TravelDestinationCountry {
  code: string;
  nameEn: string;
  nameBn: string;
  flagEmoji: string;
  hasSpecialHajjRules?: boolean;
  requiredVaccines: string[]; // e.g. ['MENINGITIS_ACWY', 'FLU', 'COVID']
  customsMaxSupplyDays: number; // e.g. 90 days
  controlledSubstanceLetterRequired: boolean;
  sharpsCoolerLetterRequired: boolean;
  specialCustomsNoteBn: string;
}

export interface DeclaredTravelMedicine {
  id: string;
  brandName: string;
  genericName: string;
  formFactor: string; // 'tablet', 'capsule', 'injection', 'inhaler', etc.
  strength: string; // e.g. '500 mg', '100 IU/ml'
  dailyFrequency: string; // e.g. '1+0+1 (After meal)'
  daysOfSupply: number; // e.g. 60 days
  quantityCarried: string; // e.g. '120 Tablets', '3 Insulin Pens'
  purpose: string; // e.g. 'Type 2 Diabetes Mellitus', 'Hypertension'
  isControlledOrInjectable: boolean;
  requiresCooling: boolean;
  doctorNotes?: string;
}

export interface TravelVaccineCertification {
  vaccineKey: string;
  nameEn: string;
  nameBn: string;
  status: 'VALID' | 'EXPIRED' | 'MISSING';
  dateAdministered?: string;
  validUntil?: string;
  batchNumber?: string;
  issuingAuthority?: string;
  isMandatoryForDestination: boolean;
  requirementNoteBn?: string;
}

export interface TravelMedicalDossier {
  id: string;
  dossierDate: string;
  travelerMemberId: string;
  travelerName: string;
  passportNumber: string;
  nidOrBirthCert?: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  purpose: TravelPurpose;
  destinationCountry: string;
  destinationCountryNameBn: string;
  destinationFlag: string;
  departureDate: string;
  returnDate: string;
  
  // Emergency Contacts
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  hotelOrDestinationAddress?: string;

  // Medical History
  activeConditions: string[];
  knownAllergies: string[];

  // Clinical & Customs Sections
  declaredMedicines: DeclaredTravelMedicine[];
  certifiedVaccines: TravelVaccineCertification[];

  // Attending Doctor Certification
  attendingDoctorName: string;
  doctorBmdcRegNo: string;
  doctorSpecialty: string;
  hospitalName: string;
  fitToFlyDeclarationBn: string;
  fitToFlyDeclarationEn: string;
}
