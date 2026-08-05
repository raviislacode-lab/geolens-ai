import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Text,
  TextStyle,
} from 'react-native';
import {
  colors,
  radius as themeRadius,
  typography,
  clayElevated,
  clayElevatedPressed,
  claySageElevated,
  claySagePressed,
  clayCardElevated,
  clayInsetStack,
  pressTravel,
  isSageFill,
  CLAY_DEPTH,
  getAppearance,
} from '@/theme';
import { useThemeOptional } from '@/theme/ThemeContext';

export type ClayVariant =
  | 'surface'
  | 'alt'
  | 'accent'
  | 'lavender'
  | 'mint'
  | 'peach'
  | 'sky'
  | 'blush'
  | 'inset'
  | 'flat';

function variantFill(variant: ClayVariant): string {
  const map: Record<ClayVariant, string> = {
    surface: colors.surface,
    alt: colors.surfaceAlt,
    accent: colors.accent,
    lavender: colors.lavender,
    mint: colors.mint,
    peach: colors.peach,
    sky: colors.sky,
    blush: colors.blush,
    inset: colors.surfaceSunken,
    flat: 'transparent',
  };
  return map[variant];
}

export function defaultTextColorFor(variant: ClayVariant): string {
  if (variant === 'accent') return colors.textOnAccent;
  if (variant === 'mint') return colors.accentDark;
  return colors.textDark;
}

function shadowStacksFor(variant: ClayVariant, depth: number, largeCard: boolean) {
  if (variant === 'flat') return { rest: undefined, pressed: undefined };
  if (variant === 'inset') {
    const inset = clayInsetStack();
    return { rest: inset, pressed: inset };
  }

  const sage = variant === 'accent';
  const scale = depth / 12;

  if (sage) {
    return {
      rest: claySageElevated(scale),
      pressed: claySagePressed(scale),
    };
  }

  if (largeCard) {
    return {
      rest: clayCardElevated(),
      pressed: clayElevatedPressed(scale),
    };
  }

  return {
    rest: clayElevated(scale),
    pressed: clayElevatedPressed(scale),
  };
}

interface ClaySurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: ClayVariant;
  borderRadius?: number;
  noPadding?: boolean;
  compact?: boolean;
  depth?: number;
  disabled?: boolean;
  clip?: boolean;
  /** Use larger card shadow stack */
  large?: boolean;
}

/**
 * ClaySurface — dual outer + dual inset soft clay in Clay mode;
 * flat bordered cards in Classic mode.
 */
export function ClaySurface({
  children,
  style,
  onPress,
  onLongPress,
  variant = 'surface',
  borderRadius = themeRadius.lg,
  noPadding = false,
  compact = false,
  depth: depthProp,
  disabled = false,
  clip = false,
  large = false,
}: ClaySurfaceProps) {
  // Subscribe so appearance switches re-render every surface
  useThemeOptional();
  const classic = getAppearance() === 'classic';
  const depth = depthProp ?? (compact ? CLAY_DEPTH.cardCompact : CLAY_DEPTH.card);
  const { rest, pressed } = shadowStacksFor(variant, depth, large && !compact);
  const fill = variantFill(variant);

  const base: ViewStyle = {
    backgroundColor: fill,
    borderRadius,
    overflow: clip ? 'hidden' : 'visible',
    ...(classic && variant !== 'flat'
      ? {
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: colors.border,
        }
      : null),
  };

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={({ pressed: isPressed }) =>
          [
            base,
            { boxShadow: isPressed && !disabled ? pressed : rest } as ViewStyle,
            !noPadding && styles.padded,
            style,
            isPressed &&
              !disabled && {
                transform: [{ translateY: pressTravel(depth) }, { scale: 0.99 }],
              },
            disabled && styles.disabled,
          ] as StyleProp<ViewStyle>
        }
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[base, { boxShadow: rest } as ViewStyle, !noPadding && styles.padded, style]}>
      {children}
    </View>
  );
}

/** Squircle icon button — header actions */
export function ClayIconButton({
  children,
  onPress,
  size = 48,
  variant = 'surface',
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  variant?: ClayVariant;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ClaySurface
      onPress={onPress}
      variant={variant}
      borderRadius={themeRadius.sm}
      noPadding
      depth={CLAY_DEPTH.iconWell}
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </ClaySurface>
  );
}

/** Soft clay icon bubble — circular or squircle */
export function ClayIconWell({
  children,
  size = 44,
  fill,
  round = false,
  style,
  sunken = false,
}: {
  children: React.ReactNode;
  size?: number;
  fill?: string;
  round?: boolean;
  style?: StyleProp<ViewStyle>;
  sunken?: boolean;
}) {
  useThemeOptional();
  const classic = getAppearance() === 'classic';
  const resolvedFill = fill ?? colors.surface;
  const br = round ? size / 2 : themeRadius.sm;
  const sage = isSageFill(resolvedFill);

  return (
    <View
      style={[
        styles.iconWellBase,
        {
          width: size,
          height: size,
          borderRadius: br,
          backgroundColor: resolvedFill,
          boxShadow: sunken
            ? clayInsetStack()
            : sage
              ? claySageElevated(0.55)
              : clayElevated(0.55),
          ...(classic
            ? {
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderColor: colors.border,
              }
            : null),
        } as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Pill-shaped clay CTA — capsule ends, sage by default */
export function ClayButton({
  title,
  onPress,
  icon,
  variant = 'accent',
  style,
  textStyle,
  disabled = false,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: ClayVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  compact?: boolean;
}) {
  useThemeOptional();
  return (
    <ClaySurface
      onPress={onPress}
      variant={variant}
      disabled={disabled}
      borderRadius={themeRadius.full}
      noPadding
      depth={compact ? CLAY_DEPTH.buttonCompact : CLAY_DEPTH.button}
      style={[styles.button, compact && styles.buttonCompact, style]}
    >
      {icon}
      <Text style={[typography.button, { color: defaultTextColorFor(variant) }, textStyle]}>
        {title}
      </Text>
    </ClaySurface>
  );
}

/** Small rounded label chip */
export function ClayChip({
  label,
  variant = 'alt',
  style,
  textStyle,
}: {
  label: string;
  variant?: ClayVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <ClaySurface
      variant={variant}
      borderRadius={themeRadius.full}
      noPadding
      depth={CLAY_DEPTH.chip}
      style={[styles.chip, style]}
    >
      <Text style={[typography.small, { color: defaultTextColorFor(variant) }, textStyle]}>
        {label}
      </Text>
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  padded: {
    padding: 28,
  },
  disabled: {
    opacity: 0.45,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 15,
    paddingHorizontal: 32,
  },
  buttonCompact: {
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  iconWellBase: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
