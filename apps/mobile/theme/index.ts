// ─────────────────────────────────────────────────────────────────────────────
// GeoLens AI — Design System
// Clay: soft lavender + sage claymorphism (packages/claymorphism.md)
// Classic: flat light surfaces, subtle borders, no dual clay shadows
// ─────────────────────────────────────────────────────────────────────────────

import { Platform, TextStyle } from 'react-native';

export type AppearanceMode = 'clay' | 'classic';

export type ThemeColors = {
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceAlt: string;
  surfaceSoft: string;
  surfaceSunken: string;
  accent: string;
  accentShadow: string;
  accentDark: string;
  accentHighlight: string;
  accentSoft: string;
  accentIcon: string;
  mint: string;
  mintShadow: string;
  lavender: string;
  lavenderShadow: string;
  lavenderDeep: string;
  lavenderSoft: string;
  peach: string;
  peachShadow: string;
  sky: string;
  skyShadow: string;
  blush: string;
  blushShadow: string;
  text: string;
  textLight: string;
  textDark: string;
  textOnAccent: string;
  textMutedStrong: string;
  border: string;
  separator: string;
  divider: string;
  ring: string;
  highlight: string;
  shadow: string;
  shadowDeep: string;
  shadowNeutral: string;
  shadowNeutralSoft: string;
  shadowInsetDark: string;
  shadowInsetLight: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  success: string;
};

export const clayColors: ThemeColors = {
  background: '#E5E1EE',
  backgroundDeep: '#DCD6E8',
  surface: '#E7E1F0',
  surfaceAlt: '#E4E0EC',
  surfaceSoft: '#E4E0EC',
  surfaceSunken: '#DCD6E8',
  accent: '#9EAFAC',
  accentShadow: '#7F908C',
  accentDark: '#1A2824',
  accentHighlight: '#B7C6C2',
  accentSoft: '#D5E0DC',
  accentIcon: '#697B75',
  mint: '#D5E0DC',
  mintShadow: '#7F908C',
  lavender: '#E4E0EC',
  lavenderShadow: '#C8C2D8',
  lavenderDeep: '#78729A',
  lavenderSoft: '#E7E1F0',
  peach: '#E8E2EF',
  peachShadow: '#C8C2D8',
  sky: '#E4E0EC',
  skyShadow: '#C8C2D8',
  blush: '#E8E2EF',
  blushShadow: '#C8C2D8',
  text: '#7E7993',
  textLight: '#8A85A8',
  textDark: '#2D2D42',
  textOnAccent: '#1A2824',
  textMutedStrong: '#78729A',
  border: '#D5CFE7',
  separator: 'rgba(213, 207, 231, 0.4)',
  divider: '#D5CFE7',
  ring: '#FFFFFF',
  highlight: '#FFFFFF',
  shadow: '#D5CFE7',
  shadowDeep: '#C8C2D8',
  shadowNeutral: '#D5CFE7',
  shadowNeutralSoft: '#C8C2D8',
  shadowInsetDark: 'rgba(213, 207, 231, 0.65)',
  shadowInsetLight: 'rgba(255, 255, 255, 0.85)',
  warning: '#8A85A8',
  warningSoft: '#E8E2EF',
  error: '#966077',
  errorSoft: '#E8E2EF',
  success: '#697B75',
};

/** Flat / non-clay theme — same soft brightness as clay, neutral gray instead of lavender */
export const classicColors: ThemeColors = {
  background: '#E2E4E8',
  backgroundDeep: '#D6D9DF',
  surface: '#E8EAEE',
  surfaceAlt: '#E4E6EB',
  surfaceSoft: '#E4E6EB',
  surfaceSunken: '#D6D9DF',
  accent: '#9EAFAC',
  accentShadow: '#7F908C',
  accentDark: '#1A2824',
  accentHighlight: '#B7C6C2',
  accentSoft: '#D5E0DC',
  accentIcon: '#697B75',
  mint: '#D5E0DC',
  mintShadow: '#7F908C',
  lavender: '#E4E6EB',
  lavenderShadow: '#C5C9D0',
  lavenderDeep: '#6B7280',
  lavenderSoft: '#E8EAEE',
  peach: '#E4E6EB',
  peachShadow: '#C5C9D0',
  sky: '#E4E6EB',
  skyShadow: '#C5C9D0',
  blush: '#E4E6EB',
  blushShadow: '#C5C9D0',
  text: '#6B7280',
  textLight: '#8B93A0',
  textDark: '#2D2D42',
  textOnAccent: '#1A2824',
  textMutedStrong: '#6B7280',
  border: '#CDD1D8',
  separator: 'rgba(45, 45, 66, 0.1)',
  divider: '#CDD1D8',
  ring: '#FFFFFF',
  highlight: '#FFFFFF',
  shadow: '#C5C9D0',
  shadowDeep: '#B0B5BF',
  shadowNeutral: '#C5C9D0',
  shadowNeutralSoft: '#B0B5BF',
  shadowInsetDark: 'rgba(45, 45, 66, 0.12)',
  shadowInsetLight: 'rgba(255, 255, 255, 0.85)',
  warning: '#8B93A0',
  warningSoft: '#E4E6EB',
  error: '#966077',
  errorSoft: '#E8E2EF',
  success: '#697B75',
};

