import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ClayButton,
  ClayIconButton,
  ClayIconWell,
  ClaySurface,
} from '../../components/ClaySurface';
import { updateSetting } from '../../lib/db';
import { notifyOnboardingComplete } from '../../lib/onboardingEvents';
import { useT } from '../../lib/i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme';
import type { TranslationKey } from '../../lib/i18n';

type TargetId =
  | 'brand'
  | 'capture'
  | 'crown'
  | 'cameraTab'
  | 'historyTab'
  | 'profile'
  | 'filter'
  | 'badges'
  | null;

type Spot = {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  target: TargetId;
  handSide: 'left' | 'right' | 'bottom';
};

const STEPS: Spot[] = [
  {
    titleKey: 'onboarding.tutorial.step1.title',
    bodyKey: 'onboarding.tutorial.step1.body',
    target: 'brand',
    handSide: 'bottom',
  },
  {
    titleKey: 'onboarding.tutorial.step2.title',
    bodyKey: 'onboarding.tutorial.step2.body',
    target: 'capture',
    handSide: 'bottom',
  },
  {
    titleKey: 'onboarding.tutorial.step3.title',
    bodyKey: 'onboarding.tutorial.step3.body',
    target: 'crown',
    handSide: 'bottom',
  },
  {
    titleKey: 'onboarding.tutorial.step4.title',
    bodyKey: 'onboarding.tutorial.step4.body',
    target: 'cameraTab',
    handSide: 'bottom',
  },
  {
    titleKey: 'onboarding.tutorial.step5.title',
    bodyKey: 'onboarding.tutorial.step5.body',
    target: 'historyTab',
    handSide: 'left',
  },
  {
    titleKey: 'onboarding.tutorial.step6.title',
    bodyKey: 'onboarding.tutorial.step6.body',
    target: 'profile',
    handSide: 'bottom',
  },
  {
    titleKey: 'onboarding.tutorial.step7.title',
    bodyKey: 'onboarding.tutorial.step7.body',
    target: 'filter',
    handSide: 'left',
  },
  {
    titleKey: 'onboarding.tutorial.step8.title',
    bodyKey: 'onboarding.tutorial.step8.body',
    target: 'badges',
    handSide: 'bottom',
  },
  {
    titleKey: 'onboarding.tutorial.step9.title',
    bodyKey: 'onboarding.tutorial.step9.body',
    target: null,
    handSide: 'bottom',
  },
];

const PAD = 8;

type Rect = { left: number; top: number; width: number; height: number };

