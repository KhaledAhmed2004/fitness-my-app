/**
 * Gym Trainer & Coaching Studio Data Contracts & Types
 * Complete Client CRM, PAR-Q+ Medical Clearance, Injury Shield, Scheduler & Certifications
 */

export type SessionPeriod = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type SessionType = '1_ON_1_PT' | 'ASSESSMENT' | 'NUTRITION_CONSULT' | 'FORM_CHECK';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type CertificationIssuer = 'NSCA' | 'ACE' | 'ISSA' | 'NASM' | 'RED_CROSS' | 'PRECISION_NUTRITION' | 'OTHER';

export type ClientGoalType =
  | 'HYPERTROPHY'
  | 'FAT_LOSS'
  | 'POWERLIFTING'
  | 'REHAB'
  | 'ATHLETIC_CONDITIONING';

export type InjurySeverity = 'MILD' | 'MODERATE' | 'SEVERE_CONTRAINDICATED';

export type ClientInjuryRecord = {
  id: string;
  jointOrArea: string; // e.g., 'Lumbar Spine (L4-L5)', 'Right Knee Patellar', 'Left Rotator Cuff'
  severity: InjurySeverity;
  contraindicatedMovements: string[]; // Red List: e.g. ['Barbell Back Squat', 'Standing OHP']
  safeAlternatives: string[]; // Green List: e.g. ['Belt Squat', 'Chest-Supported Row']
  notes: string;
};

export type ParQStatus = {
  hasHeartCondition: boolean;
  hasChestPainDuringExercise: boolean;
  hasDizzinessOrLossOfConsciousness: boolean;
  hasBoneOrJointProblem: boolean;
  isTakingBloodPressureMeds: boolean;
  medicalClearanceApproved: boolean;
  physicianName?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
};

export type CustomCoachingPackage = {
  id: string;
  title: string; // e.g. '12-Session Hypertrophy Master Pack', '1-Day Trial Single Assessment'
  tag?: string; // e.g. 'POPULAR', 'BEST VALUE', 'TRIAL', 'REHAB'
  sessionsCount: number; // e.g. 1, 8, 12, 16, 24, 36
  durationDays: number; // e.g. 7, 30, 45, 60, 90
  priceBdt: number; // e.g. 15000
  frequencyPerWeek: string; // e.g. '3 Days / Week', 'Flexible'
  features: string[]; // e.g. ['Custom Workout Split', 'Macro Nutrition Plan', 'WhatsApp Priority']
  color?: string; // accent color e.g. '#89FE00'
  isPopular?: boolean;
  isActive: boolean;
};

export type PaymentMethod = 'bKash' | 'Nagad' | 'Cash' | 'Bank';

export type PtPaymentRecord = {
  id: string;
  date: string;
  amountBdt: number;
  method: PaymentMethod;
  transactionId?: string;
  note?: string;
};

export type ClientProgressPhoto = {
  id: string;
  date: string;
  label: string; // 'Day 1 Baseline', 'Week 4 Check-in', 'Month 2 Transformation', etc.
  uri: string;
  weightAtTime?: number;
  bodyFatAtTime?: number;
  notes?: string;
};

export type PtPackageInfo = {
  packageType: string; // 'TRIAL_1' | 'MONTHLY_12' | 'TRANSFORMATION_24' | custom package id
  packageName?: string;
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  startDate: string;
  expiryDate: string;
  priceBdt: number;
  isPaid: boolean;
  attendanceHistory: {
    id: string;
    date: string;
    timeSlot: string;
    topic: string;
  }[];
  paymentLog?: PtPaymentRecord[];
};

export type PrescribedMealType =
  | 'BREAKFAST'
  | 'LUNCH'
  | 'PRE_WORKOUT'
  | 'POST_WORKOUT'
  | 'DINNER'
  | 'BEDTIME_SNACK';

export type PrescribedMeal = {
  id: string;
  mealType: PrescribedMealType;
  title: string;
  banglaTitle?: string;
  foods: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  timing: string;
  notes?: string;
};

export type PrescribedSupplement = {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
  isMandatory: boolean;
  brandSuggestion?: string;
};

export type CarbCyclingType =
  | 'BALANCED'
  | 'TRAINING_VS_REST'
  | 'LOW_CARB_HIGH_FAT'
  | 'HIGH_CARB_REFEED';

