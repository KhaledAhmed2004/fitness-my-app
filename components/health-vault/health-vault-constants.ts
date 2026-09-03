import { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  BloodGroup,
  DiagnosticCategory,
  FamilyRelation,
  MedicalDocumentType,
  MedicalExpenseCategory,
} from '@/types/health-vault';

export const RELATION_CONFIG: Record<
  FamilyRelation,
  { label: string; icon: ComponentProps<typeof MaterialIcons>['name']; color: string }
> = {
  SELF: { label: 'My Health (Self)', icon: 'person', color: '#38BDF8' },
  FATHER: { label: 'Father (বাবা)', icon: 'elderly', color: '#20C997' },
  MOTHER: { label: 'Mother (মা)', icon: 'elderly-woman', color: '#A78BFA' },
  SPOUSE: { label: 'Spouse (স্ত্রী / স্বামী)', icon: 'favorite', color: '#F43F5E' },
  CHILD: { label: 'Child (সন্তান)', icon: 'child-care', color: '#FF922B' },
  SIBLING: { label: 'Sibling (ভাই / বোন)', icon: 'group', color: '#FCC419' },
  OTHER: { label: 'Other Family Member', icon: 'person-outline', color: '#8899A6' },
};

export const DOCUMENT_TYPE_CONFIG: Record<
  MedicalDocumentType,
  { label: string; icon: ComponentProps<typeof MaterialIcons>['name']; color: string; bgColor: string }
> = {
  PRESCRIPTION: {
    label: 'প্রেসক্রিপশন (Prescription)',
    icon: 'receipt-long',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
  },
  LAB_REPORT: {
    label: 'ল্যাব ও রক্ত রিপোর্ট (Lab Report)',
    icon: 'biotech',
    color: '#20C997',
    bgColor: 'rgba(32, 201, 151, 0.15)',
  },
  IMAGING: {
    label: 'এক্স-রে ও স্ক্যান (Imaging / X-Ray)',
    icon: 'panorama-photosphere',
    color: '#A78BFA',
    bgColor: 'rgba(167, 139, 250, 0.15)',
  },
  DISCHARGE_SUMMARY: {
    label: 'ডিসচার্জ সার্টিফিকেট (Discharge)',
    icon: 'assignment-turned-in',
    color: '#D4A017',
    bgColor: 'rgba(212, 160, 23, 0.15)',
  },
  VACCINATION: {
    label: 'টিকা ও ভ্যাকসিনেশন (Vaccine)',
    icon: 'vaccines',
    color: '#F43F5E',
    bgColor: 'rgba(244, 63, 94, 0.15)',
  },
  CERTIFICATE: {
    label: 'মেডিকেল সার্টিফিকেট (Certificate)',
    icon: 'verified',
    color: '#51CF66',
    bgColor: 'rgba(81, 207, 102, 0.15)',
  },
  OTHER: {
    label: 'অন্যান্য ডকুমেন্ট (Other)',
    icon: 'description',
    color: '#8899A6',
    bgColor: 'rgba(136, 153, 166, 0.15)',
  },
};

export const DIAGNOSTIC_CATEGORY_CONFIG: Record<
  DiagnosticCategory,
  { label: string; icon: ComponentProps<typeof MaterialIcons>['name']; color: string }
> = {
  BLOOD: { label: 'Blood Test', icon: 'bloodtype', color: '#F43F5E' },
  URINE: { label: 'Urine Test', icon: 'water-drop', color: '#D4A017' },
  IMAGING_XRAY: { label: 'X-Ray / MRI / CT', icon: 'camera', color: '#38BDF8' },
  CARDIAC_ECG: { label: 'ECG / Echo', icon: 'monitor-heart', color: '#FF7849' },
  ULTRASOUND: { label: 'USG Ultrasound', icon: 'waves', color: '#20C997' },
  OTHER: { label: 'Diagnostic Test', icon: 'biotech', color: '#A78BFA' },
};

export const MEDICAL_EXPENSE_CONFIG: Record<
  MedicalExpenseCategory,
  { label: string; icon: ComponentProps<typeof MaterialIcons>['name']; color: string }
> = {
  DOCTOR_VISIT: { label: 'Doctor Visit Fee (ডাক্তার ফি)', icon: 'person-pin', color: '#38BDF8' },
  DIAGNOSTIC_TEST: { label: 'Lab & Diagnostic (টেস্ট)', icon: 'biotech', color: '#20C997' },
  MEDICINE: { label: 'Medicines & Pharmacy (ওষুধ)', icon: 'medication', color: '#FF922B' },
  HOSPITALIZATION: { label: 'Hospital & Surgery (হাসপাতাল)', icon: 'local-hospital', color: '#F43F5E' },
  DENTAL: { label: 'Dental & Optical (দাঁত ও চোখ)', icon: 'visibility', color: '#FCC419' },
  EMERGENCY: { label: 'Emergency & Ambulance', icon: 'emergency', color: '#E31B23' },
  OTHER: { label: 'Other Medical Expense', icon: 'receipt', color: '#8899A6' },
};

