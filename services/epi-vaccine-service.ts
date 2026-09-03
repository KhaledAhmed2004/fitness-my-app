import {
  BANGLADESH_EPI_CHILD_SCHEDULE,
  ELDERLY_ADULT_SCHEDULE,
  ElderlyVaccineItem,
  EpiMilestone,
} from '@/services/epi-vaccine-knowledge';
import { Vaccination } from '@/types/health-vault';

export type VaccineDueStatus = 'COMPLETED' | 'DUE_TODAY' | 'UPCOMING' | 'OVERDUE';

export interface ChildScheduledVaccine {
  code: string;
  nameEn: string;
  nameBn: string;
  diseaseEn: string;
  diseaseBn: string;
  routeBn: string;
  doseCountText: string;
  criticalNotesBn: string;
  scheduledDateStr: string;
  status: VaccineDueStatus;
  statusTextBn: string;
  daysDifference: number; // >0 means upcoming in X days, <0 means overdue by X days, 0 = today
  isCompleted: boolean;
  completedDate?: string;
  completedProvider?: string;
  batchNumber?: string;
  vaccinationRecordId?: string;
}

export interface ChildEpiMilestoneView {
  milestoneId: string;
  milestoneAgeDays: number;
  milestoneLabelEn: string;
  milestoneLabelBn: string;
  descriptionBn: string;
  scheduledDateStr: string;
  milestoneStatus: VaccineDueStatus;
  milestoneStatusTextBn: string;
  vaccines: ChildScheduledVaccine[];
  allCompleted: boolean;
}

export interface ElderlyVaccineView {
  item: ElderlyVaccineItem;
  isCompleted: boolean;
  lastTakenDate?: string;
  nextDueDate?: string;
  status: VaccineDueStatus;
  statusTextBn: string;
  vaccinationRecordId?: string;
}

export interface EpiScheduleReport {
  childName: string;
  dobStr: string;
  milestones: ChildEpiMilestoneView[];
  totalDosesCount: number;
  completedDosesCount: number;
  pendingDosesCount: number;
  overdueDosesCount: number;
  adherencePercentage: number;
  nextUpcomingVaccine?: ChildScheduledVaccine;
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getDaysDifference(targetDateStr: string): number {
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function generateChildEpiSchedule(
  childName: string,
  dobStr: string,
  existingVaccinations: Vaccination[] = []
): EpiScheduleReport {
  let totalDoses = 0;
  let completedDoses = 0;
  let overdueDoses = 0;
  let pendingDoses = 0;
  let nextUpcoming: ChildScheduledVaccine | undefined;

  const milestones: ChildEpiMilestoneView[] = BANGLADESH_EPI_CHILD_SCHEDULE.map(
    (milestone) => {
      const scheduledDateStr = addDaysToDate(dobStr, milestone.milestoneAgeDays);
      const daysDiff = getDaysDifference(scheduledDateStr);

      const mappedVaccines: ChildScheduledVaccine[] = milestone.vaccines.map(
        (vac) => {
          totalDoses += 1;

          // Check if user has an existing vaccination matching this code or name
          const match = existingVaccinations.find(
            (v) =>
              v.vaccineName.toLowerCase().includes(vac.code.toLowerCase()) ||
              v.vaccineName.toLowerCase().includes(vac.nameEn.toLowerCase()) ||
              v.vaccineName.toLowerCase().includes(vac.nameBn.toLowerCase())
          );

          const isCompleted = !!match;
          let status: VaccineDueStatus;
          let statusTextBn: string;

          if (isCompleted) {
            completedDoses += 1;
            status = 'COMPLETED';
            statusTextBn = `✅ সম্পন্ন (${match.vaccinationDate})`;
          } else if (daysDiff < 0) {
            overdueDoses += 1;
            status = 'OVERDUE';
            statusTextBn = `⚠️ ${Math.abs(daysDiff)} দিন পার হয়ে গেছে (Pending)`;
          } else if (daysDiff === 0) {
            pendingDoses += 1;
            status = 'DUE_TODAY';
            statusTextBn = '🚨 আজকেই দেওয়ার নির্ধারিত দিন';
          } else {
            pendingDoses += 1;
            status = 'UPCOMING';
            statusTextBn = `⏳ আর ${daysDiff} দিন বাকি (${scheduledDateStr})`;
          }

          const scheduledVac: ChildScheduledVaccine = {
            ...vac,
            scheduledDateStr,
            status,
            statusTextBn,
            daysDifference: daysDiff,
            isCompleted,
            completedDate: match?.vaccinationDate,
            completedProvider: match?.providerName,
            batchNumber: match?.batchNumber,
            vaccinationRecordId: match?.id,
          };

          if (!isCompleted && !nextUpcoming && daysDiff >= 0) {
            nextUpcoming = scheduledVac;
          }

          return scheduledVac;
        }
      );

      const allCompleted = mappedVaccines.every((v) => v.isCompleted);
      let milestoneStatus: VaccineDueStatus = 'UPCOMING';
      let milestoneStatusTextBn = 'আসন্ন';

      if (allCompleted) {
        milestoneStatus = 'COMPLETED';
        milestoneStatusTextBn = 'সম্পূর্ণ সম্পন্ন';
      } else if (mappedVaccines.some((v) => v.status === 'OVERDUE')) {
        milestoneStatus = 'OVERDUE';
        milestoneStatusTextBn = 'অপেক্ষমান (Overdue)';
      } else if (mappedVaccines.some((v) => v.status === 'DUE_TODAY')) {
        milestoneStatus = 'DUE_TODAY';
        milestoneStatusTextBn = 'আজকের শিডিউল';
      }

      return {
        milestoneId: milestone.id,
        milestoneAgeDays: milestone.milestoneAgeDays,
        milestoneLabelEn: milestone.milestoneLabelEn,
        milestoneLabelBn: milestone.milestoneLabelBn,
        descriptionBn: milestone.descriptionBn,
        scheduledDateStr,
        milestoneStatus,
        milestoneStatusTextBn,
        vaccines: mappedVaccines,
        allCompleted,
      };
    }
  );

  const adherencePercentage =
    totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 0;

  return {
    childName,
    dobStr,
    milestones,
    totalDosesCount: totalDoses,
    completedDosesCount: completedDoses,
    pendingDosesCount: pendingDoses,
    overdueDosesCount: overdueDoses,
    adherencePercentage,
    nextUpcomingVaccine: nextUpcoming,
  };
}

export function generateElderlyVaccineSchedule(
  existingVaccinations: Vaccination[] = []
): ElderlyVaccineView[] {
  return ELDERLY_ADULT_SCHEDULE.map((item) => {
    const match = existingVaccinations.find(
      (v) =>
        v.vaccineName.toLowerCase().includes(item.code.toLowerCase()) ||
        v.vaccineName.toLowerCase().includes(item.nameEn.toLowerCase()) ||
        v.vaccineName.toLowerCase().includes(item.nameBn.toLowerCase())
    );

    const isCompleted = !!match;
    let status: VaccineDueStatus = 'UPCOMING';
    let statusTextBn = 'পরামর্শ দেওয়া হয়েছে (প্রয়োজনীয়)';

    if (isCompleted) {
      status = 'COMPLETED';
      statusTextBn = `✅ গ্রহণ করা হয়েছে (${match.vaccinationDate})`;
    }

    return {
      item,
      isCompleted,
      lastTakenDate: match?.vaccinationDate,
      nextDueDate: match?.nextDueDate,
      status,
      statusTextBn,
      vaccinationRecordId: match?.id,
    };
  });
}