export type CoachDietPlan = {
  id: string;
  code: string; // 'HYPERTROPHY_LEAN_BULK', 'DESI_FAT_LOSS_CUT', 'RECON_CARB_CYCLE', etc.
  title: string;
  banglaTitle?: string;
  tag: string; // 'Hypertrophy', 'Fat Loss', 'Carb Cycling', 'Eggetarian', 'Rehab'
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  carbCyclingType: CarbCyclingType;
  trainingDayCarbsG?: number;
  restDayCarbsG?: number;
  meals: PrescribedMeal[];
  supplements: PrescribedSupplement[];
  waterIntakeLiters: number;
  coachGuidelines: string[];
  color: string;
  bg: string;
  description: string;
};

export type AssignedDietPlan = {
  id: string;
  clientId: string;
  clientName: string;
  dietPlanId: string;
  dietTitle: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  assignedAt: string; // ISO string
  status: 'ACTIVE' | 'ARCHIVED';
  customNotes?: string;
  supplementsList: PrescribedSupplement[];
  waterIntakeLiters?: number;
};

export type AthleteClientDossier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm?: number;
  starterSplitId?: string;
  avatarUrl?: string;
  goal: ClientGoalType;
  currentPhase: string; // e.g., 'Week 6: Hypertrophy Accumulation Block'
  startingWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number;
  bodyFatPercent?: number;
  parQ: ParQStatus;
  injuries: ClientInjuryRecord[];
  package: PtPackageInfo;
  dietPlan?: AssignedDietPlan;
  progressPhotos?: ClientProgressPhoto[];
  notes: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
};

export type TrainerCertification = {
  id: string;
  title: string;
  issuer: CertificationIssuer;
  issuerFull: string;
  credentialId: string;
  issueDate: string;
  expiryDate?: string;
  badgeCode: 'CSCS' | 'ACE' | 'ISSA' | 'CPR' | 'PN1';
  verified: boolean;
  color: string;
  bg: string;
  description: string;
};

export type ClientTransformation = {
  id: string;
  clientName: string;
  clientAvatar?: string;
  age: number;
  startingWeightKg: number;
  currentWeightKg: number;
  durationWeeks: number;
  programName: string;
  muscleGainKg?: number;
  bodyFatLossPercent?: number;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  story: string;
  verified: boolean;
  tag: string;
};

export type TrainerAppointmentSlot = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientAvatar?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., '07:00 AM - 08:00 AM'
  period: SessionPeriod;
  sessionType: SessionType;
  targetFocus: string;
  status: AppointmentStatus;
  attendancePunchedAt?: string;
  sessionNotes?: string;
  completedExercises?: string[];
};

export type TrainerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  bio: string;
  gymAffiliation: string;
  yearsOfExperience: number;
  totalClientsCoached: number;
  activeClientsCount: number;
  specialties: string[];
  certifications: TrainerCertification[];
  transformations: ClientTransformation[];
  pricingRates: {
    singleSessionRateBdt: number;
    monthlyPackage12Bdt: number;
    monthlyPackage24Bdt: number;
  };
  rating: {
    average: number;
    reviewCount: number;
  };
};

export type ProgramExercise = {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string; // e.g. '8-10' or '5' or '12-15'
  rpe?: number; // Reps In Reserve / Rate of Perceived Exertion (e.g., 8)
  tempo?: string; // e.g. '3-1-1-0'
  restSeconds: number; // e.g., 90
  notes?: string;
};

export type ProgramDay = {
  id: string;
  dayNumber: number;
  title: string; // e.g. 'Day 1: Heavy Push & Delts'
  focus: string;
  exercises: ProgramExercise[];
};

export type ProgramSplit = {
  id: string;
  code: string; // 'PPL', 'U/L', '531', 'REHAB', 'HIIT'
  title: string;
  subtitle: string;
  durationWeeks: number;
  daysPerWeek: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  goal: 'Hypertrophy' | 'Strength' | 'Fat Loss' | 'Spine Rehab' | 'Conditioning';
  color: string;
  bg: string;
  description: string;
  days: ProgramDay[];
};

export type AssignedProgram = {
  id: string;
  clientId: string;
  clientName: string;
  splitId: string;
  splitTitle: string;
  splitCode: string;
  assignedAt: string; // ISO date string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  notes?: string;
};

