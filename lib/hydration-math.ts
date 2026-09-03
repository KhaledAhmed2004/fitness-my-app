/**
 * MENTOR: Pure hydration math — mirrors backend computeStatus thresholds.
 */

import type { HydrationStatus, HydrationSummary } from '@/types/hydration';

export function computeHydrationStatus(consumedMl: number, goalMl: number): HydrationStatus {
  if (goalMl <= 0) return 'ON_TRACK';
  const ratio = consumedMl / goalMl;
  if (ratio >= 1.05) return 'OVER';
  if (ratio >= 1) return 'MET';
  if (ratio >= 0.7) return 'ON_TRACK';
  return 'UNDER';
}

export function recomputeHydrationSummary(
  prev: HydrationSummary,
  goal: { goalMl: number; goalLiters: number },
): HydrationSummary {
  const goalMl = Math.round(goal.goalMl);
  const goalLiters = Number(goal.goalLiters);
  const consumedMl = prev.consumedMl;
  const remainingMl = Math.max(0, goalMl - consumedMl);
  const progressPercent =
    goalMl > 0 ? Math.round((consumedMl / goalMl) * 1000) / 10 : 0;

  return {
    ...prev,
    goalMl,
    goalLiters,
    remainingMl,
    remainingLiters: remainingMl / 1000,
    progressPercent,
    status: computeHydrationStatus(consumedMl, goalMl),
  };
}
