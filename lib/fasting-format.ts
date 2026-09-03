import { PROTOCOL_HOURS, type FastingProtocol, type FastingSessionStatus } from '@/types/fasting';

export function protocolLabel(protocol: FastingProtocol) {
  return protocol;
}

export function fastingHoursForProtocol(protocol: FastingProtocol, fallback = 16) {
  if (protocol === 'CUSTOM') return fallback;
  return PROTOCOL_HOURS[protocol].fastingHours;
}

export function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Relative day label for history rows — Yesterday, 2 Days Ago, … */
export function formatRelativeDay(iso: string, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatShortDate(iso);

  const startOf = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} Days Ago`;
  return formatShortDate(iso);
}

export type FastHistoryOutcome = 'completed' | 'exceeded' | 'early';

/** Map session → history card outcome (design: Completed / Exceeded / Ended Early). */
export function fastingHistoryOutcome(session: FastingSessionStatus): FastHistoryOutcome {
  if (session.status === 'CANCELLED') return 'early';
  if (!session.goalMet) return 'early';
  if (session.elapsedMinutes > session.targetMinutes) return 'exceeded';
  return 'completed';
}

export function fastingHistoryOutcomeLabel(outcome: FastHistoryOutcome) {
  if (outcome === 'exceeded') return 'Exceeded Goal';
  if (outcome === 'early') return 'Ended Early';
  return 'Completed Goal';
}

/** e.g. 5h 20m */
export function formatDurationMinutes(totalMinutes: number) {
  const mins = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Center timer style 5:20 */
export function formatTimerHm(totalMinutes: number) {
  const mins = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function computeLiveProgress(session: FastingSessionStatus, now = Date.now()) {
  const started = new Date(session.startedAt).getTime();
  const elapsedMs = Math.max(0, now - started);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const targetMinutes = session.targetMinutes;
  const remainingMinutes = Math.max(0, targetMinutes - elapsedMinutes);
  const progressPercent =
    targetMinutes > 0 ? Math.min(100, Math.round((elapsedMinutes / targetMinutes) * 100)) : 0;
  const goalMet = elapsedMinutes >= targetMinutes;
  return { elapsedMinutes, remainingMinutes, progressPercent, goalMet };
}

export function eatingWindowLabel(startedAt: string, fastingHours: number) {
  const start = new Date(startedAt);
  const end = new Date(start.getTime() + fastingHours * 60 * 60 * 1000);
  return `Ends ${formatClock(end)}`;
}

export function subtitleForFast(opts: {
  protocol: FastingProtocol;
  startedAt?: string | null;
  fastingHours: number;
  active: boolean;
}) {
  if (opts.active && opts.startedAt) {
    return `${opts.protocol} · ${eatingWindowLabel(opts.startedAt, opts.fastingHours)}`;
  }
  return `${opts.protocol} · ${opts.fastingHours}h fast`;
}
