/**
 * Settings screen — pastel claymorphic preferences.
 */
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  ViewStyle,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography, claySm } from '../theme';
import {
  ClaySurface,
  ClayIconButton,
  ClayIconWell,
  ClayChip,
  ClayButton,
} from '../components/ClaySurface';
import { ClayToggle } from '../components/ClayToggle';
import { getScanCount, getSettings, updateSetting } from '../lib/db';
import { AppSettings } from '../lib/types';
import { APP_LANGUAGES, getLanguageByCode } from '../lib/languages';
import { useI18n } from '../lib/i18n/I18nContext';
import { startOnboardingFlow } from '../lib/startOnboarding';
import { useTheme } from '../theme/ThemeContext';
import type { AppearanceMode } from '../theme';
import { AboutAppModal } from '../components/AboutAppModal';
import {
  LegalDocumentModal,
  type LegalDocKind,
} from '../components/LegalDocumentModal';
import { clearOrphanScanCache, exportScanHistory } from '../lib/exportData';

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tint?: string;
  iconColor?: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

function SettingRow({ icon, title, subtitle, tint, iconColor, right, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.6 }]}
    >
      <ClayIconWell size={44} fill={tint ?? colors.accentSoft}>
        <Ionicons name={icon} size={19} color={iconColor ?? colors.accentIcon} />
      </ClayIconWell>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{subtitle}</Text>
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={colors.textLight} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t, setLanguage } = useI18n();
  const { colors: themeColors, appearance, setAppearance } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [legalKind, setLegalKind] = useState<LegalDocKind | null>(null);
  const [busyAction, setBusyAction] = useState<'export' | 'cache' | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        try {
          const data = await getSettings();
          if (isMounted) {
            setSettings(data);
            setLoading(false);
          }
        } catch {
          if (isMounted) setLoading(false);
        }
      })();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleBackup = () => {
    Alert.alert(t('settings.backup.alertTitle'), t('settings.backup.alertBody'));
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.clearCache.confirmTitle'),
      t('settings.clearCache.confirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clearCache.clear'),
          style: 'destructive',
          onPress: async () => {
            setBusyAction('cache');
            try {
              const { removed, kept } = await clearOrphanScanCache();
              Alert.alert(
                t('settings.clearCache.doneTitle'),
                t('settings.clearCache.doneBody', { removed, kept })
              );
            } catch {
              Alert.alert(
                t('settings.clearCache.doneTitle'),
                t('settings.clearCache.doneBody', { removed: 0, kept: 0 })
              );
            } finally {
              setBusyAction(null);
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (busyAction) return;
    setBusyAction('export');
    try {
      const count = await getScanCount();
      if (count === 0) {
        Alert.alert(t('settings.export.emptyTitle'), t('settings.export.emptyBody'));
        return;
      }
      const result = await exportScanHistory();
      Alert.alert(
        t('settings.export.doneTitle'),
        t('settings.export.doneBody', { count: result.count })
      );
    } catch {
      Alert.alert(t('settings.export.errorTitle'), t('settings.export.errorBody'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggle = async (key: keyof AppSettings, value: boolean | string) => {
    if (!settings) return;
    try {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await updateSetting(key, value);
      if (key === 'language' && typeof value === 'string') {
        setLanguage(value);
      }
      if (key === 'appearance' && (value === 'clay' || value === 'classic')) {
        setAppearance(value);
      }
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
    }
  };

  const handleAppearance = (mode: AppearanceMode) => {
    handleToggle('appearance', mode);
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={themeColors.accentDark} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.navBar}>
        <ClayIconButton onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={21} color={colors.textMutedStrong} />
        </ClayIconButton>
        <Text style={styles.navTitle}>{t('settings.title')}</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t('settings.section.preferences')}</Text>
        <ClaySurface noPadding style={styles.card}>
          <SettingRow
            icon="globe-outline"
            title={t('settings.language')}
            subtitle={getLanguageByCode(settings.language).nativeName}
            onPress={() => setLanguageOpen(true)}
            right={
              <ClayChip label={getLanguageByCode(settings.language).name} />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="create-outline"
            title={t('settings.units')}
            subtitle={t('settings.units.subtitle')}
            right={
              <View style={styles.segmented}>
                {(['metric', 'imperial'] as const).map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => handleToggle('units', unit)}
                    style={[
                      styles.segment,
                      settings.units === unit && styles.segmentActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        settings.units === unit && styles.segmentTextActive,
                      ]}
                    >
                      {unit === 'metric'
                        ? t('settings.units.metric')
                        : t('settings.units.imperial')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="color-palette-outline"
            title={t('settings.appearance')}
            subtitle={t('settings.appearance.subtitle')}
            right={
              <View style={styles.segmented}>
                {(['clay', 'classic'] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    onPress={() => handleAppearance(mode)}
                    style={[
                      styles.segment,
                      (settings.appearance ?? appearance) === mode &&
                        styles.segmentActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        (settings.appearance ?? appearance) === mode &&
                          styles.segmentTextActive,
                      ]}
                    >
                      {mode === 'clay'
                        ? t('settings.appearance.clay')
                        : t('settings.appearance.classic')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="notifications-outline"
            title={t('settings.notifications')}
            subtitle={t('settings.notifications.subtitle')}
            right={
              <ClayToggle
                value={settings.notifications_enabled}
                onValueChange={(v) => handleToggle('notifications_enabled', v)}
              />
            }
          />
        </ClaySurface>

        <Text style={styles.sectionLabel}>{t('settings.section.scanning')}</Text>
        <ClaySurface noPadding style={styles.card}>
          <SettingRow
            icon="camera-outline"
            title={t('settings.autoSave')}
            subtitle={t('settings.autoSave.subtitle')}
            right={
              <ClayToggle
                value={settings.auto_save}
                onValueChange={(v) => handleToggle('auto_save', v)}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="sparkles-outline"
            title={t('settings.confidence')}
            subtitle={t('settings.confidence.subtitle')}
            right={
              <ClayToggle
                value={settings.show_confidence}
                onValueChange={(v) => handleToggle('show_confidence', v)}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="cloud-offline-outline"
            title={t('settings.offline')}
            subtitle={t('settings.offline.subtitle')}
            right={
              <ClayToggle
                value={false}
                disabled
                onValueChange={() =>
                  Alert.alert(
                    t('settings.offline.alertTitle'),
                    t('settings.offline.alertBody')
                  )
                }
              />
            }
          />
        </ClaySurface>

        <Text style={styles.sectionLabel}>{t('settings.section.data')}</Text>
        <ClaySurface noPadding style={styles.card}>
          <SettingRow
            icon="cloud-upload-outline"
            title={t('settings.backup')}
            subtitle={t('settings.backup.subtitle')}
            onPress={handleBackup}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="trash-bin-outline"
            title={t('settings.clearCache')}
            subtitle={t('settings.clearCache.subtitle')}
            onPress={busyAction === 'cache' ? undefined : handleClearCache}
            right={
              busyAction === 'cache' ? (
                <ActivityIndicator color={colors.accentIcon} />
              ) : undefined
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="server-outline"
            title={t('settings.export')}
            subtitle={t('settings.export.subtitle')}
            onPress={busyAction === 'export' ? undefined : handleExport}
            right={
              busyAction === 'export' ? (
                <ActivityIndicator color={colors.accentIcon} />
              ) : undefined
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="map-outline"
            title={t('settings.replayOnboarding')}
            subtitle={t('settings.replayOnboarding.subtitle')}
            onPress={startOnboardingFlow}
          />
        </ClaySurface>

        <Text style={styles.sectionLabel}>{t('settings.section.about')}</Text>
        <ClaySurface noPadding style={styles.card}>
          <SettingRow
            icon="information-circle-outline"
            title={t('settings.aboutApp')}
            subtitle={t('settings.aboutApp.subtitle')}
            onPress={() => setAboutOpen(true)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="shield-outline"
            title={t('settings.privacy')}
            subtitle={t('settings.privacy.subtitle')}
            onPress={() => setLegalKind('privacy')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="document-text-outline"
            title={t('settings.terms')}
            subtitle={t('settings.terms.subtitle')}
            onPress={() => setLegalKind('terms')}
          />
        </ClaySurface>

        <ClayButton
          title={t('settings.done')}
          onPress={() => router.back()}
          variant="accent"
          textStyle={{ color: colors.textOnAccent }}
          style={styles.doneBtn}
        />
      </ScrollView>

      <AboutAppModal visible={aboutOpen} onClose={() => setAboutOpen(false)} />
      <LegalDocumentModal
        visible={legalKind !== null}
        kind={legalKind ?? 'privacy'}
        onClose={() => setLegalKind(null)}
      />

      <Modal
        visible={languageOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setLanguageOpen(false)}
      >
        <View style={styles.langOverlay}>
          <Pressable
            style={styles.langBackdrop}
            onPress={() => setLanguageOpen(false)}
          />
          <View style={styles.langSheet}>
            <View style={styles.langHandle} />
            <Text style={styles.langTitle}>{t('settings.language.sheetTitle')}</Text>
            <Text style={styles.langSubtitle}>
              {t('settings.language.sheetSubtitle')}
            </Text>
            <FlatList
              data={APP_LANGUAGES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.langList}
              renderItem={({ item }) => {
                const active = settings.language === item.code;
                return (
                  <Pressable
                    onPress={async () => {
                      await handleToggle('language', item.code);
                      setLanguageOpen(false);
                    }}
                    style={[styles.langRow, active && styles.langRowActive]}
                  >
                    <View style={styles.langTextCol}>
                      <Text
                        style={[styles.langName, active && styles.langNameActive]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.langNative}>{item.nativeName}</Text>
                    </View>
                    {active ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.accentIcon}
                      />
                    ) : (
                      <View style={{ width: 22 }} />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  navTitle: {
    ...typography.heading,
    fontSize: 22,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },
  sectionLabel: {
    ...typography.subheading,
    fontSize: 15,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  rowDesc: {
    ...typography.small,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginLeft: 58,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.full,
    padding: 3,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    boxShadow: claySm,
  } as ViewStyle,
  segmentText: {
    ...typography.small,
    fontSize: 12,
  },
  segmentTextActive: {
    color: colors.textDark,
    fontWeight: '600',
  },
  doneBtn: {
    marginTop: spacing.sm,
  },
  langOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  langBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 45, 66, 0.4)',
  },
  langSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.md,
  },
  langHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceSunken,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  langTitle: {
    ...typography.heading,
    fontSize: 22,
    textAlign: 'center',
  },
  langSubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  langList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: 6,
    gap: 12,
  },
  langRowActive: {
    backgroundColor: colors.accentSoft,
  },
  langTextCol: {
    flex: 1,
  },
  langName: {
    ...typography.subheading,
    fontSize: 15,
  },
  langNameActive: {
    color: '#2F6F5E',
  },
  langNative: {
    ...typography.small,
    color: colors.textLight,
    marginTop: 2,
  },
});
