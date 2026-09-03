/**
 * Gym Owner & Commercial Fitness Facility Data Contracts & Schemas
 * Full-stack B2B GymOS: Member CRM, Fee Billing, Trainer Payroll, Equipment AMC & Lead Tracker
 */

export type MembershipPlanType =
  | 'MONTHLY_STANDARD'
  | 'QUARTERLY_PRO'
  | 'HALF_YEARLY'
  | 'ANNUAL_VIP'
  | 'STUDENT_PASS'
  | 'OFF_PEAK_PASS'
  | string;

export interface GymMembershipPlan {
  id: string;
  type: string;
  title: string;
  durationMonths: number;
  feeBdt: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
  description?: string;
}

export type MemberStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNPAID' | 'FROZEN';

export type GymFreezeReason = 'MEDICAL' | 'EXAM' | 'TRAVEL' | 'RAMADAN' | 'WORK' | 'OTHER';

export interface GymMemberFreezeRecord {
  id: string;
  freezeStartDate: string; // YYYY-MM-DD
  freezeEndDate?: string; // Tentative return date YYYY-MM-DD
  resumedDate?: string; // Actual return date YYYY-MM-DD
  reason: GymFreezeReason;
  reasonNotes?: string;
  daysFrozen?: number;
  previousEndDate: string;
  newEndDate?: string;
}

export type PaymentMethod = 'bKash' | 'Nagad' | 'Cash' | 'Card' | 'Bank_Transfer';

export interface GymPaymentRecord {
  id: string;
  date: string;
  amountBdt: number;
  method: PaymentMethod;
  transactionId?: string;
  notes?: string;
  invoiceNumber: string;
  receivedBy: string;
}

// How was this member enrolled into the gym?
export type EnrollmentSource = 'MANUAL' | 'WHATSAPP_BOT' | 'QR_SELF_ENROLL';

export interface GymMemberItem {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  membershipPlan: MembershipPlanType;
  planTitle: string;
  startDate: string;
  endDate: string;
  admissionFeeBdt?: number;
  totalFeeBdt: number;
  paidAmountBdt: number;
  dueAmountBdt: number;
  status: MemberStatus;
  lastCheckInDate?: string;
  assignedTrainerId?: string;
  assignedTrainerName?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  lockerNumber?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  weightKg?: number; // Body Weight in KG
  enrollmentDate?: string; // YYYY-MM-DD
  totalCheckInsCount?: number;
  currentStreakDays?: number;
  lastBirthdayWishedYear?: number;
  paymentHistory: GymPaymentRecord[];
  freezeHistory?: GymMemberFreezeRecord[];
  currentFreeze?: GymMemberFreezeRecord;
  bodyMeasurements?: GymBodyMeasurement[];
  ptPackages?: PTPackageEnrollment[];
  absenceReasonTag?: AbsenceReasonTag;
  lastRescueContactedDate?: string; // YYYY-MM-DD
  assignedPlanHistory?: MemberAssignedPlanRecord[];
  currentDietPlanId?: string;
  currentWorkoutRoutineId?: string;
  referralCode?: string;
  referredByMemberId?: string;
  referredByMemberName?: string;
  referralCount?: number;
  ambassadorTier?: AmbassadorTier;
  notes?: string;
  /** How this member was onboarded (undefined = legacy/manual) */
  enrollmentSource?: EnrollmentSource;
  /** ISO timestamp of WhatsApp/QR enrollment, used for "new via WhatsApp" badge */
  whatsappEnrolledAt?: string;
}

export interface GymTrainerStaff {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE';
  specialization: string;
  baseSalaryBdt: number;
  commissionPercentage: number; // e.g. 30% of PT packages
  assignedClientsCount: number;
  monthlyRevenueGeneratedBdt: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  shift: 'MORNING' | 'EVENING' | 'FULL_DAY';
}

export type EquipmentCategory = 'CARDIO' | 'STRENGTH_MACHINE' | 'FREE_WEIGHTS' | 'FACILITY_AC';
export type EquipmentStatus = 'OPTIMAL' | 'SERVICE_DUE' | 'OUT_OF_ORDER';

