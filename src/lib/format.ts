/** ₦ from integer kobo — money is kobo end to end, formatted only here at the edge. */
export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo) / 100;
  return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * A non-negative duration as mm:ss, or h:mm:ss once it passes 60 minutes.
 * The caller decides direction (count up when overdue, down when on track).
 */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.trunc(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/** "34m 14s" (or "1h 04m 14s" past an hour) — for the Elapsed line under the bar. */
export function formatElapsedLong(totalSeconds: number): string {
  const s = Math.max(0, Math.trunc(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

/** Whole minutes between an ISO instant and a server-now (ms). */
export function minutesSince(iso: string | null, nowMs: number): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((nowMs - then) / 60000));
}
