import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayButton, ClayIconButton } from '../../components/ClaySurface';
import { updateSetting } from '../../lib/db';
import { useT } from '../../lib/i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme';

export default function OnboardingNameScreen() {
  const t = useT();
  const { colors } = useTheme();
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');

  const canContinue =
    handle.trim().replace(/^@/, '').length >= 2 && displayName.trim().length >= 2;

  const handleContinue = async () => {
    const nextHandle = handle.trim().replace(/^@/, '').toLowerCase();
    const nextName = displayName.trim();
    await Promise.all([
      updateSetting('handle', nextHandle),
      updateSetting('username', nextName),
    ]);
    router.push('/onboarding/photo');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.nav}>
          <ClayIconButton onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={21} color={colors.textMutedStrong} />
          </ClayIconButton>
          <Text style={[styles.navTitle, { color: colors.textDark }]}>
            {t('onboarding.name.title')}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            {t('onboarding.name.subtitle')}
          </Text>

          <Text style={[styles.label, { color: colors.textDark }]}>
            {t('onboarding.name.usernameLabel')}
          </Text>
          <View
            style={[
              styles.field,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.at, { color: colors.textLight }]}>@</Text>
            <TextInput
              value={handle}
              onChangeText={(text) =>
                setHandle(text.replace(/[^a-zA-Z0-9._]/g, ''))
              }
              placeholder={t('onboarding.name.usernamePlaceholder')}
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: colors.textDark }]}
              maxLength={30}
            />
          </View>
          <Text style={[styles.hint, { color: colors.textLight }]}>
            {t('onboarding.name.usernameHint')}
          </Text>

          <Text style={[styles.label, { color: colors.textDark, marginTop: spacing.lg }]}>
            {t('onboarding.name.displayLabel')}
          </Text>
          <View
            style={[
              styles.field,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('onboarding.name.displayPlaceholder')}
              placeholderTextColor={colors.textLight}
              autoCapitalize="words"
              style={[styles.input, { color: colors.textDark }]}
              maxLength={40}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={{ color: colors.textMutedStrong }}>{t('common.back')}</Text>
          </Pressable>
          <ClayButton
            title={t('common.continue')}
            onPress={handleContinue}
            disabled={!canContinue}
            textStyle={{ color: colors.textOnAccent }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  navTitle: { ...typography.heading, fontSize: 20 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  subtitle: { ...typography.body, marginBottom: spacing.lg },
  label: { ...typography.bodyBold, fontSize: 15, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  at: { ...typography.body, marginRight: 2 },
  input: { flex: 1, ...typography.body, paddingVertical: 14 },
  hint: { ...typography.small, marginTop: 8 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 12,
  },
  backLink: { alignSelf: 'center', paddingVertical: 4 },
});