export interface GymEquipmentItem {
  id: string;
  name: string;
  brand: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  purchaseDate: string;
  lastServiceDate: string;
  nextServiceDueDate: string;
  warrantyExpiryDate?: string;
  technicianPhone?: string;
  lastRepairCostBdt?: number;
  notes?: string;
}

export type LeadSource = 'WALK_IN' | 'INSTAGRAM' | 'FACEBOOK' | 'MEMBER_REFERRAL' | 'WEBSITE';
export type LeadStatus = 'INQUIRY' | 'TRIAL_BOOKED' | 'CONVERTED' | 'LOST';

export interface GymLeadItem {
  id: string;
  fullName: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  interestedPlan: MembershipPlanType;
  inquiryDate: string;
  trialDate?: string;
  followUpDate: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'RENT'
  | 'ELECTRICITY_AC'
  | 'STAFF_PAYROLL'
  | 'EQUIPMENT_REPAIR'
  | 'MARKETING_ADS'
  | 'CLEANING_SUPPLIES'
  | 'MISC';

export interface GymExpenseItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  amountBdt: number;
  date: string;
  receiptNumber?: string;
  notes?: string;
}

export interface GymAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  targetAudience: 'ALL_MEMBERS' | 'TRAINERS_ONLY' | 'EXPIRING_MEMBERS';
  isPinned: boolean;
}

export type LockerStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type LockerType = 'DAILY_FREE' | 'MONTHLY_RENTAL' | 'VIP';

export interface GymLockerItem {
  id: string;
  lockerNumber: string; // e.g. 'L-01', 'L-02'
  status: LockerStatus;
  type: LockerType;
  assignedMemberId?: string;
  assignedMemberName?: string;
  assignedMemberPhone?: string;
  assignedDate?: string;
  expiryDate?: string;
  monthlyRentBdt?: number;
  notes?: string;
}

export type GymShiftType = 'LADIES_ONLY' | 'GENTS_ONLY' | 'UNISEX_MIXED';

export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export interface GymShiftScheduleItem {
  id: string;
  name: string;
  shiftType: GymShiftType;
  allowedGenders: ('MALE' | 'FEMALE' | 'OTHER')[];
  startTime: string; // '10:00' 24-hr format
  endTime: string;   // '13:00' 24-hr format
  daysApplicable: DayOfWeek[];
  isActive: boolean;
  notes?: string;
}

export interface GymShiftStatusSnapshot {
  currentShift: GymShiftScheduleItem | null;
  shiftType: GymShiftType;
  label: string;
  badgeEmoji: string;
  remainingMinutes: number;
  nextShift: GymShiftScheduleItem | null;
  nextShiftStartsInMinutes: number;
}

// 🎂 MEMBER CELEBRATION & MILESTONE RETENTION CONTRACTS
export type GymMilestoneType = 'BIRTHDAY' | 'STREAK_50' | 'CENTURY_100' | 'GYMVERSARY_1YR';

export interface GymCelebrationItem {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberAvatar?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  type: GymMilestoneType;
  title: string;
  badgeEmoji: string;
  description: string;
  isWishedThisYear: boolean;
  perkOffer?: string;
  dateString: string;
  daysRemaining?: number; // 0 = today, 1..7 = upcoming
}

export interface GymCelebrationSummary {
  todaysCelebrations: GymCelebrationItem[];
  upcomingBirthdays7Days: GymCelebrationItem[];
  hasCelebrationsToday: boolean;
}

// 💵 CASH REGISTER & NIGHTLY RECONCILIATION CONTRACTS
export type CashRegisterSessionStatus = 'OPEN' | 'CLOSED';

export type PettyExpenseCategory =
  | 'UTILITIES'
  | 'MAINTENANCE'
  | 'REFRESHMENTS'
  | 'SUPPLIES'
  | 'STAFF'
  | 'MISC';

export type PettyVoucherStatus = 'APPROVED' | 'AUTO_APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface GymPettyCatalogItem {
  id: string;
  category: PettyExpenseCategory;
  name: string; // e.g. "Kinley 20L Water Jar"
  standardRateBdt: number; // e.g. 80
  unit: string; // e.g. "per jar"
  icon: string;
  isPopular?: boolean;
}

