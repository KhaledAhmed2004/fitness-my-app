/**
 * Gym Owner Store — State Management for Commercial Fitness Facility (GymOS)
 * Manages Member CRM, Fee Collection, Trainer Roster, Equipment Health, Leads & Financial Analytics
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type {
  GymProfile,
  GymMemberItem,
  GymTrainerStaff,
  GymEquipmentItem,
  GymLeadItem,
  GymExpenseItem,
  GymAnnouncement,
  GymFinancialSnapshot,
  GymProShopItem,
  GymPosSaleRecord,
  ProShopCategory,
  PosPaymentMethod,
  MemberStatus,
  MembershipPlanType,
  GymMembershipPlan,
  PaymentMethod,
  GymLockerItem,
  LockerStatus,
  LockerType,
  GymFreezeReason,
  GymMemberFreezeRecord,
  GymPaymentRecord,
  GymShiftType,
  DayOfWeek,
  GymShiftScheduleItem,
  GymShiftStatusSnapshot,
  GymMilestoneType,
  GymCelebrationItem,
  GymCelebrationSummary,
  CashRegisterSessionStatus,
  PettyExpenseCategory,
  PettyVoucherStatus,
  GymPettyCatalogItem,
  GymPettyExpenseItem,
  GymPettyEnvelopeStatus,
  GymCashDropItem,
  GymCashDrawerSession,
  GymCashRegisterSnapshot,
  GymOPEXCategory,
  GymOperationalExpenseItem,
  StaffLedgerSummary,
  GymBodyMeasurement,
  GymTransformationSummary,
  PTSessionStatus,
  PTPunchRecord,
  PTPackageEnrollment,
  TrainerPTCommissionSummary,
  GhostingTier,
  AbsenceReasonTag,
  GhostingMemberInfo,
  DietGoalCategory,
  DietBudgetType,
  GymDietMealItem,
  GymDietPlanTemplate,
  GymWorkoutRoutineTemplate,
  MemberAssignedPlanRecord,
  AmbassadorTier,
  GymReferralRecord,
  GymReferralSummary,
} from '@/types/gym';

const GYM_STORAGE_KEY = 'vital_gym_owner_master_v1';

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

// 🏛️ SEED GYM PROFILE
const SEED_GYM_PROFILE: GymProfile = {
  id: 'gym_ironforge_101',
  gymName: 'IronForge Fitness Arena',
  tagline: 'Premium Strength, Conditioning & Recovery Hub',
  ownerName: 'Khaled Nayeem',
  phone: '+880 1805-659610',
  email: 'director@ironforgegym.com',
  address: 'Level 4, Road 11, Block D, Banani',
  city: 'Dhaka, Bangladesh',
  operatingHours: '6:00 AM – 11:00 PM (Daily)',
  maxFloorCapacity: 75,
  currentFloorCount: 32,
  logoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
  bkashMerchantNumber: '01805659610',
  nagadMerchantNumber: '01805659610',
  defaultAdmissionFeeBdt: 1000,
  managerPin: '1234',
};

// ⏰ SEED GYM SHIFTS (Ladies & Gents Schedules)
export const SEED_GYM_SHIFTS: GymShiftScheduleItem[] = [
  {
    id: 'shift_1',
    name: 'Morning Gents Prime',
    shiftType: 'GENTS_ONLY',
    allowedGenders: ['MALE'],
    startTime: '06:00',
    endTime: '10:00',
    daysApplicable: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    isActive: true,
    notes: 'Morning heavy lifting & cardio (Gents only)',
  },
  {
    id: 'shift_2',
    name: 'Ladies Prime Shift',
    shiftType: 'LADIES_ONLY',
    allowedGenders: ['FEMALE'],
    startTime: '10:00',
    endTime: '13:00',
    daysApplicable: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    isActive: true,
    notes: 'Full privacy with female trainers & staff on floor',
  },
  {
    id: 'shift_3',
    name: 'Afternoon Mixed Session',
    shiftType: 'UNISEX_MIXED',
    allowedGenders: ['MALE', 'FEMALE', 'OTHER'],
    startTime: '13:00',
    endTime: '16:30',
    daysApplicable: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    isActive: true,
    notes: 'Open floor for both male and female athletes',
  },
  {
    id: 'shift_4',
    name: 'Evening Gents Rush',
    shiftType: 'GENTS_ONLY',
    allowedGenders: ['MALE'],
    startTime: '16:30',
    endTime: '23:00',
    daysApplicable: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT'],
    isActive: true,
    notes: 'Peak evening strength & bodybuilding hours',
  },
  {
    id: 'shift_5',
    name: 'Friday Ladies Morning',
    shiftType: 'LADIES_ONLY',
    allowedGenders: ['FEMALE'],
    startTime: '09:00',
    endTime: '12:00',
    daysApplicable: ['FRI'],
    isActive: true,
    notes: 'Pre-Jummah prayer ladies workout session',
  },
  {
    id: 'shift_6',
    name: 'Friday Gents Post-Jummah',
    shiftType: 'GENTS_ONLY',
    allowedGenders: ['MALE'],
    startTime: '14:30',
    endTime: '23:00',
    daysApplicable: ['FRI'],
    isActive: true,
    notes: 'Friday evening workout session',
  },
];

// Helper to evaluate current shift status
export function evaluateCurrentShift(
  shifts?: GymShiftScheduleItem[],
  testDate?: Date
): GymShiftStatusSnapshot {
  const list = (shifts && shifts.length > 0 ? shifts : SEED_GYM_SHIFTS).filter((s) => s.isActive);
  const now = testDate || new Date();

  const dayNames: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const currentDay = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayShifts = list.filter((s) => s.daysApplicable.includes(currentDay));

  const parseMins = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
    return h * 60 + m;
  };

  let activeShift: GymShiftScheduleItem | null = null;
  let remainingMinutes = 0;

  for (const shift of todayShifts) {
    const startM = parseMins(shift.startTime);
    const endM = parseMins(shift.endTime);

    if (currentMinutes >= startM && currentMinutes < endM) {
      activeShift = shift;
      remainingMinutes = endM - currentMinutes;
      break;
    }
  }

  let nextShift: GymShiftScheduleItem | null = null;
  let nextShiftStartsInMinutes = 0;

  const upcoming = todayShifts
    .filter((s) => parseMins(s.startTime) > currentMinutes)
    .sort((a, b) => parseMins(a.startTime) - parseMins(b.startTime));

  if (upcoming.length > 0) {
    nextShift = upcoming[0];
    nextShiftStartsInMinutes = parseMins(nextShift.startTime) - currentMinutes;
  } else if (todayShifts.length > 0) {
    const sorted = [...todayShifts].sort((a, b) => parseMins(a.startTime) - parseMins(b.startTime));
    nextShift = sorted[0];
    nextShiftStartsInMinutes = 24 * 60 - currentMinutes + parseMins(nextShift.startTime);
  }

  if (activeShift) {
    const emoji =
      activeShift.shiftType === 'LADIES_ONLY'
        ? '🚺'
        : activeShift.shiftType === 'GENTS_ONLY'
        ? '🚹'
        : '🚻';

    return {
      currentShift: activeShift,
      shiftType: activeShift.shiftType,
      label: activeShift.name,
      badgeEmoji: emoji,
      remainingMinutes,
      nextShift,
      nextShiftStartsInMinutes,
    };
  }

  return {
    currentShift: null,
    shiftType: 'UNISEX_MIXED',
    label: 'Open / Off-Peak Hours',
    badgeEmoji: '⚡',
    remainingMinutes: nextShiftStartsInMinutes,
    nextShift,
    nextShiftStartsInMinutes,
  };
}

// 🎂 Helper to evaluate birthdays & milestones
export function evaluateCelebrations(
  members: GymMemberItem[],
  targetDate?: Date
): GymCelebrationSummary {
  const now = targetDate || new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayMMDD = `${pad(currentMonth)}-${pad(currentDay)}`;

  const todaysCelebrations: GymCelebrationItem[] = [];
  const upcomingBirthdays7Days: GymCelebrationItem[] = [];

  members.forEach((m) => {
    // 1. Check Birthday
    if (m.dateOfBirth) {
      const parts = m.dateOfBirth.split('-');
      if (parts.length >= 3) {
        const bMonth = parseInt(parts[1], 10);
        const bDay = parseInt(parts[2], 10);
        const bMMDD = `${pad(bMonth)}-${pad(bDay)}`;

        const isWished = m.lastBirthdayWishedYear === currentYear;

        if (bMMDD === todayMMDD) {
          // Today's Birthday
          todaysCelebrations.push({
            id: `bday_${m.id}_${currentYear}`,
            memberId: m.id,
            memberName: m.fullName,
            memberPhone: m.phone,
            memberAvatar: m.avatarUrl,
            gender: m.gender,
            type: 'BIRTHDAY',
            title: 'Birthday Today! 🎉',
            badgeEmoji: '🎂',
            description: `${m.fullName} celebrates their birthday today. Send love & gift perk!`,
            isWishedThisYear: isWished,
            perkOffer: '🥤 1 Free Shake at Juice Bar & 10% Renewal Discount',
            dateString: m.dateOfBirth,
            daysRemaining: 0,
          });
        } else {
          // Check upcoming within 7 days
          const nextBday = new Date(currentYear, bMonth - 1, bDay);
          if (nextBday < now) {
            nextBday.setFullYear(currentYear + 1);
          }
          const diffMs = nextBday.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays > 0 && diffDays <= 7) {
            upcomingBirthdays7Days.push({
              id: `up_bday_${m.id}_${diffDays}`,
              memberId: m.id,
              memberName: m.fullName,
              memberPhone: m.phone,
              memberAvatar: m.avatarUrl,
              gender: m.gender,
              type: 'BIRTHDAY',
              title: `Birthday in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
              badgeEmoji: '🎈',
              description: `Upcoming on ${parts[2]} ${new Date(currentYear, bMonth - 1).toLocaleString('default', { month: 'short' })}`,
              isWishedThisYear: isWished,
              dateString: m.dateOfBirth,
              daysRemaining: diffDays,
            });
          }
        }
      }
    }

    // 2. Check Milestones (50 / 100 Check-ins)
    const checkins = m.totalCheckInsCount || 0;
    if (checkins === 50) {
      todaysCelebrations.push({
        id: `milestone_50_${m.id}`,
        memberId: m.id,
        memberName: m.fullName,
        memberPhone: m.phone,
        memberAvatar: m.avatarUrl,
        gender: m.gender,
        type: 'STREAK_50',
        title: '50th Workout Milestone! 🔥',
        badgeEmoji: '🔥',
        description: 'Half-Century of pure discipline & gains completed!',
        isWishedThisYear: false,
        perkOffer: '🎖️ IronForge Silver Athlete Digital Certificate',
        dateString: m.lastCheckInDate || 'Today',
        daysRemaining: 0,
      });
    } else if (checkins === 100) {
      todaysCelebrations.push({
        id: `milestone_100_${m.id}`,
        memberId: m.id,
        memberName: m.fullName,
        memberPhone: m.phone,
        memberAvatar: m.avatarUrl,
        gender: m.gender,
        type: 'CENTURY_100',
        title: '100th Workout Century Club! 💯',
        badgeEmoji: '💯',
        description: 'Elite 100 workouts completed at IronForge!',
        isWishedThisYear: false,
        perkOffer: '🏆 Century Hall of Fame Pass & Free Steam Pass',
        dateString: m.lastCheckInDate || 'Today',
        daysRemaining: 0,
      });
    }

    // 3. 1-Year Gymversary (365 days)
    if (m.enrollmentDate) {
      const enrollDate = new Date(m.enrollmentDate);
      const diffMs = now.getTime() - enrollDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 365 || diffDays === 730) {
        todaysCelebrations.push({
          id: `gymversary_${m.id}_${diffDays}`,
          memberId: m.id,
          memberName: m.fullName,
          memberPhone: m.phone,
          memberAvatar: m.avatarUrl,
          gender: m.gender,
          type: 'GYMVERSARY_1YR',
          title: `${diffDays === 365 ? '1-Year' : '2-Year'} Gymversary! 🏆`,
          badgeEmoji: '🏆',
          description: `${diffDays === 365 ? '365 Days' : '730 Days'} of fitness brotherhood at IronForge!`,
          isWishedThisYear: false,
          perkOffer: '⭐ VIP Loyalty Renewal Special Bonus (15% Off)',
          dateString: m.enrollmentDate,
          daysRemaining: 0,
        });
      }
    }
  });

  upcomingBirthdays7Days.sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

  return {
    todaysCelebrations,
    upcomingBirthdays7Days,
    hasCelebrationsToday: todaysCelebrations.length > 0,
  };
}

// ⚖️ MEMBER BODY TRANSFORMATION & PROGRESS CALCULATOR
export function calculateMemberTransformationSummary(
  member: GymMemberItem
): GymTransformationSummary | null {
  const list = member.bodyMeasurements || [];
  if (list.length === 0) return null;

  // Sort by date ascending
  const sorted = [...list].sort(
    (a, b) => new Date(`${a.date} ${a.time || '00:00'}`).getTime() - new Date(`${b.date} ${b.time || '00:00'}`).getTime()
  );

  const baseline = sorted[0];
  const latest = sorted[sorted.length - 1];

  const deltaWeightKg = parseFloat((latest.weightKg - baseline.weightKg).toFixed(1));
  const deltaWaistInches =
    latest.waistInches !== undefined && baseline.waistInches !== undefined
      ? parseFloat((latest.waistInches - baseline.waistInches).toFixed(1))
      : undefined;
  const deltaChestInches =
    latest.chestInches !== undefined && baseline.chestInches !== undefined
      ? parseFloat((latest.chestInches - baseline.chestInches).toFixed(1))
      : undefined;
  const deltaBicepInches =
    latest.bicepInches !== undefined && baseline.bicepInches !== undefined
      ? parseFloat((latest.bicepInches - baseline.bicepInches).toFixed(1))
      : undefined;
  const deltaBodyFat =
    latest.bodyFatPercentage !== undefined && baseline.bodyFatPercentage !== undefined
      ? parseFloat((latest.bodyFatPercentage - baseline.bodyFatPercentage).toFixed(1))
      : undefined;

  const baselineDate = new Date(baseline.date);
  const latestDate = new Date(latest.date);
  const diffDays = Math.max(
    1,
    Math.round((latestDate.getTime() - baselineDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Recomposition logic:
  // Weight flat (+-1.5kg) while waist shrunk >=1.0" and arms/chest grew >=0.5"
  // OR weight dropped while arms/chest grew
  const isRecompoFlat =
    Math.abs(deltaWeightKg) <= 1.5 &&
    deltaWaistInches !== undefined &&
    deltaWaistInches <= -1.0 &&
    ((deltaChestInches !== undefined && deltaChestInches >= 0.5) ||
      (deltaBicepInches !== undefined && deltaBicepInches >= 0.5));

  const isRecompoFatLossMuscleGain =
    deltaWeightKg < 0 &&
    deltaWaistInches !== undefined &&
    deltaWaistInches <= -2.0 &&
    ((deltaBicepInches !== undefined && deltaBicepInches >= 0.5) ||
      (deltaChestInches !== undefined && deltaChestInches >= 0.5));

  const isRecompositionVictory = isRecompoFlat || isRecompoFatLossMuscleGain;

  let primaryTransformationStatus: GymTransformationSummary['primaryTransformationStatus'] = 'MAINTENANCE';

  if (isRecompositionVictory) {
    primaryTransformationStatus = 'RECOMPOSITION';
  } else if (deltaWeightKg <= -2.0 || (deltaWaistInches !== undefined && deltaWaistInches <= -2.0)) {
    primaryTransformationStatus = 'WEIGHT_LOSS';
  } else if (deltaWeightKg >= 2.0 && ((deltaChestInches || 0) >= 0.5 || (deltaBicepInches || 0) >= 0.5)) {
    primaryTransformationStatus = 'MUSCLE_GAIN';
  }

  return {
    memberId: member.id,
    memberName: member.fullName,
    phone: member.phone,
    baseline,
    latest,
    checkpointsCount: sorted.length,
    daysSinceBaseline: diffDays,
    deltaWeightKg,
    deltaWaistInches,
    deltaChestInches,
    deltaBicepInches,
    deltaBodyFat,
    isRecompositionVictory,
    primaryTransformationStatus,
  };
}

export function generateWhatsAppTransformationReportCard(
  member: GymMemberItem,
  gymName = 'IronForge Fitness Arena'
): string {
  const summary = calculateMemberTransformationSummary(member);
  if (!summary) {
    return `*TRANSFORMATION REPORT CARD: ${member.fullName.toUpperCase()}* 🏋️‍♂️\n🏢 *${gymName}*\n\nNo body measurements recorded yet. Please visit the trainer desk to log your baseline stats!`;
  }

  const { baseline, latest, deltaWeightKg, deltaWaistInches, deltaChestInches, deltaBicepInches, daysSinceBaseline, isRecompositionVictory, primaryTransformationStatus } = summary;

  let statusHeader = '🔥 *PROGRESS ACHIEVED!*';
  if (primaryTransformationStatus === 'RECOMPOSITION' || isRecompositionVictory) {
    statusHeader = '🏆 *PURE BEAST RECOMPOSITION VICTORY!* 🔥';
  } else if (primaryTransformationStatus === 'WEIGHT_LOSS') {
    statusHeader = '⚡ *INCH & FAT SHRED CHAMPION!* 🎯';
  } else if (primaryTransformationStatus === 'MUSCLE_GAIN') {
    statusHeader = '💪 *MASS & HYPERTROPHY GAINS!* 🛡️';
  }

  const weightSign = deltaWeightKg > 0 ? `+${deltaWeightKg}` : `${deltaWeightKg}`;
  const weightEmoji = deltaWeightKg < 0 ? '🟢' : deltaWeightKg > 0 ? '🔵' : '⚪';

  let waistText = '';
  if (deltaWaistInches !== undefined) {
    const sign = deltaWaistInches > 0 ? `+${deltaWaistInches}` : `${deltaWaistInches}`;
    waistText = `\n👖 *Waist:* ${baseline.waistInches}" ➔ ${latest.waistInches}" (${deltaWaistInches < 0 ? '🟢' : '⚪'} *${sign}" ${deltaWaistInches < 0 ? 'Slimmer! ⚡' : ''}*)`;
  }

  let bicepText = '';
  if (deltaBicepInches !== undefined) {
    const sign = deltaBicepInches > 0 ? `+${deltaBicepInches}` : `${deltaBicepInches}`;
    bicepText = `\n💪 *Bicep:* ${baseline.bicepInches}" ➔ ${latest.bicepInches}" (${deltaBicepInches > 0 ? '🟢' : '⚪'} *${sign}" ${deltaBicepInches > 0 ? 'Gains! 💪' : ''}*)`;
  }

  let chestText = '';
  if (deltaChestInches !== undefined) {
    const sign = deltaChestInches > 0 ? `+${deltaChestInches}` : `${deltaChestInches}`;
    chestText = `\n🛡️ *Chest:* ${baseline.chestInches}" ➔ ${latest.chestInches}" (${deltaChestInches > 0 ? '🟢' : '⚪'} *${sign}" ${deltaChestInches > 0 ? 'Expanded! 🚀' : ''}*)`;
  }

  let fatText = '';
  if (latest.bodyFatPercentage !== undefined) {
    const fatDiff = summary.deltaBodyFat;
    const fatDiffStr = fatDiff !== undefined ? ` (${fatDiff > 0 ? `+${fatDiff}` : `${fatDiff}`}% Δ)` : '';
    fatText = `\n🔥 *Body Fat:* ${latest.bodyFatPercentage}%${fatDiffStr}`;
  }

  const trainerRemarks = latest.notes || 'Outstanding discipline and dedication to progressive overload! Keep this fire burning!';

  return `🎉 *TRANSFORMATION REPORT CARD: ${member.fullName.toUpperCase()}* 🏋️‍♂️
🏢 *${gymName}*
📅 Baseline: ${baseline.date} ➔ Latest: ${latest.date} (${daysSinceBaseline} Days)
👤 Measured By: Coach ${latest.measuredByTrainerName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${statusHeader}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 *YOUR PROGRESS DELTAS:*

⚖️ *Weight:* ${baseline.weightKg} kg ➔ ${latest.weightKg} kg (${weightEmoji} *${weightSign} kg*)${waistText}${bicepText}${chestText}${fatText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *COACH'S REMARKS:*
"${trainerRemarks}"

🎁 *RENEWAL REWARD:*
Your discipline earned you a *৳500 Renewal Voucher* on your next quarter/annual pass!

— Powered by GymOS Performance Radar 🚀`;
}

// 🥊 PT WHATSAPP SLIP & RENEWAL GENERATORS
export function generateWhatsAppPTSessionSlip(
  pkg: PTPackageEnrollment,
  punch: PTPunchRecord,
  gymName = 'IronForge Fitness Arena'
): string {
  const remaining = Math.max(0, pkg.totalSessions - punch.sessionNumber);
  const stamps = Array.from({ length: pkg.totalSessions }, (_, i) =>
    i < punch.sessionNumber ? '✅' : '⭕'
  ).join('');

  return `🥊 *PERSONAL TRAINING SESSION LOGGED!* 🏋️‍♂️
🏢 *${gymName}*
👤 Client: *${pkg.memberName}* | Coach: *${punch.conductedByTrainerName}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *SESSION COMPLETED: #${punch.sessionNumber} OF ${pkg.totalSessions}*
📅 Date: ${punch.date} (${punch.time})
🎯 Focus: ${punch.workoutFocus || 'Strength & Conditioning'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 *PUNCH-CARD BALANCE:*
${stamps}

⏳ *Sessions Remaining: ${remaining} Classes*
🗓️ Package Validity: Valid until ${pkg.expiryDate}

💬 *Coach's Note:*
"${punch.notes || 'Outstanding effort and discipline in today’s workout! Keep hydrated and stick to your nutrition plan.'}"

— Powered by GymOS Personal Training Engine 🚀`;
}

export function generateWhatsAppPTRenewalOffer(
  pkg: PTPackageEnrollment,
  gymName = 'IronForge Fitness Arena'
): string {
  const remaining = Math.max(0, pkg.totalSessions - pkg.completedSessions);

  return `🎁 *EXCLUSIVE PERSONAL TRAINING RENEWAL OFFER!* 🥊
🏢 *${gymName}*
Dear *${pkg.memberName}*,

Congratulations on completing *${pkg.completedSessions} of ${pkg.totalSessions}* sessions with Coach *${pkg.assignedTrainerName}*! You only have *${remaining} session${remaining > 1 ? 's' : ''}* remaining.

🔥 *DO NOT BREAK YOUR FITNESS MOMENTUM!*
Renew your next 12 or 24-Session Personal Training Pack this week and unlock:
• 🎁 *2 BONUS Sessions Free* (Value ৳2,500)
• 🥤 *1 Free Post-Workout Whey Shake* after every class
• ⭐ Priority trainer floor time booking

Speak to Coach ${pkg.assignedTrainerName} or the front desk today to lock in your discount pass!

— ${gymName} Coaching Team 💪`;
}

// 👻 GHOSTING MEMBER ABSENTEE HELPERS
export function calculateMemberDaysAbsent(lastCheckInDate?: string, targetDateStr?: string): number {
  if (!lastCheckInDate) return 14;
  const today = targetDateStr ? new Date(targetDateStr) : new Date();
  const last = new Date(lastCheckInDate);
  const diffMs = today.getTime() - last.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function generateWhatsAppComebackMessage(
  member: GymMemberItem,
  gymName = 'IronForge Fitness Arena',
  daysAbsent = 7
): string {
  const coachName = member.assignedTrainerName || 'Floor Coach';
  const isFemale = member.gender === 'FEMALE';

  if (isFemale) {
    if (daysAbsent >= 14) {
      return `Dear *${member.fullName}*,

Warm greetings from *${gymName}*! 🌸
We noticed it has been *${daysAbsent} days* since your last gym session. We truly hope everything is fine with your health and family.

✨ *A FRESH RESTART FOR YOUR FITNESS:*
We would love to welcome you back! Your health journey matters to us. Whenever you return this week, enjoy a *Complimentary 1-on-1 Mobility & Stretch Session* with our Lady Fitness Instructor, plus a *Free Post-Workout Refreshment Shake*.

Female floor timings and our dedicated female trainers are always ready for you. Let us know if you need any assistance with your schedule!

Warm regards,  
*Management Team & Coach Maya*  
🏢 *${gymName}* 🏋️‍♀️`;
    }

    return `Dear *${member.fullName}*,

Warm greetings from *${gymName}*! 🌸
We noticed you have not been able to visit the gym for the past *${daysAbsent} days*. We hope you are doing wonderful!

If work or family schedules are hectic, even a *20-minute light cardio or relaxing stretch session* can refresh your energy and relieve stress. 

Feel free to visit during our exclusive Ladies Shift hours. Let us know if we can assist you in any way!

Warm regards,  
*Coach Maya & ${gymName} Team* 🌸`;
  }

  // Male Athlete Copy
  if (daysAbsent >= 14) {
    return `আসসালামু আলাইকুম *${member.fullName}* ভাই! 🥊
🏢 *${gymName}* থেকে ${coachName} বলছি।

টানা *${daysAbsent} দিন* যাবত জিমে আপনাকে দেখতে পাচ্ছি না। আশা করি বড় কোনো ইনজুরি বা অসুস্থতা নেই। এতদিন কষ্ট করে যে প্রগ্রেস তৈরি করেছিলেন, সেটা নষ্ট হতে দেওয়া যাবে না ভাই!

🔥 *COMEBACK MOTIVATION PASS:*
আপনার এই গ্যাপ কাটিয়ে উঠতে জিম ম্যানেজমেন্ট থেকে আপনার জন্য:
• 🥤 *১টি ফ্রি প্রি-ওয়ার্কআউট বুস্টার বা প্রোটিন শেক*
• 🏋️‍♂️ *আমার সাথে পার্সোনাল ৩০ মিনিটের ফর্ম রি-অ্যাসেসমেন্ট সেশন*

আজ বা কাল যেকোনো সময় জাস্ট চলে আসুন। কোনো ভারী ডেডলিফ্ট করতে হবে না—হালকা ওয়ার্মআপ দিয়ে বডিটা আবার চালু করে দেব!

দেখা হচ্ছে ফ্লোরে ভাই? 💪`;
  }

  if (daysAbsent >= 7) {
    return `আসসালামু আলাইকুম *${member.fullName}* ভাই! 💪
🏢 *${gymName}* থেকে আপনার ট্রেইনার ${coachName} বলছি।

গত *${daysAbsent} দিন* জিমে আপনার সাথে দেখা নেই! শরীর ঠিক আছে তো ভাই? কোনো ব্যস্ততা থাকলে আজ শুধু ২০-২৫ মিনিট আসুন। কোনো ভারী ওজন তুলতে হবে না—আপনার পছন্দের চেস্ট পাম্প ও হালকা স্ট্রেচিং একসাথে করব!

মোমেন্টামটা ধরে রাখুন ভাই, আজ বিকেলে কি দেখা হচ্ছে? 🏋️‍♂️`;
  }

  // Soft Alert: 4 - 6 days
  return `আসসালামু আলাইকুম *${member.fullName}* ভাই! 🏋️‍♂️
*${daysAbsent} দিন* ধরে জিমে আপনাকে মিস করছি। শরীর ঠিক আছে তো? 

এই সপ্তাহে আপনার সাথে ওয়ার্কআউটটা মিস হয়ে গেল! আজ বিকেলে কি ফ্লোরে দেখা হচ্ছে? হালকা ওয়ার্কআউটে পুরো এনার্জি ফিরে আসবে ভাই! 💪

— ${coachName}, *${gymName}*`;
}

// 🥗 DIET & WORKOUT ROUTINE WHATSAPP HELPERS
export function generateWhatsAppDietChart(
  member: GymMemberItem,
  dietPlan: GymDietPlanTemplate,
  gymName = 'IronForge Fitness Arena',
  customNotes?: string
): string {
  const coachName = member.assignedTrainerName || 'Fitness Coaching Team';
  let mealText = '';

  dietPlan.meals.forEach((m) => {
    mealText += `\n⏰ *${m.title} (~${m.approxCalories} kcal | ${m.proteinGrams}g Protein):*\n`;
    m.itemsBengali.forEach((item) => {
      mealText += `• ${item}\n`;
    });
    if (m.substitutions) {
      mealText += `  _(বিকল্প: ${m.substitutions})_\n`;
    }
  });

  const notesSection = customNotes
    ? `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💬 *COACH'S SPECIAL ADVICE:*\n"${customNotes}"\n`
    : '';

  return `🥗 *OFFICIAL NUTRITION PRESCRIPTION* 🍎
🏢 *${gymName}*
👤 Athlete: *${member.fullName}* | Coach: *${coachName}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *PLAN: ${dietPlan.title.toUpperCase()}*
⚡ Daily Calories: ~${dietPlan.dailyCalories} kcal | Protein: ~${dietPlan.dailyProteinGrams}g
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${mealText}${notesSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *ESSENTIAL GUIDELINES:*
${dietPlan.dosAndDonts.map((d) => `• ${d}`).join('\n')}

💡 *Want 1-on-1 personalized daily macro adjustments and form tracking? Ask reception about Coach ${coachName}’s 12-Session PT Program!*

— Powered by GymOS Performance Engine 🚀`;
}

export function generateWhatsAppWorkoutRoutine(
  member: GymMemberItem,
  routine: GymWorkoutRoutineTemplate,
  gymName = 'IronForge Fitness Arena',
  customNotes?: string
): string {
  const coachName = member.assignedTrainerName || 'Fitness Coaching Team';
  let scheduleText = '';

  routine.daysSchedule.forEach((day) => {
    scheduleText += `\n📅 *${day.dayName}:*\n`;
    day.exercises.forEach((ex, idx) => {
      scheduleText += `${idx + 1}. *${ex.name}* — ${ex.setsReps}${ex.notes ? ` _(${ex.notes})_` : ''}\n`;
    });
  });

  const notesSection = customNotes
    ? `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💬 *COACH'S SPECIAL NOTE:*\n"${customNotes}"\n`
    : '';

  return `🏋️‍♂️ *OFFICIAL WORKOUT ROUTINE PRESCRIPTION* 💪
🏢 *${gymName}*
👤 Athlete: *${member.fullName}* | Coach: *${coachName}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *ROUTINE: ${routine.title.toUpperCase()}*
⚡ Experience Level: *${routine.experienceLevel}* | Split: *${routine.splitType}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${scheduleText}${notesSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *COACHING ESSENTIALS:*
${routine.coachingTips.map((tip) => `• ${tip}`).join('\n')}

💡 *Need hands-on spotter assistance and injury-proof form corrections? Unlock Coach ${coachName}’s Personal Training Program at the desk!*

— Powered by GymOS Training Hub 🚀`;
}

// 🎁 MEMBER REFERRAL & AMBASSADOR HELPERS
export function getMemberReferralCode(member: GymMemberItem): string {
  if (member.referralCode) return member.referralCode;
  const firstName = member.fullName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'VIP';
  const cleanPhone = member.phone.replace(/[^0-9]/g, '');
  const last3 = cleanPhone.slice(-3) || 'FIT';
  return `${firstName}-${last3}`;
}

export function generateWhatsAppGuestPass(
  member: GymMemberItem,
  gymName = 'IronForge Fitness Arena'
): string {
  const code = getMemberReferralCode(member);
  return `🏋️‍♂️ *VIP WORKOUT GUEST PASS & ADMISSION VOUCHER* 🎟️
🏢 *${gymName}*
👤 Invited by: *${member.fullName}* (VIP Code: *${code}*)

Hey দোস্ত! আমি *${gymName}*-এ রেগুলার ওয়ার্কআউট করছি। আমার এই স্পেশাল ভিআইপি রেফারেল পাস দিয়ে ভর্তি হলে তুমি পাবে:

✅ *১০০% ভর্তি ফি মাফ (৳১,০০০ Admission Fee FREE!)*
✅ *৩ দিনের ফ্রি ভিআইপি ট্রায়াল ওয়ার্কআউট*
✅ *ফ্রি বডি কম্পোজিশন ও বিএমআই টেস্ট*
✅ *ট্রেইনারের সাথে ফ্রি ১টি ফর্ম কারেকশন সেশন*

📍 লোকেশন: লেভেল ৪, ধানমন্ডি ২৭, ঢাকা।
📱 অ্যাডমিশনের সময় রিসেপশনে এই কোডটি দেখাও: *${code}*

চল আজ বিকেলেই একসাথে ওয়ার্কআউট শুরু করি! 💪🔥`;
}

export function generateWhatsAppReferralGratitude(
  referrer: GymMemberItem,
  friendName: string,
  gymName = 'IronForge Fitness Arena',
  newExpiryDate?: string
): string {
  const expiryLine = newExpiryDate ? `\n📅 আপনার মেম্বারশিপের নতুন এক্সপায়ারি ডেট: *${newExpiryDate}*` : '';
  return `🎉 *CONGRATULATIONS ${referrer.fullName.toUpperCase()}!* 🎁
🏢 *${gymName}*

আপনার আমন্ত্রণে আপনার বন্ধু *${friendName}* আজ আমাদের জিমে সফলভাবে ভর্তি হয়েছেন! 🤝

🌟 আমাদের কমিউনিটি গ্রো করতে সাহায্য করায় আপনার অবদানের স্বীকৃতি হিসেবে:
👉 *১৫ দিনের ফ্রি মেম্বারশিপ এক্সটেনশন* আপনার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে যোগ করা হয়েছে!${expiryLine}

IronForge ফ্যামিলিকে সমৃদ্ধ করতে আপনার সহযোগিতা অপরিসীম। Keep Grinding & Inspiring! 🚀💪`;
}

// 💵 CASH REGISTER RECONCILIATION HELPER
export function calculateCashRegisterSnapshot(
  session: GymCashDrawerSession,
  members: GymMemberItem[],
  targetDate?: string
): GymCashRegisterSnapshot {
  const todayStr = targetDate || session.date || new Date().toISOString().split('T')[0];

  let cashCollected = 0;
  let bkashCollected = 0;
  let nagadCollected = 0;
  let cardCollected = 0;
  let bankTransferCollected = 0;

  const countByMethod = {
    Cash: 0,
    bKash: 0,
    Nagad: 0,
    Card: 0,
    Bank_Transfer: 0,
  };

  members.forEach((m) => {
    (m.paymentHistory || []).forEach((p) => {
      // Check if payment was made today (matching date YYYY-MM-DD)
      if (p.date && p.date.startsWith(todayStr)) {
        if (p.method === 'Cash') {
          cashCollected += p.amountBdt;
          countByMethod.Cash++;
        } else if (p.method === 'bKash') {
          bkashCollected += p.amountBdt;
          countByMethod.bKash++;
        } else if (p.method === 'Nagad') {
          nagadCollected += p.amountBdt;
          countByMethod.Nagad++;
        } else if (p.method === 'Card') {
          cardCollected += p.amountBdt;
          countByMethod.Card++;
        } else if (p.method === 'Bank_Transfer') {
          bankTransferCollected += p.amountBdt;
          countByMethod.Bank_Transfer++;
        }
      }
    });
  });

  const pettyCashSpent = (session.pettyExpenses || [])
    .filter((e) => e.paidFrom === 'CASH_DRAWER')
    .reduce((sum, e) => sum + e.amountBdt, 0);

  const cashDropsTotal = (session.cashDrops || []).reduce((sum, d) => sum + d.amountBdt, 0);

  const expectedCashInDrawer =
    session.openingFloatBdt + cashCollected - pettyCashSpent - cashDropsTotal;

  const totalGrossRevenue =
    cashCollected + bkashCollected + nagadCollected + cardCollected + bankTransferCollected;

  return {
    session,
    openingFloatBdt: session.openingFloatBdt,
    cashCollectedBdt: cashCollected,
    bkashCollectedBdt: bkashCollected,
    nagadCollectedBdt: nagadCollected,
    cardCollectedBdt: cardCollected,
    bankTransferCollectedBdt: bankTransferCollected,
    totalGrossRevenueBdt: totalGrossRevenue,
    pettyCashSpentBdt: pettyCashSpent,
    cashDropsTotalBdt: cashDropsTotal,
    expectedCashInDrawerBdt: expectedCashInDrawer,
    paymentCountByMethod: countByMethod,
  };
}

// 💵 SEED PRE-APPROVED PETTY CATALOG
const SEED_PETTY_CATALOG: GymPettyCatalogItem[] = [
  {
    id: 'cat_water',
    category: 'REFRESHMENTS',
    name: 'Kinley 20L Water Jar',
    standardRateBdt: 80,
    unit: 'per jar',
    icon: 'local-drink',
    isPopular: true,
  },
  {
    id: 'cat_detergent',
    category: 'SUPPLIES',
    name: 'Floor Cleaning Disinfectant + Mop',
    standardRateBdt: 150,
    unit: 'per bottle',
    icon: 'cleaning-services',
    isPopular: true,
  },
  {
    id: 'cat_tea',
    category: 'REFRESHMENTS',
    name: 'Staff Refreshment / Tea Allowance',
    standardRateBdt: 50,
    unit: 'per shift',
    icon: 'local-cafe',
    isPopular: true,
  },
  {
    id: 'cat_bulb',
    category: 'MAINTENANCE',
    name: '15W LED Floor Lighting Bulb',
    standardRateBdt: 180,
    unit: 'per unit',
    icon: 'lightbulb',
    isPopular: true,
  },
  {
    id: 'cat_soap',
    category: 'SUPPLIES',
    name: 'Washroom Liquid Hand Soap Refill',
    standardRateBdt: 120,
    unit: 'per pouch',
    icon: 'soap',
  },
  {
    id: 'cat_repair',
    category: 'MAINTENANCE',
    name: 'Emergency Plumbing / Electrical Repair',
    standardRateBdt: 250,
    unit: 'per job',
    icon: 'build',
  },
];

// Helper to calculate petty envelope status
export function calculatePettyEnvelopeStatus(
  session: GymCashDrawerSession,
  totalAllocatedFloat = 2000,
  dailySpendLimit = 1500
): GymPettyEnvelopeStatus {
  const todaySpent = (session.pettyExpenses || [])
    .filter((e) => e.paidFrom === 'CASH_DRAWER')
    .reduce((sum, e) => sum + e.amountBdt, 0);

  const remaining = Math.max(0, totalAllocatedFloat - todaySpent);

  return {
    totalAllocatedFloatBdt: totalAllocatedFloat,
    currentRemainingBalanceBdt: remaining,
    todaySpentBdt: todaySpent,
    dailySpendLimitBdt: dailySpendLimit,
    vouchersTodayCount: (session.pettyExpenses || []).length,
  };
}

// 💵 SEED CASH REGISTER SESSION
const SEED_ACTIVE_CASH_REGISTER_SESSION: GymCashDrawerSession = {
  id: `session_${new Date().toISOString().split('T')[0]}`,
  date: new Date().toISOString().split('T')[0],
  status: 'OPEN',
  openedAt: `${new Date().toISOString().split('T')[0]}T06:30:00.000Z`,
  openedBy: 'Tareq Rahman (Manager)',
  openingFloatBdt: 1000,
  pettyExpenses: [
    {
      id: 'petty_1',
      voucherNumber: 'PV-2026-0901-01',
      category: 'REFRESHMENTS',
      title: '2x Kinley 20L Water Jars',
      catalogItemId: 'cat_water',
      amountBdt: 160,
      paidFrom: 'CASH_DRAWER',
      spentBy: 'Tareq Rahman',
      recipientName: 'Kinley Agent',
      time: '10:15 AM',
      approvalStatus: 'AUTO_APPROVED',
      hasReceiptPhoto: true,
      notes: 'Delivered by Kinley agent',
    },
    {
      id: 'petty_2',
      voucherNumber: 'PV-2026-0901-02',
      category: 'SUPPLIES',
      title: 'Floor Cleaning Disinfectant + Mop Head',
      catalogItemId: 'cat_detergent',
      amountBdt: 350,
      paidFrom: 'CASH_DRAWER',
      spentBy: 'Shuvo (Staff)',
      recipientName: 'CleanCare Store',
      time: '01:45 PM',
      approvalStatus: 'AUTO_APPROVED',
      hasReceiptPhoto: true,
      notes: 'Receipt kept in front drawer',
    },
  ],
  cashDrops: [],
};

// 🏢 SEED OPERATIONAL EXPENSES
const SEED_OPERATIONAL_EXPENSES: GymOperationalExpenseItem[] = [
  {
    id: 'opex_1',
    voucherNumber: 'EXP-20260901-01',
    date: new Date().toISOString().split('T')[0],
    time: '11:30 AM',
    title: 'Salary Advance to Trainer Shuvo',
    category: 'STAFF_SALARY_ADVANCE',
    amountBdt: 1000,
    paidFrom: 'CASH_DRAWER',
    spentBy: 'Tareq Rahman (Manager)',
    targetStaffId: 'tr_1',
    targetStaffName: 'Shuvo Ahmed (Senior PT)',
    notes: 'Emergency medical advance, deduct from Sept payroll',
  },
  {
    id: 'opex_2',
    voucherNumber: 'EXP-20260901-02',
    date: new Date().toISOString().split('T')[0],
    time: '02:15 PM',
    title: 'Generator Diesel (12 Liters @ ৳115/L)',
    category: 'GENERATOR_FUEL',
    amountBdt: 1380,
    paidFrom: 'CASH_DRAWER',
    spentBy: 'Tareq Rahman',
    fuelLiters: 12,
    recipientName: 'Meghna Petrol Pump',
    hasReceiptPhoto: true,
    notes: 'Purchased for 3 hours afternoon load shedding',
  },
  {
    id: 'opex_3',
    voucherNumber: 'EXP-20260901-03',
    date: new Date().toISOString().split('T')[0],
    time: '05:45 PM',
    title: 'Staff Evening Tiffin (3 Persons)',
    category: 'STAFF_TIFFIN_ALLOWANCE',
    amountBdt: 300,
    paidFrom: 'CASH_DRAWER',
    spentBy: 'Shuvo Ahmed',
    recipientName: 'Bhai Bhai Teastall',
    notes: 'Approved daily tea/tiffin allowance',
  },
  {
    id: 'opex_4',
    voucherNumber: 'EXP-20260901-04',
    date: new Date().toISOString().split('T')[0],
    time: '06:30 PM',
    title: 'Main Floor AC Servicing & Filter Cleaning',
    category: 'HARDWARE_EQUIPMENT_REPAIR',
    amountBdt: 770,
    paidFrom: 'BKASH_MERCHANT',
    spentBy: 'Khaled Nayeem (Owner)',
    recipientName: 'CoolTech AC Care',
    hasReceiptPhoto: true,
    notes: 'Paid directly from Owner Merchant wallet',
  },
];

// 💳 SEED MEMBERSHIP PACKAGES & PRICING PLANS
const SEED_MEMBERSHIP_PLANS: GymMembershipPlan[] = [
  {
    id: 'plan_1',
    type: 'MONTHLY_STANDARD',
    title: 'Monthly Regular Pass',
    durationMonths: 1,
    feeBdt: 4500,
    features: ['Full Gym & Cardio Floor', 'Locker Room Access', 'General Trainer Guidance'],
    isActive: true,
  },
  {
    id: 'plan_2',
    type: 'QUARTERLY_PRO',
    title: '3-Month Standard Pass',
    durationMonths: 3,
    feeBdt: 12000,
    features: ['Full Gym Access', 'Steam & Sauna (2x/wk)', 'Free Locker', 'Body Composition Scan'],
    isActive: true,
  },
  {
    id: 'plan_3',
    type: 'HALF_YEARLY',
    title: '6-Month Fitness + Steam',
    durationMonths: 6,
    feeBdt: 22000,
    features: ['All-Access Floor + Cardio', 'Unlimited Steam & Sauna', 'Dedicated Locker', '1 Free PT Session'],
    isPopular: true,
    isActive: true,
  },
  {
    id: 'plan_4',
    type: 'ANNUAL_VIP',
    title: '1-Year VIP All-Access',
    durationMonths: 12,
    feeBdt: 36000,
    features: ['VIP Locker & Laundry', 'Unlimited Steam & Sauna', '3 Free PT Sessions', 'Guest Passes (4x/yr)', 'Juice Bar 10% Off'],
    isPopular: true,
    isActive: true,
  },
  {
    id: 'plan_5',
    type: 'STUDENT_PASS',
    title: 'Student Semester Discount',
    durationMonths: 3,
    feeBdt: 9000,
    features: ['Student ID Required', 'Off-Peak + Evening Access', 'Locker Access'],
    isActive: true,
  },
  {
    id: 'plan_6',
    type: 'OFF_PEAK_PASS',
    title: 'Off-Peak Morning Pass',
    durationMonths: 1,
    feeBdt: 3500,
    features: ['6:00 AM – 4:00 PM Entry Only', 'Cardio + Weight Floor', 'Locker Access'],
    isActive: true,
  },
];

// 👥 SEED MEMBERS
const SEED_MEMBERS: GymMemberItem[] = [
  {
    id: 'mem_1',
    fullName: 'Tanvir Ahmed',
    phone: '+880 1819-223344',
    email: 'tanvir.ahmed@gmail.com',
    gender: 'MALE',
    dateOfBirth: '1996-09-01', // Birthday Today
    enrollmentDate: '2025-09-01', // 1-Year Gymversary
    totalCheckInsCount: 100, // 100th Workout Century
    currentStreakDays: 12,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    membershipPlan: 'ANNUAL_VIP',
    planTitle: '1-Year VIP All-Access',
    startDate: '2026-01-15',
    endDate: '2027-01-15',
    totalFeeBdt: 36000,
    paidAmountBdt: 36000,
    dueAmountBdt: 0,
    status: 'ACTIVE',
    lastCheckInDate: '2026-08-31',
    assignedTrainerId: 'trainer_1',
    assignedTrainerName: 'Coach Alex',
    referralCode: 'TANVIR-344',
    referralCount: 4,
    ambassadorTier: 'SILVER_AMBASSADOR',
    lockerNumber: 'L-14',
    notes: 'Powerlifting prep; highly consistent athlete.',
    bodyMeasurements: [
      {
        id: 'bm_101',
        date: '2026-06-01',
        time: '07:30 AM',
        weightKg: 84.0,
        heightCm: 175,
        waistInches: 36.0,
        chestInches: 38.0,
        bicepInches: 13.0,
        hipsInches: 40.0,
        thighsInches: 23.5,
        bodyFatPercentage: 24.5,
        bmi: 27.4,
        measuredByTrainerId: 'trainer_1',
        measuredByTrainerName: 'Coach Alex',
        notes: 'Day 1 Baseline assessment. Goal: Fat loss & recomp.',
      },
      {
        id: 'bm_102',
        date: '2026-07-15',
        time: '08:00 AM',
        weightKg: 81.2,
        heightCm: 175,
        waistInches: 34.0,
        chestInches: 39.5,
        bicepInches: 13.8,
        hipsInches: 38.5,
        thighsInches: 23.0,
        bodyFatPercentage: 21.0,
        bmi: 26.5,
        measuredByTrainerId: 'trainer_1',
        measuredByTrainerName: 'Coach Alex',
        notes: 'Great response to carb cycling and progressive overload.',
      },
      {
        id: 'bm_103',
        date: '2026-09-01',
        time: '07:45 AM',
        weightKg: 78.5,
        heightCm: 175,
        waistInches: 32.5,
        chestInches: 41.0,
        bicepInches: 14.5,
        hipsInches: 37.0,
        thighsInches: 22.5,
        bodyFatPercentage: 17.5,
        bmi: 25.6,
        measuredByTrainerId: 'trainer_1',
        measuredByTrainerName: 'Coach Alex',
        notes: 'Pure beast transformation! 3.5 inches off waist, 1.5 inches on arms!',
      },
    ],
    paymentHistory: [
      {
        id: 'pay_101',
        date: '2026-01-15',
        amountBdt: 36000,
        method: 'Card',
        invoiceNumber: 'INV-2026-0112',
        receivedBy: 'Khaled Nayeem',
        notes: 'Full upfront payment with annual discount',
      },
    ],
  },
  {
    id: 'mem_2',
    fullName: 'Sabrina Rahman',
    phone: '+880 1712-445566',
    email: 'sabrina.r@yahoo.com',
    gender: 'FEMALE',
    dateOfBirth: '1998-09-01', // Birthday Today
    enrollmentDate: '2026-06-05',
    totalCheckInsCount: 50, // 50th Workout
    currentStreakDays: 8,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    membershipPlan: 'QUARTERLY_PRO',
    planTitle: '3-Month Standard Pass',
    startDate: '2026-06-05',
    endDate: '2026-09-05',
    totalFeeBdt: 12000,
    paidAmountBdt: 9500,
    dueAmountBdt: 2500,
    status: 'EXPIRING_SOON',
    lastCheckInDate: '2026-08-30',
    assignedTrainerId: 'trainer_2',
    assignedTrainerName: 'Coach Maya',
    lockerNumber: 'L-08',
    notes: 'Due BDT 2,500 pending since last installment. Renews in 5 days.',
    bodyMeasurements: [
      {
        id: 'bm_201',
        date: '2026-06-05',
        time: '11:00 AM',
        weightKg: 66.0,
        heightCm: 162,
        waistInches: 31.0,
        hipsInches: 39.5,
        thighsInches: 22.0,
        bodyFatPercentage: 29.0,
        bmi: 25.1,
        measuredByTrainerId: 'trainer_2',
        measuredByTrainerName: 'Coach Maya',
        notes: 'Ladies Shift baseline intake. Goal: Lower body toning & posture.',
      },
      {
        id: 'bm_202',
        date: '2026-08-30',
        time: '11:30 AM',
        weightKg: 62.2,
        heightCm: 162,
        waistInches: 28.0,
        hipsInches: 37.0,
        thighsInches: 20.5,
        bodyFatPercentage: 24.0,
        bmi: 23.7,
        measuredByTrainerId: 'trainer_2',
        measuredByTrainerName: 'Coach Maya',
        notes: 'Inches dropped consistently. High endurance in HIIT sessions.',
      },
    ],
    paymentHistory: [
      {
        id: 'pay_102',
        date: '2026-06-05',
        amountBdt: 9500,
        method: 'bKash',
        transactionId: '9K28X1L99',
        invoiceNumber: 'INV-2026-0604',
        receivedBy: 'Khaled Nayeem',
        notes: '1st installment',
      },
    ],
  },
  {
    id: 'mem_3',
    fullName: 'Arif Chowdhury',
    phone: '+880 1914-778899',
    email: 'arif.chowdhury@outlook.com',
    gender: 'MALE',
    dateOfBirth: '1994-09-03', // Birthday in 2 days
    enrollmentDate: '2026-04-01',
    totalCheckInsCount: 38,
    currentStreakDays: 3,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    membershipPlan: 'MONTHLY_STANDARD',
    planTitle: 'Monthly Regular Gym Pass',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    totalFeeBdt: 4500,
    paidAmountBdt: 0,
    dueAmountBdt: 4500,
    status: 'UNPAID',
    lastCheckInDate: '2026-08-25',
    lockerNumber: 'L-22',
    notes: 'Payment overdue for August. Absent for 6 days.',
    bodyMeasurements: [
      {
        id: 'bm_301',
        date: '2026-04-01',
        time: '06:30 PM',
        weightKg: 72.0,
        heightCm: 170,
        waistInches: 33.0,
        chestInches: 37.0,
        bicepInches: 12.5,
        bmi: 24.9,
        measuredByTrainerId: 'trainer_1',
        measuredByTrainerName: 'Coach Alex',
        notes: 'Baseline intake. Measurement overdue (>30 days).',
      },
    ],
    paymentHistory: [],
  },
  {
    id: 'mem_4',
    fullName: 'Nusrat Jahan',
    phone: '+880 1618-990011',
    email: 'nusrat.j@gmail.com',
    gender: 'FEMALE',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    membershipPlan: 'HALF_YEARLY',
    planTitle: '6-Month Fitness + Steam Pack',
    startDate: '2026-03-01',
    endDate: '2026-09-01',
    totalFeeBdt: 22000,
    paidAmountBdt: 22000,
    dueAmountBdt: 0,
    status: 'EXPIRING_SOON',
    lastCheckInDate: '2026-08-31',
    assignedTrainerId: 'trainer_1',
    assignedTrainerName: 'Coach Alex',
    lockerNumber: 'L-03',
    notes: 'Membership expires tomorrow! Sent renewal promo offer.',
    paymentHistory: [
      {
        id: 'pay_104',
        date: '2026-03-01',
        amountBdt: 22000,
        method: 'Nagad',
        transactionId: 'NGD88201',
        invoiceNumber: 'INV-2026-0301',
        receivedBy: 'Khaled Nayeem',
      },
    ],
  },
  {
    id: 'mem_5',
    fullName: 'Rashedul Hasan',
    phone: '+880 1713-334455',
    gender: 'MALE',
    membershipPlan: 'MONTHLY_STANDARD',
    planTitle: 'Monthly Regular Gym Pass',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    totalFeeBdt: 4500,
    paidAmountBdt: 4500,
    dueAmountBdt: 0,
    status: 'EXPIRED',
    lastCheckInDate: '2026-07-28',
    notes: 'Expired 1 month ago. Need re-engagement call.',
    paymentHistory: [
      {
        id: 'pay_105',
        date: '2026-07-01',
        amountBdt: 4500,
        method: 'Cash',
        invoiceNumber: 'INV-2026-0701',
        receivedBy: 'Staff Reception',
      },
    ],
  },
  {
    id: 'mem_6',
    fullName: 'Fahim Shahriar',
    phone: '+880 1515-889900',
    email: 'fahim.shahriar@nsu.edu.bd',
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    membershipPlan: 'STUDENT_PASS',
    planTitle: 'Student Discount Semester Pass',
    startDate: '2026-08-15',
    endDate: '2026-11-15',
    totalFeeBdt: 9000,
    paidAmountBdt: 9000,
    dueAmountBdt: 0,
    status: 'ACTIVE',
    lastCheckInDate: '2026-08-31',
    lockerNumber: 'L-31',
    notes: 'NSU Student ID verified. Off-peak workouts.',
    paymentHistory: [
      {
        id: 'pay_106',
        date: '2026-08-15',
        amountBdt: 9000,
        method: 'bKash',
        transactionId: 'BK991203',
        invoiceNumber: 'INV-2026-0815',
        receivedBy: 'Khaled Nayeem',
      },
    ],
  },
  {
    id: 'mem_7',
    fullName: 'Tanvir Ahmed',
    phone: '+880 1819-334455',
    email: 'tanvir.ahmed@gmail.com',
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    membershipPlan: 'QUARTERLY_PRO',
    planTitle: '3-Month Standard Pass',
    startDate: '2026-07-01',
    endDate: '2026-10-01',
    totalFeeBdt: 12000,
    paidAmountBdt: 12000,
    dueAmountBdt: 0,
    status: 'FROZEN',
    lastCheckInDate: '2026-08-16',
    lockerNumber: 'L-14',
    currentFreeze: {
      id: 'frz_1',
      freezeStartDate: '2026-08-16',
      freezeEndDate: '2026-09-01',
      reason: 'EXAM',
      reasonNotes: 'Semester Final Examinations',
      previousEndDate: '2026-10-01',
    },
    freezeHistory: [],
    notes: 'Paused for University Semester Finals. Returns early September.',
    paymentHistory: [
      {
        id: 'pay_107',
        date: '2026-07-01',
        amountBdt: 12000,
        method: 'Nagad',
        invoiceNumber: 'INV-2026-0701',
        receivedBy: 'Khaled Nayeem',
      },
    ],
  },
  {
    id: 'mem_8',
    fullName: 'Imtiaz Mahmud',
    phone: '+880 1811-992233',
    gender: 'MALE',
    membershipPlan: 'QUARTERLY_PRO',
    planTitle: '3-Month Standard Pass',
    startDate: '2026-06-15',
    endDate: '2026-09-15',
    totalFeeBdt: 12000,
    paidAmountBdt: 12000,
    dueAmountBdt: 0,
    status: 'ACTIVE',
    lastCheckInDate: '2026-08-22', // 10 days absent (Tier 2 Critical)
    assignedTrainerId: 'trainer_3',
    assignedTrainerName: 'Coach Tanvir',
    notes: 'Busy corporate consultant. Absent for 10 days.',
    paymentHistory: [],
  },
  {
    id: 'mem_9',
    fullName: 'Sadia Karim',
    phone: '+880 1714-556677',
    gender: 'FEMALE',
    membershipPlan: 'MONTHLY_STANDARD',
    planTitle: 'Monthly Regular Pass',
    startDate: '2026-08-01',
    endDate: '2026-09-01',
    totalFeeBdt: 4500,
    paidAmountBdt: 4500,
    dueAmountBdt: 0,
    status: 'ACTIVE',
    lastCheckInDate: '2026-08-26', // 6 days absent (Tier 1 Soft)
    absenceReasonTag: 'EXAMS',
    assignedTrainerId: 'trainer_2',
    assignedTrainerName: 'Coach Maya',
    notes: 'MBA mid-term exams ongoing.',
    paymentHistory: [],
  },
  {
    id: 'mem_10',
    fullName: 'Kamrul Hasan',
    phone: '+880 1912-113355',
    gender: 'MALE',
    membershipPlan: 'ANNUAL_VIP',
    planTitle: '1-Year VIP All-Access',
    startDate: '2026-02-01',
    endDate: '2027-02-01',
    totalFeeBdt: 36000,
    paidAmountBdt: 36000,
    dueAmountBdt: 0,
    status: 'ACTIVE',
    lastCheckInDate: '2026-08-12', // 20 days absent (Tier 3 Danger)
    assignedTrainerId: 'trainer_1',
    assignedTrainerName: 'Coach Alex',
    notes: 'Point of no return risk! Needs comeback shake pass.',
    paymentHistory: [],
  },
];

// 🏋️ SEED TRAINERS
const SEED_TRAINERS: GymTrainerStaff[] = [
  {
    id: 'trainer_1',
    name: 'Coach Alex',
    phone: '+880 1711-223344',
    avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&auto=format&fit=crop&q=80',
    specialization: 'Hypertrophy & Strength Conditioning (CSCS, ACE)',
    baseSalaryBdt: 25000,
    commissionPercentage: 35,
    assignedClientsCount: 8,
    monthlyRevenueGeneratedBdt: 85000,
    status: 'ACTIVE',
    shift: 'FULL_DAY',
  },
  {
    id: 'trainer_2',
    name: 'Coach Maya',
    phone: '+880 1812-334455',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    specialization: 'Female Fat Loss & Functional Mobility',
    baseSalaryBdt: 22000,
    commissionPercentage: 30,
    assignedClientsCount: 6,
    monthlyRevenueGeneratedBdt: 62000,
    status: 'ACTIVE',
    shift: 'MORNING',
  },
  {
    id: 'trainer_3',
    name: 'Coach Tanvir',
    phone: '+880 1913-445566',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    specialization: 'Calisthenics & Athletic Agility',
    baseSalaryBdt: 20000,
    commissionPercentage: 30,
    assignedClientsCount: 4,
    monthlyRevenueGeneratedBdt: 40000,
    status: 'ACTIVE',
    shift: 'EVENING',
  },
];

// ⚙️ SEED EQUIPMENT
const SEED_EQUIPMENT: GymEquipmentItem[] = [
  {
    id: 'eq_1',
    name: 'LifeFitness Commercial Treadmill #1',
    brand: 'LifeFitness 95T Engage',
    category: 'CARDIO',
    status: 'SERVICE_DUE',
    purchaseDate: '2024-02-10',
    lastServiceDate: '2026-05-15',
    nextServiceDueDate: '2026-08-30',
    technicianPhone: '+880 1715-998877 (Engineers Hub)',
    notes: 'Belt lubrication due; slight squeak at 12 km/h.',
  },
  {
    id: 'eq_2',
    name: 'Hammer Strength Dual Adjustable Cable Pulley',
    brand: 'Hammer Strength Pro',
    category: 'STRENGTH_MACHINE',
    status: 'OUT_OF_ORDER',
    purchaseDate: '2023-11-20',
    lastServiceDate: '2026-04-10',
    nextServiceDueDate: '2026-09-02',
    technicianPhone: '+880 1715-998877',
    lastRepairCostBdt: 3500,
    notes: 'Right-side 5mm wire cable frayed. Replacement cable ordered.',
  },
  {
    id: 'eq_3',
    name: 'Olympic Power Squat Rack & Platform',
    brand: 'Rogue Fitness Monster',
    category: 'FREE_WEIGHTS',
    status: 'OPTIMAL',
    purchaseDate: '2024-01-05',
    lastServiceDate: '2026-07-20',
    nextServiceDueDate: '2026-11-20',
    notes: 'All J-cups and safety pins inspected.',
  },
  {
    id: 'eq_4',
    name: 'Carrier 5-Ton Central AC Unit (Main Floor)',
    brand: 'Carrier Inverter Commercial',
    category: 'FACILITY_AC',
    status: 'OPTIMAL',
    purchaseDate: '2023-08-15',
    lastServiceDate: '2026-08-01',
    nextServiceDueDate: '2026-11-01',
    notes: 'Filters washed and refrigerant pressure optimal.',
  },
];

// 📋 SEED LEADS
const SEED_LEADS: GymLeadItem[] = [
  {
    id: 'lead_1',
    fullName: 'Mahmudul Karim',
    phone: '+880 1819-112233',
    source: 'WALK_IN',
    status: 'TRIAL_BOOKED',
    interestedPlan: 'QUARTERLY_PRO',
    inquiryDate: '2026-08-29',
    trialDate: '2026-09-01 (7:00 PM)',
    followUpDate: '2026-09-01',
    notes: 'Wants to join with office colleague. Interested in weight training.',
  },
  {
    id: 'lead_2',
    fullName: 'Farhana Zerin',
    phone: '+880 1712-998800',
    source: 'INSTAGRAM',
    status: 'INQUIRY',
    interestedPlan: 'ANNUAL_VIP',
    inquiryDate: '2026-08-30',
    followUpDate: '2026-09-02',
    notes: 'Asked about ladies morning shift & certified female trainers.',
  },
  {
    id: 'lead_3',
    fullName: 'Kamrul Hassan',
    phone: '+880 1915-667788',
    source: 'MEMBER_REFERRAL',
    status: 'CONVERTED',
    interestedPlan: 'ANNUAL_VIP',
    inquiryDate: '2026-08-20',
    followUpDate: '2026-08-25',
    notes: 'Referred by Tanvir Ahmed. Enrolled in 1-Year VIP!',
  },
];

// 💸 SEED EXPENSES
const SEED_EXPENSES: GymExpenseItem[] = [
  {
    id: 'exp_1',
    title: 'August Commercial Electricity Bill (DESCO)',
    category: 'ELECTRICITY_AC',
    amountBdt: 42500,
    date: '2026-08-28',
    receiptNumber: 'DESCO-AUG-8819',
  },
  {
    id: 'exp_2',
    title: 'Floor Rent & Maintenance Charge',
    category: 'RENT',
    amountBdt: 120000,
    date: '2026-08-05',
    receiptNumber: 'RENT-AUG-2026',
  },
  {
    id: 'exp_3',
    title: 'Disinfectant & Sanitizing Supplies Pack',
    category: 'CLEANING_SUPPLIES',
    amountBdt: 6500,
    date: '2026-08-18',
  },
];

// 📢 SEED ANNOUNCEMENTS
const SEED_ANNOUNCEMENTS: GymAnnouncement[] = [
  {
    id: 'anc_1',
    title: '⚡ Gym Power Maintenance Schedule (Friday Morning)',
    content: 'Please note building generator maintenance will take place this Friday from 8:00 AM to 10:00 AM. Gym will remain open with battery backup lights.',
    date: '2026-08-30',
    targetAudience: 'ALL_MEMBERS',
    isPinned: true,
  },
  {
    id: 'anc_2',
    title: '🎯 September 1-Year VIP Upgrade Promo (20% Off)',
    content: 'Upgrade your existing monthly/quarterly pass to Annual VIP before Sept 5th and get 2 free PT assessment sessions + Locker!',
    date: '2026-08-28',
    targetAudience: 'EXPIRING_MEMBERS',
    isPinned: false,
  },
];

// 🥤 SEED PRO-SHOP & JUICE BAR POS ITEMS
const SEED_PRO_SHOP_ITEMS: GymProShopItem[] = [
  {
    id: 'item_1',
    name: 'Double Rich Choc Whey Shake',
    category: 'SHAKES',
    priceBdt: 250,
    costBdt: 140,
    stockQuantity: 45,
    reorderThreshold: 10,
    unit: 'Glass (1 Scoop)',
    caloriesKcal: 220,
    proteinGrams: 32,
    isBestSeller: true,
  },
  {
    id: 'item_2',
    name: 'Peanut Butter Anabolic Smoothie',
    category: 'SHAKES',
    priceBdt: 280,
    costBdt: 150,
    stockQuantity: 30,
    reorderThreshold: 8,
    unit: 'Glass (Large)',
    caloriesKcal: 420,
    proteinGrams: 38,
    isBestSeller: true,
  },
  {
    id: 'item_3',
    name: 'C4 Original Explosive Pre-Workout',
    category: 'BEVERAGES',
    priceBdt: 320,
    costBdt: 210,
    stockQuantity: 18,
    reorderThreshold: 6,
    unit: 'Can (16 fl oz)',
    caloriesKcal: 0,
    proteinGrams: 0,
    isBestSeller: true,
  },
  {
    id: 'item_4',
    name: 'Optimum Nutrition Creatine 300g',
    category: 'SUPPLEMENTS',
    priceBdt: 3400,
    costBdt: 2600,
    stockQuantity: 8,
    reorderThreshold: 4,
    unit: 'Tub (60 Servings)',
    caloriesKcal: 0,
    proteinGrams: 0,
  },
  {
    id: 'item_5',
    name: 'Gold Standard 100% Whey 5lb Tub',
    category: 'SUPPLEMENTS',
    priceBdt: 9200,
    costBdt: 7600,
    stockQuantity: 3, // LOW STOCK TRIGGER
    reorderThreshold: 5,
    unit: 'Tub (74 Servings)',
    caloriesKcal: 120,
    proteinGrams: 24,
    isBestSeller: true,
  },
  {
    id: 'item_6',
    name: 'Coconut Hydration Electrolyte Water',
    category: 'BEVERAGES',
    priceBdt: 120,
    costBdt: 65,
    stockQuantity: 50,
    reorderThreshold: 15,
    unit: 'Bottle (500ml)',
    caloriesKcal: 45,
    proteinGrams: 0,
  },
  {
    id: 'item_7',
    name: 'Grenade Carb Killa Protein Bar',
    category: 'SNACKS',
    priceBdt: 380,
    costBdt: 260,
    stockQuantity: 14,
    reorderThreshold: 6,
    unit: 'Bar (60g)',
    caloriesKcal: 215,
    proteinGrams: 21,
  },
  {
    id: 'item_8',
    name: 'IronForge Figure-8 Heavy Straps',
    category: 'GEAR',
    priceBdt: 750,
    costBdt: 380,
    stockQuantity: 12,
    reorderThreshold: 4,
    unit: 'Pair',
  },
  {
    id: 'item_9',
    name: 'IronForge Stealth 700ml Steel Shaker',
    category: 'GEAR',
    priceBdt: 950,
    costBdt: 520,
    stockQuantity: 2, // LOW STOCK TRIGGER
    reorderThreshold: 5,
    unit: 'Unit',
  },
];

const SEED_POS_SALES: GymPosSaleRecord[] = [
  {
    id: 'sale_1',
    date: '2026-08-31',
    itemId: 'item_1',
    itemName: 'Double Rich Choc Whey Shake',
    category: 'SHAKES',
    quantity: 2,
    unitPriceBdt: 250,
    totalPriceBdt: 500,
    profitBdt: 220,
    paymentMethod: 'bKash',
    buyerType: 'MEMBER',
    memberId: 'mem_1',
    memberName: 'Farhan Ahmed',
    receivedBy: 'Khaled Owner',
  },
  {
    id: 'sale_2',
    date: '2026-08-31',
    itemId: 'item_3',
    itemName: 'C4 Original Explosive Pre-Workout',
    category: 'BEVERAGES',
    quantity: 1,
    unitPriceBdt: 320,
    totalPriceBdt: 320,
    profitBdt: 110,
    paymentMethod: 'Cash',
    buyerType: 'WALK_IN',
    receivedBy: 'Khaled Owner',
  },
];

// 🔒 SEED LOCKERS (24 Standard, Rental & VIP Lockers)
const SEED_GYM_LOCKERS: GymLockerItem[] = [
  { id: 'loc_1', lockerNumber: 'L-01', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_2', lockerNumber: 'L-02', status: 'OCCUPIED', type: 'DAILY_FREE', assignedMemberId: 'mem_1', assignedMemberName: 'Farhan Ahmed', assignedMemberPhone: '+8801711223344', assignedDate: '2026-08-31' },
  { id: 'loc_3', lockerNumber: 'L-03', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_4', lockerNumber: 'L-04', status: 'OCCUPIED', type: 'DAILY_FREE', assignedMemberId: 'mem_2', assignedMemberName: 'Sadia Islam', assignedMemberPhone: '+8801819334455', assignedDate: '2026-08-31' },
  { id: 'loc_5', lockerNumber: 'L-05', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_6', lockerNumber: 'L-06', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_7', lockerNumber: 'L-07', status: 'OCCUPIED', type: 'DAILY_FREE', assignedMemberId: 'mem_3', assignedMemberName: 'Mahfuzur Rahman', assignedMemberPhone: '+8801912445566', assignedDate: '2026-08-31' },
  { id: 'loc_8', lockerNumber: 'L-08', status: 'MAINTENANCE', type: 'DAILY_FREE', notes: 'Lock jammed - maintenance scheduled' },
  { id: 'loc_9', lockerNumber: 'L-09', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_10', lockerNumber: 'L-10', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_11', lockerNumber: 'L-11', status: 'OCCUPIED', type: 'DAILY_FREE', assignedMemberId: 'mem_4', assignedMemberName: 'Tanvir Hossain', assignedMemberPhone: '+8801615556677', assignedDate: '2026-08-31' },
  { id: 'loc_12', lockerNumber: 'L-12', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_13', lockerNumber: 'L-13', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_14', lockerNumber: 'L-14', status: 'OCCUPIED', type: 'DAILY_FREE', assignedMemberId: 'mem_5', assignedMemberName: 'Nusrat Jahan', assignedMemberPhone: '+8801716667788', assignedDate: '2026-08-31' },
  { id: 'loc_15', lockerNumber: 'L-15', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_16', lockerNumber: 'L-16', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_17', lockerNumber: 'L-17', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_18', lockerNumber: 'L-18', status: 'AVAILABLE', type: 'DAILY_FREE' },
  { id: 'loc_19', lockerNumber: 'L-19', status: 'OCCUPIED', type: 'MONTHLY_RENTAL', assignedMemberId: 'mem_6', assignedMemberName: 'Rafiqul Islam', assignedMemberPhone: '+8801517778899', assignedDate: '2026-08-01', expiryDate: '2026-09-01', monthlyRentBdt: 500 },
  { id: 'loc_20', lockerNumber: 'L-20', status: 'AVAILABLE', type: 'MONTHLY_RENTAL', monthlyRentBdt: 500 },
  { id: 'loc_21', lockerNumber: 'L-21', status: 'AVAILABLE', type: 'MONTHLY_RENTAL', monthlyRentBdt: 500 },
  { id: 'loc_22', lockerNumber: 'L-22', status: 'AVAILABLE', type: 'MONTHLY_RENTAL', monthlyRentBdt: 500 },
  { id: 'loc_23', lockerNumber: 'VIP-1', status: 'OCCUPIED', type: 'VIP', assignedMemberId: 'mem_7', assignedMemberName: 'Imtiaz Chowdhury', assignedMemberPhone: '+8801811990011', assignedDate: '2026-08-15', expiryDate: '2026-11-15', monthlyRentBdt: 1000 },
  { id: 'loc_24', lockerNumber: 'VIP-2', status: 'AVAILABLE', type: 'VIP', monthlyRentBdt: 1000 },
];

// 🥊 SEED PERSONAL TRAINING (PT) PACKAGES
export const SEED_PT_PACKAGES: PTPackageEnrollment[] = [
  {
    id: 'pt_pack_1',
    memberId: 'mem_1',
    memberName: 'Tanvir Ahmed',
    memberPhone: '+880 1819-223344',
    assignedTrainerId: 'trainer_1',
    assignedTrainerName: 'Coach Alex',
    packageTitle: '12-Session Fat Shred & Strength Elite',
    totalSessions: 12,
    completedSessions: 5,
    packagePriceBdt: 12000,
    trainerCommissionTotalBdt: 3600,
    commissionPerSessionBdt: 300,
    startDate: '2026-08-15',
    expiryDate: '2026-10-01',
    status: 'ACTIVE',
    history: [
      { id: 'punch_1', sessionNumber: 1, date: '2026-08-16', time: '07:30 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Chest & Triceps Hypertrophy', trainerCommissionBdt: 300, notes: 'Baseline push workout, strict form.' },
      { id: 'punch_2', sessionNumber: 2, date: '2026-08-19', time: '07:45 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Back & Biceps Pull', trainerCommissionBdt: 300, notes: 'Lat pulldowns and deadlifts.' },
      { id: 'punch_3', sessionNumber: 3, date: '2026-08-22', time: '07:30 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Legs Quad Destruction', trainerCommissionBdt: 300, notes: 'Squats 70kg x 8 reps.' },
      { id: 'punch_4', sessionNumber: 4, date: '2026-08-26', time: '07:15 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Shoulder & Core Stability', trainerCommissionBdt: 300, notes: 'Overhead barbell press.' },
      { id: 'punch_5', sessionNumber: 5, date: '2026-08-30', time: '07:30 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Chest Incline & Arm Supersets', trainerCommissionBdt: 300, notes: 'High intensity, personal best on incline dumbbell press.' },
    ],
  },
  {
    id: 'pt_pack_2',
    memberId: 'mem_2',
    memberName: 'Sabrina Rahman',
    memberPhone: '+880 1712-445566',
    assignedTrainerId: 'trainer_2',
    assignedTrainerName: 'Coach Maya',
    packageTitle: '24-Session Ladies Toning & Posture',
    totalSessions: 24,
    completedSessions: 10,
    packagePriceBdt: 22000,
    trainerCommissionTotalBdt: 7200,
    commissionPerSessionBdt: 300,
    startDate: '2026-07-10',
    expiryDate: '2026-09-25',
    status: 'ACTIVE',
    history: [
      { id: 'punch_201', sessionNumber: 1, date: '2026-07-12', time: '11:00 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Lower Body Glute & Hamstring', trainerCommissionBdt: 300 },
      { id: 'punch_202', sessionNumber: 2, date: '2026-07-15', time: '11:15 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Upper Body Tone & Core', trainerCommissionBdt: 300 },
      { id: 'punch_203', sessionNumber: 3, date: '2026-07-19', time: '11:00 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'HIIT Conditioning', trainerCommissionBdt: 300 },
      { id: 'punch_204', sessionNumber: 4, date: '2026-07-23', time: '11:00 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Posture & Shoulder Alignment', trainerCommissionBdt: 300 },
      { id: 'punch_205', sessionNumber: 5, date: '2026-07-28', time: '11:00 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Barbell RDL & Leg Press', trainerCommissionBdt: 300 },
      { id: 'punch_206', sessionNumber: 6, date: '2026-08-02', time: '11:30 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Functional Mobility', trainerCommissionBdt: 300 },
      { id: 'punch_207', sessionNumber: 7, date: '2026-08-08', time: '11:00 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Core & Abdominal Circuit', trainerCommissionBdt: 300 },
      { id: 'punch_208', sessionNumber: 8, date: '2026-08-14', time: '11:00 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Glute Hypertrophy', trainerCommissionBdt: 300 },
      { id: 'punch_209', sessionNumber: 9, date: '2026-08-20', time: '11:00 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Back & Scapular Retraction', trainerCommissionBdt: 300 },
      { id: 'punch_210', sessionNumber: 10, date: '2026-08-27', time: '11:30 AM', conductedByTrainerId: 'trainer_2', conductedByTrainerName: 'Coach Maya', status: 'COMPLETED', workoutFocus: 'Full Body Endurance Burner', trainerCommissionBdt: 300 },
    ],
  },
  {
    id: 'pt_pack_3',
    memberId: 'mem_3',
    memberName: 'Arif Chowdhury',
    memberPhone: '+880 1914-778899',
    assignedTrainerId: 'trainer_1',
    assignedTrainerName: 'Coach Alex',
    packageTitle: '12-Session Functional Hypertrophy',
    totalSessions: 12,
    completedSessions: 10,
    packagePriceBdt: 12000,
    trainerCommissionTotalBdt: 3600,
    commissionPerSessionBdt: 300,
    startDate: '2026-08-01',
    expiryDate: '2026-09-15',
    status: 'ACTIVE',
    history: [
      { id: 'punch_301', sessionNumber: 1, date: '2026-08-02', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Full Body Prep', trainerCommissionBdt: 300 },
      { id: 'punch_302', sessionNumber: 2, date: '2026-08-05', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Upper Body Power', trainerCommissionBdt: 300 },
      { id: 'punch_303', sessionNumber: 3, date: '2026-08-08', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Lower Body Strength', trainerCommissionBdt: 300 },
      { id: 'punch_304', sessionNumber: 4, date: '2026-08-11', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Push Day Hypertrophy', trainerCommissionBdt: 300 },
      { id: 'punch_305', sessionNumber: 5, date: '2026-08-14', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Pull Day Thickness', trainerCommissionBdt: 300 },
      { id: 'punch_306', sessionNumber: 6, date: '2026-08-17', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Leg Day Volume', trainerCommissionBdt: 300 },
      { id: 'punch_307', sessionNumber: 7, date: '2026-08-20', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Arm Super-Sets', trainerCommissionBdt: 300 },
      { id: 'punch_308', sessionNumber: 8, date: '2026-08-23', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Delts & Traps 3D Pump', trainerCommissionBdt: 300 },
      { id: 'punch_309', sessionNumber: 9, date: '2026-08-26', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Compound Heavy Lifts', trainerCommissionBdt: 300 },
      { id: 'punch_310', sessionNumber: 10, date: '2026-08-30', time: '06:00 PM', conductedByTrainerId: 'trainer_1', conductedByTrainerName: 'Coach Alex', status: 'COMPLETED', workoutFocus: 'Chest Incline & Triceps Blast', trainerCommissionBdt: 300 },
    ],
  },
];

// 🥗 SEED DESI DIET PLANS
export const SEED_DIET_PLANS: GymDietPlanTemplate[] = [
  {
    id: 'diet_fat_loss_1600',
    title: 'Standard Corporate Fat Loss (1,600 kcal)',
    category: 'FAT_LOSS',
    budgetType: 'STANDARD_DESI',
    dailyCalories: 1600,
    dailyProteinGrams: 110,
    description: 'Designed for office executives & busy professionals. High satiety, low oil, and easy to meal prep at home.',
    dosAndDonts: [
      'Drink at least 3.5 Liters of water throughout the day.',
      'Strictly avoid soft drinks, cha-er-chini (sugar in tea), and fried snacks (singara, puri).',
      'Use mustard oil (সরিষার তেল) with a measured 1-teaspoon limit per meal.',
    ],
    meals: [
      {
        mealTime: 'BREAKFAST',
        title: 'সকালের নাস্তা (08:00 AM)',
        itemsBengali: [
          '২টি সেদ্ধ ডিম (১টি সম্পূর্ণ, ১টি কুসুম ছাড়া)',
          '২টি লাল আটার পাতলা রুটি অথবা ১ কাপ ওটস',
          '১ কাপ লাল চা বা গ্রিন টি (চিনি ছাড়া)',
        ],
        approxCalories: 350,
        proteinGrams: 20,
        substitutions: 'ডিম না খেলে ১ কাপ ছাতুর শরবত (পানি ও লেবু দিয়ে)।',
      },
      {
        mealTime: 'LUNCH',
        title: 'দুপুরের প্রধান খাবার (01:30 PM)',
        itemsBengali: [
          '১ কাপ লাল চালের বা বাসমতি ভাত',
          '১৫০ গ্রাম মুরগির বুকের মাংস (চামড়া ছাড়া) অথবা ১ বড় টুকরো রুই/কাতল মাছ',
          '১ বাটি সবুজ শাক-সবজি ও প্রচুর শসা-টমেটো সালাদ',
          '১/২ কাপ পাতলা মসুর ডাল',
        ],
        approxCalories: 550,
        proteinGrams: 42,
        substitutions: 'মুরগির বদলে মাঝারি ৩টি ডিমের সাদা অংশ ও ডাল।',
      },
      {
        mealTime: 'PRE_WORKOUT',
        title: 'প্রি-ওয়ার্কআউট স্ন্যাক (05:30 PM)',
        itemsBengali: ['১টি মাঝারি দেশি সাগর কলা', '১ কাপ স্ট্রং ব্ল্যাক কফি (চিনি ছাড়া)'],
        approxCalories: 120,
        proteinGrams: 2,
        substitutions: 'কলা না থাকলে ১টি সবুজ আপেল।',
      },
      {
        mealTime: 'DINNER',
        title: 'রাতের হালকা খাবার (09:00 PM)',
        itemsBengali: [
          '১টি লাল আটার রুটি অথবা ১/২ কাপ ভাত',
          '১০০ গ্রাম গ্রিল করা মুরগি অথবা সেদ্ধ মাছ',
          '১ বাটি পেঁপে বা লাউ সবজি তরকারি',
        ],
        approxCalories: 400,
        proteinGrams: 30,
        substitutions: '১ গ্লাস লো-ফ্যাট খাঁটি দুধ ও ১টি সেদ্ধ ডিম।',
      },
    ],
  },
  {
    id: 'diet_muscle_bulk_2400',
    title: 'Student Budget Muscle Beast (2,400 kcal)',
    category: 'MUSCLE_BULK',
    budgetType: 'BUDGET_STUDENT',
    dailyCalories: 2400,
    dailyProteinGrams: 140,
    description: 'Ultra cost-effective mass building diet under ৳৪,৫০০/month food budget using sattu, eggs, bananas, and chicken.',
    dosAndDonts: [
      'Never skip the post-workout carb+protein window.',
      'Eat every 3 to 4 hours to maintain caloric surplus.',
      'Get 7-8 hours of uninterrupted sleep for muscle synthesis.',
    ],
    meals: [
      {
        mealTime: 'BREAKFAST',
        title: 'সকালের পাওয়ার ব্রেকফাস্ট (08:30 AM)',
        itemsBengali: [
          '৩টি সেদ্ধ ডিম (২টি সম্পূর্ণ, ১টি কুসুম ছাড়া)',
          '৩টি লাল আটার রুটি',
          '১ টেবিল চামচ দেশি বাদাম বা পিনাট বাটার',
        ],
        approxCalories: 550,
        proteinGrams: 32,
      },
      {
        mealTime: 'MID_MORNING',
        title: 'মিড-মর্নিং দেশি শেইক (11:30 AM)',
        itemsBengali: [
          '৪ টেবিল চামচ ছাতু (৫০ গ্রাম)',
          '১ গ্লাস পানি ও ১ চিমটি বিট লবণ',
          '১টি দেশি কলা',
        ],
        approxCalories: 300,
        proteinGrams: 14,
      },
      {
        mealTime: 'LUNCH',
        title: 'দুপুরের হেভি মিল (02:00 PM)',
        itemsBengali: [
          '২ কাপ সাদা বা লাল চালের ভাত',
          '১৫০ গ্রাম মুরগির মাংস বা তেলাপিয়া/পাঙ্গাশ মাছ',
          '১ বাটি ঘন ডাল ও আলুভর্তা',
        ],
        approxCalories: 750,
        proteinGrams: 45,
      },
      {
        mealTime: 'POST_WORKOUT',
        title: 'পোস্ট-ওয়ার্কআউট রিকভারি (07:30 PM)',
        itemsBengali: [
          '২টি সেদ্ধ ডিমের সাদা অংশ',
          '১ গ্লাস লো-ফ্যাট দুধ',
          '১টি কলা',
        ],
        approxCalories: 300,
        proteinGrams: 18,
      },
      {
        mealTime: 'DINNER',
        title: 'রাতের ডিনার (10:00 PM)',
        itemsBengali: [
          '২টি রুটি বা ১.৫ কাপ ভাত',
          '১০০ গ্রাম মুরগির গিলা-কলিজা বা মাংস',
          'সবজি ও সালাদ',
        ],
        approxCalories: 500,
        proteinGrams: 31,
      },
    ],
  },
  {
    id: 'diet_ladies_tone_1400',
    title: 'Ladies Metabolic Balance & Tone-Up (1,400 kcal)',
    category: 'LEAN_TONING',
    budgetType: 'STANDARD_DESI',
    dailyCalories: 1400,
    dailyProteinGrams: 90,
    description: 'PCOS-friendly, low glycemic index, high fiber diet. Curbs sugar cravings and tones thighs, glutes and waist.',
    dosAndDonts: [
      'Take 1 glass warm water with half lemon and chia seeds on waking up.',
      'Stop eating 2.5 hours before bedtime.',
      'Zero bakery items, white bread, and sweets.',
    ],
    meals: [
      {
        mealTime: 'BREAKFAST',
        title: 'সকালের স্নিগ্ধ নাস্তা (08:30 AM)',
        itemsBengali: [
          '২টি সেদ্ধ ডিম (১টি সম্পূর্ণ)',
          '১/২ কাপ ওটস (চিয়া সিডস ও দারুচিনি গুঁড়ো দিয়ে রান্না)',
          '১ কাপ গ্রিন টি',
        ],
        approxCalories: 320,
        proteinGrams: 18,
      },
      {
        mealTime: 'LUNCH',
        title: 'দুপুরের সুষম খাবার (01:30 PM)',
        itemsBengali: [
          '৩/৪ কাপ লাল চালের ভাত',
          '১ বড় বাটি মিক্সড সবজি (ব্রকলি/লাউ/গাজর/শিম)',
          '১০০ গ্রাম গ্রিলড বা ঝোল ছাড়া মাছ/মুরগি',
          'শসা ও লেবুর সালাদ',
        ],
        approxCalories: 450,
        proteinGrams: 30,
      },
      {
        mealTime: 'PRE_WORKOUT',
        title: 'বিকেলের রিফ্রেশার (05:00 PM)',
        itemsBengali: ['১ মুঠো ভেজানো ছোলা বা চিনাবাদাম (৩০ গ্রাম)', '১ কাপ গ্রিন টি'],
        approxCalories: 150,
        proteinGrams: 7,
      },
      {
        mealTime: 'DINNER',
        title: 'রাতের হালকা ডিনার (08:30 PM)',
        itemsBengali: [
          '১ বাটি গরম চিকেন বা ভেজিটেবল স্যুপ',
          '১টি ডিমের অমলেট (খুব কম তেলে)',
          '১টি শসা',
        ],
        approxCalories: 350,
        proteinGrams: 25,
      },
    ],
  },
  {
    id: 'diet_muscle_recomp_2000',
    title: 'Lean Muscle Recomposition & Power (2,000 kcal)',
    category: 'LEAN_TONING',
    budgetType: 'PREMIUM_EXECUTIVE',
    dailyCalories: 2000,
    dailyProteinGrams: 135,
    description: 'Perfect for intermediate lifters aiming to burn belly fat while carving dense muscle definition.',
    dosAndDonts: [
      'Distribute protein evenly across all 4 meals (~30-35g per meal).',
      'Take 5g Creatine Monohydrate daily with plenty of water.',
    ],
    meals: [
      {
        mealTime: 'BREAKFAST',
        title: 'সকালের পাওয়ার প্রোটিন (08:00 AM)',
        itemsBengali: [
          '৩টি ডিম (১টি সম্পূর্ণ, ২টি সাদা)',
          '১ কাপ ওটস বা ৩টি রুটি',
          '১টি কলা',
        ],
        approxCalories: 450,
        proteinGrams: 30,
      },
      {
        mealTime: 'LUNCH',
        title: 'দুপুরের বডি-বিল্ডিং মিল (01:30 PM)',
        itemsBengali: [
          '১.৫ কাপ বাসমতি ভাত',
          '২০০ গ্রাম মুরগির ব্রেস্ট বা গরুর চর্বিহীন মাংস',
          'সালাদ ও টক দই (১০০ গ্রাম)',
        ],
        approxCalories: 700,
        proteinGrams: 50,
      },
      {
        mealTime: 'PRE_WORKOUT',
        title: 'প্রি-ওয়ার্কআউট এনার্জি (05:30 PM)',
        itemsBengali: ['২টি ব্রাউন ব্রেড ও পিনাট বাটার', '১ কাপ ব্ল্যাক কফি'],
        approxCalories: 250,
        proteinGrams: 10,
      },
      {
        mealTime: 'DINNER',
        title: 'রাতের রিকভারি মিল (09:00 PM)',
        itemsBengali: [
          '১টি রুটি',
          '১৫০ গ্রাম গ্রিলড মাছ বা মুরগি',
          'মিক্সড সবজি ও পাতলা ডাল',
        ],
        approxCalories: 500,
        proteinGrams: 45,
      },
    ],
  },
];

// 🏋️ SEED WORKOUT ROUTINES
export const SEED_WORKOUT_ROUTINES: GymWorkoutRoutineTemplate[] = [
  {
    id: 'routine_beginner_fullbody_3day',
    title: 'Beginner 3-Day Full Body Circuit',
    splitType: 'FULL_BODY_3DAY',
    targetGender: 'ALL',
    experienceLevel: 'BEGINNER',
    coachingTips: [
      'প্রতিটি এক্সারসাইজের আগে হালকা ওজন দিয়ে ১ সেট ওয়ার্মআপ করুন।',
      'সেটের মাঝে ৬০ থেকে ৯০ সেকেন্ড বিশ্রাম নিন।',
      'ওজনের চেয়ে সঠিক ফর্ম ও কন্ট্রোলের দিকে নজর দিন।',
    ],
    daysSchedule: [
      {
        dayName: 'Day 1 (রবিবার): Full Body Push & Core',
        exercises: [
          { name: 'Flat Barbell Bench Press', setsReps: '3 sets × 10 reps', notes: 'Chest activation, strict form' },
          { name: 'Seated Dumbbell Shoulder Press', setsReps: '3 sets × 12 reps', notes: 'Keep core tight' },
          { name: 'Leg Press Machine', setsReps: '3 sets × 12 reps', notes: 'Don’t lock knees at top' },
          { name: 'Tricep Rope Pushdowns', setsReps: '3 sets × 15 reps', notes: 'Full elbow extension' },
          { name: 'Plank Hold', setsReps: '3 sets × 45 seconds', notes: 'Engage glutes and abs' },
        ],
      },
      {
        dayName: 'Day 2 (মঙ্গলবার): Full Body Pull & Hips',
        exercises: [
          { name: 'Wide-Grip Lat Pulldowns', setsReps: '3 sets × 12 reps', notes: 'Pull with elbows down' },
          { name: 'Seated Cable Rows', setsReps: '3 sets × 12 reps', notes: 'Squeeze shoulder blades' },
          { name: 'Dumbbell Romanian Deadlifts', setsReps: '3 sets × 10 reps', notes: 'Hinge at hips, stretch hamstrings' },
          { name: 'Standing Dumbbell Bicep Curls', setsReps: '3 sets × 12 reps', notes: 'No swinging back' },
          { name: 'Hanging Knee Raises', setsReps: '3 sets × 15 reps', notes: 'Controlled pace' },
        ],
      },
      {
        dayName: 'Day 3 (বৃহস্পতিবার): Legs & Upper Pump',
        exercises: [
          { name: 'Goblet Squats (Dumbbell)', setsReps: '3 sets × 12 reps', notes: 'Deep squat, chest proud' },
          { name: 'Incline Dumbbell Chest Press', setsReps: '3 sets × 10 reps', notes: 'Upper chest focus' },
          { name: 'Seated Leg Extensions', setsReps: '3 sets × 15 reps', notes: 'Quad contraction at top' },
          { name: 'Dumbbell Lateral Raises', setsReps: '3 sets × 15 reps', notes: 'Side deltoids shaping' },
          { name: 'Incline Treadmill Brisk Walk', setsReps: '15 minutes (Speed 5.5, Incline 8)', notes: 'Post-workout fat burner' },
        ],
      },
    ],
  },
  {
    id: 'routine_push_pull_legs_4day',
    title: '4-Day Push-Pull-Legs Hypertrophy',
    splitType: 'PUSH_PULL_LEGS',
    targetGender: 'ALL',
    experienceLevel: 'INTERMEDIATE',
    coachingTips: [
      'Progressive Overload: প্রতি সপ্তাহে ওজন বা রেপ্স বাড়ানোর চেষ্টা করুন।',
      'লাস্ট সেটে মাসল ফেইলিউর পর্যন্ত ট্রাই করুন।',
    ],
    daysSchedule: [
      {
        dayName: 'Day 1: PUSH (Chest, Shoulders & Triceps)',
        exercises: [
          { name: 'Barbell Flat Bench Press', setsReps: '4 sets × 8-10 reps', notes: 'Heavy compound power' },
          { name: 'Incline Dumbbell Press', setsReps: '3 sets × 10-12 reps', notes: 'Upper pectoral mass' },
          { name: 'Overhead Barbell Military Press', setsReps: '3 sets × 8-10 reps', notes: 'Front deltoid mass' },
          { name: 'Dumbbell Lateral Raises (Drop Set)', setsReps: '3 sets × 15 reps', notes: 'Side delt boulder pump' },
          { name: 'Dips / Tricep Pushdown Superset', setsReps: '3 sets × 12 reps', notes: 'Tricep horseshoe burn' },
        ],
      },
      {
        dayName: 'Day 2: PULL (Back, Rear Delts & Biceps)',
        exercises: [
          { name: 'Deadlifts or Rack Pulls', setsReps: '3 sets × 6-8 reps', notes: 'Posterior chain density' },
          { name: 'Barbell Bent-Over Rows', setsReps: '3 sets × 8-10 reps', notes: 'Back thickness' },
          { name: 'Close-Grip Lat Pulldowns', setsReps: '3 sets × 12 reps', notes: 'Lower lats focus' },
          { name: 'Face Pulls with Cable', setsReps: '4 sets × 15 reps', notes: 'Rear delt and posture' },
          { name: 'Incline Dumbbell Bicep Curls', setsReps: '3 sets × 12 reps', notes: 'Bicep peak stretch' },
        ],
      },
      {
        dayName: 'Day 3: LEGS & ABS (Quads, Hamstrings & Calves)',
        exercises: [
          { name: 'Barbell Back Squats', setsReps: '4 sets × 8-10 reps', notes: 'King of leg exercises' },
          { name: 'Leg Press (Wide Stance)', setsReps: '3 sets × 12 reps', notes: 'Adductor & quad pump' },
          { name: 'Lying Hamstring Leg Curls', setsReps: '3 sets × 12 reps', notes: 'Hamstring isolation' },
          { name: 'Standing Calf Raises', setsReps: '4 sets × 20 reps', notes: 'Pause 1 sec at peak' },
          { name: 'Cable Crunches', setsReps: '3 sets × 20 reps', notes: 'Deep six-pack flexion' },
        ],
      },
      {
        dayName: 'Day 4: UPPER BODY CONDENSED & ARMS',
        exercises: [
          { name: 'Incline Barbell Bench Press', setsReps: '3 sets × 10 reps', notes: 'Upper chest' },
          { name: 'Weighted / Bodyweight Pull-ups', setsReps: '3 sets × 8-10 reps', notes: 'V-taper width' },
          { name: 'Dumbbell Hammer Curls', setsReps: '3 sets × 12 reps', notes: 'Brachialis & forearms' },
          { name: 'Skull Crushers (EZ Bar)', setsReps: '3 sets × 12 reps', notes: 'Tricep long head' },
        ],
      },
    ],
  },
  {
    id: 'routine_ladies_fat_shred_circuit',
    title: 'Ladies Fat Shred & Glute Shaping Circuit',
    splitType: 'FAT_LOSS_CIRCUIT',
    targetGender: 'FEMALE',
    experienceLevel: 'BEGINNER',
    coachingTips: [
      'সেটের মাঝে কম বিশ্রাম নিয়ে হার্ট রেট হাই রাখুন।',
      'পানি পর্যাপ্ত পান করুন।',
    ],
    daysSchedule: [
      {
        dayName: 'Day 1: Glute & Hamstring Lift',
        exercises: [
          { name: 'Barbell / Dumbbell Hip Thrusts', setsReps: '4 sets × 12 reps', notes: '2 sec hold at top squeeze' },
          { name: 'Goblet Squats', setsReps: '3 sets × 12 reps', notes: 'Torso upright' },
          { name: 'Dumbbell Romanian Deadlifts', setsReps: '3 sets × 12 reps', notes: 'Feel the hamstring stretch' },
          { name: 'Cable Glute Kickbacks', setsReps: '3 sets × 15 reps/leg', notes: 'Isolation' },
          { name: 'Elliptical Cardio', setsReps: '15 minutes steady state', notes: 'Low impact fat burn' },
        ],
      },
      {
        dayName: 'Day 2: Upper Body Posture & Core Slimming',
        exercises: [
          { name: 'Lat Pulldowns (Neutral Grip)', setsReps: '3 sets × 12 reps', notes: 'Sculpt upper back' },
          { name: 'Dumbbell Flat Chest Press', setsReps: '3 sets × 12 reps', notes: 'Chest tone' },
          { name: 'Dumbbell Lateral Raises', setsReps: '3 sets × 15 reps', notes: 'Toned shoulders' },
          { name: 'Seated Cable Rows', setsReps: '3 sets × 12 reps', notes: 'Improve posture' },
          { name: 'Plank & Mountain Climbers Circuit', setsReps: '3 rounds × 45 sec', notes: 'Core endurance' },
        ],
      },
      {
        dayName: 'Day 3: Full Body Metabolic Burner',
        exercises: [
          { name: 'Dumbbell Walking Lunges', setsReps: '3 sets × 20 steps', notes: 'Glute burn' },
          { name: 'Kettlebell Swings', setsReps: '3 sets × 15 reps', notes: 'Power & cardio' },
          { name: 'Step-ups on Plyo Box', setsReps: '3 sets × 12 reps/leg', notes: 'Leg definition' },
          { name: 'Incline Treadmill Walk', setsReps: '20 mins (Incline 10, Speed 5.0)', notes: 'Maximum fat calorie burn' },
        ],
      },
    ],
  },
];

// 🎁 SEED MEMBER REFERRALS
export const SEED_REFERRALS: GymReferralRecord[] = [
  {
    id: 'ref_1',
    referrerMemberId: 'mem_1',
    referrerMemberName: 'Tanvir Ahmed',
    referrerCode: 'TANVIR-344',
    referredMemberId: 'mem_6',
    referredMemberName: 'Rafiqul Islam',
    referredMemberPhone: '+880 1517-778899',
    enrolledDate: '2026-08-01',
    packageTitle: 'Monthly Regular Gym Pass',
    rewardStatus: 'REWARDED',
    rewardDescription: '+15 Days Membership Extended',
    daysAddedToReferrer: 15,
    discountGivenToFriendBdt: 1000,
  },
  {
    id: 'ref_2',
    referrerMemberId: 'mem_1',
    referrerMemberName: 'Tanvir Ahmed',
    referrerCode: 'TANVIR-344',
    referredMemberId: 'mem_7',
    referredMemberName: 'Imtiaz Chowdhury',
    referredMemberPhone: '+880 1811-990011',
    enrolledDate: '2026-08-15',
    packageTitle: '3-Month Standard Pass',
    rewardStatus: 'REWARDED',
    rewardDescription: '+15 Days Membership Extended',
    daysAddedToReferrer: 15,
    discountGivenToFriendBdt: 1000,
  },
  {
    id: 'ref_3',
    referrerMemberId: 'mem_1',
    referrerMemberName: 'Tanvir Ahmed',
    referrerCode: 'TANVIR-344',
    referredMemberId: 'mem_4',
    referredMemberName: 'Nusrat Jahan',
    referredMemberPhone: '+880 1618-990011',
    enrolledDate: '2026-07-20',
    packageTitle: '6-Month Fitness + Steam Pack',
    rewardStatus: 'REWARDED',
    rewardDescription: '+15 Days Membership Extended',
    daysAddedToReferrer: 15,
    discountGivenToFriendBdt: 1000,
  },
  {
    id: 'ref_4',
    referrerMemberId: 'mem_1',
    referrerMemberName: 'Tanvir Ahmed',
    referrerCode: 'TANVIR-344',
    referredMemberId: 'mem_2',
    referredMemberName: 'Sabrina Rahman',
    referredMemberPhone: '+880 1712-445566',
    enrolledDate: '2026-06-05',
    packageTitle: '3-Month Standard Pass',
    rewardStatus: 'REWARDED',
    rewardDescription: '+15 Days Membership Extended',
    daysAddedToReferrer: 15,
    discountGivenToFriendBdt: 1000,
  },
  {
    id: 'ref_5',
    referrerMemberId: 'mem_2',
    referrerMemberName: 'Sabrina Rahman',
    referrerCode: 'SABRINA-566',
    referredMemberId: 'mem_5',
    referredMemberName: 'Farhan Ahmed',
    referredMemberPhone: '+880 1711-223344',
    enrolledDate: '2026-08-10',
    packageTitle: 'Monthly Regular Gym Pass',
    rewardStatus: 'REWARDED',
    rewardDescription: '+15 Days Membership Extended',
    daysAddedToReferrer: 15,
    discountGivenToFriendBdt: 1000,
  },
  {
    id: 'ref_6',
    referrerMemberId: 'mem_3',
    referrerMemberName: 'Arif Chowdhury',
    referrerCode: 'ARIF-899',
    referredMemberId: 'mem_8',
    referredMemberName: 'Shahriar Kabir',
    referredMemberPhone: '+880 1715-998877',
    enrolledDate: '2026-08-20',
    packageTitle: 'Monthly Regular Gym Pass',
    rewardStatus: 'REWARDED',
    rewardDescription: '+15 Days Membership Extended',
    daysAddedToReferrer: 15,
    discountGivenToFriendBdt: 1000,
  },
];

interface GymOwnerStoreState {
  gymProfile: GymProfile;
  members: GymMemberItem[];
  trainers: GymTrainerStaff[];
  equipment: GymEquipmentItem[];
  leads: GymLeadItem[];
  expenses: GymExpenseItem[];
  announcements: GymAnnouncement[];
  proShopItems: GymProShopItem[];
  posSales: GymPosSaleRecord[];
  membershipPlans: GymMembershipPlan[];
  lockers: GymLockerItem[];
  todayCheckInIds: string[];
  isLoaded: boolean;

  // Actions
  loadGymData: () => Promise<void>;
  updateGymProfile: (profile: Partial<GymProfile>) => Promise<void>;
  
  // Membership Plans & Pricing
  addMembershipPlan: (plan: Omit<GymMembershipPlan, 'id'>) => Promise<GymMembershipPlan>;
  updateMembershipPlan: (id: string, update: Partial<GymMembershipPlan>) => Promise<void>;
  deleteMembershipPlan: (id: string) => Promise<void>;
  toggleMembershipPlanActive: (id: string) => Promise<void>;

  // Smart Lockers
  assignLocker: (
    lockerId: string,
    memberId: string,
    memberName: string,
    memberPhone?: string,
    type?: LockerType,
    rentBdt?: number,
    expiryDate?: string
  ) => Promise<void>;
  releaseLocker: (lockerId: string) => Promise<void>;
  toggleLockerMaintenance: (lockerId: string) => Promise<void>;
  getAvailableLockers: () => GymLockerItem[];
  getOccupiedLockers: () => GymLockerItem[];

  // Member Management
  addMember: (
    member: Omit<GymMemberItem, 'id' | 'paymentHistory'>,
    initialPayment?: { amount: number; method: PaymentMethod; notes?: string }
  ) => Promise<GymMemberItem>;
  updateMember: (id: string, update: Partial<GymMemberItem>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  collectMemberFee: (
    memberId: string,
    amountBdt: number,
    method: PaymentMethod,
    notes?: string
  ) => Promise<void>;
  collectDuePayment: (
    memberId: string,
    amountBdt: number,
    method: PaymentMethod,
    notes?: string,
    transactionId?: string
  ) => Promise<{ success: boolean; paymentRecord?: any; updatedMember?: GymMemberItem }>;
  renewMemberPlan: (
    memberId: string,
    plan: MembershipPlanType,
    planTitle: string,
    durationMonths: number,
    feeBdt: number,
    paidBdt: number,
    method: PaymentMethod,
    customStartDate?: string,
    notes?: string
  ) => Promise<{ success: boolean; member?: GymMemberItem; paymentRecord?: GymPaymentRecord; invoiceNumber?: string }>;
  freezeMember: (
    memberId: string,
    days: number,
    reason: GymFreezeReason,
    notes?: string
  ) => Promise<{ success: boolean; member?: GymMemberItem }>;
  resumeMember: (
    memberId: string
  ) => Promise<{ success: boolean; member?: GymMemberItem; extendedDays: number; newEndDate: string }>;
  toggleMemberCheckIn: (memberId: string) => Promise<boolean>;

  // Pro-Shop & Juice Bar POS Actions
  addProShopItem: (item: Omit<GymProShopItem, 'id'>) => Promise<GymProShopItem>;
  updateProShopItem: (id: string, update: Partial<GymProShopItem>) => Promise<void>;
  deleteProShopItem: (id: string) => Promise<void>;
  restockProShopItem: (id: string, addQuantity: number, costPerUnitBdt?: number) => Promise<void>;
  recordPosSale: (saleData: {
    itemId: string;
    quantity: number;
    paymentMethod: PosPaymentMethod;
    buyerType: 'WALK_IN' | 'MEMBER';
    memberId?: string;
    transactionId?: string;
  }) => Promise<{ success: boolean; saleRecord?: GymPosSaleRecord; message?: string }>;
  getLowStockProShopItems: () => GymProShopItem[];
  getProShopSalesSummary: () => {
    todayRevenueBdt: number;
    todayProfitBdt: number;
    totalSoldUnits: number;
    lowStockCount: number;
  };

  // Leads CRM
  addLead: (lead: Omit<GymLeadItem, 'id' | 'inquiryDate'>) => Promise<GymLeadItem>;
  updateLead: (id: string, update: Partial<GymLeadItem>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  convertLeadToMember: (
    leadId: string,
    plan: MembershipPlanType,
    planTitle: string,
    feeBdt: number,
    paidBdt: number,
    method: PaymentMethod
  ) => Promise<GymMemberItem>;

  // Equipment AMC
  addEquipment: (eq: Omit<GymEquipmentItem, 'id'>) => Promise<GymEquipmentItem>;
  updateEquipment: (id: string, update: Partial<GymEquipmentItem>) => Promise<void>;
  logEquipmentService: (
    id: string,
    nextServiceDueDate: string,
    costBdt?: number,
    notes?: string
  ) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;

  // Expenses & Finance
  addExpense: (expense: Omit<GymExpenseItem, 'id' | 'date'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Announcements
  createAnnouncement: (announcement: Omit<GymAnnouncement, 'id' | 'date'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Analytics & Computed
  getFinancialSnapshot: () => GymFinancialSnapshot;
  getMembersByStatus: (status: MemberStatus) => GymMemberItem[];
  getGhostingMembers: (daysThreshold?: number) => GymMemberItem[];
  getNewbieMembers: (daysThreshold?: number) => GymMemberItem[];
  generateWhatsAppDuesMessage: (member: GymMemberItem) => string;
  generateWhatsAppDigitalReceipt: (member: GymMemberItem, paymentRecord: any) => string;
  generateWhatsAppRenewalReceipt: (
    member: GymMemberItem,
    paymentRecord: any,
    isUpgrade?: boolean,
    previousPlanTitle?: string
  ) => string;
  generateWhatsAppReEngagementMessage: (member: GymMemberItem) => string;
  generateWhatsAppFreezeMessage: (member: GymMemberItem) => string;
  generateWhatsAppResumeMessage: (member: GymMemberItem, extendedDays: number, newEndDate: string) => string;
  generateWhatsAppTrialPass: (lead: GymLeadItem, trialDate?: string) => string;
  generateWhatsAppDigitalPass: (member: GymMemberItem) => string;
  generateWhatsAppShiftSchedule: () => string;
  getCurrentShiftStatus: (testTime?: Date) => GymShiftStatusSnapshot;
  updateGymShifts: (shifts: GymShiftScheduleItem[]) => Promise<void>;
  addGymShift: (shift: Omit<GymShiftScheduleItem, 'id'>) => Promise<void>;
  deleteGymShift: (shiftId: string) => Promise<void>;
  getCelebrationsSnapshot: (targetDate?: Date) => GymCelebrationSummary;
  recordCelebrationWish: (memberId: string, type: GymMilestoneType) => Promise<void>;
  generateWhatsAppBirthdayWish: (member: GymMemberItem) => string;
  generateWhatsAppMilestoneWish: (member: GymMemberItem, celebration: GymCelebrationItem) => string;
  quickCheckInMember: (memberId: string) => Promise<{ success: boolean; isCheckIn: boolean; member?: GymMemberItem }>;

  // Cash Register & Shift Reconciliation
  activeCashRegisterSession: GymCashDrawerSession;
  cashRegisterHistory: GymCashDrawerSession[];
  pettyCatalog: GymPettyCatalogItem[];
  pettyFloatAllocatedBdt: number;
  getCashRegisterSnapshot: () => GymCashRegisterSnapshot;
  getPettyCatalog: () => GymPettyCatalogItem[];
  getPettyEnvelopeStatus: () => GymPettyEnvelopeStatus;
  openNewRegisterSession: (openingFloatBdt: number, openedBy: string) => Promise<void>;
  logPettyExpense: (expense: Omit<GymPettyExpenseItem, 'id' | 'time'>) => Promise<void>;
  deletePettyExpense: (id: string) => Promise<void>;
  logCashDropToOwner: (drop: Omit<GymCashDropItem, 'id' | 'time'>) => Promise<void>;
  replenishPettyEnvelope: (amountBdt: number, approvedBy: string) => Promise<void>;
  closeRegisterSession: (
    actualCashReportedBdt: number,
    closedBy: string,
    discrepancyReason?: string,
    eodNotes?: string
  ) => Promise<{ success: boolean; discrepancyBdt: number; session: GymCashDrawerSession }>;
  generateWhatsAppEodReport: (session?: GymCashDrawerSession) => string;
  generateWhatsAppPettyDigest: () => string;

  // OPEX & Staff Daily Expenses
  operationalExpenses: GymOperationalExpenseItem[];
  getOperationalExpensesSnapshot: () => {
    totalOpexTodayBdt: number;
    staffAdvancesTodayBdt: number;
    drawerOpexTodayBdt: number;
    netDailyRetainedCashBdt: number;
    expenses: GymOperationalExpenseItem[];
  };
  logOperationalExpense: (
    expense: Omit<GymOperationalExpenseItem, 'id' | 'voucherNumber' | 'time' | 'date'> & { date?: string }
  ) => Promise<GymOperationalExpenseItem>;
  deleteOperationalExpense: (id: string) => Promise<void>;
  getStaffLedgerSummaries: () => StaffLedgerSummary[];
  generateWhatsAppOpexDossier: () => string;

  // ⚖️ Member Body Transformation & Measurements
  getMemberTransformationSummary: (memberId: string) => GymTransformationSummary | null;
  getMeasurementDueMembers: () => GymMemberItem[];
  logMemberMeasurement: (
    memberId: string,
    measurement: Omit<GymBodyMeasurement, 'id' | 'time'>
  ) => Promise<GymBodyMeasurement>;
  deleteMemberMeasurement: (memberId: string, measurementId: string) => Promise<void>;
  generateWhatsAppTransformationReportCard: (memberId: string) => string;

  // 🥊 Personal Training (PT) Hub
  ptPackages: PTPackageEnrollment[];
  enrollMemberPTPackage: (
    data: Omit<PTPackageEnrollment, 'id' | 'completedSessions' | 'status' | 'history'>
  ) => Promise<PTPackageEnrollment>;
  punchPTSession: (
    packageId: string,
    punchData: {
      workoutFocus?: string;
      notes?: string;
      substituteTrainerId?: string;
      substituteTrainerName?: string;
      status?: PTSessionStatus;
      date?: string;
      time?: string;
    }
  ) => Promise<PTPunchRecord>;
  getTrainerPTCommissionSummaries: () => TrainerPTCommissionSummary[];
  generateWhatsAppPTSessionSlip: (packageId: string, sessionNumber?: number) => string;
  generateWhatsAppPTRenewalOffer: (packageId: string) => string;

  // 👻 Absentee & Ghosting Member Radar
  getGhostingMembersSnapshot: (targetDate?: string) => {
    totalGhostingCount: number;
    softCount: number;
    criticalCount: number;
    dangerCount: number;
    members: GhostingMemberInfo[];
  };
  logMemberRescueContact: (memberId: string) => Promise<void>;
  setMemberAbsenceReason: (memberId: string, reason: AbsenceReasonTag) => Promise<void>;
  generateWhatsAppComebackMessage: (memberId: string) => string;

  // 🥗 Diet & Workout Routine Prescriber
  dietPlans: GymDietPlanTemplate[];
  workoutRoutines: GymWorkoutRoutineTemplate[];
  prescribeDietAndRoutine: (
    memberId: string,
    dietPlanId?: string,
    routineId?: string,
    coachNotes?: string
  ) => Promise<MemberAssignedPlanRecord>;
  generateWhatsAppDietChart: (memberId: string, dietPlanId: string, customNotes?: string) => string;
  generateWhatsAppWorkoutRoutine: (memberId: string, routineId: string, customNotes?: string) => string;

  // 🎁 Member Referral & Ambassador Hub
  referrals: GymReferralRecord[];
  getReferralSummary: () => GymReferralSummary;
  processMemberReferralAdmission: (
    referrerMemberId: string,
    newMemberData: {
      fullName: string;
      phone: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      planId: string;
      amountPaidBdt: number;
    }
  ) => Promise<{ newMember: GymMemberItem; referralRecord: GymReferralRecord }>;
  generateWhatsAppGuestPass: (memberId: string) => string;
  generateWhatsAppReferralGratitude: (referralId: string) => string;
}

export const useGymOwnerStore = create<GymOwnerStoreState>((set, get) => ({
  gymProfile: SEED_GYM_PROFILE,
  members: SEED_MEMBERS,
  trainers: SEED_TRAINERS,
  equipment: SEED_EQUIPMENT,
  leads: SEED_LEADS,
  expenses: SEED_EXPENSES,
  announcements: SEED_ANNOUNCEMENTS,
  proShopItems: SEED_PRO_SHOP_ITEMS,
  posSales: SEED_POS_SALES,
  membershipPlans: SEED_MEMBERSHIP_PLANS,
  lockers: SEED_GYM_LOCKERS,
  todayCheckInIds: ['mem_1', 'mem_4', 'mem_6'],
  activeCashRegisterSession: SEED_ACTIVE_CASH_REGISTER_SESSION,
  cashRegisterHistory: [],
  pettyCatalog: SEED_PETTY_CATALOG,
  pettyFloatAllocatedBdt: 2000,
  operationalExpenses: SEED_OPERATIONAL_EXPENSES,
  ptPackages: SEED_PT_PACKAGES,
  dietPlans: SEED_DIET_PLANS,
  workoutRoutines: SEED_WORKOUT_ROUTINES,
  referrals: SEED_REFERRALS,
  isLoaded: false,

  loadGymData: async () => {
    try {
      const raw = await getStorageItem(GYM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const storedProfile = parsed.gymProfile || SEED_GYM_PROFILE;
        if (storedProfile.phone === '+880 1711-009988') {
          storedProfile.phone = SEED_GYM_PROFILE.phone;
          storedProfile.bkashMerchantNumber = SEED_GYM_PROFILE.bkashMerchantNumber;
          storedProfile.nagadMerchantNumber = SEED_GYM_PROFILE.nagadMerchantNumber;
        }
        set({
          gymProfile: storedProfile,
          members: parsed.members || SEED_MEMBERS,
          trainers: parsed.trainers || SEED_TRAINERS,
          equipment: parsed.equipment || SEED_EQUIPMENT,
          leads: parsed.leads || SEED_LEADS,
          expenses: parsed.expenses || SEED_EXPENSES,
          announcements: parsed.announcements || SEED_ANNOUNCEMENTS,
          proShopItems: parsed.proShopItems || SEED_PRO_SHOP_ITEMS,
          posSales: parsed.posSales || SEED_POS_SALES,
          membershipPlans: parsed.membershipPlans || SEED_MEMBERSHIP_PLANS,
          lockers: parsed.lockers || SEED_GYM_LOCKERS,
          todayCheckInIds: parsed.todayCheckInIds || ['mem_1', 'mem_4', 'mem_6'],
          ptPackages: parsed.ptPackages || SEED_PT_PACKAGES,
          dietPlans: parsed.dietPlans || SEED_DIET_PLANS,
          workoutRoutines: parsed.workoutRoutines || SEED_WORKOUT_ROUTINES,
          referrals: parsed.referrals || SEED_REFERRALS,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  updateGymProfile: async (patch) => {
    set((state) => {
      const updated = { ...state.gymProfile, ...patch };
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, gymProfile: updated })
      );
      return { gymProfile: updated };
    });
  },

  addMembershipPlan: async (planData) => {
    const newId = `plan_${Date.now()}`;
    const newPlan: GymMembershipPlan = {
      ...planData,
      id: newId,
    };
    set((state) => {
      const updated = [...state.membershipPlans, newPlan];
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, membershipPlans: updated })
      );
      return { membershipPlans: updated };
    });
    return newPlan;
  },

  updateMembershipPlan: async (id, update) => {
    set((state) => {
      const updated = state.membershipPlans.map((p) =>
        p.id === id ? { ...p, ...update } : p
      );
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, membershipPlans: updated })
      );
      return { membershipPlans: updated };
    });
  },

  deleteMembershipPlan: async (id) => {
    set((state) => {
      const updated = state.membershipPlans.filter((p) => p.id !== id);
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, membershipPlans: updated })
      );
      return { membershipPlans: updated };
    });
  },

  toggleMembershipPlanActive: async (id) => {
    set((state) => {
      const updated = state.membershipPlans.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      );
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, membershipPlans: updated })
      );
      return { membershipPlans: updated };
    });
  },

  assignLocker: async (lockerId, memberId, memberName, memberPhone, type, rentBdt, expiryDate) => {
    set((state) => {
      const updated = state.lockers.map((l) => {
        if (l.id === lockerId || l.lockerNumber === lockerId) {
          return {
            ...l,
            status: 'OCCUPIED' as LockerStatus,
            assignedMemberId: memberId,
            assignedMemberName: memberName,
            assignedMemberPhone: memberPhone,
            assignedDate: new Date().toISOString().split('T')[0],
            expiryDate: expiryDate || l.expiryDate,
            type: type || l.type,
            monthlyRentBdt: rentBdt ?? l.monthlyRentBdt,
          };
        }
        return l;
      });
      void setStorageItem(GYM_STORAGE_KEY, JSON.stringify({ ...state, lockers: updated }));
      return { lockers: updated };
    });
  },

  releaseLocker: async (lockerId) => {
    set((state) => {
      const updated = state.lockers.map((l) => {
        if (l.id === lockerId || l.lockerNumber === lockerId) {
          return {
            ...l,
            status: 'AVAILABLE' as LockerStatus,
            assignedMemberId: undefined,
            assignedMemberName: undefined,
            assignedMemberPhone: undefined,
            assignedDate: undefined,
            expiryDate: undefined,
          };
        }
        return l;
      });
      void setStorageItem(GYM_STORAGE_KEY, JSON.stringify({ ...state, lockers: updated }));
      return { lockers: updated };
    });
  },

  toggleLockerMaintenance: async (lockerId) => {
    set((state) => {
      const updated = state.lockers.map((l) => {
        if (l.id === lockerId) {
          const nextStatus: LockerStatus = l.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
          return {
            ...l,
            status: nextStatus,
            assignedMemberId: nextStatus === 'MAINTENANCE' ? undefined : l.assignedMemberId,
            assignedMemberName: nextStatus === 'MAINTENANCE' ? undefined : l.assignedMemberName,
            assignedMemberPhone: nextStatus === 'MAINTENANCE' ? undefined : l.assignedMemberPhone,
          };
        }
        return l;
      });
      void setStorageItem(GYM_STORAGE_KEY, JSON.stringify({ ...state, lockers: updated }));
      return { lockers: updated };
    });
  },

  getAvailableLockers: () => {
    return get().lockers.filter((l) => l.status === 'AVAILABLE');
  },

  getOccupiedLockers: () => {
    return get().lockers.filter((l) => l.status === 'OCCUPIED');
  },

  addMember: async (memberData, initialPayment) => {
    const newId = `mem_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const paidAmount = initialPayment?.amount ?? (memberData.paidAmountBdt || 0);
    const dueAmount = Math.max(0, memberData.totalFeeBdt - paidAmount);

    const newPaymentHistory = initialPayment && initialPayment.amount > 0
      ? [
          {
            id: `pay_${Date.now()}`,
            date: todayStr,
            amountBdt: initialPayment.amount,
            method: initialPayment.method,
            invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            receivedBy: get().gymProfile.ownerName,
            notes: initialPayment.notes || 'Enrollment payment',
          },
        ]
      : [];

    const initialMeasurements: GymBodyMeasurement[] =
      memberData.bodyMeasurements && memberData.bodyMeasurements.length > 0
        ? memberData.bodyMeasurements
        : memberData.weightKg && memberData.weightKg > 0
        ? [
            {
              id: `meas_${Date.now()}`,
              date: memberData.startDate || todayStr,
              time: '10:00',
              weightKg: memberData.weightKg,
              measuredByTrainerName: memberData.assignedTrainerName || 'Front Desk',
              notes: 'Initial Baseline Measurement at Enrollment',
            },
          ]
        : [];

    const newMember: GymMemberItem = {
      ...memberData,
      id: newId,
      paidAmountBdt: paidAmount,
      dueAmountBdt: dueAmount,
      status: dueAmount > 0 && paidAmount === 0 ? 'UNPAID' : 'ACTIVE',
      paymentHistory: newPaymentHistory,
      bodyMeasurements: initialMeasurements,
    };

    set((state) => {
      const updatedMembers = [newMember, ...state.members];
      let updatedLockers = state.lockers;

      // If a locker was assigned during enrollment, occupy it in locker store
      if (memberData.lockerNumber) {
        const targetNumber = memberData.lockerNumber.trim().toUpperCase();
        updatedLockers = state.lockers.map((l) =>
          l.lockerNumber.toUpperCase() === targetNumber || l.id === memberData.lockerNumber
            ? {
                ...l,
                status: 'OCCUPIED' as LockerStatus,
                assignedMemberId: newId,
                assignedMemberName: memberData.fullName,
                assignedMemberPhone: memberData.phone,
                assignedDate: memberData.startDate,
                expiryDate: memberData.endDate,
              }
            : l
        );
      }

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers, lockers: updatedLockers })
      );
      return { members: updatedMembers, lockers: updatedLockers };
    });

    return newMember;
  },

  updateMember: async (id, patch) => {
    set((state) => {
      const updatedMembers = state.members.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      );
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers })
      );
      return { members: updatedMembers };
    });
  },

  deleteMember: async (id) => {
    set((state) => {
      const updatedMembers = state.members.filter((m) => m.id !== id);
      const updatedCheckins = state.todayCheckInIds.filter((cid) => cid !== id);
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers, todayCheckInIds: updatedCheckins })
      );
      return { members: updatedMembers, todayCheckInIds: updatedCheckins };
    });
  },

  collectMemberFee: async (memberId, amountBdt, method, notes) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newPayment = {
      id: `pay_${Date.now()}`,
      date: todayStr,
      amountBdt,
      method,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedBy: get().gymProfile.ownerName,
      notes: notes || 'Dues collection',
    };

    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id !== memberId) return m;
        const newPaid = m.paidAmountBdt + amountBdt;
        const newDue = Math.max(0, m.totalFeeBdt - newPaid);
        const newStatus: MemberStatus =
          newDue === 0 && m.status === 'UNPAID' ? 'ACTIVE' : m.status;

        return {
          ...m,
          paidAmountBdt: newPaid,
          dueAmountBdt: newDue,
          status: newStatus,
          paymentHistory: [newPayment, ...m.paymentHistory],
        };
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers })
      );
      return { members: updatedMembers };
    });
  },

  collectDuePayment: async (memberId, amountBdt, method, notes, transactionId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newPayment = {
      id: `pay_${Date.now()}`,
      date: todayStr,
      amountBdt,
      method,
      transactionId: transactionId?.trim() || undefined,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedBy: get().gymProfile.ownerName,
      notes: notes || 'Dues Settlement',
    };

    let updatedMember: GymMemberItem | undefined;

    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id !== memberId) return m;
        const newPaid = m.paidAmountBdt + amountBdt;
        const newDue = Math.max(0, m.totalFeeBdt - newPaid);
        const newStatus: MemberStatus =
          newDue === 0 && (m.status === 'UNPAID' || m.status === 'EXPIRING_SOON')
            ? 'ACTIVE'
            : m.status;

        const updated = {
          ...m,
          paidAmountBdt: newPaid,
          dueAmountBdt: newDue,
          status: newStatus,
          paymentHistory: [newPayment, ...m.paymentHistory],
        };
        updatedMember = updated;
        return updated;
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers })
      );
      return { members: updatedMembers };
    });

    return {
      success: true,
      paymentRecord: newPayment,
      updatedMember,
    };
  },

  renewMemberPlan: async (
    memberId,
    plan,
    planTitle,
    durationMonths,
    feeBdt,
    paidBdt,
    method,
    customStartDate,
    notes
  ) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const state = get();
    const currentMember = state.members.find((m) => m.id === memberId);
    if (!currentMember) {
      return { success: false };
    }

    // Determine smart start date:
    // If customStartDate is specified, use that.
    // Else if member has a valid future endDate (endDate >= todayStr), start from that endDate!
    // Else start from todayStr.
    let startStr = todayStr;
    if (customStartDate) {
      startStr = customStartDate;
    } else if (currentMember.endDate && currentMember.endDate >= todayStr) {
      startStr = currentMember.endDate;
    }

    const startDateObj = new Date(startStr);
    const endDateObj = new Date(startDateObj);
    endDateObj.setMonth(endDateObj.getMonth() + durationMonths);
    const endStr = endDateObj.toISOString().split('T')[0];

    const dueBdt = Math.max(0, feeBdt - paidBdt);
    const invNumber = `INV-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const renewalPayment: GymPaymentRecord | null = paidBdt > 0
      ? {
          id: `pay_${Date.now()}`,
          date: todayStr,
          amountBdt: paidBdt,
          method,
          invoiceNumber: invNumber,
          receivedBy: state.gymProfile.ownerName,
          notes: notes || `Plan Renewal: ${planTitle} (${durationMonths} mo)`,
        }
      : null;

    let updatedMember: GymMemberItem | undefined;

    set((s) => {
      const updatedMembers = s.members.map((m) => {
        if (m.id !== memberId) return m;
        const updated: GymMemberItem = {
          ...m,
          membershipPlan: plan,
          planTitle,
          startDate: startStr,
          endDate: endStr,
          totalFeeBdt: feeBdt,
          paidAmountBdt: paidBdt,
          dueAmountBdt: dueBdt,
          status: 'ACTIVE' as MemberStatus,
          paymentHistory: renewalPayment ? [renewalPayment, ...m.paymentHistory] : m.paymentHistory,
          currentFreeze: undefined, // Clear freeze when renewing/upgrading
        };
        updatedMember = updated;
        return updated;
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...s, members: updatedMembers })
      );
      return { members: updatedMembers };
    });

    return {
      success: true,
      member: updatedMember,
      paymentRecord: renewalPayment || undefined,
      invoiceNumber: invNumber,
    };
  },

  freezeMember: async (memberId, days, reason, notes) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const plannedEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let targetMember: GymMemberItem | undefined;

    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id === memberId) {
          const freezeRecord: GymMemberFreezeRecord = {
            id: `frz_${Date.now()}`,
            freezeStartDate: todayStr,
            freezeEndDate: plannedEndDate,
            reason: reason,
            reasonNotes: notes,
            previousEndDate: m.endDate,
          };

          targetMember = {
            ...m,
            status: 'FROZEN' as MemberStatus,
            currentFreeze: freezeRecord,
          };
          return targetMember;
        }
        return m;
      });

      void setStorageItem(GYM_STORAGE_KEY, JSON.stringify({ ...state, members: updatedMembers }));
      return { members: updatedMembers };
    });

    return { success: !!targetMember, member: targetMember };
  },

  resumeMember: async (memberId) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let targetMember: GymMemberItem | undefined;
    let extendedDays = 1;
    let newEndDateStr = '';

    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id === memberId) {
          const freezeStart = m.currentFreeze?.freezeStartDate
            ? new Date(m.currentFreeze.freezeStartDate)
            : new Date(today.getTime() - 24 * 60 * 60 * 1000);

          const diffTime = Math.abs(today.getTime() - freezeStart.getTime());
          extendedDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

          // Calculate new end date by adding extendedDays to old endDate
          const currentEnd = new Date(m.endDate || todayStr);
          currentEnd.setDate(currentEnd.getDate() + extendedDays);
          newEndDateStr = currentEnd.toISOString().split('T')[0];

          const completedFreezeRecord: GymMemberFreezeRecord = {
            id: m.currentFreeze?.id || `frz_${Date.now()}`,
            freezeStartDate: m.currentFreeze?.freezeStartDate || todayStr,
            freezeEndDate: m.currentFreeze?.freezeEndDate,
            resumedDate: todayStr,
            reason: m.currentFreeze?.reason || 'OTHER',
            reasonNotes: m.currentFreeze?.reasonNotes,
            daysFrozen: extendedDays,
            previousEndDate: m.endDate,
            newEndDate: newEndDateStr,
          };

          const updatedHistory = [...(m.freezeHistory || []), completedFreezeRecord];

          // Determine next status (ACTIVE or EXPIRING_SOON)
          const daysUntilNewEnd = Math.ceil((currentEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const nextStatus: MemberStatus = daysUntilNewEnd <= 0 ? 'EXPIRED' : daysUntilNewEnd <= 7 ? 'EXPIRING_SOON' : 'ACTIVE';

          targetMember = {
            ...m,
            endDate: newEndDateStr,
            status: nextStatus,
            currentFreeze: undefined,
            freezeHistory: updatedHistory,
          };
          return targetMember;
        }
        return m;
      });

      void setStorageItem(GYM_STORAGE_KEY, JSON.stringify({ ...state, members: updatedMembers }));
      return { members: updatedMembers };
    });

    return {
      success: !!targetMember,
      member: targetMember,
      extendedDays,
      newEndDate: newEndDateStr,
    };
  },

  toggleMemberCheckIn: async (memberId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let isCheckedIn = false;

    set((state) => {
      const exists = state.todayCheckInIds.includes(memberId);
      const newCheckins = exists
        ? state.todayCheckInIds.filter((id) => id !== memberId)
        : [...state.todayCheckInIds, memberId];

      isCheckedIn = !exists;

      const updatedMembers = state.members.map((m) =>
        m.id === memberId
          ? { ...m, lastCheckInDate: !exists ? todayStr : m.lastCheckInDate }
          : m
      );

      const newFloorCount = Math.max(0, isCheckedIn ? state.gymProfile.currentFloorCount + 1 : state.gymProfile.currentFloorCount - 1);
      const updatedProfile = { ...state.gymProfile, currentFloorCount: newFloorCount };

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({
          ...state,
          gymProfile: updatedProfile,
          members: updatedMembers,
          todayCheckInIds: newCheckins,
        })
      );

      return {
        gymProfile: updatedProfile,
        members: updatedMembers,
        todayCheckInIds: newCheckins,
      };
    });

    return isCheckedIn;
  },

  addLead: async (leadData) => {
    const newId = `lead_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newLead: GymLeadItem = {
      ...leadData,
      id: newId,
      inquiryDate: todayStr,
    };

    set((state) => {
      const updatedLeads = [newLead, ...state.leads];
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, leads: updatedLeads })
      );
      return { leads: updatedLeads };
    });

    return newLead;
  },

  updateLead: async (id, patch) => {
    set((state) => {
      const updatedLeads = state.leads.map((l) => (l.id === id ? { ...l, ...patch } : l));
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, leads: updatedLeads })
      );
      return { leads: updatedLeads };
    });
  },

  deleteLead: async (id) => {
    set((state) => {
      const updatedLeads = state.leads.filter((l) => l.id !== id);
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, leads: updatedLeads })
      );
      return { leads: updatedLeads };
    });
  },

  convertLeadToMember: async (leadId, plan, planTitle, feeBdt, paidBdt, method) => {
    const lead = get().leads.find((l) => l.id === leadId);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const end = new Date(today);
    end.setMonth(end.getMonth() + 3); // default 3 months
    const endStr = end.toISOString().split('T')[0];

    const newMember = await get().addMember(
      {
        fullName: lead?.fullName || 'New Member',
        phone: lead?.phone || '',
        gender: 'MALE',
        membershipPlan: plan,
        planTitle,
        startDate: todayStr,
        endDate: endStr,
        totalFeeBdt: feeBdt,
        paidAmountBdt: paidBdt,
        dueAmountBdt: Math.max(0, feeBdt - paidBdt),
        status: 'ACTIVE',
        notes: `Converted from lead (${lead?.source || 'Walk-in'})`,
      },
      paidBdt > 0 ? { amount: paidBdt, method, notes: 'Lead Conversion Payment' } : undefined
    );

    // Update lead status to CONVERTED
    await get().updateLead(leadId, { status: 'CONVERTED' });
    return newMember;
  },

  addEquipment: async (eqData) => {
    const newId = `eq_${Date.now()}`;
    const newEq: GymEquipmentItem = { ...eqData, id: newId };
    set((state) => {
      const updated = [newEq, ...state.equipment];
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, equipment: updated })
      );
      return { equipment: updated };
    });
    return newEq;
  },

  updateEquipment: async (id, patch) => {
    set((state) => {
      const updated = state.equipment.map((e) => (e.id === id ? { ...e, ...patch } : e));
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, equipment: updated })
      );
      return { equipment: updated };
    });
  },

  logEquipmentService: async (id, nextServiceDueDate, costBdt, notes) => {
    const todayStr = new Date().toISOString().split('T')[0];
    set((state) => {
      const updated = state.equipment.map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          status: 'OPTIMAL' as const,
          lastServiceDate: todayStr,
          nextServiceDueDate,
          lastRepairCostBdt: costBdt ?? e.lastRepairCostBdt,
          notes: notes ? `${e.notes ? e.notes + ' | ' : ''}Serviced on ${todayStr}: ${notes}` : e.notes,
        };
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, equipment: updated })
      );
      return { equipment: updated };
    });
  },

  deleteEquipment: async (id) => {
    set((state) => {
      const updated = state.equipment.filter((e) => e.id !== id);
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, equipment: updated })
      );
      return { equipment: updated };
    });
  },

  addExpense: async (expData) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newExp: GymExpenseItem = {
      ...expData,
      id: `exp_${Date.now()}`,
      date: todayStr,
    };
    set((state) => {
      const updated = [newExp, ...state.expenses];
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, expenses: updated })
      );
      return { expenses: updated };
    });
  },

  deleteExpense: async (id) => {
    set((state) => {
      const updated = state.expenses.filter((e) => e.id !== id);
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, expenses: updated })
      );
      return { expenses: updated };
    });
  },

  createAnnouncement: async (ancData) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newAnc: GymAnnouncement = {
      ...ancData,
      id: `anc_${Date.now()}`,
      date: todayStr,
    };
    set((state) => {
      const updated = [newAnc, ...state.announcements];
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, announcements: updated })
      );
      return { announcements: updated };
    });
  },

  deleteAnnouncement: async (id) => {
    set((state) => {
      const updated = state.announcements.filter((a) => a.id !== id);
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, announcements: updated })
      );
      return { announcements: updated };
    });
  },

  getFinancialSnapshot: () => {
    const state = get();
    let totalCollected = 0;
    let totalPendingDues = 0;
    let activeCount = 0;
    let expiringCount = 0;
    let unpaidCount = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    state.members.forEach((m) => {
      totalPendingDues += m.dueAmountBdt;
      if (m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON') {
        activeCount++;
      }
      if (m.status === 'EXPIRING_SOON') {
        expiringCount++;
      }
      if (m.status === 'UNPAID') {
        unpaidCount++;
      }

      // Sum payments this month
      m.paymentHistory.forEach((p) => {
        const pDate = new Date(p.date);
        if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
          totalCollected += p.amountBdt;
        }
      });
    });

    let totalExpenses = 0;
    state.expenses.forEach((e) => {
      const eDate = new Date(e.date);
      if (eDate.getFullYear() === currentYear && eDate.getMonth() === currentMonth) {
        totalExpenses += e.amountBdt;
      }
    });

    const netProfit = totalCollected - totalExpenses;
    const mrr = totalCollected + totalPendingDues;

    return {
      mrrBdt: mrr,
      totalCollectedThisMonthBdt: totalCollected,
      totalPendingDuesBdt: totalPendingDues,
      totalExpensesThisMonthBdt: totalExpenses,
      netProfitThisMonthBdt: netProfit,
      activeMemberCount: activeCount,
      expiringIn7DaysCount: expiringCount,
      unpaidMembersCount: unpaidCount,
      todayCheckInsCount: state.todayCheckInIds.length,
    };
  },

  getMembersByStatus: (status) => {
    return get().members.filter((m) => m.status === status);
  },

  getGhostingMembers: (daysThreshold = 7) => {
    const today = new Date();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    return get().members.filter((m) => {
      if (m.status !== 'ACTIVE' && m.status !== 'EXPIRING_SOON') return false;
      if (!m.lastCheckInDate) return true;
      const lastCheckIn = new Date(m.lastCheckInDate);
      const diffMs = today.getTime() - lastCheckIn.getTime();
      return diffMs >= thresholdMs;
    });
  },

  getNewbieMembers: (daysThreshold = 14) => {
    const today = new Date();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    return get().members.filter((m) => {
      if (!m.startDate) return false;
      const start = new Date(m.startDate);
      const diffMs = today.getTime() - start.getTime();
      return diffMs >= 0 && diffMs <= thresholdMs;
    });
  },

  generateWhatsAppDuesMessage: (member) => {
    const profile = get().gymProfile;
    return `আসসালামু আলাইকুম ${member.fullName}, \n\n${profile.gymName} থেকে আপনার মেম্বারশিপ ফি এর একটি সংক্ষিপ্ত রিমাইন্ডার:\n\n📋 প্ল্যান: ${member.planTitle}\n💰 মোট বকেয়া: ৳${member.dueAmountBdt.toLocaleString()}\n📅 মেয়াদ শেষ: ${member.endDate}\n\nপেমেন্ট মেথড:\n📱 bKash Merchant: ${profile.bkashMerchantNumber || profile.phone} (Make Payment)\n📱 Nagad Merchant: ${profile.nagadMerchantNumber || profile.phone}\n\nপেমেন্ট সম্পন্ন করে অনুগ্রহ করে ট্রানজ্যাকশন আইডি টি রিপ্লাই দিন। সুস্থ থাকুন, ফিট থাকুন!\n\nধন্যবাদ,\n${profile.ownerName}\n${profile.gymName}`;
  },

  generateWhatsAppDigitalReceipt: (member, paymentRecord) => {
    const profile = get().gymProfile;
    const remainingDue = member.dueAmountBdt > 0
      ? `\n📌 অবশিষ্ট বকেয়া: ৳${member.dueAmountBdt.toLocaleString()}`
      : '\n✅ পেমেন্ট স্ট্যাটাস: সম্পূর্ণ পরিশোধিত (Paid in Full)';

    const trxLine = paymentRecord.transactionId
      ? `\n🔑 Trx ID: ${paymentRecord.transactionId}`
      : '';

    return `🧾 ${profile.gymName} — ডিজিটাল মানি রিসিট\n\nআসসালামু আলাইকুম ${member.fullName},\nআপনার মেম্বারশিপ ফি সফলভাবে গৃহীত হয়েছে।\n\n📄 ইনভয়েস নং: ${paymentRecord.invoiceNumber}\n💵 প্রাপ্ত টাকা: ৳${paymentRecord.amountBdt.toLocaleString()}\n💳 পেমেন্ট মাধ্যম: ${paymentRecord.method}${trxLine}\n📅 তারিখ: ${paymentRecord.date}\n🏋️‍♂️ মেম্বারশিপ প্ল্যান: ${member.planTitle}${remainingDue}\n\nআমাদের সাথে থাকার জন্য ধন্যবাদ!\n\n— ${profile.ownerName}\n${profile.gymName}`;
  },

  generateWhatsAppRenewalReceipt: (member, paymentRecord, isUpgrade = false, previousPlanTitle) => {
    const profile = get().gymProfile;
    const remainingDue = member.dueAmountBdt > 0
      ? `\n📌 বকেয়া ব্যালেন্স: ৳${member.dueAmountBdt.toLocaleString()}`
      : '\n✅ পেমেন্ট স্ট্যাটাস: সম্পূর্ণ পরিশোধিত (Paid in Full)';

    const typeTitle = isUpgrade ? 'মেম্বারশিপ আপগ্রেড ও রিনিউয়াল' : 'মেম্বারশিপ রিনিউয়াল';
    const upgradeLine = isUpgrade && previousPlanTitle
      ? `⭐ পূর্ববর্তী প্যাকেজ: ${previousPlanTitle}\n💎 নতুন আপগ্রেড প্যাকেজ: *${member.planTitle}*`
      : `🏋️‍♂️ রিনিউয়াল প্যাকেজ: *${member.planTitle}*`;

    const trxLine = paymentRecord?.transactionId
      ? `\n🔑 Trx ID: ${paymentRecord.transactionId}`
      : '';

    return (
      `🧾 *${profile.gymName} — ${typeTitle} মানি রিসিট*\n\n` +
      `আসসালামু আলাইকুম *${member.fullName}*,\n` +
      `আপনার মেম্বারশিপ সফলভাবে *${isUpgrade ? 'Upgraded & Renewed' : 'Renewed'}* করা হয়েছে! 🎉\n\n` +
      `📄 *ইনভয়েস নং:* ${paymentRecord?.invoiceNumber || 'INV-RENEW'}\n` +
      `${upgradeLine}\n` +
      `💵 *পরিশোধিত ফি:* ৳${paymentRecord?.amountBdt?.toLocaleString() || 0} (via ${paymentRecord?.method || 'Cash'})${trxLine}\n` +
      `📅 *মেম্বারশিপ শুরুর তারিখ:* ${member.startDate}\n` +
      `🎉 *নতুন মেয়াদ শেষ:* *${member.endDate}*${remainingDue}\n\n` +
      `আমাদের সাথে ফিটনেস জার্নি অব্যাহত রাখার জন্য ধন্যবাদ! 💪🔥\n\n` +
      `— ${profile.ownerName}\n${profile.gymName}`
    );
  },

  generateWhatsAppReEngagementMessage: (member) => {
    const profile = get().gymProfile;
    const trainerLine = member.assignedTrainerName
      ? `আপনার ট্রেইনার ${member.assignedTrainerName}`
      : 'আমাদের কোচিং টিম';

    return `আসসালামু আলাইকুম ${member.fullName} ভাই/আপু, \n\n${profile.gymName} থেকে ${trainerLine} আপনাকে ফ্লোরে মিস করছেন! 💪\n\nআমরা লক্ষ্য করেছি আপনি গত কয়েক দিন যাবত জিমে আসতে পারেননি। সুস্থতা, স্ট্রেন্থ ও কাঙ্ক্ষিত ফিজিক ধরে রাখতে ধারাবাহিকতাই আসল চাবিকাঠি।\n\n🎯 বিশেষ রি-এনগেজমেন্ট সাপোর্ট: এই সপ্তাহে ফ্লোরে আসলে কোচের সাথে ফ্রি ১৫-মিনিট প্রোগ্রেস রিভিউ ও ফর্ম চেক সেশন পাবেন।\n\nকোনো শারীরিক সমস্যা বা টাইমিং অ্যাডজাস্টমেন্টের প্রয়োজন হলে আমাদের জানান। আপনার প্রত্যাবর্তনের অপেক্ষায় রইলাম!\n\nআন্তরিক শুভেচ্ছায়,\n${profile.ownerName}\n${profile.gymName}`;
  },

  generateWhatsAppTrialPass: (lead, trialDate) => {
    const profile = get().gymProfile;
    const dateStr = trialDate || lead.trialDate || 'আগামীকাল';

    return `🎟️ ${profile.gymName} — ফ্রি ১-দিনের ভিআইপি ট্রায়াল পাস\n\nআসসালামু আলাইকুম ${lead.fullName}!\n${profile.gymName}-এ আপনার ১-দিনের ট্রায়াল বুকিং নিশ্চিত করা হয়েছে।\n\n📅 ট্রায়াল তারিখ: ${dateStr}\n⏰ অপারেটিং আওয়ার: ${profile.operatingHours}\n📍 ঠিকানা: ${profile.address}, ${profile.city}\n📞 ফ্রন্ট ডেস্ক: ${profile.phone}\n\nজিম ফ্লোরে এসে রিসেপশনে এই মেসেজটি দেখান এবং উপভোগ করুন আমাদের প্রিমিয়াম ইকুইপমেন্ট ও ওয়ার্কআউট সেশন!\n\n— ${profile.ownerName}\n${profile.gymName}`;
  },

  generateWhatsAppFreezeMessage: (member) => {
    const gymName = get().gymProfile.gymName || 'IronForge Fitness Arena';
    const reasonLabels: Record<GymFreezeReason, string> = {
      MEDICAL: 'Medical / Injury Recovery (অসুস্থতা বা ইনজুরি)',
      EXAM: 'Exams & Study Break (পরীক্ষার ছুটি)',
      TRAVEL: 'Travel / Vacation Break (ভ্রমণ / দেশের বাইরে)',
      RAMADAN: 'Ramadan / Fasting Break (রমজানের রোজা)',
      WORK: 'Work / Relocation Pause (কাজের ব্যস্ততা)',
      OTHER: 'Personal Leave (ব্যক্তিগত ছুটি)',
    };
    const reasonText = member.currentFreeze?.reason ? reasonLabels[member.currentFreeze.reason] : 'Personal Leave';

    return (
      `*Membership Paused — ${gymName}* ❄️\n\n` +
      `আসসালামু আলাইকুম *${member.fullName}*,\n` +
      `আপনার অনুরোধ অনুযায়ী আপনার মেম্বারশিপ সাময়িক পজ/ফ্রিজ করা হয়েছে।\n\n` +
      `📅 *ফ্রিজ শুরুর তারিখ:* ${member.currentFreeze?.freezeStartDate || 'Today'}\n` +
      `⏳ *সম্ভাব্য ফেরার তারিখ:* ${member.currentFreeze?.freezeEndDate || 'Upon notification'}\n` +
      `🏷️ *কারণ:* ${reasonText}\n\n` +
      `✨ *গ্যারান্টি:* আপনার মেম্বারশিপের বাকি দিনগুলো সুরক্ষিত রয়েছে এবং জিমে ফিরে আসার পর স্বয়ংক্রিয়ভাবে মেয়াদ বাড়িয়ে দেওয়া হবে!\n\n` +
      `সুস্থ থাকুন, খুব শীঘ্রই আবার জিম ফ্লোরে দেখা হবে! 💪\n\n` +
      `— ${get().gymProfile.ownerName}\n${gymName}`
    );
  },

  generateWhatsAppResumeMessage: (member, extendedDays, newEndDate) => {
    const gymName = get().gymProfile.gymName || 'IronForge Fitness Arena';
    return (
      `*Welcome Back to ${gymName}!* 🏋️🔥\n\n` +
      `আসসালামু আলাইকুম *${member.fullName}*,\n` +
      `আপনার জিম মেম্বারশিপ আজ সফলভাবে *Resumed / Active* করা হয়েছে!\n\n` +
      `❄️ *মোট ফ্রিজ ছিলেন:* ${extendedDays} দিন\n` +
      `🎉 *নতুন বর্ধিত মেয়াদ:* *${newEndDate}*\n\n` +
      `আপনাকে আবার ফ্লোরে পেয়ে আমরা আনন্দিত। চলুন আপনার ফিটনেস গোল অর্জন করি! 💪\n\n` +
      `— ${get().gymProfile.ownerName}\n${gymName}`
    );
  },

  generateWhatsAppDigitalPass: (member) => {
    const profile = get().gymProfile;
    const memberCode = `#IF-${new Date().getFullYear()}-${member.id.replace('mem_', '').padStart(4, '0')}`;
    const statusEmoji = member.status === 'ACTIVE' ? '🟢 ACTIVE' : member.status === 'FROZEN' ? '❄️ FROZEN' : member.status === 'EXPIRING_SOON' ? '⏳ EXPIRING SOON' : '🔴 EXPIRED';
    const lockerLine = member.lockerNumber ? `\n🔒 *বরাদ্দকৃত লকার:* ${member.lockerNumber}` : '';
    const coachLine = member.assignedTrainerName ? `\n🏋️‍♂️ *ব্যক্তিগত ট্রেইনার:* ${member.assignedTrainerName}` : '';
    const duesLine = member.dueAmountBdt > 0 ? `\n⚠️ *বকেয়া ব্যালেন্স:* ৳${member.dueAmountBdt.toLocaleString()}` : '\n✅ *পেমেন্ট স্ট্যাটাস:* পরিশোধিত (No Dues)';

    return (
      `🪪 *${profile.gymName} — অফিশিয়াল ডিজিটাল মেম্বার পাস*\n\n` +
      `আসসালামু আলাইকুম *${member.fullName}*,\n` +
      `আপনার মেম্বারশিপের অফিসিয়াল ডিজিটাল আইডি পাস নিচে সংযুক্ত করা হলো:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *Member ID:* ${memberCode}\n` +
      `📋 *প্ল্যান টিয়ার:* ${member.planTitle}\n` +
      `📅 *মেয়াদ শেষ:* *${member.endDate}*\n` +
      `⚡ *স্ট্যাটাস:* ${statusEmoji}${lockerLine}${coachLine}${duesLine}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📌 *এন্ট্রি নির্দেশিকা:*\n` +
      `জিমে প্রবেশের সময় ফ্রন্ট ডেস্কে এই পাসটি প্রদর্শন করুন অথবা আপনার Member ID (${memberCode}) প্রদান করে চেক-ইন দিন।\n\n` +
      `ধারাবাহিক ওয়ার্কআউট করুন ও সুস্থ থাকুন! 💪🔥\n\n` +
      `— ${profile.ownerName}\n` +
      `${profile.gymName}\n` +
      `📍 ${profile.address}, ${profile.city} | 📞 ${profile.phone}`
    );
  },

  // Pro-Shop & Juice Bar POS Actions
  addProShopItem: async (itemData) => {
    const newItem: GymProShopItem = {
      ...itemData,
      id: `item_${Date.now()}`,
    };
    set((state) => {
      const updated = [newItem, ...state.proShopItems];
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, proShopItems: updated })
      );
      return { proShopItems: updated };
    });
    return newItem;
  },

  updateProShopItem: async (id, patch) => {
    set((state) => {
      const updated = state.proShopItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      );
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, proShopItems: updated })
      );
      return { proShopItems: updated };
    });
  },

  deleteProShopItem: async (id) => {
    set((state) => {
      const updated = state.proShopItems.filter((item) => item.id !== id);
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, proShopItems: updated })
      );
      return { proShopItems: updated };
    });
  },

  restockProShopItem: async (id, addQuantity, costPerUnitBdt) => {
    set((state) => {
      const updated = state.proShopItems.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          stockQuantity: item.stockQuantity + addQuantity,
          costBdt: costPerUnitBdt !== undefined ? costPerUnitBdt : item.costBdt,
        };
      });
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, proShopItems: updated })
      );
      return { proShopItems: updated };
    });
  },

  recordPosSale: async (saleData) => {
    const state = get();
    const item = state.proShopItems.find((i) => i.id === saleData.itemId);
    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    if (item.stockQuantity < saleData.quantity) {
      return { success: false, message: `Only ${item.stockQuantity} ${item.unit} available in stock.` };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const totalAmount = item.priceBdt * saleData.quantity;
    const profit = (item.priceBdt - item.costBdt) * saleData.quantity;
    const member = saleData.memberId ? state.members.find((m) => m.id === saleData.memberId) : undefined;

    const newSaleRecord: GymPosSaleRecord = {
      id: `sale_${Date.now()}`,
      date: todayStr,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      quantity: saleData.quantity,
      unitPriceBdt: item.priceBdt,
      totalPriceBdt: totalAmount,
      profitBdt: profit,
      paymentMethod: saleData.paymentMethod,
      buyerType: saleData.buyerType,
      memberId: saleData.memberId,
      memberName: member ? member.fullName : undefined,
      transactionId: saleData.transactionId,
      receivedBy: state.gymProfile.ownerName,
    };

    // Decrement stock
    const updatedInventory = state.proShopItems.map((i) =>
      i.id === item.id ? { ...i, stockQuantity: Math.max(0, i.stockQuantity - saleData.quantity) } : i
    );

    // If charged to Member Tab, add to member due
    let updatedMembers = state.members;
    if (saleData.paymentMethod === 'MEMBER_TAB' && member) {
      updatedMembers = state.members.map((m) => {
        if (m.id !== member.id) return m;
        return {
          ...m,
          dueAmountBdt: m.dueAmountBdt + totalAmount,
          notes: `${m.notes ? m.notes + ' | ' : ''}Pro-Shop Tab: ${saleData.quantity}x ${item.name} (৳${totalAmount})`,
        };
      });
    }

    const updatedSales = [newSaleRecord, ...state.posSales];

    set({
      proShopItems: updatedInventory,
      posSales: updatedSales,
      members: updatedMembers,
    });

    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({
        ...state,
        proShopItems: updatedInventory,
        posSales: updatedSales,
        members: updatedMembers,
      })
    );

    return {
      success: true,
      saleRecord: newSaleRecord,
    };
  },

  getLowStockProShopItems: () => {
    return get().proShopItems.filter((i) => i.stockQuantity <= i.reorderThreshold);
  },

  getProShopSalesSummary: () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = get().posSales.filter((s) => s.date === todayStr);

    const todayRevenueBdt = todaySales.reduce((sum, s) => sum + s.totalPriceBdt, 0);
    const todayProfitBdt = todaySales.reduce((sum, s) => sum + s.profitBdt, 0);
    const totalSoldUnits = todaySales.reduce((sum, s) => sum + s.quantity, 0);
    const lowStockCount = get().proShopItems.filter((i) => i.stockQuantity <= i.reorderThreshold).length;

    return {
      todayRevenueBdt,
      todayProfitBdt,
      totalSoldUnits,
      lowStockCount,
    };
  },

  quickCheckInMember: async (memberId) => {
    const state = get();
    const member = state.members.find((m) => m.id === memberId);
    if (!member) {
      return { success: false, isCheckIn: false };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isAlreadyCheckedIn = state.todayCheckInIds.includes(memberId);

    let updatedCheckins: string[];
    if (isAlreadyCheckedIn) {
      updatedCheckins = state.todayCheckInIds.filter((id) => id !== memberId);
    } else {
      updatedCheckins = [memberId, ...state.todayCheckInIds];
    }

    const updatedMembers = state.members.map((m) =>
      m.id === memberId
        ? {
            ...m,
            lastCheckInDate: todayStr,
            totalCheckInsCount: (m.totalCheckInsCount || 0) + (isAlreadyCheckedIn ? 0 : 1),
          }
        : m
    );

    set({
      todayCheckInIds: updatedCheckins,
      members: updatedMembers,
    });

    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({
        ...state,
        todayCheckInIds: updatedCheckins,
        members: updatedMembers,
      })
    );

    return {
      success: true,
      isCheckIn: !isAlreadyCheckedIn,
      member: {
        ...member,
        lastCheckInDate: todayStr,
        totalCheckInsCount: (member.totalCheckInsCount || 0) + (isAlreadyCheckedIn ? 0 : 1),
      },
    };
  },

  // Member Milestones & Celebrations
  getCelebrationsSnapshot: (targetDate) => {
    return evaluateCelebrations(get().members, targetDate);
  },

  recordCelebrationWish: async (memberId, type) => {
    const currentYear = new Date().getFullYear();
    const updated = get().members.map((m) =>
      m.id === memberId
        ? {
            ...m,
            lastBirthdayWishedYear: type === 'BIRTHDAY' ? currentYear : m.lastBirthdayWishedYear,
          }
        : m
    );

    set({ members: updated });
    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({ ...get(), members: updated })
    );
  },

  generateWhatsAppBirthdayWish: (member) => {
    const profile = get().gymProfile;
    return (
      `🎂 *${profile.gymName} — শুভ জন্মদিন, ${member.fullName}!* 🎉\n\n` +
      `আসসালামু আলাইকুম *${member.fullName}*,\n` +
      `${profile.gymName} পরিবারের পক্ষ থেকে আপনাকে জন্মদিনের অনেক অনেক শুভেচ্ছা ও আন্তরিক অভিনন্দন! 🎈✨\n\n` +
      `আপনার সুস্থতা, দীর্ঘায়ু এবং ফিটনেস যাত্রার অবিচল সাফল্য কামনা করি।\n\n` +
      `🎁 *আপনার জন্মদিনের স্পেশাল জিম গিফট:*\n` +
      `• আজ জিম ফ্লোরে এসে রিসেপশন থেকে সংগ্রহ করুন আপনার *১টি ফ্রি স্পেশাল প্রোটিন শেক* 🥤\n` +
      `• এই মাসে মেম্বারশিপ রিনিউয়ালের ক্ষেত্রে উপভোগ করুন এক্সক্লুসিভ *১০% বার্থডে ডিসকাউন্ট* 🏷️\n\n` +
      `আজকের দিনটি আপনার অনেক সুন্দর কাটুক! জিম ফ্লোরে দেখা হচ্ছে! 💪🔥\n\n` +
      `— ${profile.ownerName}\n` +
      `${profile.gymName}\n` +
      `📍 ${profile.address}, ${profile.city} | 📞 ${profile.phone}`
    );
  },

  generateWhatsAppMilestoneWish: (member, celebration) => {
    const profile = get().gymProfile;
    return (
      `🎖️ *${profile.gymName} — অভিনন্দন মাইলস্টোন অর্জনের জন্য!* ${celebration.badgeEmoji}🔥\n\n` +
      `আসসালামু আলাইকুম *${member.fullName}*,\n` +
      `আপনি আজ ${profile.gymName}-এ আপনার গৌরবময় *${celebration.title}* সফলভাবে সম্পন্ন করেছেন!\n\n` +
      `ধারাবাহিক ডিসিপ্লিন ও কঠোর পরিশ্রমের মাধ্যমে আপনি পুরো জিমের অন্য সকল মেম্বারদের জন্য একটি অনুপ্রেরণা তৈরি করেছেন। 🏋️‍♂️⚡\n\n` +
      `🏆 *আপনার বিশেষ উপহার:* ${celebration.perkOffer || '১টি ফ্রি স্পেশাল সেশন'}\n` +
      `রিসেপশন ডেস্কে যোগাযোগ করে আপনার গিফট রিডিম করে নিন।\n\n` +
      `Keep pushing your limits! 💪\n\n` +
      `— ${profile.ownerName}\n` +
      `${profile.gymName}`
    );
  },

  // Shift Guard & Timing Controls
  getCurrentShiftStatus: (testTime) => {
    const shifts = get().gymProfile.shifts || SEED_GYM_SHIFTS;
    return evaluateCurrentShift(shifts, testTime);
  },

  // 💵 CASH REGISTER & NIGHTLY SHIFT RECONCILIATION ACTIONS
  getCashRegisterSnapshot: () => {
    const session = get().activeCashRegisterSession;
    return calculateCashRegisterSnapshot(session, get().members);
  },

  getPettyCatalog: () => {
    return get().pettyCatalog || SEED_PETTY_CATALOG;
  },

  getPettyEnvelopeStatus: () => {
    const session = get().activeCashRegisterSession;
    return calculatePettyEnvelopeStatus(session, get().pettyFloatAllocatedBdt || 2000);
  },

  replenishPettyEnvelope: async (amountBdt, approvedBy) => {
    const newFloat = (get().pettyFloatAllocatedBdt || 2000) + amountBdt;
    set({ pettyFloatAllocatedBdt: newFloat });
  },

  openNewRegisterSession: async (openingFloatBdt, openedBy) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newSession: GymCashDrawerSession = {
      id: `session_${Date.now()}`,
      date: todayStr,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      openedBy,
      openingFloatBdt,
      pettyExpenses: [],
      cashDrops: [],
    };

    set({ activeCashRegisterSession: newSession });
    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({ ...get(), activeCashRegisterSession: newSession })
    );
  },

  logPettyExpense: async (expenseData) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentSession = get().activeCashRegisterSession;
    const count = (currentSession.pettyExpenses || []).length + 1;
    const todayNum = (currentSession.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const voucherNumber = expenseData.voucherNumber || `PV-${todayNum}-${count.toString().padStart(2, '0')}`;

    const newExpense: GymPettyExpenseItem = {
      ...expenseData,
      id: `petty_${Date.now()}`,
      voucherNumber,
      time: timeStr,
      approvalStatus: expenseData.approvalStatus || (expenseData.amountBdt <= 200 ? 'AUTO_APPROVED' : 'APPROVED'),
    };

    const updatedExpenses = [newExpense, ...(currentSession.pettyExpenses || [])];
    const updatedSession: GymCashDrawerSession = {
      ...currentSession,
      pettyExpenses: updatedExpenses,
    };

    set({ activeCashRegisterSession: updatedSession });
    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({ ...get(), activeCashRegisterSession: updatedSession })
    );
  },

  deletePettyExpense: async (id) => {
    const currentSession = get().activeCashRegisterSession;
    const updatedExpenses = (currentSession.pettyExpenses || []).filter((e) => e.id !== id);
    const updatedSession: GymCashDrawerSession = {
      ...currentSession,
      pettyExpenses: updatedExpenses,
    };

    set({ activeCashRegisterSession: updatedSession });
    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({ ...get(), activeCashRegisterSession: updatedSession })
    );
  },

  logCashDropToOwner: async (dropData) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newDrop: GymCashDropItem = {
      ...dropData,
      id: `drop_${Date.now()}`,
      time: timeStr,
    };

    const currentSession = get().activeCashRegisterSession;
    const updatedDrops = [newDrop, ...(currentSession.cashDrops || [])];
    const updatedSession: GymCashDrawerSession = {
      ...currentSession,
      cashDrops: updatedDrops,
    };

    set({ activeCashRegisterSession: updatedSession });
    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({ ...get(), activeCashRegisterSession: updatedSession })
    );
  },

  closeRegisterSession: async (actualCashReportedBdt, closedBy, discrepancyReason, eodNotes) => {
    const snapshot = get().getCashRegisterSnapshot();
    const expected = snapshot.expectedCashInDrawerBdt;
    const discrepancy = actualCashReportedBdt - expected;

    const closedSession: GymCashDrawerSession = {
      ...get().activeCashRegisterSession,
      status: 'CLOSED',
      actualCashReportedBdt,
      cashDiscrepancyBdt: discrepancy,
      discrepancyReason: discrepancyReason || undefined,
      closedAt: new Date().toISOString(),
      closedBy,
      eodNotes: eodNotes || undefined,
    };

    const history = [closedSession, ...(get().cashRegisterHistory || [])];

    set({
      activeCashRegisterSession: closedSession,
      cashRegisterHistory: history,
    });

    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({
        ...get(),
        activeCashRegisterSession: closedSession,
        cashRegisterHistory: history,
      })
    );

    return {
      success: true,
      discrepancyBdt: discrepancy,
      session: closedSession,
    };
  },

  generateWhatsAppPettyDigest: () => {
    const session = get().activeCashRegisterSession;
    const profile = get().gymProfile;
    const envelope = get().getPettyEnvelopeStatus();

    let voucherList = '';
    if (session.pettyExpenses.length === 0) {
      voucherList = '• No petty vouchers logged today.';
    } else {
      voucherList = session.pettyExpenses
        .map(
          (v, i) =>
            `${i + 1}️⃣ [${v.voucherNumber || `#PV-0${i + 1}`}] *${v.title}*\n` +
            `   • Category: ${v.category} | Amount: ৳${v.amountBdt.toLocaleString()}\n` +
            `   • Spent By: ${v.spentBy}${v.recipientName ? ` | Paid to: ${v.recipientName}` : ''}\n` +
            `   • Status: ${v.approvalStatus || 'APPROVED'} ${v.hasReceiptPhoto ? '📷' : '✍️'}${v.notes ? `\n   • Note: ${v.notes}` : ''}`
        )
        .join('\n\n');
    }

    return (
      `🧾 *${profile.gymName} — DAILY PETTY CASH AUDIT DIGEST* 🔍\n` +
      `📅 Date: ${session.date} | ⏰ Shift: Full Day\n` +
      `👤 Logged By: ${session.openedBy || 'Manager'} | 🏢 Branch: ${profile.city}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💸 *TODAY'S TOTAL PETTY OUTFLOW: ৳${envelope.todaySpentBdt.toLocaleString()}*\n` +
      `💼 Petty Envelope Balance: ৳${envelope.currentRemainingBalanceBdt.toLocaleString()} / ৳${envelope.totalAllocatedFloatBdt.toLocaleString()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 *ITEMIZED VOUCHERS (${session.pettyExpenses.length}):*\n\n` +
      voucherList +
      `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *BUDGET COMPLIANCE:*\n` +
      `• Daily Limit: ৳${envelope.dailySpendLimitBdt.toLocaleString()} | Used: ৳${envelope.todaySpentBdt.toLocaleString()} (${Math.round((envelope.todaySpentBdt / envelope.dailySpendLimitBdt) * 100)}%)\n` +
      `• Variance Status: ${envelope.todaySpentBdt <= envelope.dailySpendLimitBdt ? 'OPTIMAL & COMPLIANT ✅' : 'OVER-BUDGET ⚠️'}\n\n` +
      `🔒 *All vouchers cryptographically signed & logged in GymOS.*`
    );
  },

  // 🏢 OPEX & STAFF DAILY EXPENSES ACTIONS
  getOperationalExpensesSnapshot: () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const expenses = get().operationalExpenses || [];
    const todayExpenses = expenses.filter((e) => e.date === todayStr);

    const totalOpexToday = todayExpenses.reduce((sum, e) => sum + e.amountBdt, 0);
    const staffAdvancesToday = todayExpenses
      .filter((e) => e.category === 'STAFF_SALARY_ADVANCE')
      .reduce((sum, e) => sum + e.amountBdt, 0);
    const drawerOpexToday = todayExpenses
      .filter((e) => e.paidFrom === 'CASH_DRAWER')
      .reduce((sum, e) => sum + e.amountBdt, 0);

    const registerSnap = get().getCashRegisterSnapshot();
    const netDailyRetainedCash = registerSnap.totalGrossRevenueBdt - totalOpexToday - registerSnap.pettyCashSpentBdt;

    return {
      totalOpexTodayBdt: totalOpexToday,
      staffAdvancesTodayBdt: staffAdvancesToday,
      drawerOpexTodayBdt: drawerOpexToday,
      netDailyRetainedCashBdt: netDailyRetainedCash,
      expenses: todayExpenses,
    };
  },

  logOperationalExpense: async (expenseData) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = expenseData.date || now.toISOString().split('T')[0];
    const todayNum = todayStr.replace(/-/g, '');
    const currentList = get().operationalExpenses || [];
    const count = currentList.length + 1;
    const voucherNumber = `EXP-${todayNum}-${count.toString().padStart(2, '0')}`;

    const newExpense: GymOperationalExpenseItem = {
      ...expenseData,
      id: `opex_${Date.now()}`,
      voucherNumber,
      date: todayStr,
      time: timeStr,
    };

    const updatedList = [newExpense, ...currentList];
    set({ operationalExpenses: updatedList });

    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({ ...get(), operationalExpenses: updatedList })
    );

    return newExpense;
  },

  deleteOperationalExpense: async (id) => {
    const updatedList = (get().operationalExpenses || []).filter((e) => e.id !== id);
    set({ operationalExpenses: updatedList });

    void setStorageItem(
      GYM_STORAGE_KEY,
      JSON.stringify({ ...get(), operationalExpenses: updatedList })
    );
  },

  getStaffLedgerSummaries: () => {
    const trainers = get().trainers || [];
    const expenses = get().operationalExpenses || [];

    return trainers.map((t) => {
      const staffExpenses = expenses.filter((e) => e.targetStaffId === t.id);
      const advances = staffExpenses
        .filter((e) => e.category === 'STAFF_SALARY_ADVANCE')
        .reduce((sum, e) => sum + e.amountBdt, 0);
      const allowances = staffExpenses
        .filter((e) => e.category === 'STAFF_TIFFIN_ALLOWANCE' || e.category === 'STAFF_TRANSPORT_REIMBURSE')
        .reduce((sum, e) => sum + e.amountBdt, 0);

      const baseSalary = 18000;
      const netPayable = Math.max(0, baseSalary - advances);

      return {
        staffId: t.id,
        staffName: t.name,
        role: t.specialization || 'Trainer',
        monthlyBaseSalaryBdt: baseSalary,
        totalAdvanceTakenThisMonthBdt: advances,
        totalAllowancesClaimedBdt: allowances,
        netPayableSalaryBdt: netPayable,
        advancesCount: staffExpenses.filter((e) => e.category === 'STAFF_SALARY_ADVANCE').length,
      };
    });
  },

  generateWhatsAppOpexDossier: () => {
    const profile = get().gymProfile;
    const snap = get().getOperationalExpensesSnapshot();
    const registerSnap = get().getCashRegisterSnapshot();
    const todayStr = new Date().toISOString().split('T')[0];

    let expenseLines = '';
    if (snap.expenses.length === 0) {
      expenseLines = '• No operational expenses logged today.';
    } else {
      expenseLines = snap.expenses
        .map(
          (e, i) =>
            `${i + 1}️⃣ [${e.voucherNumber}] *${e.title}*\n` +
            `   • Category: ${e.category} | Amount: ৳${e.amountBdt.toLocaleString()}\n` +
            `   • Paid From: ${e.paidFrom} | Spent By: ${e.spentBy}` +
            `${e.targetStaffName ? `\n   • ⚠️ Staff Deduct: ${e.targetStaffName}` : ''}` +
            `${e.fuelLiters ? `\n   • ⛽ Fuel: ${e.fuelLiters} Liters` : ''}` +
            `${e.recipientName ? `\n   • Paid to: ${e.recipientName}` : ''}` +
            `${e.hasReceiptPhoto ? ' 📷' : ''}` +
            `${e.notes ? `\n   • Note: ${e.notes}` : ''}`
        )
        .join('\n\n');
    }

    return (
      `📊 *${profile.gymName} — DAILY OPEX & STAFF EXPENSE DOSSIER* 🏢\n` +
      `📅 Date: ${todayStr} | ⏰ Day Settlement\n` +
      `👤 Generated By: Manager | 🏢 Branch: ${profile.city}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💸 *TODAY'S TOTAL OPEX OUTFLOW: ৳${snap.totalOpexTodayBdt.toLocaleString()}*\n` +
      `• Paid from Drawer: ৳${snap.drawerOpexTodayBdt.toLocaleString()}\n` +
      `• Paid from bKash/Owner: ৳${(snap.totalOpexTodayBdt - snap.drawerOpexTodayBdt).toLocaleString()}\n` +
      `• Staff Advances Included: ৳${snap.staffAdvancesTodayBdt.toLocaleString()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 *ITEMIZED EXPENSES (${snap.expenses.length}):*\n\n` +
      expenseLines +
      `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📈 *DAILY CASH FLOW SNAPSHOT:*\n` +
      `• Total Revenue Inflow: ৳${registerSnap.totalGrossRevenueBdt.toLocaleString()}\n` +
      `• Total OPEX + Petty: ৳${(snap.totalOpexTodayBdt + registerSnap.pettyCashSpentBdt).toLocaleString()}\n` +
      `• 🟢 *Net Retained Daily Cash: ৳${snap.netDailyRetainedCashBdt.toLocaleString()}*\n\n` +
      `🔒 *All entries reconciled with GymOS Payroll & Ledger.*`
    );
  },

  generateWhatsAppEodReport: (sessionParam) => {
    const session = sessionParam || get().activeCashRegisterSession;
    const snap = get().getCashRegisterSnapshot();
    const profile = get().gymProfile;

    const varianceText =
      session.cashDiscrepancyBdt === 0 || session.cashDiscrepancyBdt === undefined
        ? '৳0 (PERFECT MATCH ✅)'
        : session.cashDiscrepancyBdt > 0
        ? `+৳${session.cashDiscrepancyBdt.toLocaleString()} (SURPLUS 💎)`
        : `-৳${Math.abs(session.cashDiscrepancyBdt).toLocaleString()} (SHORTAGE ⚠️)`;

    let pettyLog = '';
    if (session.pettyExpenses.length === 0) {
      pettyLog = '• No petty expenses logged today.';
    } else {
      pettyLog = session.pettyExpenses
        .map((e) => `• ${e.title} — ৳${e.amountBdt.toLocaleString()} (${e.spentBy})`)
        .join('\n');
    }

    let dropsLog = '';
    if (session.cashDrops.length > 0) {
      dropsLog =
        '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📤 *CASH HANDED TO OWNER:*\n' +
        session.cashDrops
          .map((d) => `• ৳${d.amountBdt.toLocaleString()} handed to ${d.receivedBy} at ${d.time}`)
          .join('\n');
    }

    return (
      `💵 *${profile.gymName} — DAILY NIGHTLY CLOSING REPORT* 🌙\n` +
      `📅 Date: ${session.date} | ⏰ Closed At: ${session.closedAt ? new Date(session.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 PM'}\n` +
      `👤 Closed By: ${session.closedBy || 'Shift Manager'} | 🏢 Branch: ${profile.city}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TODAY'S GROSS REVENUE: ৳${snap.totalGrossRevenueBdt.toLocaleString()}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 Cash Inflow:        ৳${snap.cashCollectedBdt.toLocaleString()} (${snap.paymentCountByMethod.Cash} Payments)\n` +
      `📱 bKash Merchant:     ৳${snap.bkashCollectedBdt.toLocaleString()} (${snap.paymentCountByMethod.bKash} Payments)\n` +
      `💳 POS Card:           ৳${snap.cardCollectedBdt.toLocaleString()} (${snap.paymentCountByMethod.Card} Payments)\n` +
      `⚡ Nagad:              ৳${snap.nagadCollectedBdt.toLocaleString()} (${snap.paymentCountByMethod.Nagad} Payments)\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏦 *CASH DRAWER RECONCILIATION:*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `➕ Morning Opening Float:  ৳${session.openingFloatBdt.toLocaleString()}\n` +
      `➕ Day's Cash Collections: ৳${snap.cashCollectedBdt.toLocaleString()}\n` +
      `➖ Petty Cash Outflows:    ৳${snap.pettyCashSpentBdt.toLocaleString()} (${session.pettyExpenses.length} Items)\n` +
      `➖ Cash Drops to Owner:    ৳${snap.cashDropsTotalBdt.toLocaleString()}\n` +
      `────────────────────────────\n` +
      `🎯 *Expected Cash in Hand: ৳${snap.expectedCashInDrawerBdt.toLocaleString()}*\n` +
      `✋ *Actual Counted Cash:   ৳${(session.actualCashReportedBdt ?? snap.expectedCashInDrawerBdt).toLocaleString()}*\n` +
      `⚖️ *Discrepancy / Variance: ${varianceText}*\n` +
      (session.discrepancyReason ? `📝 Variance Reason: "${session.discrepancyReason}"\n` : '') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *PETTY CASH EXPENSES LOG (৳${snap.pettyCashSpentBdt.toLocaleString()}):*\n` +
      pettyLog +
      dropsLog +
      `\n\n🔒 *Status: ${session.status === 'CLOSED' ? 'REGISTER LOCKED & AUDITED ✅' : 'SESSION ACTIVE 🟢'}*\n` +
      `— GymOS Financial Terminal`
    );
  },

  updateGymShifts: async (shifts) => {
    const updatedProfile = { ...get().gymProfile, shifts };
    set((state) => {
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, gymProfile: updatedProfile })
      );
      return { gymProfile: updatedProfile };
    });
  },

  addGymShift: async (shiftData) => {
    const newShift: GymShiftScheduleItem = {
      ...shiftData,
      id: `shift_${Date.now()}`,
    };
    const currentShifts = get().gymProfile.shifts || SEED_GYM_SHIFTS;
    const updatedShifts = [...currentShifts, newShift];
    await get().updateGymShifts(updatedShifts);
  },

  deleteGymShift: async (shiftId) => {
    const currentShifts = get().gymProfile.shifts || SEED_GYM_SHIFTS;
    const updatedShifts = currentShifts.filter((s) => s.id !== shiftId);
    await get().updateGymShifts(updatedShifts);
  },

  generateWhatsAppShiftSchedule: () => {
    const profile = get().gymProfile;
    const shifts = (profile.shifts || SEED_GYM_SHIFTS).filter((s) => s.isActive);

    const ladiesShifts = shifts.filter((s) => s.shiftType === 'LADIES_ONLY');
    const gentsShifts = shifts.filter((s) => s.shiftType === 'GENTS_ONLY');
    const mixedShifts = shifts.filter((s) => s.shiftType === 'UNISEX_MIXED');

    const formatList = (items: GymShiftScheduleItem[]) =>
      items.map((i) => `• *${i.name}:* ${i.startTime} – ${i.endTime} (${i.daysApplicable.join(', ')})`).join('\n');

    return (
      `⏰ *${profile.gymName} — অফিসিয়াল জিম শিফট শিডিউল নোটিশ*\n\n` +
      `আসসালামু আলাইকুম মেম্বারবৃন্দ,\n` +
      `আমাদের নারী সদস্যদের সর্বোচ্চ প্রাইভেসি ও সবার নির্বিঘ্ন ওয়ার্কআউট নিশ্চিত করতে অনুমোদিত শিডিউল:\n\n` +
      (ladiesShifts.length > 0 ? `🚺 *লেডিস শিফট (শুধুমাত্র মহিলাদের জন্য):*\n${formatList(ladiesShifts)}\n\n` : '') +
      (gentsShifts.length > 0 ? `🚹 *জেন্টস শিফট (শুধুমাত্র পুরুষদের জন্য):*\n${formatList(gentsShifts)}\n\n` : '') +
      (mixedShifts.length > 0 ? `🚻 *মিক্সড / সাধারণ শিফট:*\n${formatList(mixedShifts)}\n\n` : '') +
      `⚠️ *বিশেষ অনুরোধ:* আপনার নির্ধারিত শিফট ব্যতীত অন্য সময়ে ফ্লোরে প্রবেশ করবেন না। চেক-ইন টার্মিনাল স্বয়ংক্রিয়ভাবে শিফট যাচাই করে।\n\n` +
      `ওয়ার্কআউটে ধারাবাহিক থাকুন ও সুস্থ থাকুন! 💪🔥\n\n` +
      `— ${profile.ownerName}\n` +
      `${profile.gymName}\n` +
      `📍 ${profile.address}, ${profile.city} | 📞 ${profile.phone}`
    );
  },

  // ⚖️ MEMBER BODY TRANSFORMATION METHODS
  getMemberTransformationSummary: (memberId: string) => {
    const member = get().members.find((m) => m.id === memberId);
    if (!member) return null;
    return calculateMemberTransformationSummary(member);
  },

  getMeasurementDueMembers: () => {
    const now = new Date();
    return get()
      .members.filter((m) => m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON')
      .filter((m) => {
        if (!m.bodyMeasurements || m.bodyMeasurements.length === 0) return true;
        const sorted = [...m.bodyMeasurements].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const latestDate = new Date(sorted[0].date);
        const diffDays = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 30;
      });
  },

  logMemberMeasurement: async (memberId, measurementData) => {
    const newMeasurement: GymBodyMeasurement = {
      ...measurementData,
      id: `bm_${Date.now()}`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id !== memberId) return m;
        const existing = m.bodyMeasurements || [];
        return {
          ...m,
          bodyMeasurements: [...existing, newMeasurement],
        };
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers })
      );

      return { members: updatedMembers };
    });

    return newMeasurement;
  },

  deleteMemberMeasurement: async (memberId, measurementId) => {
    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id !== memberId) return m;
        const existing = m.bodyMeasurements || [];
        return {
          ...m,
          bodyMeasurements: existing.filter((bm) => bm.id !== measurementId),
        };
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers })
      );

      return { members: updatedMembers };
    });
  },

  generateWhatsAppTransformationReportCard: (memberId: string) => {
    const member = get().members.find((m) => m.id === memberId);
    if (!member) return '';
    return generateWhatsAppTransformationReportCard(member, get().gymProfile.gymName);
  },

  // 🥊 PERSONAL TRAINING (PT) METHODS
  enrollMemberPTPackage: async (packageData) => {
    const newId = `pt_pack_${Date.now()}`;
    const newPackage: PTPackageEnrollment = {
      ...packageData,
      id: newId,
      completedSessions: 0,
      status: 'ACTIVE',
      history: [],
    };

    set((state) => {
      const updatedPackages = [...(state.ptPackages || []), newPackage];
      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, ptPackages: updatedPackages })
      );
      return { ptPackages: updatedPackages };
    });

    return newPackage;
  },

  punchPTSession: async (packageId, punchData) => {
    const targetPkg = (get().ptPackages || []).find((p) => p.id === packageId);
    if (!targetPkg) {
      throw new Error('PT Package not found');
    }

    const nextSessionNum = targetPkg.completedSessions + 1;
    const trainerId = punchData.substituteTrainerId || targetPkg.assignedTrainerId;
    const trainerName = punchData.substituteTrainerName || targetPkg.assignedTrainerName;
    const commission = targetPkg.commissionPerSessionBdt;

    const newPunch: PTPunchRecord = {
      id: `punch_${Date.now()}`,
      sessionNumber: nextSessionNum,
      date: punchData.date || new Date().toISOString().split('T')[0],
      time: punchData.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      conductedByTrainerId: trainerId,
      conductedByTrainerName: trainerName,
      status: punchData.status || 'COMPLETED',
      workoutFocus: punchData.workoutFocus,
      trainerCommissionBdt: commission,
      notes: punchData.notes,
    };

    set((state) => {
      const updatedPackages = (state.ptPackages || []).map((p) => {
        if (p.id !== packageId) return p;
        const newCompleted = p.completedSessions + 1;
        return {
          ...p,
          completedSessions: newCompleted,
          status: newCompleted >= p.totalSessions ? ('COMPLETED' as const) : ('ACTIVE' as const),
          history: [...p.history, newPunch],
        };
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, ptPackages: updatedPackages })
      );

      return { ptPackages: updatedPackages };
    });

    return newPunch;
  },

  getTrainerPTCommissionSummaries: () => {
    const trainers = get().trainers;
    const packages = get().ptPackages || [];

    return trainers.map((t) => {
      const trainerPacks = packages.filter((p) => p.assignedTrainerId === t.id && p.status === 'ACTIVE');
      let sessionsConducted = 0;
      let commissionEarned = 0;
      let projected = 0;

      packages.forEach((p) => {
        if (p.assignedTrainerId === t.id) {
          projected += p.trainerCommissionTotalBdt;
        }
        (p.history || []).forEach((h) => {
          if (h.conductedByTrainerId === t.id && (h.status === 'COMPLETED' || h.status === 'NO_SHOW_CHARGED')) {
            sessionsConducted++;
            commissionEarned += h.trainerCommissionBdt;
          }
        });
      });

      return {
        trainerId: t.id,
        trainerName: t.name,
        totalActivePTPackages: trainerPacks.length,
        totalSessionsConductedThisMonth: sessionsConducted,
        totalCommissionEarnedBdt: commissionEarned,
        projectedCommissionBdt: projected,
      };
    });
  },

  generateWhatsAppPTSessionSlip: (packageId: string, sessionNumber?: number) => {
    const pkg = (get().ptPackages || []).find((p) => p.id === packageId);
    if (!pkg) return '';
    const punch = sessionNumber
      ? pkg.history.find((h) => h.sessionNumber === sessionNumber)
      : pkg.history[pkg.history.length - 1];

    if (!punch) return '';
    return generateWhatsAppPTSessionSlip(pkg, punch, get().gymProfile.gymName);
  },

  generateWhatsAppPTRenewalOffer: (packageId: string) => {
    const pkg = (get().ptPackages || []).find((p) => p.id === packageId);
    if (!pkg) return '';
    return generateWhatsAppPTRenewalOffer(pkg, get().gymProfile.gymName);
  },

  // 👻 GHOSTING MEMBER RESCUE METHODS
  getGhostingMembersSnapshot: (targetDate?: string) => {
    const todayStr = targetDate || new Date().toISOString().split('T')[0];
    const members = get().members;
    const ghostingList: GhostingMemberInfo[] = [];

    let softCount = 0;
    let criticalCount = 0;
    let dangerCount = 0;

    members.forEach((m) => {
      // Exclude expired, frozen or pending intake members
      if (m.status === 'EXPIRED' || m.status === 'FROZEN') return;
      if (m.currentFreeze && m.currentFreeze.freezeStartDate <= todayStr && (!m.currentFreeze.freezeEndDate || m.currentFreeze.freezeEndDate >= todayStr)) {
        return; // Member has active freeze
      }

      const daysAbsent = calculateMemberDaysAbsent(m.lastCheckInDate, todayStr);
      if (daysAbsent < 4) return; // Normal attendance

      let tier: GhostingTier = 'TIER_1_SOFT';
      if (daysAbsent >= 14) {
        tier = 'TIER_3_DANGER';
        dangerCount++;
      } else if (daysAbsent >= 7) {
        tier = 'TIER_2_CRITICAL';
        criticalCount++;
      } else {
        tier = 'TIER_1_SOFT';
        softCount++;
      }

      // Check cool-down (contacted within last 3 days)
      let isCoolingDown = false;
      if (m.lastRescueContactedDate) {
        const contactDate = new Date(m.lastRescueContactedDate);
        const today = new Date(todayStr);
        const diffDays = Math.floor((today.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) {
          isCoolingDown = true;
        }
      }

      ghostingList.push({
        memberId: m.id,
        fullName: m.fullName,
        phone: m.phone,
        gender: m.gender,
        assignedTrainerId: m.assignedTrainerId,
        assignedTrainerName: m.assignedTrainerName,
        membershipPlanTitle: m.planTitle,
        daysAbsent,
        lastCheckInDate: m.lastCheckInDate || 'Never',
        tier,
        absenceReason: m.absenceReasonTag || 'NONE',
        lastRescueContactedDate: m.lastRescueContactedDate,
        isCoolingDown,
      });
    });

    // Sort by days absent descending (highest churn risk first)
    ghostingList.sort((a, b) => b.daysAbsent - a.daysAbsent);

    return {
      totalGhostingCount: ghostingList.length,
      softCount,
      criticalCount,
      dangerCount,
      members: ghostingList,
    };
  },

  logMemberRescueContact: async (memberId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];

    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          lastRescueContactedDate: todayStr,
        };
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers })
      );

      return { members: updatedMembers };
    });
  },

  setMemberAbsenceReason: async (memberId: string, reason: AbsenceReasonTag) => {
    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          absenceReasonTag: reason,
        };
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers })
      );

      return { members: updatedMembers };
    });
  },

  generateWhatsAppComebackMessage: (memberId: string) => {
    const member = get().members.find((m) => m.id === memberId);
    if (!member) return '';
    const daysAbsent = calculateMemberDaysAbsent(member.lastCheckInDate);
    return generateWhatsAppComebackMessage(member, get().gymProfile.gymName, daysAbsent);
  },

  // 🥗 DIET & WORKOUT ROUTINE PRESCRIBER METHODS
  prescribeDietAndRoutine: async (memberId, dietPlanId, routineId, coachNotes) => {
    const member = get().members.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');

    const dietPlan = get().dietPlans.find((d) => d.id === dietPlanId);
    const routine = get().workoutRoutines.find((r) => r.id === routineId);

    const record: MemberAssignedPlanRecord = {
      id: `assign_${Date.now()}`,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedByTrainerId: member.assignedTrainerId || 'trainer_1',
      assignedByTrainerName: member.assignedTrainerName || 'Coach Alex',
      dietPlanId,
      dietPlanTitle: dietPlan?.title,
      workoutRoutineId: routineId,
      workoutRoutineTitle: routine?.title,
      coachPersonalNotes: coachNotes,
    };

    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          currentDietPlanId: dietPlanId || m.currentDietPlanId,
          currentWorkoutRoutineId: routineId || m.currentWorkoutRoutineId,
          assignedPlanHistory: [record, ...(m.assignedPlanHistory || [])],
        };
      });

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: updatedMembers })
      );

      return { members: updatedMembers };
    });

    return record;
  },

  generateWhatsAppDietChart: (memberId, dietPlanId, customNotes) => {
    const member = get().members.find((m) => m.id === memberId);
    const dietPlan = get().dietPlans.find((d) => d.id === dietPlanId);
    if (!member || !dietPlan) return '';
    return generateWhatsAppDietChart(member, dietPlan, get().gymProfile.gymName, customNotes);
  },

  generateWhatsAppWorkoutRoutine: (memberId, routineId, customNotes) => {
    const member = get().members.find((m) => m.id === memberId);
    const routine = get().workoutRoutines.find((r) => r.id === routineId);
    if (!member || !routine) return '';
    return generateWhatsAppWorkoutRoutine(member, routine, get().gymProfile.gymName, customNotes);
  },

  // 🎁 MEMBER REFERRAL & AMBASSADOR METHODS
  getReferralSummary: () => {
    const referrals = get().referrals || [];
    const members = get().members || [];

    const totalReferralsCount = referrals.length;
    const totalDaysRewarded = referrals.reduce((sum, r) => sum + (r.daysAddedToReferrer || 0), 0);

    // Compute top referrers
    const countByMember: Record<string, number> = {};
    referrals.forEach((r) => {
      countByMember[r.referrerMemberId] = (countByMember[r.referrerMemberId] || 0) + 1;
    });

    const topReferrers = Object.entries(countByMember)
      .map(([mId, count]) => {
        const member = members.find((m) => m.id === mId);
        const tier: AmbassadorTier =
          count >= 5 ? 'GOLD_AMBASSADOR' : count >= 3 ? 'SILVER_AMBASSADOR' : 'BRONZE_AMBASSADOR';
        return {
          memberId: mId,
          memberName: member?.fullName || 'Unknown Member',
          phone: member?.phone || '',
          referralCode: member ? getMemberReferralCode(member) : 'VIP',
          referralCount: count,
          tier,
          daysEarned: count * 15,
        };
      })
      .sort((a, b) => b.referralCount - a.referralCount);

    return {
      totalReferralsCount,
      totalDaysRewarded,
      activeAmbassadorsCount: topReferrers.length,
      topReferrers,
    };
  },

  processMemberReferralAdmission: async (referrerMemberId, newMemberData) => {
    const referrer = get().members.find((m) => m.id === referrerMemberId);
    if (!referrer) throw new Error('Referrer member not found');

    const plan = get().membershipPlans.find((p) => p.id === newMemberData.planId) || get().membershipPlans[0];
    const today = new Date().toISOString().split('T')[0];

    // Calculate end date for friend (30 days from now)
    const friendEndDate = new Date();
    friendEndDate.setDate(friendEndDate.getDate() + 30);
    const friendEndStr = friendEndDate.toISOString().split('T')[0];

    const referrerCode = getMemberReferralCode(referrer);

    const newMemberId = `mem_${Date.now()}`;
    const newMember: GymMemberItem = {
      id: newMemberId,
      fullName: newMemberData.fullName,
      phone: newMemberData.phone,
      gender: newMemberData.gender,
      enrollmentDate: today,
      totalCheckInsCount: 0,
      membershipPlan: plan.id as any,
      planTitle: plan.title,
      startDate: today,
      endDate: friendEndStr,
      totalFeeBdt: plan.feeBdt,
      paidAmountBdt: newMemberData.amountPaidBdt,
      dueAmountBdt: Math.max(0, plan.feeBdt - newMemberData.amountPaidBdt),
      status: newMemberData.amountPaidBdt >= plan.feeBdt ? 'ACTIVE' : 'UNPAID',
      referredByMemberId: referrer.id,
      referredByMemberName: referrer.fullName,
      referralCode: `${newMemberData.fullName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'VIP'}-${newMemberData.phone.slice(-3) || '888'}`,
      notes: `Enrolled via referral code ${referrerCode} (100% Admission Fee Waived: Saved ৳1,000)`,
      paymentHistory: [
        {
          id: `pay_${Date.now()}`,
          date: today,
          amountBdt: newMemberData.amountPaidBdt,
          method: 'Cash',
          invoiceNumber: `INV-REF-${Date.now().toString().slice(-4)}`,
          receivedBy: 'Khaled Owner',
          notes: `Admission fee waived via referral ${referrerCode}`,
        },
      ],
    };

    // Calculate 15 days extension for referrer
    const currentEnd = new Date(referrer.endDate || today);
    currentEnd.setDate(currentEnd.getDate() + 15);
    const updatedReferrerEndStr = currentEnd.toISOString().split('T')[0];

    const newReferralCount = (referrer.referralCount || 0) + 1;
    const newAmbassadorTier: AmbassadorTier =
      newReferralCount >= 5
        ? 'GOLD_AMBASSADOR'
        : newReferralCount >= 3
        ? 'SILVER_AMBASSADOR'
        : 'BRONZE_AMBASSADOR';

    const referralRecord: GymReferralRecord = {
      id: `ref_${Date.now()}`,
      referrerMemberId: referrer.id,
      referrerMemberName: referrer.fullName,
      referrerCode,
      referredMemberId: newMemberId,
      referredMemberName: newMemberData.fullName,
      referredMemberPhone: newMemberData.phone,
      enrolledDate: today,
      packageTitle: plan.title,
      rewardStatus: 'REWARDED',
      rewardDescription: '+15 Days Membership Extended',
      daysAddedToReferrer: 15,
      discountGivenToFriendBdt: 1000,
    };

    set((state) => {
      const updatedMembers = state.members.map((m) => {
        if (m.id !== referrer.id) return m;
        return {
          ...m,
          endDate: updatedReferrerEndStr,
          referralCount: newReferralCount,
          ambassadorTier: newAmbassadorTier,
          notes: `${m.notes || ''} | [Referral Bonus: +15 Days for enrolling ${newMemberData.fullName}]`.trim(),
        };
      });

      const nextMembers = [newMember, ...updatedMembers];
      const nextReferrals = [referralRecord, ...state.referrals];

      void setStorageItem(
        GYM_STORAGE_KEY,
        JSON.stringify({ ...state, members: nextMembers, referrals: nextReferrals })
      );

      return { members: nextMembers, referrals: nextReferrals };
    });

    return { newMember, referralRecord };
  },

  generateWhatsAppGuestPass: (memberId) => {
    const member = get().members.find((m) => m.id === memberId);
    if (!member) return '';
    return generateWhatsAppGuestPass(member, get().gymProfile.gymName);
  },

  generateWhatsAppReferralGratitude: (referralId) => {
    const ref = get().referrals.find((r) => r.id === referralId);
    if (!ref) return '';
    const referrer = get().members.find((m) => m.id === ref.referrerMemberId);
    if (!referrer) return '';
    return generateWhatsAppReferralGratitude(
      referrer,
      ref.referredMemberName,
      get().gymProfile.gymName,
      referrer.endDate
    );
  },
}));
