/** ₦ from integer kobo — money is kobo end to end, formatted only here at the edge. */
export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo) / 100;
  return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** mm:ss from a signed seconds value; shows a leading - once overdue. */
export function formatCountdown(seconds: number): string {
  const overdue = seconds < 0;
  const abs = Math.abs(Math.trunc(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const body = `${m}:${s.toString().padStart(2, '0')}`;
  return overdue ? `-${body}` : body;
}