export interface GymPettyExpenseItem {
  id: string;
  voucherNumber?: string; // e.g. "PV-2026-0901-01"
  category: PettyExpenseCategory;
  title: string; // e.g. "2x Kinley Water Jars"
  catalogItemId?: string;
  amountBdt: number;
  paidFrom: 'CASH_DRAWER' | 'BKASH_MERCHANT' | 'OWNER_POCKET';
  spentBy: string; // Staff Name
  recipientName?: string; // e.g. "Kinley Delivery Agent"
  time: string; // HH:mm
  hasReceiptPhoto?: boolean;
  receiptPhotoUri?: string;
  approvalStatus?: PettyVoucherStatus;
  approvedBy?: string;
  notes?: string;
}

export interface GymPettyEnvelopeStatus {
  totalAllocatedFloatBdt: number; // e.g. ৳ 2,000
  currentRemainingBalanceBdt: number; // e.g. ৳ 1,350
  todaySpentBdt: number; // e.g. ৳ 650
  dailySpendLimitBdt: number; // e.g. ৳ 1,500
  vouchersTodayCount: number;
}

export interface GymCashDropItem {
  id: string;
  time: string;
  amountBdt: number;
  receivedBy: string; // e.g. "Owner Khaled"
  notes?: string;
}

export interface GymCashDrawerSession {
  id: string;
  date: string; // YYYY-MM-DD
  status: CashRegisterSessionStatus;
  openedAt: string; // ISO String
  openedBy: string;
  openingFloatBdt: number; // e.g. ৳1,000 (starting cash)

  pettyExpenses: GymPettyExpenseItem[];
  cashDrops: GymCashDropItem[];

  actualCashReportedBdt?: number; // Counted by manager at closing
  cashDiscrepancyBdt?: number; // actual - expected (0, positive or negative)
  discrepancyReason?: string;

  closedAt?: string;
  closedBy?: string;
  eodNotes?: string;
}

export interface GymCashRegisterSnapshot {
  session: GymCashDrawerSession;
  openingFloatBdt: number;
  cashCollectedBdt: number;
  bkashCollectedBdt: number;
  nagadCollectedBdt: number;
  cardCollectedBdt: number;
  bankTransferCollectedBdt: number;
  totalGrossRevenueBdt: number;
  pettyCashSpentBdt: number;
  cashDropsTotalBdt: number;
  expectedCashInDrawerBdt: number;
  paymentCountByMethod: {
    Cash: number;
    bKash: number;
    Nagad: number;
    Card: number;
    Bank_Transfer: number;
  };
}

export interface GymProfile {
  id: string;
  gymName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  operatingHours: string;
  maxFloorCapacity: number;
  currentFloorCount: number;
  totalLockersCount?: number;
  logoUrl?: string;
  bannerUrl?: string;
  bkashMerchantNumber?: string;
  nagadMerchantNumber?: string;
  defaultAdmissionFeeBdt?: number;
  shifts?: GymShiftScheduleItem[];
  managerPin?: string;
}

export interface GymFinancialSnapshot {
  mrrBdt: number;
  totalCollectedThisMonthBdt: number;
  totalPendingDuesBdt: number;
  totalExpensesThisMonthBdt: number;
  netProfitThisMonthBdt: number;
  activeMemberCount: number;
  expiringIn7DaysCount: number;
  unpaidMembersCount: number;
  todayCheckInsCount: number;
}

export type ProShopCategory = 'SHAKES' | 'SUPPLEMENTS' | 'BEVERAGES' | 'SNACKS' | 'GEAR';

export interface GymProShopItem {
  id: string;
  name: string;
  category: ProShopCategory;
  priceBdt: number;
  costBdt: number;
  stockQuantity: number;
  reorderThreshold: number;
  unit: string; // e.g. "Glass", "Can", "Tub 2lb", "Bar", "Pair"
  imageUrl?: string;
  isBestSeller?: boolean;
  caloriesKcal?: number;
  proteinGrams?: number;
}