export const COMMON_SPECIALTIES = [
  'General Medicine (মেডিসিন বিশেষজ্ঞ)',
  'Cardiologist (হৃদরোগ বিশেষজ্ঞ)',
  'Diabetologist & Endocrinologist',
  'Pediatrician (শিশু বিশেষজ্ঞ)',
  'Orthopedic (হাড় ও জোড়া বিশেষজ্ঞ)',
  'Dermatologist (চর্ম ও যৌন রোগ)',
  'Gynecologist & Obstetrician (স্ত্রী রোগ)',
  'Neurologist (নিউরো ও স্নায়ুরোগ)',
  'Gastroenterologist (লিভার ও পরিপাক)',
  'ENT Specialist (নাক, কান ও গলা)',
  'Ophthalmologist (চক্ষু বিশেষজ্ঞ)',
  'Dentist (দন্ত বিশেষজ্ঞ)',
];

export const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'O+',
  'O-',
  'AB+',
  'AB-',
  'UNKNOWN',
];

export const SAMPLE_DOCUMENT_IMAGES = [
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
];

export interface AnalytePreset {
  code: string;
  name: string;
  shortName: string;
  defaultUnit: string;
  defaultRefMin?: number;
  defaultRefMax?: number;
  defaultRefText?: string;
  testCategory: DiagnosticCategory;
}

export const COMMON_ANALYTE_PRESETS: AnalytePreset[] = [
  {
    code: 'HBA1C',
    name: 'HbA1c Glycated Hemoglobin',
    shortName: 'HbA1c',
    defaultUnit: '%',
    defaultRefMin: 4.0,
    defaultRefMax: 5.6,
    defaultRefText: 'Normal: 4.0–5.6%, Pre-diabetes: 5.7–6.4%, Diabetes: ≥6.5%',
    testCategory: 'BLOOD',
  },
  {
    code: 'FASTING_GLUCOSE',
    name: 'Fasting Blood Sugar (FBS)',
    shortName: 'Fasting Sugar',
    defaultUnit: 'mmol/L',
    defaultRefMin: 4.0,
    defaultRefMax: 6.0,
    defaultRefText: 'Normal: 4.0–6.0 mmol/L',
    testCategory: 'BLOOD',
  },
  {
    code: 'HEMOGLOBIN',
    name: 'Hemoglobin (Hb)',
    shortName: 'Hemoglobin',
    defaultUnit: 'g/dL',
    defaultRefMin: 13.0,
    defaultRefMax: 17.0,
    defaultRefText: 'Male: 13.0–17.0 g/dL, Female: 12.0–15.0 g/dL',
    testCategory: 'BLOOD',
  },
  {
    code: 'CREATININE',
    name: 'Serum Creatinine (Kidney Function)',
    shortName: 'Creatinine',
    defaultUnit: 'mg/dL',
    defaultRefMin: 0.7,
    defaultRefMax: 1.3,
    defaultRefText: 'Normal: 0.7–1.3 mg/dL',
    testCategory: 'BLOOD',
  },
  {
    code: 'CHOLESTEROL_TOTAL',
    name: 'Total Cholesterol (Lipid)',
    shortName: 'Total Cholesterol',
    defaultUnit: 'mg/dL',
    defaultRefMax: 200,
    defaultRefText: 'Desirable: <200 mg/dL',
    testCategory: 'BLOOD',
  },
  {
    code: 'SGPT_ALT',
    name: 'SGPT / ALT (Liver Function)',
    shortName: 'SGPT / ALT',
    defaultUnit: 'U/L',
    defaultRefMax: 45,
    defaultRefText: 'Normal: <45 U/L',
    testCategory: 'BLOOD',
  },
  {
    code: 'TSH',
    name: 'Thyroid Stimulating Hormone (TSH)',
    shortName: 'TSH',
    defaultUnit: 'uIU/mL',
    defaultRefMin: 0.4,
    defaultRefMax: 4.5,
    defaultRefText: 'Normal: 0.4–4.5 uIU/mL',
    testCategory: 'BLOOD',
  },
  {
    code: 'PLATELETS',
    name: 'Platelet Count (CBC)',
    shortName: 'Platelets',
    defaultUnit: 'Lakhs/cumm',
    defaultRefMin: 1.5,
    defaultRefMax: 4.5,
    defaultRefText: 'Normal: 1.5–4.5 Lakhs/cumm',
    testCategory: 'BLOOD',
  },
];