let activeAppearance: AppearanceMode = 'clay';
let activePalette: ThemeColors = clayColors;

export function getAppearance(): AppearanceMode {
  return activeAppearance;
}

export function getColors(): ThemeColors {
  return activePalette;
}

/** Swap active palette (also used by ThemeProvider). */
export function applyAppearance(mode: AppearanceMode): void {
  activeAppearance = mode === 'classic' ? 'classic' : 'clay';
  activePalette = activeAppearance === 'classic' ? classicColors : clayColors;
}

/**
 * Live color tokens. Prefer reading these at render time (not baking into
 * StyleSheet.create) so Clay ↔ Classic switches update the UI.
 */
export const colors: ThemeColors = new Proxy(clayColors, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== 'string') return undefined;
    return activePalette[prop as keyof ThemeColors];
  },
}) as ThemeColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 40,
  full: 999,
};

// System geometric sans (SF Pro / Roboto) — matches screenshot references
const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: undefined,
});

export const fonts = {
  regular: systemFont as string,
  medium: systemFont as string,
  semibold: systemFont as string,
  bold: systemFont as string,
  extrabold: systemFont as string,
  black: systemFont as string,
};

export const typography = {
  display: {
    fontFamily: fonts.regular,
    fontWeight: '800' as const,
    fontSize: 32,
    color: colors.textDark,
    letterSpacing: -0.5,
  } as TextStyle,
  title: {
    fontFamily: fonts.regular,
    fontWeight: '700' as const,
    fontSize: 28,
    color: colors.textDark,
    letterSpacing: -0.4,
  } as TextStyle,
  heading: {
    fontFamily: fonts.regular,
    fontWeight: '700' as const,
    fontSize: 21,
    color: colors.textDark,
    letterSpacing: -0.2,
  } as TextStyle,
  subheading: {
    fontFamily: fonts.regular,
    fontWeight: '600' as const,
    fontSize: 17,
    color: colors.textDark,
  } as TextStyle,
  body: {
    fontFamily: fonts.regular,
    fontWeight: '400' as const,
    fontSize: 16,
    color: colors.text,
  } as TextStyle,
  bodyBold: {
    fontFamily: fonts.regular,
    fontWeight: '600' as const,
    fontSize: 16,
    color: colors.textDark,
  } as TextStyle,
  caption: {
    fontFamily: fonts.regular,
    fontWeight: '500' as const,
    fontSize: 14,
    color: colors.textLight,
  } as TextStyle,
  small: {
    fontFamily: fonts.regular,
    fontWeight: '500' as const,
    fontSize: 12,
    color: colors.textLight,
  } as TextStyle,
  button: {
    fontFamily: fonts.regular,
    fontWeight: '600' as const,
    fontSize: 16,
    color: colors.textOnAccent,
    letterSpacing: 0.1,
  } as TextStyle,
};

// ─────────────────────────────────────────────────────────────────────────────
// Clay shadow formula — dual outer + dual inset (never solid offset slabs)
// ─────────────────────────────────────────────────────────────────────────────

export type ClayShadowLayer = {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
  inset?: boolean;
  spreadDistance?: number;
};
export type ClayShadowStack = ClayShadowLayer[];

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const CLAY_DEPTH = {
  card: 12,
  cardCompact: 8,
  button: 10,
  buttonCompact: 7,
  chip: 5,
  iconWell: 6,
  tabFloat: 14,
  tabSquare: 8,
  cameraButton: 10,
};

