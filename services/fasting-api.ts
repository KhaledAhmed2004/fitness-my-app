/**
 * Fasting Service — with full offline / standalone local mock engine.
 */

import { DEMO_FASTING_HISTORY } from '@/constants/demo-fasting-history';
import { apiRequest } from '@/services/api-client';
import type {
  FastingHistoryPage,
  FastingPreference,
  FastingProtocol,
  FastingProtocolPreset,
  FastingSessionStatus,
  SelectableProtocolPreset,
  StartFastingInput,
  UpdatePreferenceInput,
} from '@/types/fasting';
import { PROTOCOL_HOURS, SELECTABLE_PROTOCOLS } from '@/types/fasting';

let localPreference: FastingPreference = {
  id: 'pref_local_1',
  protocol: '16:8',
  fastingHours: 16,
  eatingHours: 8,
  timezone: 'UTC',
};

// Initial active fast started 4 hours ago for demo
let localActiveFast: FastingSessionStatus | null = {
  sessionId: 'fast_active_1',
  protocol: '16:8',
  status: 'ACTIVE',
  startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  endedAt: null,
  targetMinutes: 16 * 60,
  elapsedMinutes: 4 * 60,
  remainingMinutes: 12 * 60,
  progressPercent: 25,
  goalMet: false,
};

let localHistory: FastingSessionStatus[] = [...DEMO_FASTING_HISTORY];

function getProtocolHours(protocol?: FastingProtocol): { fastingHours: number; eatingHours: number } {
  if (protocol && protocol !== 'CUSTOM' && PROTOCOL_HOURS[protocol]) {
    return PROTOCOL_HOURS[protocol];
  }
  return { fastingHours: 16, eatingHours: 8 };
}

function calculateLocalProgress(startedAt: string, targetHours: number): {
  elapsedMinutes: number;
  remainingMinutes: number;
  progressPercent: number;
  goalMet: boolean;
} {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.max(0, Math.floor((now - start) / (1000 * 60)));
  const targetMinutes = targetHours * 60;
  const remainingMinutes = Math.max(0, targetMinutes - elapsedMinutes);
  const progressPercent = Math.min(100, Math.round((elapsedMinutes / targetMinutes) * 100));
  const goalMet = elapsedMinutes >= targetMinutes;

  return { elapsedMinutes, remainingMinutes, progressPercent, goalMet };
}

export function fallbackSelectableProtocols(): SelectableProtocolPreset[] {
  return SELECTABLE_PROTOCOLS.map((code) => ({
    code,
    fastingHours: PROTOCOL_HOURS[code].fastingHours,
    eatingHours: PROTOCOL_HOURS[code].eatingHours,
  }));
}

export function toSelectableProtocols(
  presets: FastingProtocolPreset[],
): SelectableProtocolPreset[] {
  const out: SelectableProtocolPreset[] = [];
  for (const p of presets) {
    if (p.code === 'CUSTOM') continue;
    const fastingHours = p.fastingHours ?? PROTOCOL_HOURS[p.code].fastingHours;
    const eatingHours = p.eatingHours ?? PROTOCOL_HOURS[p.code].eatingHours;
    out.push({ code: p.code, fastingHours, eatingHours });
  }
  return out.length > 0 ? out : fallbackSelectableProtocols();
}

export async function fetchFastingProtocols(): Promise<FastingProtocolPreset[]> {
  try {
    const data = await apiRequest<Array<Record<string, unknown>>>({
      method: 'GET',
      path: '/api/v1/fasting/protocols',
      auth: true,
      timeoutMs: 3000,
    });
    if (data?.length) {
      return data as FastingProtocolPreset[];
    }
  } catch {
    /* fallback */
  }
  return fallbackSelectableProtocols();
}

export async function fetchFastingPreference(): Promise<FastingPreference> {
  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'GET',
      path: '/api/v1/fasting/preference',
      auth: true,
      timeoutMs: 3000,
    });
    if (data && (data.protocol || data.id)) {
      return {
        id: String(data.id ?? data._id ?? 'pref_local_1'),
        protocol: (data.protocol as FastingProtocol) ?? '16:8',
        fastingHours: Number(data.fastingHours ?? 16),
        eatingHours: Number(data.eatingHours ?? 8),
      };
    }
  } catch {
    /* fallback */
  }
  return localPreference;
}

