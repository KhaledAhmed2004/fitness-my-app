/**
 * Hydration Service — with seamless offline / standalone local mock engine.
 */

import { apiRequest } from '@/services/api-client';
import {
  emptyHydrationSummary,
  ML_TO_PRESET,
  type DeleteWaterResult,
  type HydrationGoalPayload,
  type HydrationPreset,
  type HydrationPresetKey,
  type HydrationStatus,
  type HydrationSummary,
  type QuickAddResult,
  type WaterLogEntry,
} from '@/types/hydration';

let localGoalMl = 2500;
const localLogsByDate = new Map<string, WaterLogEntry[]>();

// Seed initial hydration logs for today
const todayStr = new Date().toISOString().split('T')[0];
localLogsByDate.set(todayStr, [
  {
    id: 'water_1',
    amountMl: 250,
    preset: 'GLASS',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    date: todayStr,
  },
  {
    id: 'water_2',
    amountMl: 500,
    preset: 'BOTTLE',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    date: todayStr,
  },
]);

function buildLocalSummary(date: string): HydrationSummary {
  const logs = localLogsByDate.get(date) || [];
  const consumedMl = logs.reduce((sum, l) => sum + l.amountMl, 0);
  const goalMl = localGoalMl;
  const remainingMl = Math.max(0, goalMl - consumedMl);
  const progressPercent = Math.min(100, Math.round((consumedMl / goalMl) * 100));

  let status: HydrationStatus = 'UNDER';
  if (consumedMl > goalMl) status = 'OVER';
  else if (consumedMl === goalMl) status = 'MET';
  else if (progressPercent >= 50) status = 'ON_TRACK';

  return {
    date,
    amountMl: consumedMl,
    consumedMl,
    consumedLiters: Number((consumedMl / 1000).toFixed(2)),
    goalMl,
    goalLiters: Number((goalMl / 1000).toFixed(2)),
    remainingMl,
    remainingLiters: Number((remainingMl / 1000).toFixed(2)),
    progressPercent,
    status,
    entryCount: logs.length,
    presets: emptyHydrationSummary(date).presets,
    logs,
  };
}

export async function fetchHydrationForDate(date: string): Promise<HydrationSummary> {
  try {
    const data = await apiRequest<any>({
      method: 'GET',
      path: `/api/v1/hydration/summary?date=${encodeURIComponent(date)}`,
      auth: true,
      timeoutMs: 3000,
    });
    if (data && typeof data.consumedMl === 'number') {
      return {
        date: data.resolvedDate || date,
        amountMl: data.consumedMl,
        consumedMl: data.consumedMl,
        consumedLiters: data.consumedLiters ?? data.consumedMl / 1000,
        goalMl: data.goalMl,
        goalLiters: data.goalLiters ?? data.goalMl / 1000,
        remainingMl: data.remainingMl,
        remainingLiters: data.remainingLiters ?? data.remainingMl / 1000,
        progressPercent: data.progressPercent,
        status: data.status,
        entryCount: data.entryCount ?? 0,
        presets: data.presets || emptyHydrationSummary(date).presets,
        logs: data.logs || [],
      };
    }
  } catch {
    /* fallback */
  }

  return buildLocalSummary(date);
}

export async function fetchHydrationGoal(): Promise<HydrationGoalPayload> {
  try {
    const data = await apiRequest<HydrationGoalPayload>({
      method: 'GET',
      path: '/api/v1/hydration/goal',
      auth: true,
      timeoutMs: 3000,
    });
    if (data && data.goalMl) {
      localGoalMl = data.goalMl;
      return data;
    }
  } catch {
    /* fallback */
  }

  return {
    goalMl: localGoalMl,
    goalLiters: Number((localGoalMl / 1000).toFixed(2)),
  };
}

export async function setWaterGoalMl(goalMl: number): Promise<HydrationGoalPayload> {
  localGoalMl = Math.round(goalMl);
  try {
    await apiRequest<HydrationGoalPayload>({
      method: 'PATCH',
      path: '/api/v1/hydration/goal',
      auth: true,
      body: { goalMl: localGoalMl },
      timeoutMs: 3000,
    });
  } catch {
    /* fallback */
  }

  return {
    goalMl: localGoalMl,
    goalLiters: Number((localGoalMl / 1000).toFixed(2)),
  };
}

export async function setWaterGoalLiters(waterLiters: number): Promise<HydrationGoalPayload> {
  return setWaterGoalMl(waterLiters * 1000);
}

export async function quickAddWater(input: {
  date: string;
  preset?: HydrationPresetKey;
  amountMl?: number;
}): Promise<QuickAddResult> {
  const amount = input.amountMl || (input.preset === 'GLASS' ? 250 : input.preset === 'BOTTLE' ? 500 : 750);
  const entry: WaterLogEntry = {
    id: `water_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    amountMl: amount,
    preset: input.preset || null,
    createdAt: new Date().toISOString(),
    date: input.date,
  };

  try {
    const body = input.preset != null ? { preset: input.preset, date: input.date } : { amountMl: input.amountMl, date: input.date };
    const data = await apiRequest<any>({
      method: 'POST',
      path: '/api/v1/hydration/quick-add',
      auth: true,
      body,
      timeoutMs: 3000,
    });
    if (data && data.entry && data.summary) {
      return {
        entry: data.entry,
        summary: data.summary,
      };
    }
  } catch {
    /* fallback */
  }

  const existing = localLogsByDate.get(input.date) || [];
  localLogsByDate.set(input.date, [entry, ...existing]);

  return {
    entry,
    summary: buildLocalSummary(input.date),
  };
}

export async function logWaterIntake(date: string, amountMl: number): Promise<QuickAddResult> {
  const preset = ML_TO_PRESET[amountMl];
  return quickAddWater(preset ? { date, preset } : { date, amountMl });
}

export async function deleteWaterLog(waterLogId: string): Promise<DeleteWaterResult> {
  try {
    const data = await apiRequest<any>({
      method: 'DELETE',
      path: `/api/v1/hydration/logs/${encodeURIComponent(waterLogId)}`,
      auth: true,
      timeoutMs: 3000,
    });
    if (data && data.deleted && data.summary) {
      return {
        deleted: data.deleted,
        summary: data.summary,
      };
    }
  } catch {
    /* fallback */
  }

  let deleted: WaterLogEntry = { id: waterLogId, amountMl: 250, createdAt: new Date().toISOString() };
  for (const [date, logs] of localLogsByDate.entries()) {
    const found = logs.find((l) => l.id === waterLogId);
    if (found) {
      deleted = found;
      localLogsByDate.set(date, logs.filter((l) => l.id !== waterLogId));
      return {
        deleted,
        summary: buildLocalSummary(date),
      };
    }
  }

  return {
    deleted,
    summary: buildLocalSummary(todayStr),
  };
}
