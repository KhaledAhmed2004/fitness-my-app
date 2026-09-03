export type MedicineType = 'medicine' | 'supplement';
export type MedicineFormFactor =
  | 'pill'
  | 'capsule'
  | 'syrup'
  | 'drop'
  | 'injection'
  | 'powder'
  | 'gummy'
  | 'puff'
  | 'application';

export type MedicineUnit =
  | 'mg'
  | 'g'
  | 'ml'
  | 'pill'
  | 'capsule'
  | 'drop'
  | 'scoop'
  | 'IU'
  | 'puff'
  | 'application';

export type TimeCategory = 'morning' | 'afternoon' | 'evening' | 'night';

export interface MedicineScheduleItem {
  id: string;
  time: string; // e.g., '08:00 AM'
  timeCategory: TimeCategory;
  doseAmount: number; // e.g. 1 pill
  instructions?: string; // e.g. "Take after meal"
}

export interface MedicineItem {
  id: string;
  name: string;
  type: MedicineType;
  formFactor: MedicineFormFactor;
  strength?: string; // e.g. "500 mg", "5000 IU"
  unit: MedicineUnit;
  instructions?: string; // general intake instruction e.g. "With water"

  // INVENTORY & STOCK
  trackInventory: boolean;
  currentStock: number; // e.g. 24
  totalPackSize: number; // e.g. 30
  lowStockThreshold: number; // e.g. 5
  expiryDate?: string; // YYYY-MM-DD

  // SCHEDULING
  isAsNeeded: boolean; // PRN medicine (no fixed schedule)
  isCourse: boolean; // Course / antibiotic
  courseDurationDays?: number; // e.g. 7
  courseStartDate?: string; // YYYY-MM-DD
  schedules: MedicineScheduleItem[];

  isArchived?: boolean;
  createdAt: string;
}

export interface MedicineLog {
  id: string;
  medicineId: string;
  scheduleId?: string; // optional for PRN / as-needed intake
  date: string; // YYYY-MM-DD
  takenAt: string; // ISO string
  doseTaken: number;
  isTaken: boolean;
}

/**
 * Joined view representation for today's timeline cards
 */
export interface TodayDoseView {
  medicineId: string;
  scheduleId: string;
  name: string;
  type: MedicineType;
  formFactor: MedicineFormFactor;
  strength?: string;
  unit: MedicineUnit;
  time: string;
  timeCategory: TimeCategory;
  doseAmount: number;
  instructions?: string;
  isTaken: boolean;
  logId?: string;
  currentStock: number;
  trackInventory: boolean;
  lowStockThreshold: number;
  isAsNeeded?: boolean;
}

// Backward compatibility helper type for existing components
export type MedicineEntry = {
  id: string;
  name: string;
  amount: number;
  unit: MedicineUnit;
  time: string;
  timeCategory: TimeCategory;
  type: MedicineType;
  formFactor: MedicineFormFactor;
  date: string;
  isTaken?: boolean;
  medicineId?: string;
  scheduleId?: string;
};