export async function updateFastingPreference(
  input: UpdatePreferenceInput,
): Promise<FastingPreference> {
  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'PATCH',
      path: '/api/v1/fasting/preference',
      auth: true,
      body: input,
      timeoutMs: 3000,
    });
    if (data && data.protocol) {
      return data as unknown as FastingPreference;
    }
  } catch {
    /* fallback */
  }

  const hours = getProtocolHours(input.protocol);
  localPreference = {
    ...localPreference,
    protocol: (input.protocol as FastingProtocol) || localPreference.protocol,
    fastingHours: input.fastingHours ?? hours.fastingHours,
    eatingHours: input.eatingHours ?? hours.eatingHours,
  };
  return localPreference;
}

export async function fetchActiveFast(): Promise<FastingSessionStatus | null> {
  try {
    const data = await apiRequest<Record<string, unknown> | null>({
      method: 'GET',
      path: '/api/v1/fasting/active',
      auth: true,
      timeoutMs: 3000,
    });
    if (data && data.sessionId) {
      return data as unknown as FastingSessionStatus;
    }
  } catch {
    /* fallback */
  }

  if (localActiveFast) {
    const targetHours = getProtocolHours(localActiveFast.protocol).fastingHours;
    const progress = calculateLocalProgress(localActiveFast.startedAt, targetHours);
    localActiveFast = {
      ...localActiveFast,
      ...progress,
    };
  }
  return localActiveFast;
}

export async function updateActiveFast(input: { protocol?: string; startedAt?: string }): Promise<FastingSessionStatus> {
  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'PATCH',
      path: '/api/v1/fasting/active',
      auth: true,
      body: input,
      timeoutMs: 3000,
    });
    if (data && data.sessionId) {
      return data as unknown as FastingSessionStatus;
    }
  } catch {
    /* fallback */
  }

  if (!localActiveFast) {
    localActiveFast = {
      sessionId: `fast_${Date.now()}`,
      protocol: (input.protocol as FastingProtocol) || '16:8',
      status: 'ACTIVE',
      startedAt: input.startedAt || new Date().toISOString(),
      endedAt: null,
      targetMinutes: 16 * 60,
      elapsedMinutes: 0,
      remainingMinutes: 16 * 60,
      progressPercent: 0,
      goalMet: false,
    };
  } else {
    localActiveFast = {
      ...localActiveFast,
      protocol: (input.protocol as FastingProtocol) || localActiveFast.protocol,
      startedAt: input.startedAt || localActiveFast.startedAt,
    };
  }
  return localActiveFast;
}

export async function startFast(input: StartFastingInput = {}): Promise<FastingSessionStatus> {
  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'POST',
      path: '/api/v1/fasting/start',
      auth: true,
      body: input,
      timeoutMs: 3000,
    });
    if (data && data.sessionId) {
      return data as unknown as FastingSessionStatus;
    }
  } catch {
    /* fallback */
  }

  const protocol = input.protocol || localPreference.protocol || '16:8';
  const targetHours = getProtocolHours(protocol).fastingHours;
  const startedAt = input.startedAt || new Date().toISOString();

  localActiveFast = {
    sessionId: `fast_${Date.now()}`,
    protocol,
    status: 'ACTIVE',
    startedAt,
    endedAt: null,
    targetMinutes: targetHours * 60,
    elapsedMinutes: 0,
    remainingMinutes: targetHours * 60,
    progressPercent: 0,
    goalMet: false,
  };
  return localActiveFast;
}

