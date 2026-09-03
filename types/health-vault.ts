export type FamilyRelation =
  | 'SELF'
  | 'FATHER'
  | 'MOTHER'
  | 'SPOUSE'
  | 'CHILD'
  | 'SIBLING'
  | 'OTHER';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';

export type HealthcareProviderType =
  | 'DOCTOR'
  | 'HOSPITAL'
  | 'CLINIC'
  | 'LAB'
  | 'PHARMACY';

export interface HealthcareProvider {
  id: string;
  name: string;
  type: HealthcareProviderType;
  specialtyOrService?: string; // e.g. 'Cardiology', 'Diagnostic Center', '24/7 Pharmacy'
  phone?: string;
  hospitalOrClinic?: string;
  address?: string;
  rating?: number;
  totalVisits?: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: FamilyRelation;
  dateOfBirth?: string;
  bloodGroup: BloodGroup;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  avatarColor: string;
  createdAt: string;
}

export type AllergyType = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export interface Allergy {
  id: string;
  memberId: string;
  allergen: string; // e.g. 'Penicillin', 'Sulfa', 'Peanuts'
  type: AllergyType;
  severity: AllergySeverity;
  reaction?: string; // e.g. 'Skin hives, Anaphylaxis'
  isCritical: boolean; // Marked as critical by user
  createdAt: string;
}

export type ConditionStatus = 'ACTIVE' | 'MANAGED' | 'RESOLVED';

export interface HealthCondition {
  id: string;
  memberId: string;
  conditionName: string; // e.g. 'Type 2 Diabetes', 'Hypertension', 'Asthma'
  status: ConditionStatus;
  firstDiagnosedDate?: string;
  notes?: string;
  isCritical: boolean; // Flagged for emergency profile
  createdAt: string;
}

