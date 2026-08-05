import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClaySurface } from './ClaySurface';
import { colors, radius, typography, clayInsetStack } from '@/theme';
import { useThemeOptional } from '@/theme/ThemeContext';

interface ScanListItemProps {
  name: string;
  classification: string;
  timestamp: string;
  imageUri?: string;
  onPress: () => void;
}

export function ScanListItem({
  name,
  classification,
  timestamp,
  imageUri,
  onPress,
}: ScanListItemProps) {
  useThemeOptional();

  return (
    <ClaySurface
      onPress={onPress}
      variant="surface"
      borderRadius={radius.lg}
      noPadding
      compact
      style={styles.container}
    >
      <View
        style={[
          styles.thumbWell,
          {
            backgroundColor: colors.surfaceSunken,
            boxShadow: clayInsetStack(),
          } as ViewStyle,
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Ionicons name="diamond-outline" size={22} color={colors.textMutedStrong} />
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.classification} numberOfLines={1}>
          {classification}
        </Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
    marginBottom: 14,
  },
  thumbWell: {
    width: 62,
    height: 62,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    fontSize: 16,
    marginBottom: 1,
  },
  classification: {
    ...typography.caption,
    fontSize: 13,
    marginBottom: 1,
  },
  timestamp: {
    ...typography.small,
    fontSize: 11,
  },
});
