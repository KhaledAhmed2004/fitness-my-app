export type CalendarPlatform =
  | 'GOOGLE_CALENDAR'
  | 'APPLE_CALENDAR'
  | 'DEVICE_CALENDAR'
  | 'ICAL_FEED';

export type SyncableHealthItemType =
  | 'DOCTOR_FOLLOWUP'
  | 'VACCINE_BOOSTER'
  | 'LAB_DIAGNOSTIC_TEST'
  | 'HEREDITARY_SCREENING'
  | 'HOSPITAL_VISIT'
  | 'CUSTOM';

export interface SyncableHealthEvent {
  id: string;
  memberId: string;
  memberName: string;
  title: string; // e.g. "Dr. M. A. Rahman - Cardiology Follow-up"
  itemType: SyncableHealthItemType;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // "10:00 AM" or "10:00"
  durationMinutes: number; // default 60
  location?: string; // e.g. "National Heart Foundation, Dhaka"
  clinicalNotes?: string; // e.g. "Bring previous lipid profile, fasting 8h"
  doctorName?: string;
  specialty?: string;
  alarmPresets: number[]; // Minutes before: [1440, 120, 30]
  isSynced: boolean;
  syncedAt?: string;
  syncedPlatform?: CalendarPlatform;
}

export interface CalendarAlarmConfig {
  remind24HoursBefore: boolean;
  remind2HoursBefore: boolean;
  remind30MinutesBefore: boolean;
  includeFastingInstructions: boolean;
  includeDoctorContact: boolean;
}

export interface CalendarSyncBatchResult {
  totalEvents: number;
  syncedSuccess: number;
  failed: number;
  platform: CalendarPlatform;
  syncedAt: string;
}
