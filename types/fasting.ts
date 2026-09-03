/**
 * MENTOR: Client types aligned with backend /api/v1/fasting payloads.
 */

export const FASTING_PROTOCOLS = ['16:8', '18:6', '20:4', 'OMAD', 'CUSTOM'] as const;
export type FastingProtocol = (typeof FASTING_PROTOCOLS)[number];

/** Fallback chips when GET /protocols is loading or fails. CUSTOM stays out of UI this pass. */
export const SELECTABLE_PROTOCOLS: Exclude<FastingProtocol, 'CUSTOM'>[] = [
  '16:8',
  '18:6',
  '20:4',
  'OMAD',
];

export const PROTOCOL_HOURS: Record<
  Exclude<FastingProtocol, 'CUSTOM'>,
  { fastingHours: number; eatingHours: number }
> = {
  '16:8': { fastingHours: 16, eatingHours: 8 },
  '18:6': { fastingHours: 18, eatingHours: 6 },
  '20:4': { fastingHours: 20, eatingHours: 4 },
  OMAD: { fastingHours: 23, eatingHours: 1 },
};

/** GET /api/v1/fasting/protocols item */
export type FastingProtocolPreset = {
  code: FastingProtocol;
  fastingHours: number | null;
  eatingHours: number | null;
};

/** Chip-ready preset (CUSTOM filtered out until custom UI ships). */
export type SelectableProtocolPreset = {
  code: Exclude<FastingProtocol, 'CUSTOM'>;
  fastingHours: number;
  eatingHours: number;
};

export type FastingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type FastingEndReason = 'MANUAL' | 'CANCELLED';

export type FastingPreference = {
  id: string;
  protocol: FastingProtocol;
  fastingHours: number;
  eatingHours: number;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FastingSessionStatus = {
  sessionId: string;
  protocol: FastingProtocol;
  status: FastingStatus;
  startedAt: string;
  endedAt: string | null;
  endReason?: FastingEndReason;
  timezone?: string;
  targetMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  progressPercent: number;
  goalMet: boolean;
};

export type FastingHistoryPage = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: FastingSessionStatus[];
};

export type StartFastingInput = {
  protocol?: FastingProtocol;
  fastingHours?: number;
  eatingHours?: number;
  timezone?: string;
  startedAt?: string;
};

export type UpdatePreferenceInput = {
  protocol: FastingProtocol;
  fastingHours?: number;
  eatingHours?: number;
  timezone?: string;
};
