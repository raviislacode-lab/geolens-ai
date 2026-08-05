import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import {
  colors,
  radius,
  clayInsetStack,
  claySageElevated,
  clayElevated,
  getAppearance,
} from '@/theme';
import { useThemeOptional } from '@/theme/ThemeContext';

interface ClayToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/** Soft clay toggle — recessed track, sage when on */
export function ClayToggle({ value, onValueChange, disabled = false }: ClayToggleProps) {
  useThemeOptional();
  const classic = getAppearance() === 'classic';

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={({ pressed }) => [
        {
          width: 58,
          height: 34,
          borderRadius: radius.full,
          backgroundColor: value ? colors.accent : colors.surfaceSunken,
          justifyContent: 'center',
          paddingHorizontal: 4,
          boxShadow: value ? claySageElevated(0.55) : clayInsetStack(),
          ...(classic
            ? {
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderColor: colors.border,
              }
            : null),
        } as ViewStyle,
        disabled && styles.disabled,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View
        style={
          {
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: value ? colors.ring : colors.surface,
            alignSelf: value ? 'flex-end' : 'flex-start',
            boxShadow: clayElevated(0.4),
          } as ViewStyle
        }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
});
