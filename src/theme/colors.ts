/**
 * Brand + status tokens from the Stitch designs. The four status colours map the
 * server's status_colour string straight to a swatch — the app never recomputes
 * the traffic-light rule.
 */
export const colors = {
  navy: '#002F61',
  navyDark: '#001A3B',
  navyTint: '#E8EEF6',

  bg: '#F8FAFC', // canvas
  muted: '#F1F5F9', // neutral wells / inactive chips
  surface: '#FFFFFF',
  border: '#E2E8F0', // structural stroke
  borderStrong: '#CBD5E1',

  text: '#0F172A', // content primary
  textMuted: '#475569', // content secondary
  textOnNavy: '#FFFFFF',

  // status_colour tokens (green | amber | red | grey)
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
  grey: '#64748B',
} as const;

export type StatusColour = 'green' | 'amber' | 'red' | 'grey';

export function statusHex(colour: StatusColour): string {
  return colors[colour];
}

/** Soft chip palette (bg / text / border) per DESIGN.md status matrix. */
export const statusChip: Record<StatusColour, { bg: string; fg: string; border: string; label: string }> = {
  green: { bg: '#DCFCE7', fg: '#16A34A', border: '#BBF7D0', label: 'ON TIME' },
  amber: { bg: '#FEF3C7', fg: '#B45309', border: '#FDE68A', label: 'PREP' },
  red: { bg: '#FEE2E2', fg: '#DC2626', border: '#FECACA', label: 'OVERDUE' },
  grey: { bg: '#F1F5F9', fg: '#64748B', border: '#E2E8F0', label: 'LATE' },
};
