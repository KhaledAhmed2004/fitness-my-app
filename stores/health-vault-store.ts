import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Allergy,
  CareCalendarItem,
  DiagnosticTest,
  DiagnosticTestStatus,
  Doctor,
  EmergencyCardData,
  EmergencyProfileSettings,
  FamilyMember,
  FollowUp,
  HealthcareBudget,
  HealthcareProvider,
  HealthCondition,
  HospitalAdmission,
  LabResultEntry,
  MedicalDocument,
  MedicalDocumentType,
  MedicalEvent,
  MedicalExpense,
  MedicalSpendingSummary,
  PrescribedMedicineItem,
  Vaccination,
} from '@/types/health-vault';
import { DoctorConsultationRecording } from '@/types/voice-consultation';
import {
  AncestorConditionEntry,
  FamilyAncestorRecord,
  PreventiveScreeningMilestone,
} from '@/types/family-hereditary';
import { DEV_SEED_ANCESTORS } from '@/services/family-hereditary-service';
import { useMedicineStore } from '@/stores/medicine-store';

const HEALTH_VAULT_STORAGE_KEY = 'vital_health_vault_master_v2';

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

// ==========================================
// DEVELOPMENT DEMO SEED DATA (DEV_SEED_*)
// ==========================================

const DEV_SEED_MEMBERS: FamilyMember[] = [
  {
    id: 'mem_khaled',
    name: 'Khaled (Self)',
    relation: 'SELF',
    bloodGroup: 'B+',
    dateOfBirth: '1998-05-14',
    gender: 'MALE',
    emergencyContactName: 'Father',
    emergencyContactPhone: '+8801711223344',
    emergencyContactRelation: 'Father',
    avatarColor: '#38BDF8',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
  },
  {
    id: 'mem_father',
    name: 'Father (আব্বার স্বাস্থ্য)',
    relation: 'FATHER',
    bloodGroup: 'O+',
    dateOfBirth: '1962-11-20',
    gender: 'MALE',
    emergencyContactName: 'Khaled',
    emergencyContactPhone: '+8801700112233',
    emergencyContactRelation: 'Son',
    avatarColor: '#20C997',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
  },
  {
    id: 'mem_mother',
    name: 'Mother (আম্মার স্বাস্থ্য)',
    relation: 'MOTHER',
    bloodGroup: 'A+',
    dateOfBirth: '1968-03-12',
    gender: 'FEMALE',
    emergencyContactName: 'Khaled',
    emergencyContactPhone: '+8801700112233',
    emergencyContactRelation: 'Son',
    avatarColor: '#A78BFA',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
  },
];

