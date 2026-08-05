import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme';
import { ClaySurface, ClayIconButton } from '../components/ClaySurface';
import {
  BadgeArt,
  BadgeDetailModal,
  BadgeTile,
} from '../components/BadgeSection';
import {
  BadgeStatus,
  evaluateAndUnlockBadges,
  getBadgeStatuses,
  isUltimateBadge,
} from '../lib/badges';
import { getBadgePalette } from '../lib/badgeColors';
import { useBadgeUnlockOptional } from '../context/BadgeUnlockContext';
import { useT } from '../lib/i18n/I18nContext';

const SCREEN_H = Dimensions.get('window').height;

export default function BadgesScreen() {
  const t = useT();
  const [badges, setBadges] = useState<BadgeStatus[]>([]);
  const [selected, setSelected] = useState<BadgeStatus | null>(null);
  const params = useLocalSearchParams<{ celebrate?: string }>();
  const unlock = useBadgeUnlockOptional();
  const scrollRef = useRef<ScrollView>(null);
  const slotRefs = useRef<Record<string, View | null>>({});

  const celebrateId = unlock?.activeBadge?.id ?? params.celebrate ?? null;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          await evaluateAndUnlockBadges();
          const statuses = await getBadgeStatuses();
          if (mounted) setBadges(statuses);
        } catch (error) {
          console.error('Failed to load badges:', error);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const { standardBadges, ultimateBadge } = useMemo(() => {
    const ultimate = badges.find((b) => isUltimateBadge(b)) ?? null;
    const standard = badges.filter((b) => !isUltimateBadge(b));
    return { standardBadges: standard, ultimateBadge: ultimate };
  }, [badges]);

  const measureAndReport = useCallback(() => {
    if (!unlock || !celebrateId) return;
    const node = slotRefs.current[celebrateId];
    if (!node) return;

    node.measureInWindow((x, y, width, height) => {
      if (width < 24 || height < 24) return;
      if (y < 40 || y > SCREEN_H - 40) return;
      unlock.reportFlightTarget({ x, y, width, height });
    });
  }, [celebrateId, unlock]);

  useEffect(() => {
    if (!celebrateId || !badges.length || !unlock) return;

    const index = standardBadges.findIndex((b) => b.id === celebrateId);
    if (index >= 0) {
      const row = Math.floor(index / 3);
      scrollRef.current?.scrollTo({ y: Math.max(0, row * 112 - 24), animated: false });
    } else if (ultimateBadge?.id === celebrateId) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }

    const timers = [80, 200, 400, 700, 1100].map((ms) =>
      setTimeout(measureAndReport, ms)
    );

    return () => timers.forEach(clearTimeout);
  }, [celebrateId, badges, unlock, measureAndReport, standardBadges, ultimateBadge]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const ultimatePalette = ultimateBadge ? getBadgePalette(ultimateBadge) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.navBar}>
        <ClayIconButton onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={21} color={colors.textMutedStrong} />
        </ClayIconButton>
        <Text style={styles.navTitle}>{t('badges.title')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={measureAndReport}
        onMomentumScrollEnd={measureAndReport}
      >
        <Text style={styles.progress}>
          {t('badges.progress', { n: unlockedCount, total: badges.length })}
        </Text>

        <ClaySurface borderRadius={radius.xl} style={styles.card} large>
          <View style={styles.grid}>
            {standardBadges.map((badge) => {
              const landing = !!unlock?.isLanding(badge.id);
              return (
                <BadgeTile
                  key={badge.id}
                  badge={badge}
                  hideArt={landing}
                  highlight={landing}
                  onArtLayout={(art) => {
                    slotRefs.current[badge.id] = art;
                    if (badge.id === celebrateId) {
                      requestAnimationFrame(measureAndReport);
                    }
                  }}
                  onPress={() => setSelected(badge)}
                />
              );
            })}
          </View>
        </ClaySurface>

        {ultimateBadge && ultimatePalette ? (
          <View style={styles.ultimateWrap}>
            <Text style={styles.ultimateEyebrow}>{t('badges.ultimate')}</Text>
            <Pressable
              onPress={() => setSelected(ultimateBadge)}
              style={styles.ultimatePress}
            >
              <View
                ref={(node) => {
                  slotRefs.current[ultimateBadge.id] = node;
                }}
                collapsable={false}
                onLayout={() => {
                  const node = slotRefs.current[ultimateBadge.id];
                  if (node && ultimateBadge.id === celebrateId) {
                    requestAnimationFrame(measureAndReport);
                  }
                }}
                style={[
                  styles.ultimateArt,
                  !ultimateBadge.unlocked && styles.ultimateLocked,
                  unlock?.isLanding(ultimateBadge.id) && styles.ultimateHidden,
                ]}
              >
                {!unlock?.isLanding(ultimateBadge.id) ? (
                  <BadgeArt badge={ultimateBadge} size={96} />
                ) : null}
                {!ultimateBadge.unlocked && !unlock?.isLanding(ultimateBadge.id) ? (
                  <View style={styles.ultimateLock}>
                    <Ionicons name="lock-closed" size={20} color={colors.textMutedStrong} />
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.ultimateTitle,
                  ultimateBadge.unlocked
                    ? { color: ultimatePalette.title }
                    : styles.ultimateTitleLocked,
                ]}
              >
                {ultimateBadge.title}
              </Text>
              <Text style={styles.ultimateDesc}>{ultimateBadge.description}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingBottom: 48,
  },
  progress: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMutedStrong,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  card: {
    paddingVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  ultimateWrap: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  ultimateEyebrow: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#8A6A20',
    marginBottom: spacing.sm,
  },
  ultimatePress: {
    alignItems: 'center',
    width: '100%',
  },
  ultimateArt: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ultimateLocked: {
    opacity: 0.45,
  },
  ultimateHidden: {
    opacity: 0.2,
    borderWidth: 1.5,
    borderColor: '#8A6A20',
    borderStyle: 'dashed',
    borderRadius: 60,
  },
  ultimateLock: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ultimateTitle: {
    ...typography.heading,
    fontSize: 20,
    textAlign: 'center',
  },
  ultimateTitleLocked: {
    color: colors.textLight,
  },
  ultimateDesc: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.lg,
  },
});
