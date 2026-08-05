import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ClaySurface, ClayButton, ClayIconWell } from './ClaySurface';
import { colors, radius, spacing, typography } from '@/theme';
import {
  activatePaidPlan,
  devBypassPaywall,
  EntitlementState,
  FREE_LIFETIME_SCANS,
  getEntitlementState,
  PlanKey as EntitlementPlanKey,
  startFreeTrial,
  TRIAL_DAYS,
} from '@/lib/entitlements';
import { useT } from '@/lib/i18n/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  /** When true, user is out of free scans — cannot dismiss without trial/subscribe */
  required?: boolean;
  onEntitlementChange?: (state: EntitlementState) => void;
}

type PlanKey = 'weekly' | 'monthly' | 'annual';

const PRICES = {
  weekly: 3.99,
  monthly: 7.99,
  annual: 39.99,
  lifetime: 69.99,
  annualSpecial: 29.99,
} as const;

const PLAN_DURATION_KEYS: Record<PlanKey, TranslationKey> = {
  weekly: 'paywall.plan.weekly',
  monthly: 'paywall.plan.monthly',
  annual: 'paywall.plan.annual',
};

const TOGGLE_OPTIONS: PlanKey[] = ['weekly', 'monthly', 'annual'];

function savingsPercent(plan: PlanKey): number | null {
  if (plan === 'weekly') return null;
  if (plan === 'monthly') {
    const weeklyEquivalent = PRICES.weekly * (52 / 12);
    return Math.round(((weeklyEquivalent - PRICES.monthly) / weeklyEquivalent) * 100);
  }
  const weeklyEquivalentYear = PRICES.weekly * 52;
  return Math.round(((weeklyEquivalentYear - PRICES.annual) / weeklyEquivalentYear) * 100);
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

type Step = 'plans' | 'special';

export function PaywallModal({
  visible,
  onClose,
  required = false,
  onEntitlementChange,
}: PaywallModalProps) {
  const t = useT();
  const [step, setStep] = useState<Step>('plans');
  const [selected, setSelected] = useState<PlanKey>('annual');
  const [busy, setBusy] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementState | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep('plans');
    setSelected('annual');
    getEntitlementState()
      .then(setEntitlement)
      .catch(() => setEntitlement(null));
  }, [visible]);

  const savePct = useMemo(() => savingsPercent(selected), [selected]);
  const selectedPrice = PRICES[selected];
  const selectedDuration = t(PLAN_DURATION_KEYS[selected]);
  const trialAvailable = entitlement?.trialAvailable ?? true;
  const freeRemaining = entitlement?.freeScansRemaining ?? FREE_LIFETIME_SCANS;
  const perks = useMemo(
    () =>
      [
        'paywall.perk.unlimited',
        'paywall.perk.confidence',
        'paywall.perk.history',
        'paywall.perk.early',
      ] as const,
    []
  );

  const requestClose = () => {
    if (required) {
      // Locked users: show special offer once, then stay locked (modal can close
      // but scanning remains gated).
      if (step === 'plans') {
        setStep('special');
        return;
      }
      onClose();
      return;
    }
    if (step === 'plans') {
      setStep('special');
      return;
    }
    onClose();
  };

  const dismissEverything = () => {
    onClose();
  };

  const finishWithState = (state: EntitlementState) => {
    setEntitlement(state);
    onEntitlementChange?.(state);
    onClose();
  };

  const handlePrimaryCta = async (plan: EntitlementPlanKey = selected) => {
    if (busy) return;
    setBusy(true);
    try {
      if (trialAvailable) {
        const state = await startFreeTrial(plan);
        if (state.tier === 'trial' || state.canScan) {
          Alert.alert(
            'Trial started',
            `You have ${TRIAL_DAYS} days of Premium free. After that, your ${plan === 'annualSpecial' ? 'annual' : plan} plan continues unless you cancel.`
          );
          finishWithState(state);
          return;
        }
      }
      // Trial already used — activate paid (StoreKit stub)
      const state = await activatePaidPlan(plan);
      finishWithState(state);
    } catch (error) {
      console.error('Paywall checkout failed:', error);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleLifetime = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const state = await activatePaidPlan('lifetime');
      Alert.alert('Lifetime unlocked', 'You now have unlimited Premium forever.');
      finishWithState(state);
    } catch (error) {
      console.error('Lifetime purchase failed:', error);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDevBypass = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const state = await devBypassPaywall();
      finishWithState(state);
    } catch (error) {
      console.error('Dev bypass failed:', error);
      Alert.alert('Dev bypass failed', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const ctaTitle = trialAvailable
    ? t('paywall.cta.trial', { days: TRIAL_DAYS })
    : t('paywall.cta.subscribe', { price: formatMoney(selectedPrice) });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={requestClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={required && step === 'plans' ? undefined : requestClose}
        />

        {step === 'plans' ? (
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <ClayIconWell size={72} fill={colors.accent} round style={styles.crownWell}>
                <MaterialCommunityIcons name="crown" size={34} color={colors.accentIcon} />
              </ClayIconWell>

              <Text style={styles.title}>{t('paywall.title')}</Text>
              <Text style={styles.subtitle}>
                {required
                  ? t('paywall.subtitle.required', { n: FREE_LIFETIME_SCANS })
                  : trialAvailable
                    ? t('paywall.subtitle.trial', {
                        n: FREE_LIFETIME_SCANS,
                        days: TRIAL_DAYS,
                      })
                    : t('paywall.subtitle.subscribe')}
              </Text>

              {required || freeRemaining <= 0 ? (
                <View style={styles.lockBanner}>
                  <Ionicons name="lock-closed" size={16} color="#2F6F5E" />
                  <Text style={styles.lockBannerText}>{t('paywall.banner.locked')}</Text>
                </View>
              ) : (
                <View style={styles.lockBanner}>
                  <Ionicons name="sparkles" size={16} color="#2F6F5E" />
                  <Text style={styles.lockBannerText}>
                    {freeRemaining === 1
                      ? t('paywall.banner.remaining_one', { n: freeRemaining })
                      : t('paywall.banner.remaining', { n: freeRemaining })}
                  </Text>
                </View>
              )}

              <View style={styles.savingsBanner}>
                {savePct != null ? (
                  <>
                    <Text style={styles.savingsLabel}>You&apos;re saving</Text>
                    <Text style={styles.savingsValue}>{savePct}%</Text>
                    <Text style={styles.savingsHint}>compared to weekly billing</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.savingsLabel}>Flexible plan</Text>
                    <Text style={styles.savingsHint}>
                      Switch to Monthly or Annual to unlock savings
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.toggleBar}>
                {TOGGLE_OPTIONS.map((key) => {
                  const active = selected === key;
                  const pct = savingsPercent(key);
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setSelected(key)}
                      style={[styles.toggleItem, active && styles.toggleItemActive]}
                    >
                      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                        {t(PLAN_DURATION_KEYS[key])}
                      </Text>
                      {pct != null ? (
                        <Text style={[styles.toggleSave, active && styles.toggleSaveActive]}>
                          Save {pct}%
                        </Text>
                      ) : (
                        <Text style={[styles.toggleSave, active && styles.toggleSaveActive]}>
                          Flexible
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <ClaySurface variant="accent" borderRadius={radius.xl} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle} numberOfLines={1}>
                    {t('paywall.title')}
                  </Text>
                  <Text style={styles.durationBadge}>{selectedDuration}</Text>
                </View>
                <Text style={styles.planPrice}>{formatMoney(selectedPrice)}</Text>
                {trialAvailable ? (
                  <Text style={styles.planSaveLine}>
                    {t('paywall.cta.trial', { days: TRIAL_DAYS })} ·{' '}
                    {formatMoney(selectedPrice)}
                  </Text>
                ) : savePct != null ? (
                  <Text style={styles.planSaveLine}>You&apos;re saving {savePct}% vs weekly</Text>
                ) : null}
              </ClaySurface>

              <View style={styles.perks}>
                {perks.map((perkKey) => (
                  <View key={perkKey} style={styles.perkRow}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.accentIcon} />
                    <Text style={styles.perkText}>{t(perkKey)}</Text>
                  </View>
                ))}
              </View>

              <ClayButton
                title={busy ? t('paywall.wait') : ctaTitle}
                onPress={() => handlePrimaryCta(selected)}
                textStyle={{ color: colors.textOnAccent }}
                style={styles.ctaBtn}
                disabled={busy}
              />
              {busy ? (
                <ActivityIndicator
                  style={{ marginTop: 8 }}
                  color={colors.accentDark}
                  size="small"
                />
              ) : null}

              <Pressable style={styles.lifetimeRow} onPress={handleLifetime} disabled={busy}>
                <Text style={styles.lifetimeText}>
                  {t('paywall.lifetime', { price: formatMoney(PRICES.lifetime) })}
                </Text>
              </Pressable>

              {!required ? (
                <ClayButton
                  title={t('paywall.continueFree')}
                  onPress={requestClose}
                  variant="alt"
                  textStyle={{ color: colors.textMutedStrong }}
                  style={styles.freeBtn}
                />
              ) : null}

              <Text style={styles.finePrint}>
                {trialAvailable
                  ? `Start a ${TRIAL_DAYS}-day free trial. After the trial, you'll be charged for the plan you chose unless you cancel. `
                  : 'Subscriptions renew automatically unless canceled. '}
                Checkout is simulated until App Store / Play Billing is connected.
              </Text>

              {__DEV__ ? (
                <Pressable
                  onPress={handleDevBypass}
                  disabled={busy}
                  style={styles.devBypass}
                >
                  <Text style={styles.devBypassText}>Dev bypass · unlock Premium</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.specialCardWrap}>
            <ClaySurface variant="surface" borderRadius={radius.xl} style={styles.specialCard} large>
              <View style={styles.specialHeader}>
                <Text style={styles.specialEyebrow}>Wait — special offer</Text>
                <Text style={[styles.durationBadge, styles.durationBadgeMuted]}>
                  {t('paywall.plan.annual')}
                </Text>
              </View>

              <ClayIconWell size={64} fill={colors.accent} round style={styles.specialCrown}>
                <MaterialCommunityIcons name="crown" size={30} color={colors.accentIcon} />
              </ClayIconWell>

              <Text style={styles.specialTitle}>{t('paywall.title')}</Text>
              <Text style={styles.specialSubtitle}>
                {trialAvailable
                  ? t('paywall.cta.trial', { days: TRIAL_DAYS })
                  : t('paywall.subtitle.subscribe')}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.compareAt}>{formatMoney(PRICES.annual)}</Text>
                <Text style={styles.specialPrice}>{formatMoney(PRICES.annualSpecial)}</Text>
              </View>
              <Text style={styles.specialDetail}>
                You&apos;re saving{' '}
                {Math.round(
                  ((PRICES.annual - PRICES.annualSpecial) / PRICES.annual) * 100
                )}
                % off the regular annual price
              </Text>

              <ClayButton
                title={
                  busy
                    ? t('paywall.wait')
                    : trialAvailable
                      ? t('paywall.cta.trial', { days: TRIAL_DAYS })
                      : t('paywall.cta.subscribe', {
                          price: formatMoney(PRICES.annualSpecial),
                        })
                }
                onPress={() => handlePrimaryCta('annualSpecial')}
                textStyle={{ color: colors.textOnAccent }}
                style={styles.claimBtn}
                disabled={busy}
              />
              <Pressable onPress={dismissEverything} style={styles.noThanks}>
                <Text style={styles.noThanksText}>{t('common.close')}</Text>
              </Pressable>
            </ClaySurface>
          </View>
        )}
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
    backgroundColor: 'rgba(45, 45, 66, 0.4)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceSunken,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  crownWell: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 26,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  lockBanner: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  lockBannerText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#2F6F5E',
  },
  savingsBanner: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  savingsLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: '#2F6F5E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
  },
  savingsValue: {
    ...typography.heading,
    fontSize: 44,
    fontWeight: '900',
    color: '#2F6F5E',
    letterSpacing: -1,
    marginVertical: 2,
  },
  savingsHint: {
    ...typography.small,
    fontWeight: '600',
    color: '#4A8A78',
    textAlign: 'center',
  },
  toggleBar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  toggleItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  toggleItemActive: {
    backgroundColor: colors.surface,
  },
  toggleLabel: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textLight,
  },
  toggleLabelActive: {
    color: colors.textDark,
  },
  toggleSave: {
    ...typography.small,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    marginTop: 2,
  },
  toggleSaveActive: {
    color: '#2F6F5E',
  },
  planCard: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  planTitle: {
    ...typography.subheading,
    fontSize: 15,
    flex: 1,
    color: colors.textOnAccent,
  },
  durationBadge: {
    ...typography.small,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    color: colors.textOnAccent,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  durationBadgeMuted: {
    color: colors.textMutedStrong,
    backgroundColor: colors.surfaceSunken,
  },
  planPrice: {
    ...typography.heading,
    fontSize: 32,
    color: colors.textOnAccent,
    marginBottom: 2,
  },
  planDetail: {
    ...typography.caption,
    fontSize: 13,
    color: colors.accentIcon,
  },
  planSaveLine: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 14,
    color: '#1F4F42',
    marginTop: 10,
  },
  perks: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: spacing.lg,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkText: {
    ...typography.body,
    fontSize: 15,
    color: colors.textDark,
    flex: 1,
  },
  ctaBtn: {
    alignSelf: 'stretch',
  },
  lifetimeRow: {
    paddingVertical: spacing.md,
  },
  lifetimeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMutedStrong,
    textAlign: 'center',
  },
  freeBtn: {
    alignSelf: 'stretch',
  },
  finePrint: {
    ...typography.small,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  devBypass: {
    marginTop: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.textLight,
    borderStyle: 'dashed',
  },
  devBypassText: {
    ...typography.small,
    fontWeight: '700',
    color: colors.textMutedStrong,
    textAlign: 'center',
  },
  specialCardWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  specialCard: {
    alignItems: 'center',
  },
  specialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  specialEyebrow: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMutedStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  specialCrown: {
    marginBottom: spacing.md,
  },
  specialTitle: {
    ...typography.heading,
    fontSize: 20,
    textAlign: 'center',
  },
  specialSubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  compareAt: {
    ...typography.subheading,
    fontSize: 18,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  specialPrice: {
    ...typography.heading,
    fontSize: 32,
    color: colors.textDark,
  },
  specialDetail: {
    ...typography.caption,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  claimBtn: {
    alignSelf: 'stretch',
  },
  noThanks: {
    paddingVertical: spacing.md,
  },
  noThanksText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMutedStrong,
  },
});