const DEV_SEED_ALLERGIES: Allergy[] = [
  {
    id: 'alg_001',
    memberId: 'mem_father',
    allergen: 'Penicillin (পেনিসিলিন)',
    type: 'MEDICATION',
    severity: 'SEVERE',
    reaction: 'Severe skin rashes, hives and breathing difficulty',
    isCritical: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
  },
  {
    id: 'alg_002',
    memberId: 'mem_mother',
    allergen: 'Sulfa Drugs (সালফা ওষুধ)',
    type: 'MEDICATION',
    severity: 'MODERATE',
    reaction: 'Itching and facial swelling',
    isCritical: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
  },
  {
    id: 'alg_003',
    memberId: 'mem_khaled',
    allergen: 'Dust & Pollen (ধুলোবালি)',
    type: 'ENVIRONMENTAL',
    severity: 'MILD',
    reaction: 'Sneezing and runny nose',
    isCritical: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
];

const DEV_SEED_CONDITIONS: HealthCondition[] = [
  {
    id: 'cond_001',
    memberId: 'mem_father',
    conditionName: 'Hypertension (উচ্চ রক্তচাপ)',
    status: 'MANAGED',
    firstDiagnosedDate: '2020-03-15',
    notes: 'Takes Telmisartan 40mg daily morning. Regular BP monitoring advised.',
    isCritical: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
  },
  {
    id: 'cond_002',
    memberId: 'mem_father',
    conditionName: 'Type 2 Diabetes (ডায়াবেটিস)',
    status: 'MANAGED',
    firstDiagnosedDate: '2021-08-10',
    notes: 'Fasting blood sugar maintained at 6.0-6.8 mmol/L with diet and medication.',
    isCritical: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
  },
  {
    id: 'cond_003',
    memberId: 'mem_mother',
    conditionName: 'Osteoarthritis (হাঁটুর বাত/জয়েন্ট পেইন)',
    status: 'ACTIVE',
    firstDiagnosedDate: '2023-01-10',
    notes: 'Knee joint pain during cold weather and prolonged standing.',
    isCritical: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
  },
];

const DEV_SEED_PROVIDERS: HealthcareProvider[] = [
  {
    id: 'prov_doc_rahman',
    name: 'Prof. Dr. M. A. Rahman',
    type: 'DOCTOR',
    specialtyOrService: 'Cardiologist (হৃদরোগ বিশেষজ্ঞ)',
    hospitalOrClinic: 'Square Hospital, Dhaka',
    phone: '+8801711000000',
    address: 'Level 4, OPD Room 402, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath',
    rating: 4.9,
    totalVisits: 4,
  },
  {
    id: 'prov_doc_fatema',
    name: 'Dr. Fatema Begum',
    type: 'DOCTOR',
    specialtyOrService: 'General Medicine & Diabetologist',
    hospitalOrClinic: 'Ibn Sina Specialized Hospital',
    phone: '+8801819000000',
    address: 'House 48, Road 9/A, Dhanmondi, Dhaka',
    rating: 4.8,
    totalVisits: 2,
  },
  {
    id: 'prov_hosp_square',
    name: 'Square Hospital Immunization Center',
    type: 'HOSPITAL',
    specialtyOrService: 'Vaccination & Preventative Care',
    phone: '10616',
    address: '18/F Bir Uttam Qazi Nuruzzaman Sarak, Dhaka',
    rating: 4.9,
    totalVisits: 3,
  },
  {
    id: 'prov_lab_popular',
    name: 'Popular Diagnostic Center (Dhanmondi)',
    type: 'LAB',
    specialtyOrService: 'Automated Clinical Pathology & Imaging',
    phone: '09613787801',
    address: 'House 16, Road 2, Dhanmondi, Dhaka',
    rating: 4.7,
    totalVisits: 6,
  },
];

const DEV_SEED_DOCTORS: Doctor[] = [
  {
    id: 'doc_rahman',
    name: 'Prof. Dr. M. A. Rahman',
    specialty: 'Cardiologist (হৃদরোগ বিশেষজ্ঞ)',
    hospitalOrClinic: 'Square Hospital, Dhaka',
    chamberAddress: 'Level 4, OPD Room 402, 18/F Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath',
    phone: '+8801711000000',
    appointmentHotline: '10616',
    notes: 'Consultation time: Sun, Tue, Thu (5:00 PM - 9:00 PM)',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 180,
  },
  {
    id: 'doc_fatema',
    name: 'Dr. Fatema Begum',
    specialty: 'General Medicine & Diabetologist',
    hospitalOrClinic: 'Ibn Sina Specialized Hospital',
    chamberAddress: 'House 48, Road 9/A, Dhanmondi, Dhaka',
    phone: '+8801819000000',
    appointmentHotline: '10615',
    notes: 'Friendly consultation, visits every afternoon',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 120,
  },
  {
    id: 'doc_huda',
    name: 'Dr. Shamsul Huda',
    specialty: 'Orthopedic & Joint Specialist',
    hospitalOrClinic: 'Popular Diagnostic Center, Dhanmondi',
    chamberAddress: 'Unit 1, House 16, Road 2, Dhanmondi',
    phone: '+8801912000000',
    appointmentHotline: '09613787801',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
  },
];

const DEV_SEED_VACCINATIONS: Vaccination[] = [
  {
    id: 'vac_001',
    memberId: 'mem_khaled',
    vaccineName: 'COVID-19 Booster (Pfizer-BioNTech)',
    doseNumber: 3,
    totalDoses: 3,
    vaccinationDate: '2025-11-20',
    providerId: 'prov_hosp_square',
    providerName: 'Square Hospital Immunization Center',
    batchNumber: 'PF-2025-883A',
    notes: 'Administered in left deltoid. Mild soreness for 24 hours.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 280).toISOString(),
  },
  {
    id: 'vac_002',
    memberId: 'mem_father',
    vaccineName: 'Influenza / Flu Vaccine (Annual)',
    doseNumber: 1,
    totalDoses: 1,
    vaccinationDate: '2025-10-15',
    nextDueDate: '2026-10-15',
    providerId: 'prov_hosp_square',
    providerName: 'Square Hospital Immunization Center',
    notes: 'Annual seasonal flu vaccine for senior cardiac patients.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 310).toISOString(),
  },
  {
    id: 'vac_003',
    memberId: 'mem_father',
    vaccineName: 'Hepatitis B (Recombinant)',
    doseNumber: 2,
    totalDoses: 3,
    vaccinationDate: '2026-06-10',
    nextDueDate: '2026-12-10',
    providerId: 'prov_lab_popular',
    providerName: 'Popular Diagnostic Center',
    notes: 'Dose 2 completed. Booster Dose 3 due in 6 months.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
  },
];

const DEV_SEED_EMERGENCY_SETTINGS: Record<string, EmergencyProfileSettings> = {
  mem_khaled: {
    memberId: 'mem_khaled',
    enabled: true,
    showBloodGroup: true,
    showCriticalAllergies: true,
    showCriticalConditions: true,
    showActiveMedications: true,
    emergencyContactName: 'Father',
    emergencyContactPhone: '+8801711223344',
    emergencyContactRelation: 'Father',
    qrToken: 'emg_khaled_secure_88f9a',
    lastVerifiedAt: '2026-08-29',
  },
  mem_father: {
    memberId: 'mem_father',
    enabled: true,
    showBloodGroup: true,
    showCriticalAllergies: true,
    showCriticalConditions: true,
    showActiveMedications: true,
    emergencyContactName: 'Khaled',
    emergencyContactPhone: '+8801700112233',
    emergencyContactRelation: 'Son',
    qrToken: 'emg_father_secure_33b7c',
    lastVerifiedAt: '2026-08-29',
  },
  mem_mother: {
    memberId: 'mem_mother',
    enabled: true,
    showBloodGroup: true,
    showCriticalAllergies: true,
    showCriticalConditions: true,
    showActiveMedications: true,
    emergencyContactName: 'Khaled',
    emergencyContactPhone: '+8801700112233',
    emergencyContactRelation: 'Son',
    qrToken: 'emg_mother_secure_11e2d',
    lastVerifiedAt: '2026-08-29',
  },
};

const DEV_SEED_DOCUMENTS: MedicalDocument[] = [
  {
    id: 'doc_pres_001',
    memberId: 'mem_father',
    eventId: 'evt_001',
    type: 'PRESCRIPTION',
    title: 'Dr. Rahman Cardiology Prescription',
    documentDate: '2026-07-15',
    doctorId: 'doc_rahman',
    labOrHospital: 'Square Hospital',
    fileUri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    tags: ['Prescription', 'Cardiology', 'BP Check'],
    cost: 1500,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
  },
  {
    id: 'doc_lab_001',
    memberId: 'mem_father',
    eventId: 'evt_001',
    type: 'LAB_REPORT',
    title: 'Lipid Profile & Serum Creatinine Report',
    documentDate: '2026-07-16',
    doctorId: 'doc_rahman',
    labOrHospital: 'Popular Diagnostic Center',
    fileUri: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    tags: ['Lab Report', 'Cholesterol', 'Creatinine'],
    cost: 1800,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 44,
  },
  {
    id: 'doc_pres_002',
    memberId: 'mem_khaled',
    eventId: 'evt_002',
    type: 'PRESCRIPTION',
    title: 'Viral Fever & Throat Infection Prescription',
    documentDate: '2026-08-10',
    doctorId: 'doc_fatema',
    labOrHospital: 'Ibn Sina Specialized Hospital',
    fileUri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    tags: ['Prescription', 'Fever', 'Antibiotic'],
    cost: 1000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
  {
    id: 'doc_lab_002',
    memberId: 'mem_khaled',
    eventId: 'evt_002',
    type: 'LAB_REPORT',
    title: 'Complete Blood Count (CBC) Report',
    documentDate: '2026-08-10',
    doctorId: 'doc_fatema',
    labOrHospital: 'Ibn Sina Diagnostic Center',
    fileUri: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    fileType: 'image',
    tags: ['CBC', 'Blood Count', 'Platelet'],
    cost: 500,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
];

const DEV_SEED_TESTS: DiagnosticTest[] = [
  {
    id: 'test_001',
    eventId: 'evt_001',
    memberId: 'mem_father',
    testName: 'Lipid Profile (লিপিড প্রোফাইল)',
    testCategory: 'BLOOD',
    testDate: '2026-07-16',
    labOrHospital: 'Popular Diagnostic Center',
    doctorId: 'doc_rahman',
    status: 'COMPLETED',
    documentId: 'doc_lab_001',
    cost: 1200,
    notes: 'Total Cholesterol 185 mg/dL, HDL 42, LDL 110 (Normal)',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 44,
  },
  {
    id: 'test_002',
    eventId: 'evt_001',
    memberId: 'mem_father',
    testName: 'Serum Creatinine (কিডনি ফাংশন)',
    testCategory: 'BLOOD',
    testDate: '2026-07-16',
    labOrHospital: 'Popular Diagnostic Center',
    doctorId: 'doc_rahman',
    status: 'COMPLETED',
    documentId: 'doc_lab_001',
    cost: 600,
    notes: 'Creatinine 1.1 mg/dL (Normal Range 0.7 - 1.3)',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 44,
  },
  {
    id: 'test_003',
    eventId: 'evt_002',
    memberId: 'mem_khaled',
    testName: 'Complete Blood Count (CBC)',
    testCategory: 'BLOOD',
    testDate: '2026-08-10',
    labOrHospital: 'Ibn Sina Diagnostic Center',
    doctorId: 'doc_fatema',
    status: 'COMPLETED',
    documentId: 'doc_lab_002',
    cost: 500,
    notes: 'Hb 14.2 g/dL, Total WBC 8,200/cumm, Platelets 2.8 Lakhs',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
  {
    id: 'test_004',
    eventId: 'evt_001',
    memberId: 'mem_father',
    testName: 'HbA1c Glycated Hemoglobin',
    testCategory: 'BLOOD',
    testDate: '2026-08-25',
    labOrHospital: 'Square Hospital Lab',
    doctorId: 'doc_rahman',
    status: 'PENDING',
    cost: 1000,
    notes: 'Quarterly diabetes control checkup',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
];

const DEV_SEED_LAB_RESULTS: LabResultEntry[] = [
  {
    id: 'res_001',
    memberId: 'mem_father',
    testName: 'HbA1c Glycated Hemoglobin',
    analyteCode: 'HBA1C',
    analyteName: 'HbA1c',
    valueType: 'NUMERIC',
    numericValue: 7.8,
    unit: '%',
    referenceRange: { min: 4.0, max: 5.6, text: 'Normal: 4.0–5.6%' },
    referenceSource: 'Square Hospital Laboratory',
    testDate: '2025-12-10',
    notes: 'Initial diagnosis baseline before lifestyle & medication regimen',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 260).toISOString(),
  },
  {
    id: 'res_002',
    memberId: 'mem_father',
    testName: 'HbA1c Glycated Hemoglobin',
    analyteCode: 'HBA1C',
    analyteName: 'HbA1c',
    valueType: 'NUMERIC',
    numericValue: 7.2,
    unit: '%',
    referenceRange: { min: 4.0, max: 5.6, text: 'Normal: 4.0–5.6%' },
    referenceSource: 'Popular Diagnostic Center',
    testDate: '2026-04-15',
    notes: 'Significant improvement after 3 months of regular exercise',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 135).toISOString(),
  },
  {
    id: 'res_003',
    memberId: 'mem_father',
    testName: 'HbA1c Glycated Hemoglobin',
    analyteCode: 'HBA1C',
    analyteName: 'HbA1c',
    valueType: 'NUMERIC',
    numericValue: 6.8,
    unit: '%',
    referenceRange: { min: 4.0, max: 5.6, text: 'Normal: 4.0–5.6%' },
    referenceSource: 'Popular Diagnostic Center',
    testDate: '2026-07-16',
    diagnosticTestId: 'test_001',
    documentId: 'doc_lab_001',
    notes: 'Target glycemic control achieved. Maintained below 7.0%',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 44).toISOString(),
  },
  {
    id: 'res_004',
    memberId: 'mem_father',
    testName: 'Serum Creatinine',
    analyteCode: 'CREATININE',
    analyteName: 'Serum Creatinine',
    valueType: 'NUMERIC',
    numericValue: 1.2,
    unit: 'mg/dL',
    referenceRange: { min: 0.7, max: 1.3, text: 'Normal: 0.7–1.3 mg/dL' },
    referenceSource: 'Square Hospital Laboratory',
    testDate: '2026-04-15',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 135).toISOString(),
  },
  {
    id: 'res_005',
    memberId: 'mem_father',
    testName: 'Serum Creatinine',
    analyteCode: 'CREATININE',
    analyteName: 'Serum Creatinine',
    valueType: 'NUMERIC',
    numericValue: 1.1,
    unit: 'mg/dL',
    referenceRange: { min: 0.7, max: 1.3, text: 'Normal: 0.7–1.3 mg/dL' },
    referenceSource: 'Popular Diagnostic Center',
    testDate: '2026-07-16',
    diagnosticTestId: 'test_002',
    documentId: 'doc_lab_001',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 44).toISOString(),
  },
  {
    id: 'res_006',
    memberId: 'mem_father',
    testName: 'Lipid Profile - Total Cholesterol',
    analyteCode: 'CHOLESTEROL_TOTAL',
    analyteName: 'Total Cholesterol',
    valueType: 'NUMERIC',
    numericValue: 215,
    unit: 'mg/dL',
    referenceRange: { max: 200, text: 'Desirable: <200 mg/dL' },
    referenceSource: 'Square Hospital Laboratory',
    testDate: '2026-04-15',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 135).toISOString(),
  },
  {
    id: 'res_007',
    memberId: 'mem_father',
    testName: 'Lipid Profile - Total Cholesterol',
    analyteCode: 'CHOLESTEROL_TOTAL',
    analyteName: 'Total Cholesterol',
    valueType: 'NUMERIC',
    numericValue: 185,
    unit: 'mg/dL',
    referenceRange: { max: 200, text: 'Desirable: <200 mg/dL' },
    referenceSource: 'Popular Diagnostic Center',
    testDate: '2026-07-16',
    diagnosticTestId: 'test_001',
    documentId: 'doc_lab_001',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 44).toISOString(),
  },
  {
    id: 'res_008',
    memberId: 'mem_khaled',
    testName: 'Complete Blood Count - Hemoglobin',
    analyteCode: 'HEMOGLOBIN',
    analyteName: 'Hemoglobin (Hb)',
    valueType: 'NUMERIC',
    numericValue: 13.8,
    unit: 'g/dL',
    referenceRange: { min: 13.0, max: 17.0, text: 'Normal: 13.0–17.0 g/dL' },
    referenceSource: 'Ibn Sina Diagnostic Center',
    testDate: '2026-02-10',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
  },
  {
    id: 'res_009',
    memberId: 'mem_khaled',
    testName: 'Complete Blood Count - Hemoglobin',
    analyteCode: 'HEMOGLOBIN',
    analyteName: 'Hemoglobin (Hb)',
    valueType: 'NUMERIC',
    numericValue: 14.2,
    unit: 'g/dL',
    referenceRange: { min: 13.0, max: 17.0, text: 'Normal: 13.0–17.0 g/dL' },
    referenceSource: 'Ibn Sina Diagnostic Center',
    testDate: '2026-08-10',
    diagnosticTestId: 'test_003',
    documentId: 'doc_lab_002',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
];

