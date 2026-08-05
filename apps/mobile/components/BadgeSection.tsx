import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ClaySurface, ClayIconWell, ClayButton } from './ClaySurface';
import { FindBadgeGlyph, hasFindGlyph } from './badgeGlyphs';
import { colors, radius, spacing, typography } from '@/theme';
import {
  BadgeStatus,
  evaluateAndUnlockBadges,
  getBadgeStatuses,
} from '@/lib/badges';
import { getBadgePalette, LOCKED_PALETTE } from '@/lib/badgeColors';
import { useT } from '@/lib/i18n/I18nContext';

function CountMedallion({
  value,
  unlocked,
  size = 56,
  fill,
  ink,
}: {
  value: number;
  unlocked: boolean;
  size?: number;
  fill: string;
  ink: string;
}) {
  const fontSize = value >= 1000 ? size * 0.22 : value >= 100 ? size * 0.28 : size * 0.36;
  return (
    <View
      style={[
        styles.streakWell,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: unlocked ? fill : LOCKED_PALETTE.fill,
        },
      ]}
    >
      <Text
        style={[
          styles.streakNumber,
          {
            fontSize,
            color: unlocked ? ink : LOCKED_PALETTE.ink,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function BadgeArt({ badge, size = 56 }: { badge: BadgeStatus; size?: number }) {
  const palette = getBadgePalette(badge);

  if (badge.image) {
    return (
      <View
        style={[
          styles.imageWell,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            backgroundColor: badge.unlocked ? palette.fill : LOCKED_PALETTE.fill,
          },
        ]}
      >
        <Image
          source={badge.image}
          style={{ width: size + 4, height: size + 4 }}
          resizeMode="contain"
        />
      </View>
    );
  }
  if (badge.streakDays != null) {
    return (
      <CountMedallion
        value={badge.streakDays}
        unlocked={badge.unlocked}
        size={size}
        fill={palette.fill}
        ink={palette.ink}
      />
    );
  }
  if (badge.rockCount != null) {
    return (
      <CountMedallion
        value={badge.rockCount}
        unlocked={badge.unlocked}
        size={size}
        fill={palette.fill}
        ink={palette.ink}
      />
    );
  }
  return (
    <ClayIconWell
      size={size}
      fill={badge.unlocked ? palette.fill : LOCKED_PALETTE.fill}
      round
    >
      {hasFindGlyph(badge.id) ? (
        <FindBadgeGlyph
          id={badge.id}
          size={size * 0.5}
          color={badge.unlocked ? palette.ink : LOCKED_PALETTE.ink}
        />
      ) : (
        <Ionicons
          name={badge.icon}
          size={size * 0.46}
          color={badge.unlocked ? palette.ink : LOCKED_PALETTE.ink}
        />
      )}
    </ClayIconWell>
  );
}

export function BadgeTile({
  badge,
  onPress,
  hideArt = false,
  onArtLayout,
  highlight = false,
}: {
  badge: BadgeStatus;
  onPress: () => void;
  /** Hide art while the fly-in overlay owns the visual */
  hideArt?: boolean;
  onArtLayout?: (art: View) => void;
  highlight?: boolean;
}) {
  const artRef = React.useRef<View>(null);

  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <View
        ref={artRef}
        collapsable={false}
        onLayout={() => {
          if (artRef.current && onArtLayout) onArtLayout(artRef.current);
        }}
        style={[
          styles.tileArt,
          !badge.unlocked && styles.tileLocked,
          highlight && styles.tileHighlight,
          hideArt && styles.tileArtHidden,
        ]}
      >
        {!hideArt ? <BadgeArt badge={badge} size={56} /> : null}
        {!badge.unlocked && !hideArt ? (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={16} color={colors.textMutedStrong} />
          </View>
        ) : null}
      </View>
      <Text
        style={[
          styles.tileTitle,
          !badge.unlocked && styles.tileTitleLocked,
          badge.unlocked && { color: getBadgePalette(badge).title },
        ]}
        numberOfLines={2}
      >
        {badge.title}
      </Text>
    </Pressable>
  );
}

export function BadgeDetailModal({
  badge,
  onClose,
}: {
  badge: BadgeStatus | null;
  onClose: () => void;
}) {
  const t = useT();
  const palette = badge ? getBadgePalette(badge) : null;

  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        {badge && palette ? (
          <ClaySurface variant="surface" borderRadius={radius.xl} style={styles.detailCard} large>
            <ScrollView contentContainerStyle={styles.detailContent}>
              <View style={[styles.detailArt, !badge.unlocked && styles.tileLocked]}>
                <BadgeArt badge={badge} size={88} />
              </View>

              <Text style={[styles.detailTitle, badge.unlocked && { color: palette.title }]}>
                {badge.title}
              </Text>
              <Text style={[styles.detailStatus, { color: badge.unlocked ? palette.ink : colors.textLight }]}>
                {badge.unlocked ? t('badges.status.unlocked') : t('badges.status.locked')}
              </Text>
              <Text style={styles.detailDesc}>{badge.description}</Text>

              <ClayButton
                title={t('badges.close')}
                onPress={onClose}
                variant="alt"
                textStyle={{ color: colors.textMutedStrong }}
                style={styles.closeBtn}
              />
            </ScrollView>
          </ClaySurface>
        ) : null}
      </View>
    </Modal>
  );
}

/** Compact profile preview — first 3 badges + See All */
export function BadgeSection() {
  const t = useT();
  const [badges, setBadges] = useState<BadgeStatus[]>([]);
  const [selected, setSelected] = useState<BadgeStatus | null>(null);

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

  const preview = badges.filter((b) => !b.ultimate).slice(0, 3);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('badges.title')}</Text>
        <Pressable onPress={() => router.push('/badges')} hitSlop={8}>
          <Text style={styles.seeAll}>{t('badges.seeAll')}</Text>
        </Pressable>
      </View>

      <ClaySurface borderRadius={radius.xl} style={styles.card} large>
        <Text style={styles.cardHint}>{t('badges.hint')}</Text>

        <View style={styles.grid}>
          {preview.map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              onPress={() => setSelected(badge)}
            />
          ))}
        </View>
      </ClaySurface>

      <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 15,
  },
  seeAll: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMutedStrong,
  },
  card: {
    paddingVertical: spacing.md,
  },
  cardHint: {
    ...typography.caption,
    marginBottom: spacing.md,
    lineHeight: 19,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  tile: {
    width: '30%',
    alignItems: 'center',
  },
  tileArt: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  imageWell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileArtHidden: {
    opacity: 0.2,
    borderWidth: 1.5,
    borderColor: colors.accentIcon,
    borderStyle: 'dashed',
    borderRadius: 36,
  },
  tileHighlight: {
    transform: [{ scale: 1.04 }],
  },
  streakWell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    ...typography.heading,
    fontWeight: '900',
  },
  tileLocked: {
    opacity: 0.45,
  },
  lockOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    ...typography.small,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.textDark,
    lineHeight: 14,
  },
  tileTitleLocked: {
    color: colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 45, 66, 0.4)',
  },
  detailCard: {
    maxHeight: '70%',
  },
  detailContent: {
    alignItems: 'center',
  },
  detailArt: {
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    ...typography.heading,
    fontSize: 22,
    textAlign: 'center',
  },
  detailStatus: {
    ...typography.caption,
    fontWeight: '700',
    color: '#2F6F5E',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  detailDesc: {
    ...typography.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  closeBtn: {
    alignSelf: 'stretch',
  },
});
