/**
 * Design Tokens — Barrel Export
 *
 * Single entry point for all design tokens. Import from here
 * in both the Tailwind config and application code.
 */

export { colors } from './colors';
export type { ColorScale, ColorName, ColorShade } from './colors';

export { spacing, layoutSpacing } from './spacing';
export type { SpacingScale, SpacingKey } from './spacing';

export { fontFamily, fontSize, fontWeight, letterSpacing } from './typography';
export type { FontFamily, FontSize, FontWeight } from './typography';
