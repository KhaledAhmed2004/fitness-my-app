// ─────────────────────────────────────────────────────────────────────────────
// types/blood-network.ts
// Emergency Blood Response Network — Domain Model
// ─────────────────────────────────────────────────────────────────────────────

import { BloodGroup, FamilyRelation } from './health-vault';

// ─── Blood Component ──────────────────────────────────────────────────────────
// MVP default: PACKED_RBC (ABO/Rh RBC compatibility rules apply).
// WHOLE_BLOOD: shows clinical note — plasma involvement requires blood bank guidance.
// PLASMA | PLATELETS | CRYOPRECIPITATE: compatibility cannot be determined by this app.
export type BloodComponent =
  | 'PACKED_RBC'
  | 'WHOLE_BLOOD'
  | 'PLASMA'
  | 'PLATELETS'
  | 'CRYOPRECIPITATE';

export const BLOOD_COMPONENT_LABELS: Record<BloodComponent, string> = {
  PACKED_RBC: 'Packed RBC',
  WHOLE_BLOOD: 'Whole Blood',
  PLASMA: 'Plasma',
  PLATELETS: 'Platelets',
  CRYOPRECIPITATE: 'Cryoprecipitate',
};

// ─── Emergency Level ──────────────────────────────────────────────────────────
export type EmergencyLevel = 'NORMAL' | 'URGENT' | 'CRITICAL';

export const EMERGENCY_EXPIRY_HOURS: Record<EmergencyLevel, number> = {
  NORMAL: 72,
  URGENT: 24,
  CRITICAL: 6,
};

// ─── Donor Availability ───────────────────────────────────────────────────────
export type DonorAvailabilityStatus =
  | 'AVAILABLE'
  | 'MAYBE'
  | 'UNAVAILABLE'
  | 'DO_NOT_DISTURB';

// ─── Location (privacy-layered) ───────────────────────────────────────────────
// Exact address is NEVER shared. Only approximate distance is shown.
export interface LocationSharing {
  visibility: 'NONE' | 'APPROXIMATE' | 'TEMPORARY_LIVE';
  distanceKm?: number;
  expiresAt?: string;
}

// ─── Donation History Entry ───────────────────────────────────────────────────
// Source: always donor self-report in Phase 1 prototype.
// Display label: "Donation reported by donor — not clinically confirmed"
export interface DonationHistoryEntry {
  id: string;
  donationDate: string;
  component: BloodComponent;
  hospitalOrBloodBank?: string;
  requestId?: string;
}

// ─── Donor Profile ────────────────────────────────────────────────────────────
export interface DonorProfile {
  bloodGroup: BloodGroup;
  availabilityStatus: DonorAvailabilityStatus;
  lastDonationDate?: string;
  donationHistory: DonationHistoryEntry[];
  location?: LocationSharing;
  cooldownEstimateDays?: number;
}

// ─── Blood Circle Contact ─────────────────────────────────────────────────────
export type CircleRelationship =
  | FamilyRelation
  | 'FRIEND'
  | 'COLLEAGUE'
  | 'TRUSTED_CONTACT';

export interface BloodCircleContact {
  id: string;
  name: string;
  relationship: CircleRelationship;
  phone: string;
  phoneVisibility: 'ALWAYS' | 'ON_REQUEST';
  isDonor: boolean;
  donorProfile?: DonorProfile;
  createdAt: string;
}

// ─── Hospital Verification (auditable, not a boolean) ────────────────────────
export interface HospitalVerification {
  status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  verifiedBy?: string;
  method?: string;
}

// ─── Blood Request Status Machine ─────────────────────────────────────────────
// DRAFT -> SUBMITTED -> MATCHING -> SOS_ACTIVE -> DONOR_RESPONDING
//                                                  -> FULFILLED | CANCELLED | EXPIRED | NO_RESPONSE
export type BloodRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MATCHING'
  | 'SOS_ACTIVE'
  | 'DONOR_RESPONDING'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_RESPONSE';

// ─── SOS Wave ────────────────────────────────────────────────────────────────
// Tier 1=Family, 2=Friends, 3=Trusted, 4=Community(Phase2)
// PENDING -> ACTIVE -> COMPLETED | CANCELLED
export type SosWaveStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface SosWave {
  id: string;
  tier: 1 | 2 | 3 | 4;
  label: string;
  status: SosWaveStatus;
  startedAt: string;
  endedAt?: string;
  notifiedCount: number;
  viewedCount: number;
  acceptedCount: number;
}

// ─── Donor Response Status Machine ───────────────────────────────────────────
// PENDING -> VIEWED -> ACCEPTED -> ON_THE_WAY -> ARRIVED -> DONATION_REPORTED
//                   -> DECLINED
//                   -> NO_RESPONSE
// DONATION_REPORTED = self-reported by donor, not clinically confirmed.
export type DonorResponseStatus =
  | 'PENDING'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'DONATION_REPORTED'
  | 'NO_RESPONSE';

export interface DonorResponse {
  donorId: string;
  donorName: string;
  donorBloodGroup?: BloodGroup;
  status: DonorResponseStatus;
  respondedAt?: string;
  estimatedArrivalMin?: number;
  location?: LocationSharing;
}

// ─── Blood Request ────────────────────────────────────────────────────────────
export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequired: number;
  emergencyLevel: EmergencyLevel;
  neededBy: string;
  hospitalName: string;
  hospitalAddress?: string;
  contactPerson: string;
  contactPhone: string;
  hospitalVerification: HospitalVerification;
  status: BloodRequestStatus;
  createdAt: string;
  expiresAt: string;
  sosWaves: SosWave[];
  donorResponses: DonorResponse[];
  cancelledAt?: string;
  cancelledReason?: string;
  fulfilledAt?: string;
}

// ─── Ranked Donor Result ──────────────────────────────────────────────────────
export interface RankedDonorResult {
  contact: BloodCircleContact;
  compatibilityNote: 'POTENTIALLY_COMPATIBLE' | 'CONSULT_BLOOD_BANK';
  isEstimatedEligible: boolean;
  eligibilityDisclaimer: string;
  rankScore: number;
}