export interface Vaccination {
  id: string;
  memberId: string;
  vaccineName: string; // e.g. 'COVID-19 Booster', 'Hepatitis B', 'Influenza', 'Tetanus'
  doseNumber: number; // >= 1
  totalDoses?: number; // >= doseNumber
  vaccinationDate: string;
  nextDueDate?: string;
  providerId?: string; // Links to HealthcareProvider
  providerName?: string;
  medicalEventId?: string; // Links to MedicalEvent container
  certificateDocumentId?: string; // Links to MedicalDocument
  batchNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface EmergencyProfileSettings {
  memberId: string;
  enabled: boolean;
  showBloodGroup: boolean;
  showCriticalAllergies: boolean;
  showCriticalConditions: boolean;
  showActiveMedications: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  qrToken?: string; // Short-lived / revocable random token for web inspection
  lastVerifiedAt?: string; // ISO date of last review
}

export interface EmergencyCardData {
  member: FamilyMember;
  settings: EmergencyProfileSettings;
  criticalAllergies: Allergy[];
  criticalConditions: HealthCondition[];
  activeMedications: string[]; // Dynamically resolved from Medicine Store
  lastVerifiedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string; // e.g. "Cardiologist", "General Medicine", "Pediatrician", "Dermatologist"
  hospitalOrClinic: string; // e.g. "Square Hospital", "Ibn Sina Specialized Hospital"
  chamberAddress?: string;
  phone?: string;
  email?: string;
  appointmentHotline?: string;
  notes?: string;
  createdAt: number;
}

export type MedicalDocumentType =
  | 'PRESCRIPTION'
  | 'LAB_REPORT'
  | 'IMAGING'
  | 'DISCHARGE_SUMMARY'
  | 'VACCINATION'
  | 'CERTIFICATE'
  | 'OTHER';

export interface MedicalDocument {
  id: string;
  memberId: string;
  eventId?: string;
  type: MedicalDocumentType;
  title: string;
  documentDate: string; // YYYY-MM-DD
  doctorId?: string;
  labOrHospital?: string;
  fileUri: string;
  fileType: 'image' | 'pdf';
  fileSize?: string;
  notes?: string;
  tags: string[]; // e.g. ["Blood Test", "CBC", "Post-Op"]
  cost?: number;
  isConfidential?: boolean;
  createdAt: number;
}

export type DiagnosticTestStatus =
  | 'PENDING'
  | 'SAMPLE_COLLECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type DiagnosticCategory =
  | 'BLOOD'
  | 'URINE'
  | 'IMAGING_XRAY'
  | 'CARDIAC_ECG'
  | 'ULTRASOUND'
  | 'OTHER';

export type LabResultValueType = 'NUMERIC' | 'TEXT' | 'BOOLEAN';

export interface LabResultEntry {
  id: string;
  memberId: string;
  testName: string; // e.g. "Complete Blood Count", "HbA1c Glycated Hemoglobin"
  analyteCode: string; // e.g. "HBA1C", "HEMOGLOBIN", "CREATININE", "FASTING_GLUCOSE", "CHOLESTEROL_TOTAL"
  analyteName: string; // e.g. "HbA1c", "Hemoglobin", "Serum Creatinine"
  valueType: LabResultValueType;
  numericValue?: number;
  textValue?: string;
  booleanValue?: boolean;
  unit: string; // e.g. "%", "g/dL", "mg/dL", "mmol/L", "U/L"
  referenceRange?: {
    min?: number;
    max?: number;
    text?: string;
  };
  referenceSource?: string; // e.g. "Square Hospital Lab", "Popular Diagnostic"
  testDate: string; // YYYY-MM-DD
  diagnosticTestId?: string; // Links to DiagnosticTest
  documentId?: string; // Links to MedicalDocument in vault
  notes?: string;
  createdAt: string;
}

export interface DiagnosticTest {
  id: string;
  eventId?: string;
  memberId: string;
  testName: string; // e.g. "Complete Blood Count (CBC)", "HbA1c", "Lipid Profile"
  testCategory: DiagnosticCategory;
  testDate: string; // YYYY-MM-DD
  labOrHospital?: string;
  doctorId?: string;
  status: DiagnosticTestStatus;
  documentId?: string;
  cost?: number;
  notes?: string;
  createdAt: number;
}

export type FollowUpStatus =
  | 'UPCOMING'
  | 'DUE'
  | 'COMPLETED'
  | 'RESCHEDULED'
  | 'CANCELLED';

export interface FollowUp {
  id: string;
  eventId?: string;
  memberId: string;
  doctorId?: string;
  doctorName?: string;
  dueDate: string; // YYYY-MM-DD
  reason: string;
  status: FollowUpStatus;
  completedDate?: string;
  reminderDaysBefore: number[]; // e.g. [7, 3, 1]
  notes?: string;
  createdAt: number;
}

export type MedicalExpenseCategory =
  | 'DOCTOR_VISIT'
  | 'DIAGNOSTIC_TEST'
  | 'MEDICINE'
  | 'HOSPITALIZATION'
  | 'DENTAL'
  | 'EMERGENCY'
  | 'OTHER';

export interface MedicalExpense {
  id: string;
  eventId?: string;
  memberId: string;
  category: MedicalExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  providerName?: string;
  paymentMethod?: string;
  notes?: string;
  syncedToExpenseTracker?: boolean;
  createdAt: number;
}

export interface PrescribedMedicineItem {
  name: string;
  dosage: string; // e.g. "1+0+1", "1+1+1"
  duration: string; // e.g. "7 days", "1 month"
  instructions?: string; // e.g. "After meal"
  syncedToCabinet?: boolean;
}

export interface VitalSigns {
  bloodPressure?: string; // "120/80"
  pulse?: number;
  weightKg?: number;
  temperatureF?: number;
  bloodSugarMmol?: number;
}

export interface MedicalEvent {
  id: string;
  memberId: string;
  title: string; // e.g. "Cardiology Routine Checkup", "Seasonal Viral Fever Visit"
  eventDate: string; // YYYY-MM-DD
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  hospitalOrClinic?: string;
  diagnosisOrReason: string;
  vitalSigns?: VitalSigns;
  notes?: string;
  documentIds: string[];
  testIds: string[];
  prescribedMedicines: PrescribedMedicineItem[];
  totalCost: number;
  followUpId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface HealthcareBudget {
  id: string;
  year: number;
  annualBudget: number; // e.g. 100000 (BDT)
  thresholdAlertPercent: number; // e.g. 80 (%)
  emergencyReserveAllocated?: number;
  notes?: string;
  updatedAt?: string;
}

export interface MedicalSpendingSummary {
  totalSpend: number;
  doctorVisitsTotal: number;
  diagnosticTestsTotal: number;
  medicinesTotal: number;
  hospitalizationTotal: number;
  otherTotal: number;
  memberBreakdown: { memberId: string; memberName: string; total: number }[];
  monthlyBreakdown: { month: string; total: number }[];
  budget?: HealthcareBudget;
  budgetConsumedPercent: number;
  isThresholdExceeded: boolean;
  remainingBudget: number;
}

export interface HospitalAdmission {
  id: string;
  memberId: string;
  hospitalName: string;
  admissionDate: string; // YYYY-MM-DD
  dischargeDate?: string; // YYYY-MM-DD
  reason: string; // e.g. "Laparoscopic Cholecystectomy", "Severe Dengue Observation"
  department?: string; // e.g. "Surgery", "Internal Medicine"
  doctorInCharge?: string;
  cabinOrBedNo?: string; // e.g. "Cabin 604"
  dischargeSummaryDocId?: string;
  totalHospitalBill: number;
  insuranceClaimed?: number;
  outOfPocketPaid: number;
  status: 'ADMITTED' | 'DISCHARGED';
  notes?: string;
  createdAt: string;
}

export type CareCalendarItemType =
  | 'DOCTOR_FOLLOWUP'
  | 'DIAGNOSTIC_TEST'
  | 'VACCINE_BOOSTER'
  | 'HOSPITAL_EVENT';

export interface CareCalendarItem {
  id: string;
  type: CareCalendarItemType;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle: string;
  memberId: string;
  memberName?: string;
  status?: string;
  isUrgent?: boolean;
  metadata?: Record<string, any>;
}
