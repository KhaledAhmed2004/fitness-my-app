export interface MedicationInstruction {
  medicineName: string;
  dosage: string;
  timing: string;
  duration?: string;
  notes?: string;
}

export interface DoctorConsultationSummary {
  chiefComplaints: string[];
  doctorDiagnosis: string;
  keyAdvicePoints: string[];
  dietAndLifestyleRestrictions: string[];
  medicationInstructions: MedicationInstruction[];
  advisedInvestigations: string[];
  redFlagWarningSymptoms: string[];
  followUpTimeline: string;
  aiClinicalInsight: string;
}

export interface DoctorConsultationRecording {
  id: string;
  memberId: string;
  title: string;
  doctorName: string;
  specialty?: string;
  hospitalOrClinic?: string;
  recordedAt: string;
  durationSeconds: number;
  audioUri?: string;
  status: 'RECORDING' | 'TRANSCRIBING' | 'SUMMARIZED' | 'FAILED';
  rawTranscript?: string;
  summary?: DoctorConsultationSummary;
  tags: string[];
  isSyncedToTimeline?: boolean;
}
