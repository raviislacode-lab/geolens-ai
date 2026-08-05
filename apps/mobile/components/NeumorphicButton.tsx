import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ClayButton } from './ClaySurface';
import { ClayVariant } from './ClaySurface';

interface NeumorphicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'lavender';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const VARIANT_MAP: Record<string, ClayVariant> = {
  primary: 'accent',
  secondary: 'alt',
  lavender: 'lavender',
  ghost: 'flat',
};

/** Legacy export name — now a pill-shaped clay button. */
export function NeumorphicButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  style,
  disabled = false,
}: NeumorphicButtonProps) {
  return (
    <ClayButton
      title={title}
      onPress={onPress}
      icon={icon}
      variant={VARIANT_MAP[variant] ?? 'accent'}
      style={style}
      disabled={disabled}
    />
  );
}
