// ─────────────────────────────────────────────────────────────────────────────
// services/blood-network-service.ts
// Emergency Blood Response Network — Compatibility Engine & Utilities
//
// ⚠️  LOCAL PROTOTYPE MODE
// This service operates on local in-memory data only.
// No cross-device sync. No real donor notification in this phase.
// Production: React Native -> Blood Network REST API -> Backend -> MongoDB
// ─────────────────────────────────────────────────────────────────────────────

import { BloodGroup } from '@/types/health-vault';
import {
  BloodComponent,
  BloodCircleContact,
  BloodRequest,
  DonorAvailabilityStatus,
  EmergencyLevel,
  EMERGENCY_EXPIRY_HOURS,
  RankedDonorResult,
  SosWave,
  SosWaveStatus,
} from '@/types/blood-network';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ABO/Rh Red-Cell Compatibility Reference
//
// Source: Standard transfusion medicine ABO/Rh compatibility for red blood cells.
// This table applies ONLY to Packed RBC (PACKED_RBC) component.
//
// IMPORTANT: "Potentially compatible" is NOT a guarantee of transfusion safety.
// Final compatibility must always be confirmed by blood bank crossmatching and
// clinical assessment. This app NEVER claims to determine transfusion safety.
// ─────────────────────────────────────────────────────────────────────────────
const RBC_COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
  // UNKNOWN: cannot be matched
  'UNKNOWN': [],
};

const ELIGIBILITY_DISCLAIMER =
  'Eligibility must be confirmed by a blood bank or medical professional. ' +
  'This is an estimated indicator only.';

const COMPATIBILITY_DISCLAIMER =
  'These are potentially compatible donors based on ABO/Rh red-cell reference data. ' +
  'Final transfusion compatibility must be confirmed by blood bank crossmatching and clinical assessment.';

