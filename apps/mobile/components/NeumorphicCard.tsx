import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { ClaySurface } from './ClaySurface';
import { radius } from '@/theme';

interface ClayCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Recessed / sunken well */
  inset?: boolean;
  noPadding?: boolean;
}

/** Legacy export name — now a pastel clay card. */
export function NeumorphicCard({
  children,
  style,
  onPress,
  inset = false,
  noPadding = false,
}: ClayCardProps) {
  return (
    <ClaySurface
      variant={inset ? 'inset' : 'surface'}
      onPress={onPress}
      noPadding={noPadding}
      borderRadius={radius.lg}
      style={style}
    >
      {children}
    </ClaySurface>
  );
}
