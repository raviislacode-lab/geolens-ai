import React from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayButton } from './ClaySurface';
import { useT } from '../lib/i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { clayInset, radius, spacing, typography } from '../theme';

const WEBSITE_URL = 'https://geolens.ai';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AboutAppModal({ visible, onClose }: Props) {
  const t = useT();
  const { colors } = useTheme();
  const version =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    '1.0.0';

  const openWebsite = async () => {
    try {
      await Linking.openURL(WEBSITE_URL);
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: colors.background }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.surfaceSunken }]} />

          <View style={styles.brandBlock}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: colors.textDark }]}>
              {t('settings.about.title')}
            </Text>
            <Text style={[styles.version, { color: colors.textMutedStrong }]}>
              {t('settings.about.version', { version })}
            </Text>
          </View>

          <Text style={[styles.body, { color: colors.text }]}>
            {t('settings.about.body')}
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <InfoLine
              label={t('settings.about.builtFor')}
              value={t('settings.about.builtForValue')}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoLine
              label={t('settings.about.madeWith')}
              value={t('settings.about.madeWithValue')}
              colors={colors}
            />
          </View>

          <ClayButton
            title={t('settings.about.website')}
            onPress={openWebsite}
            textStyle={{ color: colors.textOnAccent }}
            style={styles.primaryBtn}
          />
          <Pressable onPress={onClose} style={styles.doneBtn}>
            <Text style={[styles.doneText, { color: colors.textMutedStrong }]}>
              {t('settings.about.done')}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function InfoLine({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { textMutedStrong: string; textDark: string };
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMutedStrong }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textDark }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 45, 66, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 3,
    marginBottom: spacing.md,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 22,
  },
  version: {
    ...typography.small,
    marginTop: 4,
    fontWeight: '600',
  },
  body: {
    ...typography.caption,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    boxShadow: clayInset,
    marginBottom: spacing.lg,
  } as ViewStyle,
  infoRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  infoLabel: {
    ...typography.small,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    fontSize: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    marginLeft: spacing.md,
  },
  primaryBtn: {
    marginBottom: spacing.sm,
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  doneText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