export default function OnboardingTutorialScreen() {
  const t = useT();
  const { colors } = useTheme();
  const { height: screenH } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);

  const rootRef = useRef<View>(null);
  const targets = useRef<Partial<Record<Exclude<TargetId, null>, View | null>>>({});

  const spot = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const measureSpotlight = useCallback(() => {
    const targetId = STEPS[step].target;
    if (!targetId) {
      setSpotlight(null);
      return;
    }
    const node = targets.current[targetId];
    const root = rootRef.current;
    if (!node || !root) return;

    root.measureInWindow((rootX, rootY) => {
      node.measureInWindow((x, y, width, height) => {
        if (width < 8 || height < 8) return;
        setSpotlight({
          left: Math.max(0, x - rootX - PAD),
          top: Math.max(0, y - rootY - PAD),
          width: width + PAD * 2,
          height: height + PAD * 2,
        });
      });
    });
  }, [step]);

  useEffect(() => {
    setSpotlight(null);
    const id = requestAnimationFrame(() => {
      // Layout can settle a frame later on larger devices
      setTimeout(measureSpotlight, 32);
      setTimeout(measureSpotlight, 120);
    });
    return () => cancelAnimationFrame(id);
  }, [step, measureSpotlight]);

  const finish = async () => {
    await updateSetting('onboarding_complete', true);
    notifyOnboardingComplete();
    router.replace('/(tabs)');
  };

  const next = () => {
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  const bind = (id: Exclude<TargetId, null>) => (node: View | null) => {
    targets.current[id] = node;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View
        ref={rootRef}
        style={styles.rootMeasure}
        onLayout={measureSpotlight}
      >
      {/* App chrome mock — targets are measured for the spotlight */}
      <View style={styles.mock} pointerEvents="none" onLayout={measureSpotlight}>
        <View style={styles.mockHeader}>
          <View ref={bind('crown')} collapsable={false}>
            <ClayIconButton>
              <MaterialCommunityIcons
                name="crown"
                size={20}
                color={colors.textMutedStrong}
              />
            </ClayIconButton>
          </View>

          <View ref={bind('brand')} collapsable={false} style={styles.mockBrand}>
            <Text style={[styles.mockTitle, { color: colors.textDark }]}>
              {t('home.title')}
            </Text>
            <Text style={[styles.mockSub, { color: colors.textLight }]}>
              {t('home.subtitle')}
            </Text>
          </View>

          <View ref={bind('profile')} collapsable={false}>
            <ClayIconButton>
              <Ionicons name="person" size={20} color={colors.textMutedStrong} />
            </ClayIconButton>
          </View>
        </View>

        <View ref={bind('capture')} collapsable={false}>
          <ClaySurface borderRadius={radius.xl} style={styles.mockHero} large>
            <View style={styles.heroRow}>
              <ClayIconWell size={64} fill={colors.accent} round>
                <Ionicons name="camera" size={26} color={colors.accentIcon} />
              </ClayIconWell>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroTitle, { color: colors.textDark }]}>
                  {t('home.heroTitle')}
                </Text>
                <Text style={[styles.heroSub, { color: colors.text }]}>
                  {t('home.heroSubtitle')}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.fakeCta,
                { backgroundColor: colors.accent, borderColor: colors.border },
              ]}
            >
              <Ionicons name="camera" size={18} color={colors.textOnAccent} />
              <Text style={{ color: colors.textOnAccent, fontWeight: '600' }}>
                {t('home.captureCta')}
              </Text>
            </View>
          </ClaySurface>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.section, { color: colors.textDark, marginBottom: 0 }]}>
            {t('home.recentTitle')}
          </Text>
          <View
            ref={bind('filter')}
            collapsable={false}
            style={[
              styles.fakeFilter,
              { backgroundColor: colors.accentSoft, borderColor: colors.border },
            ]}
          >
            <Ionicons name="funnel-outline" size={16} color={colors.accentIcon} />
          </View>
        </View>

        <ClaySurface variant="inset" style={styles.empty}>
          <Text style={{ color: colors.textLight }}>{t('home.emptyTitle')}</Text>
        </ClaySurface>

        <View
          ref={bind('badges')}
          collapsable={false}
          style={[
            styles.fakeBadges,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.section, { color: colors.textDark, marginBottom: 0 }]}>
            {t('badges.title')}
          </Text>
          <Text style={{ color: colors.textLight, marginTop: 4 }}>{t('badges.hint')}</Text>
        </View>

        <View
          style={[
            styles.fakeTabs,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.tabItem}>
            <Ionicons name="home" size={22} color={colors.textMutedStrong} />
            <Text style={[styles.tabLbl, { color: colors.textMutedStrong }]}>
              {t('tabs.home')}
            </Text>
          </View>

          <View ref={bind('cameraTab')} collapsable={false} style={styles.cameraTab}>
            <View style={[styles.cameraRing, { backgroundColor: colors.ring }]}>
              <View style={[styles.cameraDisc, { backgroundColor: colors.accent }]}>
                <Ionicons name="camera" size={24} color={colors.accentIcon} />
              </View>
            </View>
          </View>

          <View ref={bind('historyTab')} collapsable={false} style={styles.tabItem}>
            <Ionicons name="time-outline" size={22} color={colors.textMutedStrong} />
            <Text style={[styles.tabLbl, { color: colors.textMutedStrong }]}>
              {t('tabs.history')}
            </Text>
          </View>
        </View>
      </View>

      {/* Scrim + measured cutout (pointer is a child so it always moves with the box) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {spotlight ? (
          <>
            <View style={[styles.scrim, { top: 0, height: spotlight.top }]} />
            <View style={{ flexDirection: 'row', height: spotlight.height }}>
              <View style={[styles.scrim, { width: spotlight.left }]} />
              <View
                style={{
                  width: spotlight.width,
                  height: spotlight.height,
                  borderRadius: 18,
                  borderWidth: 2.5,
                  borderColor: colors.accent,
                  backgroundColor: 'transparent',
                  overflow: 'visible',
                }}
              >
                {/* Scan-style corner ticks */}
                <View style={[styles.corner, styles.cornerTL, { borderColor: colors.accent }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: colors.accent }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: colors.accent }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: colors.accent }]} />

                <View
                  style={[
                    styles.pointerAnchor,
                    spot.handSide === 'bottom' && styles.pointerBottom,
                    spot.handSide === 'left' && styles.pointerLeft,
                    spot.handSide === 'right' && styles.pointerRight,
                  ]}
                >
                  <View
                    style={[
                      styles.handWell,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Ionicons
                      name="hand-left"
                      size={26}
                      color={colors.accentIcon}
                      style={
                        spot.handSide === 'bottom'
                          ? { transform: [{ rotate: '-90deg' }] }
                          : spot.handSide === 'right'
                            ? { transform: [{ rotate: '180deg' }] }
                            : undefined
                      }
                    />
                  </View>
                </View>
              </View>
              <View style={[styles.scrim, { flex: 1 }]} />
            </View>
            <View style={[styles.scrim, { flex: 1 }]} />
          </>
        ) : (
          <View style={[styles.scrim, StyleSheet.absoluteFillObject]} />
        )}
      </View>

      {/* Dock tip at top for camera/history steps so tab bar stays visible */}
      <View
        style={[
          styles.tipCardWrap,
          { maxHeight: screenH * 0.42 },
          // 4/9 camera + 5/9 history → top; otherwise bottom
          step === 3 || step === 4 ? styles.tipCardTop : styles.tipCardBottom,
        ]}
        pointerEvents="box-none"
      >
        <ClaySurface borderRadius={radius.xl} style={styles.tipCard} large>
          <Text style={[styles.progress, { color: colors.textLight }]}>
            {step + 1} / {STEPS.length}
          </Text>
          <Text style={[styles.tipTitle, { color: colors.textDark }]}>
            {t(spot.titleKey)}
          </Text>
          <Text style={[styles.tipBody, { color: colors.text }]}>{t(spot.bodyKey)}</Text>

          <View style={styles.tipActions}>
            <Pressable onPress={finish} hitSlop={8}>
              <Text style={{ color: colors.textMutedStrong }}>
                {t('onboarding.tutorial.skip')}
              </Text>
            </Pressable>
            <View style={styles.tipBtns}>
              {step > 0 ? (
                <Pressable onPress={back} style={styles.secondaryBtn}>
                  <Text style={{ color: colors.textMutedStrong }}>{t('common.back')}</Text>
                </Pressable>
              ) : null}
              <ClayButton
                title={
                  isLast
                    ? t('onboarding.tutorial.finish')
                    : t('onboarding.tutorial.gotIt')
                }
                onPress={next}
                compact
                textStyle={{ color: colors.textOnAccent }}
                style={styles.nextBtn}
              />
            </View>
          </View>
        </ClaySurface>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rootMeasure: { flex: 1 },
  mock: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  mockBrand: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  mockTitle: { ...typography.heading, fontSize: 20 },
  mockSub: { ...typography.small },
  mockHero: { gap: spacing.md, marginBottom: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTitle: { ...typography.heading, fontSize: 18 },
  heroSub: { ...typography.caption, marginTop: 4 },
  fakeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  section: { ...typography.subheading, marginBottom: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: 28, marginBottom: spacing.md },
  fakeBadges: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 18,
    marginBottom: 110,
  },
  fakeTabs: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 16,
    height: 88,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabItem: { alignItems: 'center', width: 72, gap: 4 },
  tabLbl: { ...typography.small, fontSize: 12 },
  cameraTab: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  cameraRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraDisc: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeFilter: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  scrim: {
    backgroundColor: 'rgba(30, 30, 45, 0.58)',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#9EAFAC',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  pointerAnchor: {
    position: 'absolute',
    zIndex: 2,
  },
  pointerBottom: {
    left: '50%',
    marginLeft: -22,
    bottom: -52,
  },
  pointerLeft: {
    left: -52,
    top: '50%',
    marginTop: -22,
  },
  pointerRight: {
    right: -52,
    top: '50%',
    marginTop: -22,
  },
  handWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  tipCardWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 6,
  },
  tipCardTop: {
    top: spacing.md,
    bottom: undefined,
  },
  tipCardBottom: {
    bottom: spacing.md,
    top: undefined,
  },
  tipCard: { gap: 8 },
  progress: { ...typography.small, fontWeight: '600' },
  tipTitle: { ...typography.heading, fontSize: 20 },
  tipBody: { ...typography.body, lineHeight: 22 },
  tipActions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tipBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secondaryBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  nextBtn: { minWidth: 120 },
});