// ─────────────────────────────────────────────────────────────────────────────
// 2. getPotentiallyCompatibleDonors
//    Component-aware entry point. Returns compatible BloodGroups or a
//    'CONSULT_BLOOD_BANK' signal for components with different matching rules.
// ─────────────────────────────────────────────────────────────────────────────
export function getPotentiallyCompatibleDonors(
  recipientGroup: BloodGroup,
  component: BloodComponent,
): { groups: BloodGroup[]; disclaimer: string; consultBloodBank: boolean } {
  if (component === 'PACKED_RBC') {
    return {
      groups: RBC_COMPATIBILITY_MAP[recipientGroup] ?? [],
      disclaimer: COMPATIBILITY_DISCLAIMER,
      consultBloodBank: false,
    };
  }

  if (component === 'WHOLE_BLOOD') {
    // Whole blood involves plasma compatibility in addition to red cells.
    // We surface the RBC table as a starting point but require blood bank guidance.
    return {
      groups: RBC_COMPATIBILITY_MAP[recipientGroup] ?? [],
      disclaimer:
        'Whole blood compatibility involves plasma considerations in addition to red cells. ' +
        'These donors are potentially compatible for red-cell component only. ' +
        'Blood bank guidance is required before any transfusion. ' +
        COMPATIBILITY_DISCLAIMER,
      consultBloodBank: false, // show list but with strong warning
    };
  }

  // PLASMA, PLATELETS, CRYOPRECIPITATE — different compatibility models.
  // This app cannot determine compatibility for these components.
  return {
    groups: [],
    disclaimer:
      'Component-specific compatibility for ' +
      component +
      ' requires blood bank guidance. ' +
      'This app cannot suggest potentially compatible donors for this blood component.',
    consultBloodBank: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. calculateEligibilityEstimate
//    Returns an ESTIMATED eligibility indicator based on days since last donation.
//    This is NOT a medical clearance. Blood bank must always confirm eligibility.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_COOLDOWN_DAYS: Record<BloodComponent, number> = {
  PACKED_RBC: 90,     // Common reference minimum — varies by region & health
  WHOLE_BLOOD: 90,
  PLASMA: 28,
  PLATELETS: 14,
  CRYOPRECIPITATE: 90,
};

export function calculateEligibilityEstimate(
  lastDonationDate: string | undefined,
  component: BloodComponent,
): {
  daysSinceLastDonation: number | null;
  isEstimatedEligible: boolean;
  estimatedDaysRemaining: number;
  disclaimer: string;
} {
  if (!lastDonationDate) {
    return {
      daysSinceLastDonation: null,
      isEstimatedEligible: true, // No known recent donation
      estimatedDaysRemaining: 0,
      disclaimer: ELIGIBILITY_DISCLAIMER,
    };
  }

  const last = new Date(lastDonationDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  const cooldown = DEFAULT_COOLDOWN_DAYS[component] ?? 90;
  const remaining = Math.max(0, cooldown - daysSince);

  return {
    daysSinceLastDonation: daysSince,
    isEstimatedEligible: daysSince >= cooldown,
    estimatedDaysRemaining: remaining,
    disclaimer: ELIGIBILITY_DISCLAIMER,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. rankDonors
//    Sorts circle members by suitability for a blood request.
//    Priority: Compatibility → Availability → Relationship → Estimated Eligibility
//    Eligibility is an INDICATOR weight — never a hard exclusion filter.
// ─────────────────────────────────────────────────────────────────────────────
const AVAILABILITY_SCORE: Record<DonorAvailabilityStatus, number> = {
  AVAILABLE: 40,
  MAYBE: 25,
  DO_NOT_DISTURB: 10,
  UNAVAILABLE: 0,
};

const RELATIONSHIP_SCORE: Record<string, number> = {
  SELF: 0,
  FATHER: 20,
  MOTHER: 20,
  SPOUSE: 20,
  SIBLING: 18,
  CHILD: 15,
  OTHER: 10,
  FRIEND: 12,
  COLLEAGUE: 8,
  TRUSTED_CONTACT: 10,
};

export function rankDonors(
  circle: BloodCircleContact[],
  request: Pick<BloodRequest, 'bloodGroup' | 'component'>,
): RankedDonorResult[] {
  const { groups: compatibleGroups, disclaimer, consultBloodBank } =
    getPotentiallyCompatibleDonors(request.bloodGroup, request.component);

  const results: RankedDonorResult[] = [];

  for (const contact of circle) {
    if (!contact.isDonor || !contact.donorProfile) continue;

    const { donorProfile } = contact;
    const isCompatible =
      !consultBloodBank && compatibleGroups.includes(donorProfile.bloodGroup);

    const eligibility = calculateEligibilityEstimate(
      donorProfile.lastDonationDate,
      request.component,
    );

    const compatibilityNote: RankedDonorResult['compatibilityNote'] = consultBloodBank
      ? 'CONSULT_BLOOD_BANK'
      : 'POTENTIALLY_COMPATIBLE';

    // Score: compatible=50pts, availability up to 40pts, relationship up to 20pts,
    //        estimated eligible=10pts (indicator only — never hard filter)
    const score =
      (isCompatible ? 50 : 0) +
      (AVAILABILITY_SCORE[donorProfile.availabilityStatus] ?? 0) +
      (RELATIONSHIP_SCORE[contact.relationship] ?? 8) +
      (eligibility.isEstimatedEligible ? 10 : 0);

    results.push({
      contact,
      compatibilityNote,
      isEstimatedEligible: eligibility.isEstimatedEligible,
      eligibilityDisclaimer: ELIGIBILITY_DISCLAIMER,
      rankScore: score,
    });
  }

  // Sort descending by score. UNAVAILABLE donors still appear — at the bottom.
  return results.sort((a, b) => b.rankScore - a.rankScore);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. buildSosShareMessage
//    Pre-filled WhatsApp-shareable emergency SOS text.
//    Never claims compatibility — uses "potentially compatible" language.
// ─────────────────────────────────────────────────────────────────────────────
export function buildSosShareMessage(request: BloodRequest): string {
  const levelEmoji =
    request.emergencyLevel === 'CRITICAL'
      ? '🔴'
      : request.emergencyLevel === 'URGENT'
      ? '🟡'
      : '🟢';

  return [
    `🚨 EMERGENCY BLOOD REQUEST`,
    ``,
    `${levelEmoji} ${request.emergencyLevel} — ${request.bloodGroup} Blood Needed`,
    `Patient: ${request.patientName}`,
    `Units Required: ${request.unitsRequired}`,
    `Component: ${request.component.replace('_', ' ')}`,
    `Hospital: ${request.hospitalName}`,
    request.hospitalAddress ? `Location: ${request.hospitalAddress}` : '',
    `Needed by: ${new Date(request.neededBy).toLocaleString()}`,
    ``,
    `Contact Person: ${request.contactPerson}`,
    `Phone: ${request.contactPhone}`,
    ``,
    `If you may be able to help, please contact the person above directly.`,
    `⚠️ Please confirm your eligibility with the blood bank or hospital before donating.`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. createInitialSosWaves
//    Builds the tiered wave structure for a new SOS broadcast.
//    Tier 4 (Community) is Phase 2 — created as PENDING but never activated in MVP.
// ─────────────────────────────────────────────────────────────────────────────
export function createInitialSosWaves(): SosWave[] {
  const tiers: Array<{ tier: 1 | 2 | 3 | 4; label: string; status: SosWaveStatus }> = [
    { tier: 1, label: 'Family', status: 'ACTIVE' },        // Fires immediately
    { tier: 2, label: 'Friends', status: 'PENDING' },
    { tier: 3, label: 'Trusted Network', status: 'PENDING' },
    { tier: 4, label: 'Community (Phase 2)', status: 'PENDING' },
  ];

  const now = new Date().toISOString();

  return tiers.map((t) => ({
    id: `wave_${t.tier}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tier: t.tier,
    label: t.label,
    status: t.status,
    startedAt: now,
    notifiedCount: t.tier === 1 ? 0 : 0,
    viewedCount: 0,
    acceptedCount: 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. computeExpiresAt
//    Auto-calculates expiresAt ISO string from emergencyLevel.
// ─────────────────────────────────────────────────────────────────────────────
export function computeExpiresAt(level: EmergencyLevel): string {
  const hours = EMERGENCY_EXPIRY_HOURS[level];
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry.toISOString();
}
