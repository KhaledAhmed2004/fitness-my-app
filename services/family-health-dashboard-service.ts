import {
  DiagnosticTest,
  FamilyMember,
  FollowUp,
  HealthCondition,
  LabResultEntry,
  MedicalEvent,
} from '@/types/health-vault';
import {
  FamilyMemberHealthCard,
  UpcomingFamilyHealthEvent,
} from '@/types/family-health-dashboard';

const RELATION_BN_MAP: Record<string, string> = {
  SELF: 'নিজ (Self)',
  SPOUSE: 'স্ত্রী/স্বামী (Spouse)',
  FATHER: 'বাবা (Father)',
  MOTHER: 'মা (Mother)',
  CHILD: 'সন্তান (Child)',
  SIBLING: 'ভাই/বোন (Sibling)',
  OTHER: 'অন্যান্য (Other)',
};

const MEMBER_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

/**
 * Calculate age from dateOfBirth string (YYYY-MM-DD)
 */
function calculateAge(dob?: string): number | undefined {
  if (!dob) return undefined;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return undefined;
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Build consolidated summary cards for all family members
 */
export function buildFamilyHealthCards(
  members: FamilyMember[],
  events: MedicalEvent[],
  conditions: HealthCondition[],
  labResults: LabResultEntry[],
  diagnosticTests?: DiagnosticTest[],
  followUps?: FollowUp[]
): FamilyMemberHealthCard[] {
  return members.map((m, idx) => {
    const memberEvents = events.filter((e) => e.memberId === m.id);
    const memberConditions = conditions.filter((c) => c.memberId === m.id && c.status === 'ACTIVE');
    const memberLabs = labResults.filter((l) => l.memberId === m.id);
    const memberTests = (diagnosticTests || []).filter(
      (t) => t.memberId === m.id && t.status === 'PENDING'
    );
    const memberFollowUps = (followUps || []).filter(
      (f) => f.memberId === m.id && (f.status === 'UPCOMING' || f.status === 'DUE')
    );

    // Calculate total prescribed active meds from events
    const allMedicines = memberEvents.flatMap((e) => e.prescribedMedicines || []);
    const uniqueMedNames = Array.from(new Set(allMedicines.map((med) => med.name)));

    // Calculate last doctor visit
    const sortedVisits = memberEvents
      .filter((e) => e.eventDate)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    const lastVisit = sortedVisits[0]?.eventDate;

    const needsAttention =
      uniqueMedNames.length >= 5 ||
      memberTests.length > 0 ||
      memberConditions.length > 0 ||
      memberFollowUps.length > 0;

    let attentionReason = '';
    if (uniqueMedNames.length >= 5) {
      attentionReason = `পলিফার্মাসি সতর্কতা (${uniqueMedNames.length}টি নিয়মিত ওষুধ)`;
    } else if (memberTests.length > 0) {
      attentionReason = `${memberTests.length}টি ল্যাব টেস্ট পেন্ডিং আছে`;
    } else if (memberFollowUps.length > 0) {
      attentionReason = `${memberFollowUps.length}টি ফলো-আপ ভিজিট আসন্ন`;
    } else if (memberConditions.length > 0) {
      attentionReason = `${memberConditions.map((c) => c.conditionName).join(', ')} নিয়মিত মনিটরিং প্রয়োজন`;
    }

    return {
      memberId: m.id,
      name: m.name,
      relationBn: RELATION_BN_MAP[m.relation] || m.relation,
      age: calculateAge(m.dateOfBirth),
      bloodGroup: m.bloodGroup,
      activeConditionsCount: memberConditions.length,
      activeMedicationsCount: uniqueMedNames.length,
      lastDoctorVisitDate: lastVisit,
      pendingLabReportsCount: memberLabs.length,
      needsAttention,
      attentionReasonBn: attentionReason || undefined,
      accentColor: m.avatarColor || MEMBER_COLORS[idx % MEMBER_COLORS.length],
    };
  });
}

/**
 * Generate upcoming health events timeline for family
 */
export function getUpcomingFamilyEvents(
  members: FamilyMember[],
  events: MedicalEvent[],
  diagnosticTests?: DiagnosticTest[],
  followUps?: FollowUp[]
): UpcomingFamilyHealthEvent[] {
  const result: UpcomingFamilyHealthEvent[] = [];

  // Diagnostic tests pending
  (diagnosticTests || []).forEach((t, i) => {
    const member = members.find((m) => m.id === t.memberId) || members[0];
    const isOverdue = t.testDate ? new Date(t.testDate).getTime() < Date.now() : false;
    result.push({
      id: t.id || `test_${i}`,
      memberId: member.id,
      memberName: member.name,
      memberRelationBn: RELATION_BN_MAP[member.relation] || member.relation,
      titleBn: `ল্যাব টেস্ট: ${t.testName}`,
      eventType: 'LAB_TEST',
      dueDateStr: t.testDate || 'আসন্ন',
      accentColor: '#3B82F6',
      isOverdue,
    });
  });

  // Upcoming follow-up doctor visits
  (followUps || []).forEach((f, i) => {
    const member = members.find((m) => m.id === f.memberId) || members[0];
    const isOverdue = f.dueDate ? new Date(f.dueDate).getTime() < Date.now() : false;
    result.push({
      id: f.id || `followup_${i}`,
      memberId: member.id,
      memberName: member.name,
      memberRelationBn: RELATION_BN_MAP[member.relation] || member.relation,
      titleBn: `ডাক্তার ভিজিট: ${f.doctorName || f.reason}`,
      eventType: 'DOCTOR_VISIT',
      dueDateStr: f.dueDate,
      accentColor: '#10B981',
      isOverdue,
    });
  });

  return result;
}

/**
 * Format weekly family health status summary for WhatsApp
 */
export function formatFamilyWeeklySummary(
  cards: FamilyMemberHealthCard[],
  upcomingEvents: UpcomingFamilyHealthEvent[]
): string {
  const dateStr = new Date().toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let text = `👨‍👩‍👧‍👦 *পারিবারিক সাপ্তাহিক স্বাস্থ্য বুলেটিন (Family Health Status)*\n`;
  text += `📅 তারিখ: ${dateStr}\n`;
  text += `📱 TrackMe Health Vault Platform\n\n`;

  text += `👥 *সদস্যদের স্বাস্থ্য পরিস্থিতি:*\n`;
  cards.forEach((c) => {
    text += `\n📌 *${c.name} (${c.relationBn})*`;
    if (c.bloodGroup) text += ` [রক্ত: ${c.bloodGroup}]`;
    text += `\n`;
    text += `  • নিয়মিত ওষুধ: ${c.activeMedicationsCount} টি\n`;
    text += `  • দীর্ঘস্থায়ী রোগ: ${c.activeConditionsCount} টি\n`;
    if (c.lastDoctorVisitDate) {
      text += `  • শেষ ডাক্তার ভিজিট: ${c.lastDoctorVisitDate}\n`;
    }
    if (c.needsAttention && c.attentionReasonBn) {
      text += `  • ⚠️ সতর্কতা: ${c.attentionReasonBn}\n`;
    }
  });

  text += `\n📅 *আসন্ন স্বাস্থ্য অ্যাপয়েন্টমেন্ট ও টেস্ট:*\n`;
  if (upcomingEvents.length === 0) {
    text += `  • কোনো আসন্ন টেস্ট বা ডাক্তার ভিজিট নেই।\n`;
  } else {
    upcomingEvents.forEach((ev) => {
      text += `  • ${ev.memberName} (${ev.memberRelationBn}): ${ev.titleBn} - ${ev.dueDateStr}\n`;
    });
  }

  text += `\n❤️ _পরিবারের সকলের নিয়মিত ওষুধ খাওয়া ও পর্যাপ্ত পানি পানের খেয়াল রাখুন।_`;

  return text;
}