export type PosPaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Card' | 'MEMBER_TAB';

export interface GymPosSaleRecord {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  category: ProShopCategory;
  quantity: number;
  unitPriceBdt: number;
  totalPriceBdt: number;
  profitBdt: number;
  paymentMethod: PosPaymentMethod;
  buyerType: 'WALK_IN' | 'MEMBER';
  memberId?: string;
  memberName?: string;
  transactionId?: string;
  receivedBy: string;
}

// 🏢 GYM OPEX & STAFF EXPENSES CONTRACTS
export type GymOPEXCategory =
  | 'STAFF_SALARY_ADVANCE'
  | 'STAFF_TIFFIN_ALLOWANCE'
  | 'STAFF_TRANSPORT_REIMBURSE'
  | 'GENERATOR_FUEL'
  | 'UTILITIES_WATER_POWER'
  | 'CLEANING_SANITATION'
  | 'HARDWARE_EQUIPMENT_REPAIR'
  | 'OFFICE_SUPPLIES_MISC'
  | 'GOVT_TRADE_FEES';

export interface GymOperationalExpenseItem {
  id: string;
  voucherNumber: string; // e.g. "EXP-20260901-01"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  category: GymOPEXCategory;
  amountBdt: number;
  paidFrom: 'CASH_DRAWER' | 'BKASH_MERCHANT' | 'OWNER_PERSONAL' | 'BANK_TRANSFER';
  spentBy: string; // Staff or Manager Name
  targetStaffId?: string; // If salary advance or personal allowance
  targetStaffName?: string;
  fuelLiters?: number; // If generator diesel
  recipientName?: string; // Vendor / Shop / Person
  hasReceiptPhoto?: boolean;
  receiptPhotoUri?: string;
  notes?: string;
}

export interface StaffLedgerSummary {
  staffId: string;
  staffName: string;
  role: string;
  monthlyBaseSalaryBdt: number;
  totalAdvanceTakenThisMonthBdt: number;
  totalAllowancesClaimedBdt: number;
  netPayableSalaryBdt: number;
  advancesCount: number;
}

// ⚖️ MEMBER BODY TRANSFORMATION & MEASUREMENT CONTRACTS
export interface GymBodyMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  weightKg: number;
  heightCm?: number;
  bodyFatPercentage?: number;
  chestInches?: number;
  waistInches?: number;
  bicepInches?: number;
  hipsInches?: number;
  thighsInches?: number;
  bmi?: number;
  measuredByTrainerId?: string;
  measuredByTrainerName: string;
  notes?: string;
}

export interface GymTransformationSummary {
  memberId: string;
  memberName: string;
  phone: string;
  baseline: GymBodyMeasurement;
  latest: GymBodyMeasurement;
  checkpointsCount: number;
  daysSinceBaseline: number;
  deltaWeightKg: number;
  deltaWaistInches?: number;
  deltaChestInches?: number;
  deltaBicepInches?: number;
  deltaBodyFat?: number;
  isRecompositionVictory: boolean;
  primaryTransformationStatus: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'RECOMPOSITION' | 'MAINTENANCE';
}

// 🥊 PERSONAL TRAINING (PT) CONTRACTS
export type PTSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW_CHARGED' | 'CANCELLED_FORGIVEN';

export interface PTPunchRecord {
  id: string;
  sessionNumber: number; // e.g. 5
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  conductedByTrainerId: string;
  conductedByTrainerName: string;
  status: PTSessionStatus;
  workoutFocus?: string; // e.g. "Chest Hypertrophy & Bench"
  trainerCommissionBdt: number; // e.g. ৳300
  notes?: string;
}

export interface PTPackageEnrollment {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  assignedTrainerId: string;
  assignedTrainerName: string;
  packageTitle: string; // e.g. "12-Session Fat Shred Elite"
  totalSessions: number; // 12, 24, 36
  completedSessions: number;
  packagePriceBdt: number; // e.g. 12,000
  trainerCommissionTotalBdt: number; // e.g. 3,600 (30%)
  commissionPerSessionBdt: number; // e.g. 300
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'FROZEN';
  history: PTPunchRecord[];
}