function classicElevated(scale = 1): ClayShadowStack {
  const s = scale;
  return [
    {
      offsetX: 0,
      offsetY: 2 * s,
      blurRadius: 8 * s,
      color: 'rgba(45, 45, 66, 0.1)',
    },
  ];
}

/** Elevated soft-clay (lavender surfaces) — soft bottom cast + muted highlight */
export function clayElevated(scale = 1): ClayShadowStack {
  if (activeAppearance === 'classic') return classicElevated(scale);
  const s = scale;
  return [
    // Outer bottom shadow (primary lift — more visible, less shiny)
    {
      offsetX: 6 * s,
      offsetY: 10 * s,
      blurRadius: 16 * s,
      color: withAlpha(colors.shadowDeep, 0.7),
    },
    // Soft outer top-left highlight (kept subtle)
    {
      offsetX: -4 * s,
      offsetY: -4 * s,
      blurRadius: 10 * s,
      color: 'rgba(255, 255, 255, 0.45)',
    },
    // Inner top rim — gentle, not glossy
    {
      offsetX: -3 * s,
      offsetY: -3 * s,
      blurRadius: 8 * s,
      color: 'rgba(255, 255, 255, 0.5)',
      inset: true,
    },
    // Inner bottom shade
    {
      offsetX: 3 * s,
      offsetY: 4 * s,
      blurRadius: 8 * s,
      color: withAlpha(colors.shadowDeep, 0.45),
      inset: true,
    },
  ];
}

/** Elevated sage control — CTAs + camera disc */
export function claySageElevated(scale = 1): ClayShadowStack {
  if (activeAppearance === 'classic') return classicElevated(scale * 0.85);
  const s = scale;
  return [
    {
      offsetX: 5 * s,
      offsetY: 9 * s,
      blurRadius: 14 * s,
      color: withAlpha(colors.accentShadow, 0.5),
    },
    {
      offsetX: -3 * s,
      offsetY: -3 * s,
      blurRadius: 8 * s,
      color: 'rgba(255, 255, 255, 0.35)',
    },
    {
      offsetX: -3 * s,
      offsetY: -3 * s,
      blurRadius: 7 * s,
      color: withAlpha(colors.accentHighlight, 0.45),
      inset: true,
    },
    {
      offsetX: 3 * s,
      offsetY: 4 * s,
      blurRadius: 9 * s,
      color: withAlpha(colors.accentShadow, 0.5),
      inset: true,
    },
  ];
}

/** Large card elevation */
export function clayCardElevated(): ClayShadowStack {
  if (activeAppearance === 'classic') return classicElevated(1.1);
  return [
    {
      offsetX: 8,
      offsetY: 12,
      blurRadius: 22,
      color: withAlpha(colors.shadowDeep, 0.75),
    },
    {
      offsetX: -5,
      offsetY: -5,
      blurRadius: 14,
      color: 'rgba(255, 255, 255, 0.45)',
    },
    {
      offsetX: -3,
      offsetY: -3,
      blurRadius: 7,
      color: 'rgba(255, 255, 255, 0.45)',
      inset: true,
    },
    {
      offsetX: 3,
      offsetY: 4,
      blurRadius: 9,
      color: withAlpha(colors.shadowDeep, 0.4),
      inset: true,
    },
  ];
}

/** Recessed / sunken well (search bar, inset thumbnails) */
export function clayInsetStack(): ClayShadowStack {
  if (activeAppearance === 'classic') {
    return [
      {
        offsetX: 0,
        offsetY: 1,
        blurRadius: 2,
        color: 'rgba(45, 45, 66, 0.08)',
        inset: true,
      },
    ];
  }
  return [
    {
      offsetX: 4,
      offsetY: 4,
      blurRadius: 10,
      color: withAlpha(colors.shadowDeep, 0.7),
      inset: true,
    },
    {
      offsetX: -3,
      offsetY: -3,
      blurRadius: 8,
      color: 'rgba(255, 255, 255, 0.8)',
      inset: true,
    },
  ];
}

