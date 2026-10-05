// Back-compat shim: tokens are defined once in src/theme.ts. Existing screens
// import from '@/theme/colors'; new code should import from '@/theme'.
export { colors, statusHex, statusChip, type StatusColour } from '../theme';
