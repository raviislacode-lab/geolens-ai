import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayButton } from './ClaySurface';
import { ClayToggle } from './ClayToggle';
import { useT } from '../lib/i18n/I18nContext';
import {
  DEFAULT_PRIVACY_PREFERENCES,
  getPrivacyPreferences,
  savePrivacyPreferences,
  type PrivacyPreferences,
} from '../lib/privacy';
import { useTheme } from '../theme/ThemeContext';
import { clayInset, radius, spacing, typography } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function PrivacySettingsModal({ visible, onClose }: Props) {
  const t = useT();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<PrivacyPreferences>(DEFAULT_PRIVACY_PREFERENCES);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const next = await getPrivacyPreferences();
        if (!cancelled) setPrefs(next);
      } catch {
        if (!cancelled) setPrefs(DEFAULT_PRIVACY_PREFERENCES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const updatePref = async <K extends keyof PrivacyPreferences>(
    key: K,
    value: PrivacyPreferences[K]
  ) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await savePrivacyPreferences(next);
    } catch (error) {
      console.error('Failed to save privacy preferences:', error);
    } finally {
      setSaving(false);
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
          <Text style={[styles.title, { color: colors.textDark }]}>
            {t('profile.privacy.title')}
          </Text>
          <Text style={[styles.placeholder, { color: colors.text }]}>
            {t('profile.privacy.placeholder')}
          </Text>

          {loading ? (
            <ActivityIndicator
              style={styles.loader}
              color={colors.accentDark}
            />
          ) : (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.textDark }]}>
                    {t('profile.privacy.analytics')}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textLight }]}>
                    {t('profile.privacy.analytics.subtitle')}
                  </Text>
                </View>
                <ClayToggle
                  value={prefs.analytics_enabled}
                  onValueChange={(v) => updatePref('analytics_enabled', v)}
                  disabled={saving}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.textDark }]}>
                    {t('profile.privacy.personalized')}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textLight }]}>
                    {t('profile.privacy.personalized.subtitle')}
                  </Text>
                </View>
                <ClayToggle
                  value={prefs.personalized_tips}
                  onValueChange={(v) => updatePref('personalized_tips', v)}
                  disabled={saving}
                />
              </View>
            </View>
          )}

          <ClayButton
            title={t('profile.privacy.done')}
            onPress={onClose}
            textStyle={{ color: colors.textOnAccent }}
            style={styles.doneBtn}
          />
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
  placeholder: {
    ...typography.caption,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    boxShadow: clayInset,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...typography.subheading,
    fontSize: 15,
  },
  rowSubtitle: {
    ...typography.small,
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    marginLeft: spacing.md,
  },
  doneBtn: {
    marginTop: spacing.lg,
  },
});