/** Live inset stack accessor for StyleSheet-like call sites */
export const clayInset: ClayShadowStack = new Proxy([] as ClayShadowStack, {
  get(_t, prop) {
    const stack = clayInsetStack();
    if (prop === 'length') return stack.length;
    if (prop === Symbol.iterator) return stack[Symbol.iterator].bind(stack);
    return (stack as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as ClayShadowStack;

/** Pressed: flatten outer shadows, keep soft inset rims */
export function clayElevatedPressed(scale = 1): ClayShadowStack {
  if (activeAppearance === 'classic') return classicElevated(scale * 0.4);
  const s = scale * 0.55;
  return [
    { offsetX: 4 * s, offsetY: 5 * s, blurRadius: 10 * s, color: colors.shadow },
    { offsetX: -3 * s, offsetY: -3 * s, blurRadius: 8 * s, color: colors.highlight },
    {
      offsetX: -4 * s,
      offsetY: -4 * s,
      blurRadius: 10 * s,
      color: colors.shadowInsetLight,
      inset: true,
    },
    {
      offsetX: 6 * s,
      offsetY: 6 * s,
      blurRadius: 14 * s,
      color: withAlpha(colors.shadowDeep, 0.75),
      inset: true,
    },
  ];
}

export function claySagePressed(scale = 1): ClayShadowStack {
  if (activeAppearance === 'classic') return classicElevated(scale * 0.4);
  const s = scale * 0.55;
  return [
    {
      offsetX: 3 * s,
      offsetY: 4 * s,
      blurRadius: 8 * s,
      color: withAlpha(colors.accentShadow, 0.35),
    },
    {
      offsetX: -2 * s,
      offsetY: -2 * s,
      blurRadius: 6 * s,
      color: 'rgba(255, 255, 255, 0.4)',
    },
    {
      offsetX: -3 * s,
      offsetY: -3 * s,
      blurRadius: 8 * s,
      color: withAlpha(colors.accentHighlight, 0.6),
      inset: true,
    },
    {
      offsetX: 5 * s,
      offsetY: 6 * s,
      blurRadius: 12 * s,
      color: withAlpha(colors.accentShadow, 0.65),
      inset: true,
    },
  ];
}

/** Generic elevated shadow from depth + fill family (compat API) */
export function clayShadow(
  depth: number,
  shadowHex: string,
  opts?: { opacity?: number; blur?: number }
): ClayShadowStack {
  const isSage =
    shadowHex.toLowerCase() === colors.accentShadow.toLowerCase() ||
    shadowHex.toLowerCase() === colors.mintShadow.toLowerCase();
  if (isSage) return claySageElevated(depth / 10);
  return clayElevated(depth / 12);
}

export function clayShadowPressed(
  depth: number,
  shadowHex: string,
  opts?: { opacity?: number; blur?: number }
): ClayShadowStack {
  const isSage =
    shadowHex.toLowerCase() === colors.accentShadow.toLowerCase() ||
    shadowHex.toLowerCase() === colors.mintShadow.toLowerCase();
  if (isSage) return claySagePressed(depth / 10);
  return clayElevatedPressed(depth / 12);
}

export function pressTravel(_depth: number): number {
  return 2;
}

const SHADOW_PAIRS: Array<[string, string]> = [
  [colors.accent, colors.accentShadow],
  [colors.mint, colors.mintShadow],
  [colors.lavender, colors.lavenderShadow],
  [colors.peach, colors.peachShadow],
  [colors.sky, colors.skyShadow],
  [colors.blush, colors.blushShadow],
  [colors.surface, colors.shadow],
  [colors.surfaceAlt, colors.shadow],
  [colors.lavenderSoft, colors.shadow],
  [colors.accentSoft, colors.accentShadow],
];

export function shadowColorForFill(fillHex?: string): string {
  if (fillHex) {
    const match = SHADOW_PAIRS.find(([fill]) => fill.toLowerCase() === fillHex.toLowerCase());
    if (match) return match[1];
  }
  return colors.shadow;
}

export function isSageFill(fillHex?: string): boolean {
  if (!fillHex) return false;
  const f = fillHex.toLowerCase();
  return (
    f === colors.accent.toLowerCase() ||
    f === colors.mint.toLowerCase() ||
    f === colors.accentSoft.toLowerCase()
  );
}

// Precomputed stacks
export const clay = clayCardElevated();
export const claySm = clayElevated(0.65);
export const clayAccent = claySageElevated();
export const clayLavender = clayElevated(0.85);
export const clayFloat = clayElevated(1.1);
export const clayPressed = { transform: [{ translateY: 2 }, { scale: 0.98 }] };

export const neumorphic = clay;
