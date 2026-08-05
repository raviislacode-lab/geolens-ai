import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayButton, ClayIconWell } from './ClaySurface';
import { useT } from '../lib/i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { clayInset, radius, spacing, typography } from '../theme';
import { startOnboardingFlow } from '../lib/startOnboarding';

const SUPPORT_EMAIL = 'Raviislacode@gmail.com';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Tip = {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey:
    | 'profile.help.tip1.title'
    | 'profile.help.tip2.title'
    | 'profile.help.tip3.title';
  bodyKey:
    | 'profile.help.tip1.body'
    | 'profile.help.tip2.body'
    | 'profile.help.tip3.body';
};

const TIPS: Tip[] = [
  {
    icon: 'camera-outline',
    titleKey: 'profile.help.tip1.title',
    bodyKey: 'profile.help.tip1.body',
  },
  {
    icon: 'sunny-outline',
    titleKey: 'profile.help.tip2.title',
    bodyKey: 'profile.help.tip2.body',
  },
  {
    icon: 'bookmark-outline',
    titleKey: 'profile.help.tip3.title',
    bodyKey: 'profile.help.tip3.body',
  },
];

export function HelpSupportModal({ visible, onClose }: Props) {
  const t = useT();
  const { colors } = useTheme();

  const contactSupport = async () => {
    const subject = encodeURIComponent('GeoLens Support');
    const body = encodeURIComponent(
      'Hi GeoLens team,\n\nI need help with:\n\n'
    );
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert(t('profile.help.emailUnavailable'), SUPPORT_EMAIL);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('profile.help.emailUnavailable'), SUPPORT_EMAIL);
    }
  };

  const replayTutorial = () => {
    onClose();
    void startOnboardingFlow();
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
          <Text style={[styles.title, { color: colors.textDark }]}>
            {t('profile.help.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            {t('profile.help.intro')}
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {TIPS.map((tip, index) => (
              <View key={tip.titleKey}>
                {index > 0 ? (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                ) : null}
                <View style={styles.tipRow}>
                  <ClayIconWell size={40} fill={colors.accentSoft}>
                    <Ionicons name={tip.icon} size={18} color={colors.accentIcon} />
                  </ClayIconWell>
                  <View style={styles.tipText}>
                    <Text style={[styles.tipTitle, { color: colors.textDark }]}>
                      {t(tip.titleKey)}
                    </Text>
                    <Text style={[styles.tipBody, { color: colors.textLight }]}>
                      {t(tip.bodyKey)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <ClayButton
            title={t('profile.help.contact')}
            onPress={contactSupport}
            textStyle={{ color: colors.textOnAccent }}
            style={styles.primaryBtn}
          />
          <Pressable onPress={replayTutorial} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryText, { color: colors.textMutedStrong }]}>
              {t('profile.help.replayTutorial')}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryText, { color: colors.textMutedStrong }]}>
              {t('profile.help.done')}
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
  title: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    boxShadow: clayInset,
    marginBottom: spacing.lg,
  } as ViewStyle,
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    ...typography.subheading,
    fontSize: 15,
  },
  tipBody: {
    ...typography.small,
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    marginLeft: spacing.md,
  },
  primaryBtn: {
    marginBottom: spacing.sm,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
