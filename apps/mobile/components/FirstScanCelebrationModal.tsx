import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayButton } from './ClaySurface';
import { useT } from '../lib/i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, typography } from '../theme';

type Props = {
  visible: boolean;
  rockName: string;
  onClose: () => void;
  onViewBadges: () => void;
};

export function FirstScanCelebrationModal({
  visible,
  rockName,
  onClose,
  onViewBadges,
}: Props) {
  const t = useT();
  const { colors } = useTheme();

  useEffect(() => {
    // no-op hook for future animation
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.card, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.accentSoft },
            ]}
          >
            <Ionicons name="sparkles" size={36} color={colors.accentIcon} />
          </View>
          <Text style={[styles.title, { color: colors.textDark }]}>
            {t('result.firstScan.title')}
          </Text>
          <Text style={[styles.body, { color: colors.text }]}>
            {t('result.firstScan.body', { name: rockName })}
          </Text>
          <ClayButton
            title={t('result.firstScan.continue')}
            onPress={onClose}
            textStyle={{ color: colors.textOnAccent }}
            style={styles.btn}
          />
          <Pressable onPress={onViewBadges} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: colors.textMutedStrong }]}>
              {t('result.firstScan.badges')}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 45, 66, 0.45)',
  },
  card: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.caption,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  btn: { alignSelf: 'stretch' },
  linkBtn: { paddingVertical: 14 },
  linkText: { ...typography.caption, fontWeight: '600' },
});
