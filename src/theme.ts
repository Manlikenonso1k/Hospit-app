import { TextStyle } from 'react-native';

/**
 * The single source of truth for design tokens (spec section A) and typography
 * (section B). Existing screens import `colors` via '@/theme/colors', which
 * re-exports from here, so there is exactly one definition of every value.
 */
export const colors = {
  // Surfaces
  canvas: '#F7F9FB',
  bg: '#F7F9FB',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  fillLow: '#F2F4F6',
  fillHigh: '#E6E8EA',
  fillHighest: '#E0E3E5',
  muted: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  // Brand + text
  navy: '#002F61',
  navyDark: '#001A3B',
  deepNavy: '#001A3B',
  navyTint: '#E8EEF6',
  text: '#191C1E',
  ink: '#191C1E',
  textMuted: '#43474F',
  inkSecondary: '#43474F',
  outline: '#737780',
  textOnNavy: '#FFFFFF',

  // Status — solid edges / tokens
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
  grey: '#64748B',

  // Overdue family
  overdue: '#BA1A1A',
  overdueTint: '#FFDAD6',
  overdueTintText: '#93000A',
  cardEdgeRed: '#DC2626',

  // Amber family
  amberEdge: '#F59E0B',
  amberTint: '#FEF3C7',
  amberText: '#92400E',
  amberBadgeText: '#78350F',
  amberTimer: '#D97706',

  // Green family
  greenEdge: '#16A34A',
  greenTint: '#ECFDF5',
  greenChip: '#D1FAE5',
  green200: '#A7F3D0',
  greenIcon: '#059669',
  greenLabel: '#047857',
  greenDark: '#064E3B',

  // Misc
  onlineDot: '#10B981',
  offlineDot: '#94A3B8',
  greyLate: '#64748B',
  greyLateBg: '#F1F5F9',
  toastBg: '#001A3B',
  toastCheck: '#34D399',
  toastAccent: '#A9C7FF',
} as const;

/** One family per weight — RN custom fonts must not lean on fontWeight. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Typography scale (spec B). em letter-spacing converted to px (em × fontSize). */
export const type = {
  headlineSm: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 } as TextStyle,
  timer: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 30, fontVariant: ['tabular-nums'] } as TextStyle,
  bodyLg: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 } as TextStyle,
  bodyMd: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 } as TextStyle,
  labelLg: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18, letterSpacing: 0.28 } as TextStyle,
  labelMd: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.48 } as TextStyle,
  labelSm: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

export type StatusColour = 'green' | 'amber' | 'red' | 'grey';

export function statusHex(colour: StatusColour): string {
  return colors[colour];
}

/** Soft chip palette (bg / text / border) per DESIGN.md status matrix. */
export const statusChip: Record<StatusColour, { bg: string; fg: string; border: string; label: string }> = {
  green: { bg: colors.greenChip, fg: colors.greenLabel, border: colors.green200, label: 'ON TIME' },
  amber: { bg: colors.amberTint, fg: colors.amberBadgeText, border: '#FDE68A', label: 'PREP' },
  red: { bg: colors.overdueTint, fg: colors.overdueTintText, border: '#FECACA', label: 'OVERDUE' },
  grey: { bg: colors.greyLateBg, fg: colors.greyLate, border: colors.border, label: 'LATE' },
};

/** An order is AMBER URGENT once elapsed reaches this percent of target (spec H). */
export const AMBER_URGENT_THRESHOLD = 50;