export interface TrainerPTCommissionSummary {
  trainerId: string;
  trainerName: string;
  totalActivePTPackages: number;
  totalSessionsConductedThisMonth: number;
  totalCommissionEarnedBdt: number;
  projectedCommissionBdt: number;
}

// 👻 GHOSTING MEMBER & ABSENTEE RESCUE CONTRACTS
export type GhostingTier = 'TIER_1_SOFT' | 'TIER_2_CRITICAL' | 'TIER_3_DANGER';
export type AbsenceReasonTag = 'NONE' | 'EXAMS' | 'TRAVEL' | 'SICK_INJURY' | 'PERSONAL_BUSY';

export interface GhostingMemberInfo {
  memberId: string;
  fullName: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  assignedTrainerId?: string;
  assignedTrainerName?: string;
  membershipPlanTitle: string;
  daysAbsent: number;
  lastCheckInDate: string; // YYYY-MM-DD
  tier: GhostingTier;
  absenceReason: AbsenceReasonTag;
  lastRescueContactedDate?: string; // YYYY-MM-DD
  isCoolingDown: boolean;
}

// 🥗 DIET & WORKOUT ROUTINE PRESCRIBER CONTRACTS
export type DietGoalCategory = 'FAT_LOSS' | 'MUSCLE_BULK' | 'LEAN_TONING' | 'MAINTENANCE';
export type DietBudgetType = 'BUDGET_STUDENT' | 'STANDARD_DESI' | 'PREMIUM_EXECUTIVE';

export interface GymDietMealItem {
  mealTime: 'BREAKFAST' | 'MID_MORNING' | 'LUNCH' | 'PRE_WORKOUT' | 'POST_WORKOUT' | 'DINNER';
  title: string;
  itemsBengali: string[];
  approxCalories: number;
  proteinGrams: number;
  substitutions?: string;
}

export interface GymDietPlanTemplate {
  id: string;
  title: string;
  category: DietGoalCategory;
  budgetType: DietBudgetType;
  dailyCalories: number;
  dailyProteinGrams: number;
  description: string;
  meals: GymDietMealItem[];
  dosAndDonts: string[];
}

export interface GymWorkoutRoutineTemplate {
  id: string;
  title: string;
  splitType: 'FULL_BODY_3DAY' | 'PUSH_PULL_LEGS' | 'UPPER_LOWER_4DAY' | 'FAT_LOSS_CIRCUIT';
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  daysSchedule: {
    dayName: string;
    exercises: { name: string; setsReps: string; notes?: string }[];
  }[];
  coachingTips: string[];
}

export interface MemberAssignedPlanRecord {
  id: string;
  assignedDate: string; // YYYY-MM-DD
  assignedByTrainerId: string;
  assignedByTrainerName: string;
  dietPlanId?: string;
  dietPlanTitle?: string;
  workoutRoutineId?: string;
  workoutRoutineTitle?: string;
  coachPersonalNotes?: string;
}

// 🎁 MEMBER REFERRAL & AMBASSADOR CONTRACTS
export type AmbassadorTier = 'MEMBER' | 'BRONZE_AMBASSADOR' | 'SILVER_AMBASSADOR' | 'GOLD_AMBASSADOR';

export interface GymReferralRecord {
  id: string;
  referrerMemberId: string;
  referrerMemberName: string;
  referrerCode: string;
  referredMemberId: string;
  referredMemberName: string;
  referredMemberPhone: string;
  enrolledDate: string; // YYYY-MM-DD
  packageTitle: string;
  rewardStatus: 'REWARDED' | 'REVOKED';
  rewardDescription: string;
  daysAddedToReferrer: number;
  discountGivenToFriendBdt: number;
}

export interface GymReferralSummary {
  totalReferralsCount: number;
  totalDaysRewarded: number;
  activeAmbassadorsCount: number;
  topReferrers: {
    memberId: string;
    memberName: string;
    phone: string;
    referralCode: string;
    referralCount: number;
    tier: AmbassadorTier;
    daysEarned: number;
  }[];
}