export async function stopFast(): Promise<FastingSessionStatus> {
  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'POST',
      path: '/api/v1/fasting/stop',
      auth: true,
      body: {},
      timeoutMs: 3000,
    });
    if (data && data.sessionId) {
      return data as unknown as FastingSessionStatus;
    }
  } catch {
    /* fallback */
  }

  const current = localActiveFast;
  const endedAt = new Date().toISOString();
  const targetHours = current ? getProtocolHours(current.protocol).fastingHours : 16;
  const progress = current ? calculateLocalProgress(current.startedAt, targetHours) : { elapsedMinutes: 60, remainingMinutes: 0, progressPercent: 100, goalMet: true };

  const completedSession: FastingSessionStatus = {
    sessionId: current?.sessionId || `fast_${Date.now()}`,
    protocol: current?.protocol || '16:8',
    status: 'COMPLETED',
    startedAt: current?.startedAt || new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    endedAt,
    endReason: 'MANUAL',
    targetMinutes: targetHours * 60,
    ...progress,
  };

  localHistory = [completedSession, ...localHistory];
  localActiveFast = null;
  return completedSession;
}

export async function cancelFast(): Promise<FastingSessionStatus> {
  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'POST',
      path: '/api/v1/fasting/cancel',
      auth: true,
      body: {},
      timeoutMs: 3000,
    });
    if (data && data.sessionId) {
      return data as unknown as FastingSessionStatus;
    }
  } catch {
    /* fallback */
  }

  const current = localActiveFast;
  const cancelledSession: FastingSessionStatus = {
    sessionId: current?.sessionId || `fast_${Date.now()}`,
    protocol: current?.protocol || '16:8',
    status: 'CANCELLED',
    startedAt: current?.startedAt || new Date().toISOString(),
    endedAt: new Date().toISOString(),
    endReason: 'MANUAL',
    targetMinutes: 16 * 60,
    elapsedMinutes: current?.elapsedMinutes ?? 0,
    remainingMinutes: current?.remainingMinutes ?? 0,
    progressPercent: current?.progressPercent ?? 0,
    goalMet: false,
  };

  localActiveFast = null;
  return cancelledSession;
}

export async function fetchFastingHistory(
  page = 1,
  limit = 20,
): Promise<FastingHistoryPage> {
  try {
    const data = await apiRequest<{
      meta: FastingHistoryPage['meta'];
      data: Array<Record<string, unknown> | null>;
    }>({
      method: 'GET',
      path: `/api/v1/fasting/history?page=${page}&limit=${limit}`,
      auth: true,
      timeoutMs: 3000,
    });
    if (data?.data) {
      return {
        meta: data.meta,
        data: data.data as unknown as FastingSessionStatus[],
      };
    }
  } catch {
    /* fallback */
  }

  const start = (page - 1) * limit;
  const pageData = localHistory.slice(start, start + limit);

  return {
    meta: {
      page,
      limit,
      total: localHistory.length,
      totalPages: Math.ceil(localHistory.length / limit) || 1,
    },
    data: pageData,
  };
}

export async function updateHistoricalFast(
  sessionId: string,
  input: { startedAt?: string; endedAt?: string },
): Promise<FastingSessionStatus> {
  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'PATCH',
      path: `/api/v1/fasting/history/${sessionId}`,
      auth: true,
      body: input,
      timeoutMs: 3000,
    });
    if (data && data.sessionId) {
      return data as unknown as FastingSessionStatus;
    }
  } catch {
    /* fallback */
  }

  const itemIndex = localHistory.findIndex((h) => h.sessionId === sessionId);
  if (itemIndex >= 0) {
    const existing = localHistory[itemIndex];
    const startedAt = input.startedAt || existing.startedAt;
    const endedAt = input.endedAt || existing.endedAt;
    const updated = { ...existing, startedAt, endedAt };
    localHistory[itemIndex] = updated;
    return updated;
  }

  return {
    sessionId,
    protocol: '16:8',
    status: 'COMPLETED',
    startedAt: input.startedAt || new Date().toISOString(),
    endedAt: input.endedAt || new Date().toISOString(),
    targetMinutes: 16 * 60,
    elapsedMinutes: 16 * 60,
    remainingMinutes: 0,
    progressPercent: 100,
    goalMet: true,
  };
}
