import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayButton } from './ClaySurface';
import { useT } from '../lib/i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, typography } from '../theme';

export type LegalDocKind = 'privacy' | 'terms';

const LEGAL_URLS: Record<LegalDocKind, string> = {
  privacy: 'https://raviislacode-lab.github.io/geolens-ai/privacy.html',
  terms: 'https://raviislacode-lab.github.io/geolens-ai/terms.html',
};

type Props = {
  visible: boolean;
  kind: LegalDocKind;
  onClose: () => void;
};

export function LegalDocumentModal({ visible, kind, onClose }: Props) {
  const t = useT();
  const { colors } = useTheme();

  const title =
    kind === 'privacy' ? t('legal.privacy.title') : t('legal.terms.title');
  const webUrl = LEGAL_URLS[kind];

  const openWebsite = () => {
    void Linking.openURL(webUrl);
  };

  const sections =
    kind === 'privacy'
      ? ([
          ['legal.privacy.s1.title', 'legal.privacy.s1.body'],
          ['legal.privacy.s2.title', 'legal.privacy.s2.body'],
          ['legal.privacy.s3.title', 'legal.privacy.s3.body'],
          ['legal.privacy.s4.title', 'legal.privacy.s4.body'],
          ['legal.privacy.s5.title', 'legal.privacy.s5.body'],
          ['legal.privacy.s6.title', 'legal.privacy.s6.body'],
          ['legal.privacy.s7.title', 'legal.privacy.s7.body'],
          ['legal.privacy.s8.title', 'legal.privacy.s8.body'],
          ['legal.privacy.s9.title', 'legal.privacy.s9.body'],
        ] as const)
      : ([
          ['legal.terms.s1.title', 'legal.terms.s1.body'],
          ['legal.terms.s2.title', 'legal.terms.s2.body'],
          ['legal.terms.s3.title', 'legal.terms.s3.body'],
          ['legal.terms.s4.title', 'legal.terms.s4.body'],
          ['legal.terms.s5.title', 'legal.terms.s5.body'],
          ['legal.terms.s6.title', 'legal.terms.s6.body'],
          ['legal.terms.s7.title', 'legal.terms.s7.body'],
          ['legal.terms.s8.title', 'legal.terms.s8.body'],
          ['legal.terms.s9.title', 'legal.terms.s9.body'],
          ['legal.terms.s10.title', 'legal.terms.s10.body'],
          ['legal.terms.s11.title', 'legal.terms.s11.body'],
          ['legal.terms.s12.title', 'legal.terms.s12.body'],
        ] as const);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: colors.background }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.surfaceSunken }]} />
          <Text style={[styles.title, { color: colors.textDark }]}>{title}</Text>
          <Text style={[styles.updated, { color: colors.textLight }]}>
            {t('legal.updated')}
          </Text>
          <Pressable
            onPress={openWebsite}
            accessibilityRole="link"
            style={styles.linkRow}
          >
            <Text style={[styles.linkText, { color: colors.accentIcon }]}>
              {t('legal.viewOnline')}
            </Text>
            <Text style={[styles.linkUrl, { color: colors.textMutedStrong }]} numberOfLines={1}>
              {webUrl}
            </Text>
          </Pressable>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map(([titleKey, bodyKey]) => (
              <View key={titleKey} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textDark }]}>
                  {t(titleKey)}
                </Text>
                <Text style={[styles.sectionBody, { color: colors.text }]}>
                  {t(bodyKey)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <ClayButton
            title={t('legal.done')}
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 45, 66, 0.35)',
  },
  sheet: {
    maxHeight: '88%',
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
  title: { ...typography.heading, fontSize: 22 },
  updated: { ...typography.small, marginTop: 4, marginBottom: spacing.sm },
  linkRow: { marginBottom: spacing.md },
  linkText: { ...typography.caption, fontWeight: '700' },
  linkUrl: { ...typography.small, marginTop: 4 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.subheading, fontSize: 16, marginBottom: 6 },
  sectionBody: { ...typography.caption, lineHeight: 21 },
  doneBtn: { marginTop: spacing.sm },
});
