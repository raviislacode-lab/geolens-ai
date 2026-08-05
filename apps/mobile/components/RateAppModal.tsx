import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as StoreReview from 'expo-store-review';
import { ClayButton } from './ClaySurface';
import { useT } from '../lib/i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { clayInset, radius, spacing, typography } from '../theme';

const FEEDBACK_EMAIL = 'support@geolens.ai';

type Step = 'rate' | 'improve' | 'thanks';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const IMPROVE_TOPICS = [
  'profile.rate.topic.accuracy',
  'profile.rate.topic.speed',
  'profile.rate.topic.design',
  'profile.rate.topic.features',
  'profile.rate.topic.bugs',
  'profile.rate.topic.other',
] as const;

type TopicKey = (typeof IMPROVE_TOPICS)[number];

export function RateAppModal({ visible, onClose }: Props) {
  const t = useT();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('rate');
  const [stars, setStars] = useState(0);
  const [topics, setTopics] = useState<TopicKey[]>([]);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep('rate');
    setStars(0);
    setTopics([]);
    setDetails('');
    setSending(false);
  }, [visible]);

  const toggleTopic = (key: TopicKey) => {
    setTopics((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const requestStoreReview = async () => {
    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
        return;
      }
      const storeUrl = StoreReview.storeUrl();
      if (storeUrl) {
        await Linking.openURL(storeUrl);
      }
    } catch {
      // Store review is best-effort; keep the thanks UI.
    }
  };

  const onPickStars = (value: number) => {
    setStars(value);
    if (value === 5) {
      setStep('thanks');
      void requestStoreReview();
    } else if (value > 0) {
      setStep('improve');
    }
  };

  const submitImprovement = async () => {
    if (topics.length === 0 && !details.trim()) {
      Alert.alert(t('profile.rate.needFeedback'));
      return;
    }
    setSending(true);
    const topicLabels = topics.map((key) => t(key)).join(', ') || '—';
    const subject = encodeURIComponent(
      `GeoLens feedback (${stars}★)`
    );
    const body = encodeURIComponent(
      [
        `Rating: ${stars} / 5`,
        `Topics: ${topicLabels}`,
        '',
        'What we could improve:',
        details.trim() || '(no details)',
        '',
        '— Sent from GeoLens',
      ].join('\n')
    );
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('profile.rate.emailUnavailable'), FEEDBACK_EMAIL);
      }
      setStep('thanks');
    } catch {
      Alert.alert(t('profile.rate.emailUnavailable'), FEEDBACK_EMAIL);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: colors.background }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.surfaceSunken }]} />

          {step === 'rate' ? (
            <>
              <Text style={[styles.title, { color: colors.textDark }]}>
                {t('profile.rate.title')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                {t('profile.rate.prompt')}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const filled = value <= stars;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => onPickStars(value)}
                      accessibilityRole="button"
                      accessibilityLabel={`${value} stars`}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.starBtn,
                        pressed && { transform: [{ scale: 0.92 }] },
                      ]}
                    >
                      <Ionicons
                        name={filled ? 'star' : 'star-outline'}
                        size={40}
                        color={filled ? '#E8B84A' : colors.textLight}
                      />
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: colors.textMutedStrong }]}>
                  {t('profile.rate.notNow')}
                </Text>
              </Pressable>
            </>
          ) : null}

          {step === 'improve' ? (
            <>
              <Text style={[styles.title, { color: colors.textDark }]}>
                {t('profile.rate.improveTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                {t('profile.rate.improveSubtitle', { n: stars })}
              </Text>

              <View style={styles.topicsWrap}>
                {IMPROVE_TOPICS.map((key) => {
                  const active = topics.includes(key);
                  return (
                    <Pressable
                      key={key}
                      onPress={() => toggleTopic(key)}
                      style={[
                        styles.topicChip,
                        {
                          backgroundColor: active
                            ? colors.accentSoft
                            : colors.surfaceSunken,
                          borderColor: active ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.topicText,
                          { color: active ? colors.accentIcon : colors.textDark },
                        ]}
                      >
                        {t(key)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textMutedStrong }]}>
                {t('profile.rate.detailsLabel')}
              </Text>
              <View
                style={[
                  styles.fieldWell,
                  {
                    backgroundColor: colors.surface,
                    boxShadow: clayInset,
                  } as ViewStyle,
                ]}
              >
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder={t('profile.rate.detailsPlaceholder')}
                  placeholderTextColor={colors.textLight}
                  style={[styles.fieldInput, { color: colors.textDark }]}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>

              <ClayButton
                title={
                  sending ? t('profile.rate.sending') : t('profile.rate.submit')
                }
                onPress={submitImprovement}
                disabled={sending}
                textStyle={{ color: colors.textOnAccent }}
                style={styles.submitBtn}
              />
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: colors.textMutedStrong }]}>
                  {t('profile.rate.notNow')}
                </Text>
              </Pressable>
            </>
          ) : null}

          {step === 'thanks' ? (
            <>
              <View style={styles.thanksIcon}>
                <Ionicons name="heart" size={36} color={colors.accentIcon} />
              </View>
              <Text style={[styles.title, { color: colors.textDark, textAlign: 'center' }]}>
                {stars === 5
                  ? t('profile.rate.thanksFive')
                  : t('profile.rate.thanksFeedback')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.text, textAlign: 'center' },
                ]}
              >
                {stars === 5
                  ? t('profile.rate.thanksFiveBody')
                  : t('profile.rate.thanksFeedbackBody')}
              </Text>
              {stars === 5 ? (
                <ClayButton
                  title={t('profile.rate.thanksFiveStore')}
                  onPress={() => {
                    void requestStoreReview();
                  }}
                  textStyle={{ color: colors.textOnAccent }}
                  style={styles.submitBtn}
                />
              ) : null}
              <ClayButton
                title={t('profile.rate.done')}
                onPress={onClose}
                variant={stars === 5 ? 'surface' : 'accent'}
                textStyle={{
                  color: stars === 5 ? colors.textDark : colors.textOnAccent,
                }}
                style={styles.submitBtn}
              />
            </>
          ) : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  starBtn: {
    padding: 4,
  },
  topicsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  topicText: {
    ...typography.small,
    fontWeight: '600',
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldWell: {
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 110,
    marginBottom: spacing.md,
  },
  fieldInput: {
    ...typography.body,
    minHeight: 90,
    paddingVertical: 0,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    ...typography.caption,
    fontWeight: '600',
  },
  thanksIcon: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
