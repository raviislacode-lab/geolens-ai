import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayButton } from '../../components/ClaySurface';
import { APP_LANGUAGES } from '../../lib/languages';
import { updateSetting } from '../../lib/db';
import { useI18n } from '../../lib/i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme';

export default function OnboardingLanguageScreen() {
  const { t, language, setLanguage } = useI18n();
  const { colors } = useTheme();
  const [selected, setSelected] = useState(language || 'en');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (language) setSelected(language);
  }, [language]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APP_LANGUAGES;
    return APP_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [query]);

  const applyLanguage = async (code: string) => {
    setSelected(code);
    setLanguage(code);
    await updateSetting('language', code);
  };

  const handleContinue = async () => {
    await applyLanguage(selected);
    router.push('/onboarding/name');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.header}>
        <Text style={[styles.welcome, { color: colors.textDark }]}>
          {t('onboarding.language.welcome')}
        </Text>
        <Text style={[styles.tagline, { color: colors.text }]}>
          {t('onboarding.language.tagline')}
        </Text>
        <Text style={[styles.title, { color: colors.textDark }]}>
          {t('onboarding.language.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          {t('onboarding.language.subtitle')}
        </Text>
      </View>

      <View
        style={[
          styles.search,
          { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.textLight} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.language.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          style={[styles.searchInput, { color: colors.textDark }]}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = selected === item.code;
          return (
            <Pressable
              onPress={() => {
                void applyLanguage(item.code);
              }}
              style={[
                styles.row,
                {
                  backgroundColor: active ? colors.accentSoft : colors.surface,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowName, { color: colors.textDark }]}>
                  {item.name}
                </Text>
                <Text style={[styles.rowNative, { color: colors.textLight }]}>
                  {item.nativeName}
                </Text>
              </View>
              {active ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.accentIcon} />
              ) : (
                <View style={{ width: 22 }} />
              )}
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <ClayButton
          title={t('common.continue')}
          onPress={handleContinue}
          textStyle={{ color: colors.textOnAccent }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  welcome: { ...typography.heading, fontSize: 24 },
  tagline: { ...typography.caption, marginTop: 4 },
  title: { ...typography.subheading, marginTop: spacing.lg },
  subtitle: { ...typography.small, marginTop: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: 16,
    height: 46,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  searchInput: { flex: 1, ...typography.body, fontSize: 15 },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowName: { ...typography.subheading, fontSize: 15 },
  rowNative: { ...typography.small, marginTop: 2 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
});