const DEV_SEED_FOLLOWUPS: FollowUp[] = [
  {
    id: 'flw_001',
    eventId: 'evt_001',
    memberId: 'mem_father',
    doctorId: 'doc_rahman',
    doctorName: 'Prof. Dr. M. A. Rahman',
    dueDate: '2026-10-15',
    reason: '3-Month Hypertension & Lipid Review with fresh reports',
    status: 'UPCOMING',
    reminderDaysBefore: [7, 3, 1],
    notes: 'Bring fresh Serum Creatinine & Lipid profile before visit.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
  },
  {
    id: 'flw_002',
    eventId: 'evt_002',
    memberId: 'mem_khaled',
    doctorId: 'doc_fatema',
    doctorName: 'Dr. Fatema Begum',
    dueDate: '2026-08-17',
    reason: 'Fever recovery review',
    status: 'COMPLETED',
    completedDate: '2026-08-17',
    reminderDaysBefore: [1],
    notes: 'Fever subsided completely. Throat clear.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
];

const DEV_SEED_EXPENSES: MedicalExpense[] = [
  // --- 2026 EXPENSES (Total: ~৳44,300) ---
  // Father (৳18,000)
  {
    id: 'exp_001',
    eventId: 'evt_001',
    memberId: 'mem_father',
    category: 'DOCTOR_VISIT',
    amount: 3000,
    date: '2026-07-15',
    providerName: 'Prof. Dr. M. A. Rahman Consultation',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
  },
  {
    id: 'exp_002',
    eventId: 'evt_001',
    memberId: 'mem_father',
    category: 'DIAGNOSTIC_TEST',
    amount: 5400,
    date: '2026-07-16',
    providerName: 'Popular Diagnostic (Echo + Lipid + Creatinine)',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 44,
  },
  {
    id: 'exp_003',
    eventId: 'evt_001',
    memberId: 'mem_father',
    category: 'MEDICINE',
    amount: 7600,
    date: '2026-07-16',
    providerName: 'Square Pharmacy (Cardio & Diabetes 6-Mo Refill)',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 44,
  },
  {
    id: 'exp_003b',
    memberId: 'mem_father',
    category: 'HOSPITALIZATION',
    amount: 2000,
    date: '2026-05-12',
    providerName: 'Day Care Observation & Infusion',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 100,
  },

  // Mother (৳14,000)
  {
    id: 'exp_007',
    memberId: 'mem_mother',
    category: 'DOCTOR_VISIT',
    amount: 2500,
    date: '2026-06-10',
    providerName: 'Orthopedic Specialist Consultation',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 80,
  },
  {
    id: 'exp_008',
    memberId: 'mem_mother',
    category: 'DIAGNOSTIC_TEST',
    amount: 4200,
    date: '2026-06-12',
    providerName: 'Knee X-Ray & Bone Mineral Density',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 78,
  },
  {
    id: 'exp_009',
    memberId: 'mem_mother',
    category: 'MEDICINE',
    amount: 5800,
    date: '2026-06-15',
    providerName: 'Labaid Pharmacy (Calcium, Vit D & Collagen)',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 75,
  },
  {
    id: 'exp_009b',
    memberId: 'mem_mother',
    category: 'HOSPITALIZATION',
    amount: 1500,
    date: '2026-03-20',
    providerName: 'Physiotherapy & Rehabilitation Center',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 160,
  },

  // Khaled (৳9,000)
  {
    id: 'exp_004',
    eventId: 'evt_002',
    memberId: 'mem_khaled',
    category: 'DOCTOR_VISIT',
    amount: 1500,
    date: '2026-08-10',
    providerName: 'Dr. Fatema Begum Consultation',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
  {
    id: 'exp_005',
    eventId: 'evt_002',
    memberId: 'mem_khaled',
    category: 'DIAGNOSTIC_TEST',
    amount: 1800,
    date: '2026-08-10',
    providerName: 'Ibn Sina CBC & Serum Electrolytes',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
  {
    id: 'exp_006',
    eventId: 'evt_002',
    memberId: 'mem_khaled',
    category: 'MEDICINE',
    amount: 3900,
    date: '2026-08-10',
    providerName: 'Tamanna Pharmacy (Antibiotics & Pain)',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
  {
    id: 'exp_006b',
    memberId: 'mem_khaled',
    category: 'HOSPITALIZATION',
    amount: 1800,
    date: '2026-04-05',
    providerName: 'Emergency Wound Dressing & Tetanus',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 145,
  },

  // Child (৳3,300)
  {
    id: 'exp_010',
    memberId: 'mem_child',
    category: 'DOCTOR_VISIT',
    amount: 1000,
    date: '2026-05-18',
    providerName: 'Pediatrician Routine Growth Check',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 100,
  },
  {
    id: 'exp_011',
    memberId: 'mem_child',
    category: 'DIAGNOSTIC_TEST',
    amount: 1000,
    date: '2026-05-18',
    providerName: 'Routine Urine Routine & Blood Grouping',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 100,
  },
  {
    id: 'exp_012',
    memberId: 'mem_child',
    category: 'MEDICINE',
    amount: 1300,
    date: '2026-05-18',
    providerName: 'Pediatric Vitamins & Probiotics Syrup',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 100,
  },

  // --- 2025 EXPENSES (Total: ৳38,500) ---
  {
    id: 'exp_2025_001',
    memberId: 'mem_father',
    category: 'DOCTOR_VISIT',
    amount: 2500,
    date: '2025-09-10',
    providerName: 'Prof. Dr. Rahman Annual Review',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 350,
  },
  {
    id: 'exp_2025_002',
    memberId: 'mem_father',
    category: 'DIAGNOSTIC_TEST',
    amount: 4800,
    date: '2025-09-12',
    providerName: 'Popular Diagnostic (Lipid Profile & USG)',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 348,
  },
  {
    id: 'exp_2025_003',
    memberId: 'mem_father',
    category: 'MEDICINE',
    amount: 7200,
    date: '2025-09-15',
    providerName: 'Square Pharmacy BP Refill',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 345,
  },
  {
    id: 'exp_2025_004',
    memberId: 'mem_mother',
    category: 'DOCTOR_VISIT',
    amount: 2000,
    date: '2025-10-05',
    providerName: 'Rheumatologist Consultation',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 328,
  },
  {
    id: 'exp_2025_005',
    memberId: 'mem_mother',
    category: 'DIAGNOSTIC_TEST',
    amount: 3800,
    date: '2025-10-06',
    providerName: 'Joint X-Rays & Uric Acid Test',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 327,
  },
  {
    id: 'exp_2025_006',
    memberId: 'mem_mother',
    category: 'MEDICINE',
    amount: 5200,
    date: '2025-10-08',
    providerName: 'Pharmacy Osteo Refill',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 325,
  },
  {
    id: 'exp_2025_007',
    memberId: 'mem_khaled',
    category: 'DOCTOR_VISIT',
    amount: 1500,
    date: '2025-11-12',
    providerName: 'General Physician Consultation',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 290,
  },
  {
    id: 'exp_2025_008',
    memberId: 'mem_khaled',
    category: 'DIAGNOSTIC_TEST',
    amount: 1500,
    date: '2025-11-12',
    providerName: 'Routine Blood Test Panel',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 290,
  },
  {
    id: 'exp_2025_009',
    memberId: 'mem_khaled',
    category: 'MEDICINE',
    amount: 3000,
    date: '2025-11-14',
    providerName: 'Pharmacy General Medicines',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 288,
  },
  {
    id: 'exp_2025_010',
    memberId: 'mem_father',
    category: 'HOSPITALIZATION',
    amount: 7000,
    date: '2025-06-20',
    providerName: 'Inpatient Cardiac Monitoring (1 Night)',
    syncedToExpenseTracker: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 435,
  },
];

const DEV_SEED_EVENTS: MedicalEvent[] = [
  {
    id: 'evt_001',
    memberId: 'mem_father',
    title: 'Cardiology Routine Checkup & BP Review',
    eventDate: '2026-07-15',
    doctorId: 'doc_rahman',
    doctorName: 'Prof. Dr. M. A. Rahman',
    specialty: 'Cardiologist',
    hospitalOrClinic: 'Square Hospital',
    diagnosisOrReason: 'Hypertension routine 6-month checkup, mild chest heaviness on exertion.',
    vitalSigns: {
      bloodPressure: '135/85',
      pulse: 74,
      weightKg: 68,
      bloodSugarMmol: 6.4,
    },
    notes: 'Advised low sodium diet, 30 min brisk morning walk daily.',
    documentIds: ['doc_pres_001', 'doc_lab_001'],
    testIds: ['test_001', 'test_002'],
    prescribedMedicines: [
      { name: 'Telmisartan 40mg', dosage: '1+0+0', duration: '3 months', instructions: 'Morning after breakfast', syncedToCabinet: true },
      { name: 'Atorvastatin 10mg', dosage: '0+0+1', duration: '3 months', instructions: 'Night after dinner', syncedToCabinet: true },
      { name: 'Eco-Card 75mg', dosage: '0+1+0', duration: '3 months', instructions: 'After lunch', syncedToCabinet: true },
    ],
    totalCost: 5700,
    followUpId: 'flw_001',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 44,
  },
  {
    id: 'evt_002',
    memberId: 'mem_khaled',
    title: 'Seasonal Viral Fever & Pharyngitis',
    eventDate: '2026-08-10',
    doctorId: 'doc_fatema',
    doctorName: 'Dr. Fatema Begum',
    specialty: 'General Medicine',
    hospitalOrClinic: 'Ibn Sina Specialized Hospital',
    diagnosisOrReason: 'High grade fever (102°F) with sore throat and body ache for 3 days.',
    vitalSigns: {
      bloodPressure: '120/80',
      pulse: 88,
      temperatureF: 102,
      weightKg: 72,
    },
    notes: 'Advised warm saline gargle 3 times daily and plenty of fluids.',
    documentIds: ['doc_pres_002', 'doc_lab_002'],
    testIds: ['test_003'],
    prescribedMedicines: [
      { name: 'Napa Extend 665mg', dosage: '1+1+1', duration: '5 days', instructions: 'After meals', syncedToCabinet: true },
      { name: 'Fexo 120mg', dosage: '0+0+1', duration: '7 days', instructions: 'At bedtime', syncedToCabinet: true },
      { name: 'Moxaclav 625mg', dosage: '1+0+1', duration: '5 days', instructions: 'After meal with water', syncedToCabinet: true },
    ],
    totalCost: 2250,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
];

const DEV_SEED_BUDGET: HealthcareBudget = {
  id: 'bg_2026',
  year: 2026,
  annualBudget: 60000, // 60,000 BDT
  thresholdAlertPercent: 80, // 80% guardrail
  emergencyReserveAllocated: 20000,
  notes: 'Annual family medical & chronic disease budget',
  updatedAt: '2026-08-29',
};

const DEV_SEED_ADMISSIONS: HospitalAdmission[] = [
  {
    id: 'adm_001',
    memberId: 'mem_father',
    hospitalName: 'Square Hospital, Dhaka',
    admissionDate: '2025-11-20',
    dischargeDate: '2025-11-24',
    reason: 'Hypertensive Urgency & Chest Discomfort Observation',
    department: 'Cardiology (CCU & Stepdown)',
    doctorInCharge: 'Prof. Dr. M. A. Rahman',
    cabinOrBedNo: 'Cabin 712',
    dischargeSummaryDocId: 'doc_pres_001',
    totalHospitalBill: 45000,
    insuranceClaimed: 0,
    outOfPocketPaid: 45000,
    status: 'DISCHARGED',
    notes: 'Discharged stable. Advised regular BP monitoring and cardiology follow-up.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 280).toISOString(),
  },
];

const DEV_SEED_CONSULTATIONS: DoctorConsultationRecording[] = [
  {
    id: 'rec_001',
    memberId: 'mem_father',
    title: 'Hypertension & Lipid Follow-up Consultation',
    doctorName: 'Prof. Dr. M. A. Rahman',
    specialty: 'Cardiology',
    hospitalOrClinic: 'National Heart Foundation, Dhaka',
    recordedAt: '2026-08-20T10:30:00.000Z',
    durationSeconds: 194, // ~3 mins 14s
    status: 'SUMMARIZED',
    tags: ['Cardiology', 'BP', 'Diet', 'Lipid'],
    isSyncedToTimeline: true,
    summary: {
      chiefComplaints: [
        'Occasional palpitation during morning walks',
        'Mild occipital heaviness when waking up',
      ],
      doctorDiagnosis: 'Grade 1 Essential Hypertension with Controlled Sinus Rhythm',
      keyAdvicePoints: [
        'Strictly avoid table salt and spicy oily gravies',
        'Daily 30 minutes morning brisk walk',
        'Measure BP twice weekly in the morning before breakfast',
      ],
      dietAndLifestyleRestrictions: [
        '❌ No added table salt, pickles, or salted snacks',
        '❌ Avoid smoking and restrict excessive caffeine',
        '✅ Eat green leafy vegetables, garlic, and oats',
      ],
      medicationInstructions: [
        {
          medicineName: 'Olmesartan 20mg (Olmetec)',
          dosage: '1+0+0',
          timing: 'Morning after breakfast',
          duration: '30 days',
          notes: 'Blood pressure control',
        },
        {
          medicineName: 'Rosuvastatin 10mg (Lipicon)',
          dosage: '0+0+1',
          timing: 'Night after dinner',
          duration: '30 days',
          notes: 'Cholesterol regulation',
        },
      ],
      advisedInvestigations: [
        'Echocardiography with Color Doppler',
        'Fasting Lipid Profile',
        'Serum Creatinine',
      ],
      redFlagWarningSymptoms: [
        '🚨 Severe retrosternal chest tightness radiating to left shoulder',
        '🚨 Sudden shortness of breath or dizziness',
      ],
      followUpTimeline: 'Review after 3 weeks with fresh Lipid Profile & Echo report.',
      aiClinicalInsight:
        'Physician confirmed BP is responding well to Olmesartan. Main focus is maintaining low-sodium diet and monitoring lipid panel.',
    },
  },
];

// ==========================================
// STORE INTERFACE & IMPLEMENTATION
// ==========================================

interface HealthVaultState {
  members: FamilyMember[];
  selectedMemberId: string | 'ALL';
  events: MedicalEvent[];
  documents: MedicalDocument[];
  doctors: Doctor[];
  providers: HealthcareProvider[];
  diagnosticTests: DiagnosticTest[];
  followUps: FollowUp[];
  expenses: MedicalExpense[];
  allergies: Allergy[];
  healthConditions: HealthCondition[];
  vaccinations: Vaccination[];
  labResults: LabResultEntry[];
  emergencySettings: Record<string, EmergencyProfileSettings>;
  budget: HealthcareBudget;
  admissions: HospitalAdmission[];
  consultations: DoctorConsultationRecording[];
  ancestors: FamilyAncestorRecord[];
  isLoading: boolean;

  // Actions
  loadData: () => Promise<void>;
  setSelectedMemberId: (id: string | 'ALL') => void;
  setHealthcareBudget: (budget: Partial<HealthcareBudget>) => Promise<void>;

  // Family Members
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'createdAt'>) => Promise<string>;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;

  // Allergies & Conditions
  addAllergy: (allergy: Omit<Allergy, 'id' | 'createdAt'>) => Promise<string>;
  updateAllergy: (id: string, updates: Partial<Allergy>) => Promise<void>;
  removeAllergy: (id: string) => Promise<void>;

  addHealthCondition: (condition: Omit<HealthCondition, 'id' | 'createdAt'>) => Promise<string>;
  updateHealthCondition: (id: string, updates: Partial<HealthCondition>) => Promise<void>;
  removeHealthCondition: (id: string) => Promise<void>;

  // Vaccinations
  addVaccination: (vaccination: Omit<Vaccination, 'id' | 'createdAt'>) => Promise<string>;
  updateVaccination: (id: string, updates: Partial<Vaccination>) => Promise<void>;
  deleteVaccination: (id: string) => Promise<void>;

  // Lab Results & Biomarkers
  addLabResult: (res: Omit<LabResultEntry, 'id' | 'createdAt'>) => Promise<string>;
  updateLabResult: (id: string, updates: Partial<LabResultEntry>) => Promise<void>;
  deleteLabResult: (id: string) => Promise<void>;

  // Hospital Admissions & Inpatient Surgeries
  addHospitalAdmission: (adm: Omit<HospitalAdmission, 'id' | 'createdAt'>) => Promise<string>;
  updateHospitalAdmission: (id: string, updates: Partial<HospitalAdmission>) => Promise<void>;
  deleteHospitalAdmission: (id: string) => Promise<void>;

  // Emergency Profile
  updateEmergencySettings: (memberId: string, settings: Partial<EmergencyProfileSettings>) => Promise<void>;
  regenerateEmergencyQrToken: (memberId: string) => Promise<string>;
  verifyEmergencyProfile: (memberId: string) => Promise<void>;

  // Providers & Doctors
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt'>) => Promise<string>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;

  addProvider: (provider: Omit<HealthcareProvider, 'id'>) => Promise<string>;
  updateProvider: (id: string, updates: Partial<HealthcareProvider>) => Promise<void>;

  // Medical Events (Backbone)
  addMedicalEvent: (event: Omit<MedicalEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMedicalEvent: (id: string, updates: Partial<MedicalEvent>) => Promise<void>;
  deleteMedicalEvent: (id: string) => Promise<void>;

  // Documents
  addMedicalDocument: (doc: Omit<MedicalDocument, 'id' | 'createdAt'>) => Promise<string>;
  deleteMedicalDocument: (id: string) => Promise<void>;

  // Diagnostic Tests
  addDiagnosticTest: (test: Omit<DiagnosticTest, 'id' | 'createdAt'>) => Promise<string>;
  updateDiagnosticTestStatus: (testId: string, status: DiagnosticTestStatus, documentId?: string) => Promise<void>;
  deleteDiagnosticTest: (testId: string) => Promise<void>;

  // Follow-ups
  addFollowUp: (followUp: Omit<FollowUp, 'id' | 'createdAt'>) => Promise<string>;
  completeFollowUp: (id: string) => Promise<void>;
  rescheduleFollowUp: (id: string, newDueDate: string) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;

  // Expenses
  addMedicalExpense: (exp: Omit<MedicalExpense, 'id' | 'createdAt'>) => Promise<string>;
  deleteMedicalExpense: (id: string) => Promise<void>;

  // Cross-Module Integrations
  syncMedicinesToCabinet: (medicines: PrescribedMedicineItem[]) => Promise<number>;
  syncExpenseToExpenseTracker: (exp: MedicalExpense) => Promise<void>;

  // Filtered Getters & Selectors
  getTimelineEvents: (memberId?: string | 'ALL') => MedicalEvent[];
  getDocuments: (memberId?: string | 'ALL', type?: MedicalDocumentType) => MedicalDocument[];
  getUpcomingFollowUps: (memberId?: string | 'ALL') => FollowUp[];
  getPendingDiagnosticTests: (memberId?: string | 'ALL') => DiagnosticTest[];
  getAllergies: (memberId?: string | 'ALL') => Allergy[];
  getHealthConditions: (memberId?: string | 'ALL') => HealthCondition[];
  getVaccinations: (memberId?: string | 'ALL') => Vaccination[];
  getUpcomingVaccinations: (memberId?: string | 'ALL') => Vaccination[];
  getLabResults: (memberId?: string | 'ALL', analyteCode?: string) => LabResultEntry[];
  getAvailableAnalytes: (memberId?: string | 'ALL') => {
    code: string;
    name: string;
    unit: string;
    count: number;
    latestValue?: number;
    latestDate?: string;
  }[];
  getHospitalAdmissions: (memberId?: string | 'ALL') => HospitalAdmission[];
  getCareCalendarEvents: (memberId?: string | 'ALL') => CareCalendarItem[];
  getEmergencyCardData: (memberId: string) => EmergencyCardData;
  getMedicalSpendingSummary: (memberId?: string | 'ALL', year?: number) => MedicalSpendingSummary;

  // Doctor Voice Consultation Recordings
  addConsultationRecording: (rec: Omit<DoctorConsultationRecording, 'id' | 'recordedAt'>) => Promise<string>;
  updateConsultationRecording: (id: string, updates: Partial<DoctorConsultationRecording>) => Promise<void>;
  deleteConsultationRecording: (id: string) => Promise<void>;
  syncConsultationToTimeline: (id: string) => Promise<string>;
  getConsultations: (memberId?: string | 'ALL') => DoctorConsultationRecording[];

  // Family Hereditary Ancestors
  updateAncestorRecord: (id: string, updates: Partial<FamilyAncestorRecord>) => Promise<void>;
  addAncestorCondition: (ancestorId: string, condition: Omit<AncestorConditionEntry, 'id'>) => Promise<void>;
  removeAncestorCondition: (ancestorId: string, conditionId: string) => Promise<void>;
  scheduleMilestoneInCalendar: (milestone: PreventiveScreeningMilestone, memberId: string) => Promise<string>;
}

async function saveVaultState(state: HealthVaultState) {
  try {
    const payload = {
      members: state.members,
      events: state.events,
      documents: state.documents,
      doctors: state.doctors,
      providers: state.providers,
      diagnosticTests: state.diagnosticTests,
      followUps: state.followUps,
      expenses: state.expenses,
      allergies: state.allergies,
      healthConditions: state.healthConditions,
      vaccinations: state.vaccinations,
      labResults: state.labResults,
      emergencySettings: state.emergencySettings,
      budget: state.budget,
      admissions: state.admissions,
      consultations: state.consultations,
      ancestors: state.ancestors,
    };
    await setStorageItem(HEALTH_VAULT_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist health vault state:', error);
  }
}

export const useHealthVaultStore = create<HealthVaultState>((set, get) => ({
  members: DEV_SEED_MEMBERS,
  selectedMemberId: 'ALL',
  events: DEV_SEED_EVENTS,
  documents: DEV_SEED_DOCUMENTS,
  doctors: DEV_SEED_DOCTORS,
  providers: DEV_SEED_PROVIDERS,
  diagnosticTests: DEV_SEED_TESTS,
  followUps: DEV_SEED_FOLLOWUPS,
  expenses: DEV_SEED_EXPENSES,
  allergies: DEV_SEED_ALLERGIES,
  healthConditions: DEV_SEED_CONDITIONS,
  vaccinations: DEV_SEED_VACCINATIONS,
  labResults: DEV_SEED_LAB_RESULTS,
  emergencySettings: DEV_SEED_EMERGENCY_SETTINGS,
  budget: DEV_SEED_BUDGET,
  admissions: DEV_SEED_ADMISSIONS,
  consultations: DEV_SEED_CONSULTATIONS,
  ancestors: DEV_SEED_ANCESTORS,
  isLoading: false,

  loadData: async () => {
    try {
      set({ isLoading: true });
      const raw = await getStorageItem(HEALTH_VAULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          members: parsed.members || DEV_SEED_MEMBERS,
          events: parsed.events || DEV_SEED_EVENTS,
          documents: parsed.documents || DEV_SEED_DOCUMENTS,
          doctors: parsed.doctors || DEV_SEED_DOCTORS,
          providers: parsed.providers || DEV_SEED_PROVIDERS,
          diagnosticTests: parsed.diagnosticTests || DEV_SEED_TESTS,
          followUps: parsed.followUps || DEV_SEED_FOLLOWUPS,
          expenses: parsed.expenses || DEV_SEED_EXPENSES,
          allergies: parsed.allergies || DEV_SEED_ALLERGIES,
          healthConditions: parsed.healthConditions || DEV_SEED_CONDITIONS,
          vaccinations: parsed.vaccinations || DEV_SEED_VACCINATIONS,
          labResults: parsed.labResults || DEV_SEED_LAB_RESULTS,
          emergencySettings: parsed.emergencySettings || DEV_SEED_EMERGENCY_SETTINGS,
          budget: parsed.budget || DEV_SEED_BUDGET,
          admissions: parsed.admissions || DEV_SEED_ADMISSIONS,
          consultations: parsed.consultations || DEV_SEED_CONSULTATIONS,
          ancestors: parsed.ancestors || DEV_SEED_ANCESTORS,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setSelectedMemberId: (id) => {
    void Haptics.selectionAsync().catch(() => {});
    set({ selectedMemberId: id });
  },

  setHealthcareBudget: async (updates) => {
    const current = get().budget || DEV_SEED_BUDGET;
    const updated: HealthcareBudget = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    set({ budget: updated });
    await saveVaultState(get());
  },

  // Family Members
  addFamilyMember: async (mem) => {
    const id = `mem_${Date.now()}`;
    const newMember: FamilyMember = {
      ...mem,
      id,
      createdAt: new Date().toISOString(),
    };

    const newSettings: EmergencyProfileSettings = {
      memberId: id,
      enabled: true,
      showBloodGroup: true,
      showCriticalAllergies: true,
      showCriticalConditions: true,
      showActiveMedications: true,
      emergencyContactName: mem.emergencyContactName || 'Family Member',
      emergencyContactPhone: mem.emergencyContactPhone || '',
      emergencyContactRelation: mem.emergencyContactRelation || 'Contact',
      qrToken: `emg_${id}_${Math.random().toString(36).substring(2, 8)}`,
      lastVerifiedAt: new Date().toISOString().split('T')[0],
    };

    const updatedMembers = [...get().members, newMember];
    const updatedSettings = { ...get().emergencySettings, [id]: newSettings };

    set({ members: updatedMembers, emergencySettings: updatedSettings });
    await saveVaultState(get());
    return id;
  },

  updateFamilyMember: async (id, updates) => {
    const updated = get().members.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    set({ members: updated });
    await saveVaultState(get());
  },

  deleteFamilyMember: async (id) => {
    const updatedMembers = get().members.filter((m) => m.id !== id);
    const updatedEvents = get().events.filter((e) => e.memberId !== id);
    const updatedDocs = get().documents.filter((d) => d.memberId !== id);
    const updatedVaccines = get().vaccinations.filter((v) => v.memberId !== id);
    const updatedAllergies = get().allergies.filter((a) => a.memberId !== id);
    const updatedConditions = get().healthConditions.filter((c) => c.memberId !== id);

    set({
      members: updatedMembers,
      events: updatedEvents,
      documents: updatedDocs,
      vaccinations: updatedVaccines,
      allergies: updatedAllergies,
      healthConditions: updatedConditions,
      selectedMemberId: get().selectedMemberId === id ? 'ALL' : get().selectedMemberId,
    });
    await saveVaultState(get());
  },

  // Allergies
  addAllergy: async (alg) => {
    const id = `alg_${Date.now()}`;
    const newAlg: Allergy = {
      ...alg,
      id,
      createdAt: new Date().toISOString(),
    };
    set({ allergies: [newAlg, ...get().allergies] });
    await saveVaultState(get());
    return id;
  },

  updateAllergy: async (id, updates) => {
    const updated = get().allergies.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    set({ allergies: updated });
    await saveVaultState(get());
  },

  removeAllergy: async (id) => {
    const updated = get().allergies.filter((a) => a.id !== id);
    set({ allergies: updated });
    await saveVaultState(get());
  },

  // Health Conditions
  addHealthCondition: async (cond) => {
    const id = `cond_${Date.now()}`;
    const newCond: HealthCondition = {
      ...cond,
      id,
      createdAt: new Date().toISOString(),
    };
    set({ healthConditions: [newCond, ...get().healthConditions] });
    await saveVaultState(get());
    return id;
  },

  updateHealthCondition: async (id, updates) => {
    const updated = get().healthConditions.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    set({ healthConditions: updated });
    await saveVaultState(get());
  },

  removeHealthCondition: async (id) => {
    const updated = get().healthConditions.filter((c) => c.id !== id);
    set({ healthConditions: updated });
    await saveVaultState(get());
  },

  // Vaccinations
  addVaccination: async (vac) => {
    const id = `vac_${Date.now()}`;
    const newVac: Vaccination = {
      ...vac,
      id,
      doseNumber: Math.max(1, vac.doseNumber || 1),
      totalDoses: vac.totalDoses ? Math.max(vac.doseNumber || 1, vac.totalDoses) : undefined,
      createdAt: new Date().toISOString(),
    };
    set({ vaccinations: [newVac, ...get().vaccinations] });
    await saveVaultState(get());
    return id;
  },

  updateVaccination: async (id, updates) => {
    const updated = get().vaccinations.map((v) =>
      v.id === id ? { ...v, ...updates } : v
    );
    set({ vaccinations: updated });
    await saveVaultState(get());
  },

  deleteVaccination: async (id) => {
    const updated = get().vaccinations.filter((v) => v.id !== id);
    set({ vaccinations: updated });
    await saveVaultState(get());
  },

  // Lab Results
  addLabResult: async (res) => {
    const id = `res_${Date.now()}`;
    const newRes: LabResultEntry = {
      ...res,
      id,
      createdAt: new Date().toISOString(),
    };
    set({ labResults: [newRes, ...get().labResults] });
    await saveVaultState(get());
    return id;
  },

  updateLabResult: async (id, updates) => {
    const updated = get().labResults.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    set({ labResults: updated });
    await saveVaultState(get());
  },

  deleteLabResult: async (id) => {
    const updated = get().labResults.filter((r) => r.id !== id);
    set({ labResults: updated });
    await saveVaultState(get());
  },

  // Hospital Admissions & Inpatient Surgeries
  addHospitalAdmission: async (adm) => {
    const id = `adm_${Date.now()}`;
    const newAdm: HospitalAdmission = {
      ...adm,
      id,
      createdAt: new Date().toISOString(),
    };
    set({ admissions: [newAdm, ...get().admissions] });
    await saveVaultState(get());
    return id;
  },

  updateHospitalAdmission: async (id, updates) => {
    const updated = get().admissions.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    set({ admissions: updated });
    await saveVaultState(get());
  },

  deleteHospitalAdmission: async (id) => {
    const updated = get().admissions.filter((a) => a.id !== id);
    set({ admissions: updated });
    await saveVaultState(get());
  },

  // Emergency Profile Actions
  updateEmergencySettings: async (memberId, updates) => {
    const current = get().emergencySettings[memberId] || {
      memberId,
      enabled: true,
      showBloodGroup: true,
      showCriticalAllergies: true,
      showCriticalConditions: true,
      showActiveMedications: true,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      qrToken: `emg_${memberId}_${Math.random().toString(36).substring(2, 8)}`,
      lastVerifiedAt: new Date().toISOString().split('T')[0],
    };

    const updated = {
      ...get().emergencySettings,
      [memberId]: { ...current, ...updates },
    };
    set({ emergencySettings: updated });
    await saveVaultState(get());
  },

  regenerateEmergencyQrToken: async (memberId) => {
    const newToken = `emg_${memberId.replace('mem_', '')}_${Math.random().toString(36).substring(2, 10)}`;
    await get().updateEmergencySettings(memberId, {
      qrToken: newToken,
      lastVerifiedAt: new Date().toISOString().split('T')[0],
    });
    return newToken;
  },

  verifyEmergencyProfile: async (memberId) => {
    await get().updateEmergencySettings(memberId, {
      lastVerifiedAt: new Date().toISOString().split('T')[0],
    });
  },

  // Providers & Doctors
  addDoctor: async (doc) => {
    const id = `doc_${Date.now()}`;
    const newDoc: Doctor = {
      ...doc,
      id,
      createdAt: Date.now(),
    };
    const updatedDoctors = [newDoc, ...get().doctors];
    set({ doctors: updatedDoctors });
    await saveVaultState(get());
    return id;
  },

  updateDoctor: async (id, updates) => {
    const updated = get().doctors.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    );
    set({ doctors: updated });
    await saveVaultState(get());
  },

  deleteDoctor: async (id) => {
    const updated = get().doctors.filter((d) => d.id !== id);
    set({ doctors: updated });
    await saveVaultState(get());
  },

  addProvider: async (prov) => {
    const id = `prov_${Date.now()}`;
    const newProv: HealthcareProvider = { ...prov, id };
    set({ providers: [newProv, ...get().providers] });
    await saveVaultState(get());
    return id;
  },

  updateProvider: async (id, updates) => {
    const updated = get().providers.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    set({ providers: updated });
    await saveVaultState(get());
  },

  // Medical Events (Backbone)
  addMedicalEvent: async (evt) => {
    const id = `evt_${Date.now()}`;
    const newEvent: MedicalEvent = {
      ...evt,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (evt.totalCost > 0) {
      await get().addMedicalExpense({
        eventId: id,
        memberId: evt.memberId,
        category: 'DOCTOR_VISIT',
        amount: evt.totalCost,
        date: evt.eventDate,
        providerName: evt.doctorName || evt.hospitalOrClinic || 'Doctor Consultation',
        syncedToExpenseTracker: false,
      });
    }

    const updated = [newEvent, ...get().events];
    set({ events: updated });
    await saveVaultState(get());
    return id;
  },

  updateMedicalEvent: async (id, updates) => {
    const updated = get().events.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
    );
    set({ events: updated });
    await saveVaultState(get());
  },

  deleteMedicalEvent: async (id) => {
    const updated = get().events.filter((e) => e.id !== id);
    set({ events: updated });
    await saveVaultState(get());
  },

  // Documents
  addMedicalDocument: async (doc) => {
    const id = `doc_${Date.now()}`;
    const newDoc: MedicalDocument = {
      ...doc,
      id,
      createdAt: Date.now(),
    };
    const updated = [newDoc, ...get().documents];
    set({ documents: updated });
    await saveVaultState(get());
    return id;
  },

  deleteMedicalDocument: async (id) => {
    const updated = get().documents.filter((d) => d.id !== id);
    set({ documents: updated });
    await saveVaultState(get());
  },

  // Diagnostic Tests
  addDiagnosticTest: async (test) => {
    const id = `test_${Date.now()}`;
    const newTest: DiagnosticTest = {
      ...test,
      id,
      createdAt: Date.now(),
    };
    const updated = [newTest, ...get().diagnosticTests];
    set({ diagnosticTests: updated });
    await saveVaultState(get());
    return id;
  },

  updateDiagnosticTestStatus: async (testId, status, documentId) => {
    const updated = get().diagnosticTests.map((t) =>
      t.id === testId
        ? {
            ...t,
            status,
            documentId: documentId || t.documentId,
          }
        : t
    );
    set({ diagnosticTests: updated });
    await saveVaultState(get());
  },

  deleteDiagnosticTest: async (testId) => {
    const updated = get().diagnosticTests.filter((t) => t.id !== testId);
    set({ diagnosticTests: updated });
    await saveVaultState(get());
  },

  // Follow-ups
  addFollowUp: async (flw) => {
    const id = `flw_${Date.now()}`;
    const newFlw: FollowUp = {
      ...flw,
      id,
      createdAt: Date.now(),
    };
    const updated = [newFlw, ...get().followUps];
    set({ followUps: updated });
    await saveVaultState(get());
    return id;
  },

  completeFollowUp: async (id) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const updated = get().followUps.map((f) =>
      f.id === id
        ? {
            ...f,
            status: 'COMPLETED' as const,
            completedDate: new Date().toISOString().split('T')[0],
          }
        : f
    );
    set({ followUps: updated });
    await saveVaultState(get());
  },

  rescheduleFollowUp: async (id, newDueDate) => {
    const updated = get().followUps.map((f) =>
      f.id === id
        ? {
            ...f,
            dueDate: newDueDate,
            status: 'RESCHEDULED' as const,
          }
        : f
    );
    set({ followUps: updated });
    await saveVaultState(get());
  },

  deleteFollowUp: async (id) => {
    const updated = get().followUps.filter((f) => f.id !== id);
    set({ followUps: updated });
    await saveVaultState(get());
  },

  // Expenses
  addMedicalExpense: async (exp) => {
    const id = `exp_${Date.now()}`;
    const newExp: MedicalExpense = {
      ...exp,
      id,
      createdAt: Date.now(),
    };
    const updated = [newExp, ...get().expenses];
    set({ expenses: updated });
    await saveVaultState(get());
    return id;
  },

  deleteMedicalExpense: async (id) => {
    const updated = get().expenses.filter((e) => e.id !== id);
    set({ expenses: updated });
    await saveVaultState(get());
  },

  // 1-Tap Sync to Medicine Cabinet
  syncMedicinesToCabinet: async (medicines) => {
    let synced = 0;
    try {
      const addMedicine = useMedicineStore.getState().addMedicine;
      for (const m of medicines) {
        addMedicine({
          name: m.name,
          type: 'medicine',
          formFactor: 'pill',
          unit: 'pill',
          trackInventory: true,
          currentStock: 30,
          totalPackSize: 30,
          lowStockThreshold: 5,
          isAsNeeded: false,
          isCourse: true,
          courseDurationDays: parseInt(m.duration) || 7,
          courseStartDate: new Date().toISOString().split('T')[0],
          instructions: m.instructions || 'As prescribed by doctor',
          schedules: [
            {
              id: `sch_${Date.now()}_1`,
              time: '08:00 AM',
              timeCategory: 'morning',
              doseAmount: 1,
              instructions: m.instructions,
            },
          ],
        });
        synced++;
      }
    } catch (e) {
      console.error('Failed to sync medicines to cabinet:', e);
    }
    return synced;
  },

  // 1-Tap Sync to General Expense Tracker
  syncExpenseToExpenseTracker: async (exp) => {
    try {
      const updated = get().expenses.map((e) =>
        e.id === exp.id ? { ...e, syncedToExpenseTracker: true } : e
      );
      set({ expenses: updated });
      await saveVaultState(get());
    } catch (e) {
      console.error('Failed to sync expense:', e);
    }
  },

  // Filtered Getters & Selectors
  getTimelineEvents: (memberId = 'ALL') => {
    const events = get().events;
    if (!memberId || memberId === 'ALL') {
      return [...events].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    }
    return events
      .filter((e) => e.memberId === memberId)
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  },

  getDocuments: (memberId = 'ALL', type) => {
    let list = get().documents;
    if (memberId && memberId !== 'ALL') {
      list = list.filter((d) => d.memberId === memberId);
    }
    if (type) {
      list = list.filter((d) => d.type === type);
    }
    return list.sort((a, b) => b.documentDate.localeCompare(a.documentDate));
  },

  getUpcomingFollowUps: (memberId = 'ALL') => {
    let list = get().followUps.filter((f) => f.status === 'UPCOMING' || f.status === 'DUE');
    if (memberId && memberId !== 'ALL') {
      list = list.filter((f) => f.memberId === memberId);
    }
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  getPendingDiagnosticTests: (memberId = 'ALL') => {
    let list = get().diagnosticTests.filter((t) => t.status === 'PENDING' || t.status === 'SAMPLE_COLLECTED');
    if (memberId && memberId !== 'ALL') {
      list = list.filter((t) => t.memberId === memberId);
    }
    return list.sort((a, b) => b.testDate.localeCompare(a.testDate));
  },

  getAllergies: (memberId = 'ALL') => {
    if (!memberId || memberId === 'ALL') return get().allergies;
    return get().allergies.filter((a) => a.memberId === memberId);
  },

  getHealthConditions: (memberId = 'ALL') => {
    if (!memberId || memberId === 'ALL') return get().healthConditions;
    return get().healthConditions.filter((c) => c.memberId === memberId);
  },

  getVaccinations: (memberId = 'ALL') => {
    const list = get().vaccinations;
    if (!memberId || memberId === 'ALL') {
      return [...list].sort((a, b) => b.vaccinationDate.localeCompare(a.vaccinationDate));
    }
    return list
      .filter((v) => v.memberId === memberId)
      .sort((a, b) => b.vaccinationDate.localeCompare(a.vaccinationDate));
  },

  getUpcomingVaccinations: (memberId = 'ALL') => {
    const today = new Date().toISOString().split('T')[0];
    let list = get().vaccinations.filter((v) => v.nextDueDate && v.nextDueDate >= today);
    if (memberId && memberId !== 'ALL') {
      list = list.filter((v) => v.memberId === memberId);
    }
    return list.sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''));
  },

  getLabResults: (memberId = 'ALL', analyteCode) => {
    let list = get().labResults;
    if (memberId && memberId !== 'ALL') {
      list = list.filter((r) => r.memberId === memberId);
    }
    if (analyteCode) {
      list = list.filter((r) => r.analyteCode === analyteCode);
    }
    return [...list].sort((a, b) => a.testDate.localeCompare(b.testDate));
  },

  getAvailableAnalytes: (memberId = 'ALL') => {
    let list = get().labResults;
    if (memberId && memberId !== 'ALL') {
      list = list.filter((r) => r.memberId === memberId);
    }
    const map = new Map<
      string,
      {
        code: string;
        name: string;
        unit: string;
        count: number;
        latestValue?: number;
        latestDate?: string;
      }
    >();
    for (const r of list) {
      const existing = map.get(r.analyteCode);
      if (!existing) {
        map.set(r.analyteCode, {
          code: r.analyteCode,
          name: r.analyteName,
          unit: r.unit,
          count: 1,
          latestValue: r.numericValue,
          latestDate: r.testDate,
        });
      } else {
        existing.count++;
        if (!existing.latestDate || r.testDate >= existing.latestDate) {
          existing.latestDate = r.testDate;
          existing.latestValue = r.numericValue;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  },

  getHospitalAdmissions: (memberId = 'ALL') => {
    const list = get().admissions;
    if (!memberId || memberId === 'ALL') {
      return [...list].sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));
    }
    return list
      .filter((a) => a.memberId === memberId)
      .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));
  },

  getCareCalendarEvents: (memberId = 'ALL') => {
    const state = get();
    const members = state.members;
    const memberMap = new Map(members.map((m) => [m.id, m.name]));
    const items: CareCalendarItem[] = [];

    // Follow-ups
    const followUps = state.followUps.filter(
      (f) =>
        (memberId === 'ALL' || f.memberId === memberId) &&
        (f.status === 'UPCOMING' || f.status === 'DUE')
    );
    for (const f of followUps) {
      items.push({
        id: f.id,
        type: 'DOCTOR_FOLLOWUP',
        date: f.dueDate,
        title: f.reason,
        subtitle: `${f.doctorName || 'Doctor Review'} • Follow-up`,
        memberId: f.memberId,
        memberName: memberMap.get(f.memberId),
        status: f.status,
        isUrgent: f.status === 'DUE',
        metadata: f as any,
      });
    }

    // Diagnostic Tests
    const tests = state.diagnosticTests.filter(
      (t) =>
        (memberId === 'ALL' || t.memberId === memberId) &&
        (t.status === 'PENDING' || t.status === 'SAMPLE_COLLECTED')
    );
    for (const t of tests) {
      items.push({
        id: t.id,
        type: 'DIAGNOSTIC_TEST',
        date: t.testDate,
        title: t.testName,
        subtitle: `${t.labOrHospital || 'Diagnostic Center'} • Status: ${t.status}`,
        memberId: t.memberId,
        memberName: memberMap.get(t.memberId),
        status: t.status,
        metadata: t as any,
      });
    }

    // Vaccination Boosters
    const today = new Date().toISOString().split('T')[0];
    const vaccines = state.vaccinations.filter(
      (v) =>
        (memberId === 'ALL' || v.memberId === memberId) &&
        v.nextDueDate &&
        v.nextDueDate >= today
    );
    for (const v of vaccines) {
      items.push({
        id: v.id,
        type: 'VACCINE_BOOSTER',
        date: v.nextDueDate!,
        title: `${v.vaccineName} (Next Dose/Booster)`,
        subtitle: `Dose ${v.doseNumber}/${v.totalDoses} completed`,
        memberId: v.memberId,
        memberName: memberMap.get(v.memberId),
        status: 'UPCOMING',
        metadata: v as any,
      });
    }

    // Hospital Admissions / Discharges
    const admissions = state.admissions.filter(
      (a) => memberId === 'ALL' || a.memberId === memberId
    );
    for (const a of admissions) {
      items.push({
        id: a.id,
        type: 'HOSPITAL_EVENT',
        date: a.dischargeDate || a.admissionDate,
        title: `${a.reason} (${a.hospitalName})`,
        subtitle: `${a.department || 'Inpatient'} • ${
          a.status === 'ADMITTED' ? 'Currently Admitted' : 'Discharged'
        }`,
        memberId: a.memberId,
        memberName: memberMap.get(a.memberId),
        status: a.status,
        metadata: a as any,
      });
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  },

  // Derived Emergency Profile (Zero Duplicate State)
  getEmergencyCardData: (memberId: string) => {
    const state = get();
    const member = state.members.find((m) => m.id === memberId) || state.members[0] || DEV_SEED_MEMBERS[0];
    const settings = state.emergencySettings[member.id] || {
      memberId: member.id,
      enabled: true,
      showBloodGroup: true,
      showCriticalAllergies: true,
      showCriticalConditions: true,
      showActiveMedications: true,
      emergencyContactName: member.emergencyContactName || 'Emergency Contact',
      emergencyContactPhone: member.emergencyContactPhone || '',
      emergencyContactRelation: member.emergencyContactRelation || 'Next of Kin',
      qrToken: `emg_${member.id.replace('mem_', '')}_${Math.random().toString(36).substring(2, 8)}`,
      lastVerifiedAt: new Date().toISOString().split('T')[0],
    };

    const memberAllergies = state.allergies.filter((a) => a.memberId === member.id);
    const criticalAllergies = settings.showCriticalAllergies
      ? memberAllergies.filter((a) => a.isCritical)
      : [];

    const memberConditions = state.healthConditions.filter((c) => c.memberId === member.id);
    const criticalConditions = settings.showCriticalConditions
      ? memberConditions.filter((c) => c.isCritical && c.status !== 'RESOLVED')
      : [];

    let activeMedications: string[] = [];
    if (settings.showActiveMedications) {
      try {
        const medStore = useMedicineStore.getState();
        activeMedications = (medStore.medicines || [])
          .filter((m) => !m.isArchived)
          .map((m) => (m.strength ? `${m.name} (${m.strength})` : m.name));
      } catch {
        activeMedications = [];
      }
    }

    return {
      member,
      settings,
      criticalAllergies,
      criticalConditions,
      activeMedications,
      lastVerifiedAt: settings.lastVerifiedAt || new Date().toISOString().split('T')[0],
    };
  },

  getMedicalSpendingSummary: (memberId = 'ALL', year = new Date().getFullYear()) => {
    const expenses = get().expenses.filter((e) => {
      const expYear = new Date(e.date).getFullYear();
      if (expYear !== year) return false;
      if (memberId !== 'ALL' && e.memberId !== memberId) return false;
      return true;
    });

    let totalSpend = 0;
    let doctorVisitsTotal = 0;
    let diagnosticTestsTotal = 0;
    let medicinesTotal = 0;
    let hospitalizationTotal = 0;
    let otherTotal = 0;

    for (const exp of expenses) {
      totalSpend += exp.amount;
      switch (exp.category) {
        case 'DOCTOR_VISIT':
          doctorVisitsTotal += exp.amount;
          break;
        case 'DIAGNOSTIC_TEST':
          diagnosticTestsTotal += exp.amount;
          break;
        case 'MEDICINE':
          medicinesTotal += exp.amount;
          break;
        case 'HOSPITALIZATION':
        case 'EMERGENCY':
          hospitalizationTotal += exp.amount;
          break;
        default:
          otherTotal += exp.amount;
          break;
      }
    }

    // Member-wise breakdown
    const members = get().members;
    const memberMap = new Map<string, number>();
    for (const exp of expenses) {
      memberMap.set(exp.memberId, (memberMap.get(exp.memberId) || 0) + exp.amount);
    }
    const memberBreakdown = members
      .map((m) => ({
        memberId: m.id,
        memberName: m.name,
        total: memberMap.get(m.id) || 0,
      }))
      .filter((m) => m.total > 0);

    // Monthly breakdown
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = months.map((m, idx) => {
      const monthStr = `${year}-${String(idx + 1).padStart(2, '0')}`;
      const monthTotal = expenses
        .filter((e) => e.date.startsWith(monthStr))
        .reduce((sum, e) => sum + e.amount, 0);
      return { month: m, total: monthTotal };
    });

    const budget = get().budget || DEV_SEED_BUDGET;
    const annualBudget = budget.annualBudget || 60000;
    const thresholdPercent = budget.thresholdAlertPercent || 80;
    const budgetConsumedPercent = annualBudget > 0 ? (totalSpend / annualBudget) * 100 : 0;
    const isThresholdExceeded = budgetConsumedPercent >= thresholdPercent;
    const remainingBudget = Math.max(0, annualBudget - totalSpend);

    return {
      totalSpend,
      doctorVisitsTotal,
      diagnosticTestsTotal,
      medicinesTotal,
      hospitalizationTotal,
      otherTotal,
      memberBreakdown,
      monthlyBreakdown,
      budget,
      budgetConsumedPercent,
      isThresholdExceeded,
      remainingBudget,
    };
  },

  // Doctor Voice Consultation Recordings
  addConsultationRecording: async (rec) => {
    const id = `rec_${Date.now()}`;
    const newRec: DoctorConsultationRecording = {
      ...rec,
      id,
      recordedAt: new Date().toISOString(),
    };
    set({ consultations: [newRec, ...get().consultations] });
    await saveVaultState(get());
    return id;
  },

  updateConsultationRecording: async (id, updates) => {
    const updated = get().consultations.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    set({ consultations: updated });
    await saveVaultState(get());
  },

  deleteConsultationRecording: async (id) => {
    const updated = get().consultations.filter((c) => c.id !== id);
    set({ consultations: updated });
    await saveVaultState(get());
  },

  syncConsultationToTimeline: async (id) => {
    const rec = get().consultations.find((c) => c.id === id);
    if (!rec) throw new Error('Consultation not found');

    const summary = rec.summary;
    const eventDate = rec.recordedAt ? rec.recordedAt.split('T')[0] : new Date().toISOString().split('T')[0];

    // 1. Convert medications to prescribedMedicines format
    const prescribedMedicines: PrescribedMedicineItem[] = (summary?.medicationInstructions || []).map((m) => ({
      name: m.medicineName,
      dosage: m.dosage,
      frequency: m.timing || 'As directed',
      duration: m.duration || '7 days',
      instructions: m.notes,
      syncedToCabinet: false,
    }));

    // 2. Add Medical Event
    const eventId = await get().addMedicalEvent({
      memberId: rec.memberId,
      title: rec.title || `${rec.specialty || 'Doctor'} Consultation`,
      eventDate,
      doctorName: rec.doctorName,
      specialty: rec.specialty,
      hospitalOrClinic: rec.hospitalOrClinic || 'Chamber Visit',
      diagnosisOrReason: summary?.doctorDiagnosis || rec.title,
      notes: summary?.keyAdvicePoints ? summary.keyAdvicePoints.join('\n• ') : undefined,
      documentIds: [],
      testIds: [],
      prescribedMedicines,
      totalCost: 1500,
    });

    // 3. Auto sync medications to Cabinet
    if (prescribedMedicines.length > 0) {
      await get().syncMedicinesToCabinet(prescribedMedicines);
    }

    // 4. Add Follow-up if advised
    if (summary?.followUpTimeline) {
      const followUpDays = 14;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + followUpDays);
      await get().addFollowUp({
        eventId,
        memberId: rec.memberId,
        doctorName: rec.doctorName,
        dueDate: targetDate.toISOString().split('T')[0],
        reason: summary.followUpTimeline,
        status: 'UPCOMING',
        reminderDaysBefore: [7, 3, 1],
      });
    }

    // 5. Add Advised Tests as Pending Tests
    if (summary?.advisedInvestigations && summary.advisedInvestigations.length > 0) {
      for (const testName of summary.advisedInvestigations) {
        await get().addDiagnosticTest({
          eventId,
          memberId: rec.memberId,
          testName,
          testCategory: 'BLOOD',
          testDate: eventDate,
          labOrHospital: rec.hospitalOrClinic,
          status: 'PENDING',
          cost: 1000,
        });
      }
    }

    // Mark as synced
    await get().updateConsultationRecording(id, { isSyncedToTimeline: true });
    return eventId;
  },

  getConsultations: (memberId = 'ALL') => {
    const list = get().consultations;
    if (!memberId || memberId === 'ALL') {
      return [...list].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    }
    return list
      .filter((c) => c.memberId === memberId)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  },

  // Family Hereditary Ancestors
  updateAncestorRecord: async (id, updates) => {
    const updated = get().ancestors.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    set({ ancestors: updated });
    await saveVaultState(get());
  },

  addAncestorCondition: async (ancestorId, condition) => {
    const newCondId = `cond_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: AncestorConditionEntry = {
      ...condition,
      id: newCondId,
    };
    const updated = get().ancestors.map((a) => {
      if (a.id === ancestorId) {
        const filtered = a.conditions.filter((c) => c.disease !== condition.disease);
        return { ...a, conditions: [...filtered, newEntry] };
      }
      return a;
    });
    set({ ancestors: updated });
    await saveVaultState(get());
  },

  removeAncestorCondition: async (ancestorId, conditionId) => {
    const updated = get().ancestors.map((a) => {
      if (a.id === ancestorId) {
        return {
          ...a,
          conditions: a.conditions.filter((c) => c.id !== conditionId && c.disease !== (conditionId as any)),
        };
      }
      return a;
    });
    set({ ancestors: updated });
    await saveVaultState(get());
  },

  scheduleMilestoneInCalendar: async (milestone, memberId) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 1);
    const dueDate = targetDate.toISOString().split('T')[0];

    const followUpId = await get().addFollowUp({
      memberId,
      doctorName: 'Preventive Health Specialist / GP',
      dueDate,
      reason: `Screening: ${milestone.testName}`,
      status: 'UPCOMING',
      reminderDaysBefore: [7, 3, 1],
      notes: `Hereditary Risk Screening Milestone: ${milestone.clinicalObjective}`,
    });

    return followUpId;
  },
}));
