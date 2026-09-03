export interface FamilyMemberHealthCard {
  memberId: string;
  name: string;
  relationBn: string;
  age?: number;
  bloodGroup?: string;
  activeConditionsCount: number;
  activeMedicationsCount: number;
  lastDoctorVisitDate?: string;
  nextScheduledEvent?: string;
  pendingLabReportsCount: number;
  needsAttention: boolean;
  attentionReasonBn?: string;
  accentColor: string;
}

export interface UpcomingFamilyHealthEvent {
  id: string;
  memberId: string;
  memberName: string;
  memberRelationBn: string;
  titleBn: string;
  eventType: 'DOCTOR_VISIT' | 'LAB_TEST' | 'VACCINATION' | 'MEDICINE_REFILL';
  dueDateStr: string;
  accentColor: string;
  isOverdue: boolean;
}
