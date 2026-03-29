/**
 * Design Tokens: Typography
 *
 * Font families, sizes, weights, line heights, and letter spacing
 * for a SaaS dashboard. Optimized for data-dense interfaces.
 */

export const fontFamily = {
  sans: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  mono: [
    'JetBrains Mono',
    'Fira Code',
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
} as const;

export const fontSize = {
  /** 12px — small labels, captions, metadata */
  xs: ['0.75rem', { lineHeight: '1rem' }],
  /** 14px — body text, table cells, form inputs */
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  /** 16px — default body, primary content */
  base: ['1rem', { lineHeight: '1.5rem' }],
  /** 18px — subheadings, emphasized content */
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  /** 20px — section headings */
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  /** 24px — page headings */
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  /** 30px — hero headings */
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  /** 36px — display headings */
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
