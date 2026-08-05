import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClaySurface, ClayIconWell } from './ClaySurface';
import { colors, radius, spacing, typography } from '@/theme';

interface LimitationBannerProps {
  limitations: string[];
  recommendPhysicalTest?: boolean;
}

export function LimitationBanner({ limitations, recommendPhysicalTest }: LimitationBannerProps) {
  if (!limitations.length && !recommendPhysicalTest) return null;

  return (
    <ClaySurface variant="alt" borderRadius={radius.lg} style={styles.container}>
      <ClayIconWell size={40} fill={colors.surface} style={styles.icon}>
        <Ionicons name="warning-outline" size={19} color={colors.textMutedStrong} />
      </ClayIconWell>
      <Text style={styles.title}>Heads up</Text>
      {limitations.map((msg, i) => (
        <Text key={i} style={styles.message}>
          • {msg}
        </Text>
      ))}
      {recommendPhysicalTest && (
        <Text style={styles.recommend}>
          Physical testing (hardness, streak, acid test) is recommended to confirm.
        </Text>
      )}
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  icon: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subheading,
    color: colors.textDark,
    marginBottom: 6,
  },
  message: {
    ...typography.caption,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  recommend: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: spacing.sm,
    color: colors.textDark,
    lineHeight: 20,
  },
});
