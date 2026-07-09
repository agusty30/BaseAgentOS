// ---------------------------------------------------------------------------
// BaseAgentOS Design Tokens
// Exported as JS objects AND as CSS custom-property strings so consumers can
// either reference values directly or inject them into a :root {} block.
// ---------------------------------------------------------------------------

// ── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  brand: {
    50: '#EBF0FF',
    100: '#CCDaFF',
    200: '#99B5FF',
    300: '#6690FF',
    400: '#336BFF',
    500: '#0052FF',
    600: '#0042CC',
    700: '#003199',
    800: '#002166',
    900: '#001033',
    950: '#000819',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
} as const;

// ── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  13: '3.5rem',
  14: '4rem',
  15: '5rem',
  16: '6rem',
} as const;

// ── Typography ──────────────────────────────────────────────────────────────

export const fontFamily = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace",
} as const;

export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  xs: '1rem',
  sm: '1.25rem',
  base: '1.5rem',
  lg: '1.75rem',
  xl: '1.75rem',
  '2xl': '2rem',
  '3xl': '2.25rem',
  '4xl': '2.5rem',
} as const;

// ── Shadows ─────────────────────────────────────────────────────────────────

export const shadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ── Border Radii ────────────────────────────────────────────────────────────

export const radius = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
} as const;

// ── Transitions ─────────────────────────────────────────────────────────────

export const duration = {
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
} as const;

// ── CSS Custom Property Strings ─────────────────────────────────────────────
// Flat maps keyed by CSS var name (without the `--` prefix) for injection into
// a :root {} stylesheet.

function flattenObject(
  obj: Record<string, unknown>,
  prefix: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const varName = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, varName));
    } else {
      result[varName] = String(value);
    }
  }
  return result;
}

export const cssVariables: Record<string, string> = {
  ...flattenObject(colors, 'color'),
  ...flattenObject(spacing, 'spacing'),
  ...flattenObject(fontFamily, 'font'),
  ...flattenObject(fontSize, 'text'),
  ...flattenObject(fontWeight, 'weight'),
  ...flattenObject(lineHeight, 'leading'),
  ...flattenObject(shadow, 'shadow'),
  ...flattenObject(radius, 'radius'),
  ...flattenObject(duration, 'duration'),
};

/**
 * Generate a CSS string containing all custom properties scoped to :root.
 *
 * @example
 * ```ts
 * const style = document.createElement('style');
 * style.textContent = generateCssVariables();
 * document.head.appendChild(style);
 * ```
 */
export function generateCssVariables(): string {
  const lines = Object.entries(cssVariables).map(
    ([name, value]) => `  --${name}: ${value};`,
  );
  return `:root {\n${lines.join('\n')}\n}`;
}
