import { ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllScansForBadges,
  getShareCount,
  getUnlockedBadgeIds,
  getUnlockedBadges,
  unlockBadge,
} from './db';
import { getEntitlementState } from './entitlements';

export type BadgeCategory = 'collection' | 'type' | 'find' | 'quality' | 'habit' | 'streak' | 'special';

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  /** Custom art when available; otherwise icon / streakDays visual is used */
  image?: ImageSourcePropType;
  icon: keyof typeof Ionicons.glyphMap;
  /** Day-streak milestone — shown as a big number medallion */
  streakDays?: number;
  /** Rock-count milestone — shown as a big number medallion */
  rockCount?: number;
  /** Master badge — earned only after every other badge is unlocked */
  ultimate?: boolean;
}

export const ULTIMATE_BADGE_ID = 'master_geologist';

export interface BadgeStatus extends BadgeDef {
  unlocked: boolean;
  unlockedAt?: string;
}

type ScanRow = {
  primary_name: string;
  classification: string;
  confidence: number;
  created_at: string;
  is_favorite: boolean;
};

/** Rock-count milestones: First Rock, then 10, 25, 50, 75, 100, … */
export const ROCK_MILESTONES = [
  1, 10, 25, 50, 75, 100, 150, 200, 250, 500, 750, 1000,
] as const;

/** Unique species identified */
export const DIVERSITY_MILESTONES = [5, 10, 15, 25, 50, 75, 100] as const;

/** Favorite-count milestones */
export const FAVORITE_MILESTONES = [1, 10, 25, 50] as const;

/** Confidence thresholds (0–1) */
export const CONFIDENCE_THRESHOLDS: Array<{ id: string; title: string; min: number }> = [
  { id: 'confident_call', title: 'Confident Call', min: 0.7 },
  { id: 'sure_thing', title: 'Sure Thing', min: 0.85 },
  { id: 'near_certain', title: 'Near Certain', min: 0.95 },
  { id: 'locked_in', title: 'Locked In', min: 0.99 },
];

/** Streak milestones: 3, 5, 10, 25, 50, 100, 125, … */
export const STREAK_MILESTONES = [
  3, 5, 10, 25, 50, 100, 125, 150, 200, 250, 300, 365,
] as const;

/** Classification ladders — keep legacy starter IDs for existing unlocks */
const TYPE_LADDERS: Array<{
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  steps: Array<{ count: number; id: string; title: string }>;
}> = [
  {
    key: 'igneous',
    label: 'igneous',
    icon: 'flame',
    steps: [
      { count: 3, id: 'igneous_starter', title: 'Igneous Starter' },
      { count: 10, id: 'igneous_10', title: 'Igneous Explorer' },
      { count: 25, id: 'igneous_25', title: 'Igneous Expert' },
    ],
  },
  {
    key: 'sedimentary',
    label: 'sedimentary',
    icon: 'layers',
    steps: [
      { count: 3, id: 'sedimentary_scout', title: 'Sedimentary Scout' },
      { count: 10, id: 'sedimentary_10', title: 'Sedimentary Surveyor' },
      { count: 25, id: 'sedimentary_25', title: 'Sedimentary Scholar' },
    ],
  },
  {
    key: 'metamorphic',
    label: 'metamorphic',
    icon: 'git-merge',
    steps: [
      { count: 3, id: 'metamorphic_maven', title: 'Metamorphic Maven' },
      { count: 10, id: 'metamorphic_10', title: 'Metamorphic Mapper' },
      { count: 25, id: 'metamorphic_25', title: 'Metamorphic Master' },
    ],
  },
  {
    key: 'mineral_gem',
    label: 'mineral or gemstone',
    icon: 'sparkles',
    steps: [
      { count: 5, id: 'crystal_hunter', title: 'Crystal Hunter' },
      { count: 10, id: 'crystal_10', title: 'Crystal Collector' },
      { count: 25, id: 'crystal_25', title: 'Crystal Cabinet' },
    ],
  },
];

/** Named specimen finds */
const NAMED_FINDS: Array<{
  id: string;
  title: string;
  needle: string;
  icon: keyof typeof Ionicons.glyphMap;
  image?: ImageSourcePropType;
}> = [
  { id: 'find_granite', title: 'Granite', needle: 'granite', icon: 'cube' },
  { id: 'find_basalt', title: 'Basalt', needle: 'basalt', icon: 'planet' },
  { id: 'volcanic_glass', title: 'Volcanic Glass', needle: 'obsidian', icon: 'triangle' },
  { id: 'find_marble', title: 'Marble', needle: 'marble', icon: 'color-palette' },
  { id: 'find_limestone', title: 'Limestone', needle: 'limestone', icon: 'albums' },
  { id: 'find_sandstone', title: 'Sandstone', needle: 'sandstone', icon: 'trail-sign' },
  { id: 'find_slate', title: 'Slate', needle: 'slate', icon: 'copy' },
  { id: 'find_quartz', title: 'Quartz', needle: 'quartz', icon: 'diamond' },
  { id: 'find_quartzite', title: 'Quartzite', needle: 'quartzite', icon: 'shield' },
  { id: 'find_granodiorite', title: 'Granodiorite', needle: 'granodiorite', icon: 'cube' },
  { id: 'find_diorite', title: 'Diorite', needle: 'diorite', icon: 'ellipse' },
  { id: 'find_schist', title: 'Schist', needle: 'schist', icon: 'layers' },
  { id: 'find_gneiss', title: 'Gneiss', needle: 'gneiss', icon: 'git-branch' },
  { id: 'find_shale', title: 'Shale', needle: 'shale', icon: 'file-tray-stacked' },
  { id: 'find_flint', title: 'Flint', needle: 'flint', icon: 'flash' },
  { id: 'find_scoria', title: 'Scoria', needle: 'scoria', icon: 'flame' },
  { id: 'find_amethyst', title: 'Amethyst', needle: 'amethyst', icon: 'sparkles' },
  { id: 'find_pyrite', title: "Fool's Gold", needle: 'pyrite', icon: 'cash' },
  { id: 'find_emerald', title: 'Emerald', needle: 'emerald', icon: 'prism' },
  { id: 'find_magnetite', title: 'Magnetite', needle: 'magnetite', icon: 'magnet' },
  { id: 'find_hematite', title: 'Hematite', needle: 'hematite', icon: 'radio-button-on' },
  { id: 'find_fossil', title: 'Fossil Finder', needle: 'fossil', icon: 'leaf' },
  { id: 'find_meteorite', title: 'Space Rock', needle: 'meteorite', icon: 'rocket' },
  { id: 'find_jade', title: 'Jade', needle: 'jade', icon: 'leaf' },
  { id: 'find_turquoise', title: 'Turquoise', needle: 'turquoise', icon: 'color-fill' },
  { id: 'find_opal', title: 'Opal', needle: 'opal', icon: 'color-wand' },
  { id: 'find_garnet', title: 'Garnet', needle: 'garnet', icon: 'heart' },
  { id: 'find_feldspar', title: 'Feldspar', needle: 'feldspar', icon: 'square' },
  { id: 'find_mica', title: 'Mica', needle: 'mica', icon: 'layers' },
  { id: 'find_pumice', title: 'Pumice', needle: 'pumice', icon: 'cloudy' },
];

function collectionBadges(): BadgeDef[] {
  return ROCK_MILESTONES.map((count) => ({
    id: count === 1 ? 'first_rock' : `rocks_${count}`,
    title: count === 1 ? 'First Rock' : `${count} Rocks`,
    description:
      count === 1 ? 'Complete your first identification' : `Identify ${count} rocks`,
    category: 'collection' as const,
    icon: 'diamond' as const,
    rockCount: count,
    ...(count === 1
      ? { image: require('../assets/images/badge_first_rock.png') }
      : {}),
  }));
}

function diversityBadges(): BadgeDef[] {
  return DIVERSITY_MILESTONES.map((count) => ({
    id: `species_${count}`,
    title: count === 5 ? 'Variety Pack' : `${count} Species`,
    description: `Identify ${count} different rock or mineral types`,
    category: 'collection' as const,
    icon: 'grid' as const,
    rockCount: count,
  }));
}

function typeLadderBadges(): BadgeDef[] {
  return TYPE_LADDERS.flatMap((ladder) =>
    ladder.steps.map((step) => ({
      id: step.id,
      title: step.title,
      description: `Identify ${step.count} ${ladder.label} specimens`,
      category: 'type' as const,
      icon: ladder.icon,
    }))
  );
}

function namedFindBadges(): BadgeDef[] {
  return NAMED_FINDS.map((find) => ({
    id: find.id,
    title: find.title,
    description:
      find.id === 'volcanic_glass'
        ? 'Identify Obsidian'
        : find.id === 'find_fossil'
          ? 'Identify a fossil'
          : find.id === 'find_meteorite'
            ? 'Identify a meteorite'
            : find.id === 'find_pyrite'
              ? 'Identify Pyrite'
              : `Identify ${find.title}`,
    category: 'find' as const,
    ...(find.image ? { image: find.image } : {}),
    icon: find.icon,
  }));
}

function setBadges(): BadgeDef[] {
  return [
    {
      id: 'rock_trinity',
      title: 'Rock Trinity',
      description: 'Identify igneous, sedimentary, and metamorphic rocks',
      category: 'type' as const,
      icon: 'git-network' as const,
    },
    {
      id: 'full_spectrum',
      title: 'Full Spectrum',
      description: 'Identify a rock, a mineral, and a gemstone',
      category: 'type' as const,
      icon: 'prism' as const,
    },
  ];
}

function qualityBadges(): BadgeDef[] {
  const confidence = CONFIDENCE_THRESHOLDS.map((t) => ({
    id: t.id,
    title: t.title,
    description: `Get ${Math.round(t.min * 100)}%+ confidence on a scan`,
    category: 'quality' as const,
    icon: 'checkmark-circle' as const,
  }));

  const favorites = FAVORITE_MILESTONES.map((count) => ({
    id:
      count === 1
        ? 'first_favorite'
        : count === 10
          ? 'curator'
          : `favorites_${count}`,
    title:
      count === 1
        ? 'First Favorite'
        : count === 10
          ? 'Curator'
          : `${count} Favorites`,
    description: count === 1 ? 'Favorite a rock' : `Favorite ${count} rocks`,
    category: 'quality' as const,
    icon: (count === 1 ? 'star' : 'heart') as keyof typeof Ionicons.glyphMap,
  }));

  return [
    ...confidence,
    ...favorites,
    {
      id: 'share_the_find',
      title: 'Share the Find',
      description: 'Share an identification',
      category: 'quality',
      icon: 'share-social',
    },
    {
      id: 'share_5',
      title: 'Show & Tell',
      description: 'Share 5 identifications',
      category: 'quality',
      icon: 'megaphone',
    },
  ];
}

function habitBadges(): BadgeDef[] {
  return [
    {
      id: 'weekend_geologist',
      title: 'Weekend Geologist',
      description: 'Identify on both Saturday and Sunday',
      category: 'habit',
      icon: 'sunny',
    },
    {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Identify a rock before 8 AM',
      category: 'habit',
      icon: 'partly-sunny',
    },
    {
      id: 'night_owl',
      title: 'Night Owl',
      description: 'Identify a rock after 8 PM',
      category: 'habit',
      icon: 'moon',
    },
    {
      id: 'busy_day',
      title: 'Busy Day',
      description: 'Identify 3 rocks in a single day',
      category: 'habit',
      icon: 'flash',
    },
    {
      id: 'field_day',
      title: 'Field Day',
      description: 'Identify 10 rocks in a single day',
      category: 'habit',
      icon: 'walk',
    },
    {
      id: 'week_complete',
      title: 'Full Week',
      description: 'Identify on every day of the week',
      category: 'habit',
      icon: 'calendar',
    },
    {
      id: 'month_starter',
      title: 'Month Starter',
      description: 'Identify a rock on the 1st of a month',
      category: 'habit',
      icon: 'today',
    },
    {
      id: 'twin_find',
      title: 'Twin Find',
      description: 'Identify the same rock or mineral twice',
      category: 'habit',
      icon: 'copy',
    },
    {
      id: 'comeback_kid',
      title: 'Comeback Kid',
      description: 'Identify a rock after 7+ days away',
      category: 'habit',
      icon: 'return-down-back',
    },
  ];
}

function streakBadges(): BadgeDef[] {
  return STREAK_MILESTONES.map((days) => ({
    id: `streak_${days}`,
    title: `${days} Day Streak`,
    description: `Identify rocks ${days} days in a row`,
    category: 'streak' as const,
    icon: 'flame' as const,
    streakDays: days,
  }));
}

function specialBadges(): BadgeDef[] {
  return [
    {
      id: 'pro_member',
      title: 'Pro Member',
      description: 'Subscribe to Premium',
      category: 'special',
      icon: 'ribbon',
    },
    {
      id: 'lifetime_legend',
      title: 'Lifetime Legend',
      description: 'Unlock lifetime Premium',
      category: 'special',
      icon: 'infinite',
    },
  ];
}

function ultimateBadge(): BadgeDef {
  return {
    id: ULTIMATE_BADGE_ID,
    title: 'Master Geologist',
    description: 'Claim every badge in GeoLens',
    category: 'special',
    icon: 'trophy',
    ultimate: true,
  };
}

export const BADGES: BadgeDef[] = [
  ...collectionBadges(),
  ...diversityBadges(),
  ...typeLadderBadges(),
  ...setBadges(),
  ...namedFindBadges(),
  ...qualityBadges(),
  ...streakBadges(),
  ...habitBadges(),
  ...specialBadges(),
  ultimateBadge(),
];

export function isUltimateBadge(badge: Pick<BadgeDef, 'id' | 'ultimate'>): boolean {
  return badge.ultimate === true || badge.id === ULTIMATE_BADGE_ID;
}

/** All badges except the ultimate master badge */
export function getStandardBadges(): BadgeDef[] {
  return BADGES.filter((b) => !isUltimateBadge(b));
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function longestStreak(dates: string[]): number {
  const unique = [...new Set(dates.map(dayKey))].sort((a, b) => {
    const [ay, am, ad] = a.split('-').map(Number);
    const [by, bm, bd] = b.split('-').map(Number);
    return new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime();
  });
  if (!unique.length) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < unique.length; i++) {
    const [y1, m1, d1] = unique[i - 1].split('-').map(Number);
    const [y2, m2, d2] = unique[i].split('-').map(Number);
    const prev = new Date(y1, m1 - 1, d1);
    const next = new Date(y2, m2 - 1, d2);
    const diffDays = Math.round((next.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

function countByClass(scans: ScanRow[], needle: string): number {
  const n = needle.toLowerCase();
  return scans.filter((s) => s.classification.toLowerCase().includes(n)).length;
}

function countMineralGem(scans: ScanRow[]): number {
  return scans.filter((s) => {
    const c = s.classification.toLowerCase();
    return c.includes('mineral') || c.includes('gemstone');
  }).length;
}

function uniqueSpeciesCount(scans: ScanRow[]): number {
  return new Set(
    scans.map((s) => s.primary_name.trim().toLowerCase()).filter(Boolean)
  ).size;
}

function hasName(scans: ScanRow[], needle: string): boolean {
  const n = needle.toLowerCase();
  return scans.some((s) => {
    const name = s.primary_name.toLowerCase();
    // Avoid "quartz" matching "quartzite" and similar substring traps
    if (n === 'quartz') {
      return /\bquartz\b/.test(name) && !name.includes('quartzite');
    }
    if (n === 'jade') {
      return /\bjade\b/.test(name);
    }
    return name.includes(n);
  });
}

function maxScansInOneDay(scans: ScanRow[]): number {
  const byDay = new Map<string, number>();
  for (const s of scans) {
    const key = dayKey(s.created_at);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  let max = 0;
  for (const n of byDay.values()) max = Math.max(max, n);
  return max;
}

function hasTwinFind(scans: ScanRow[]): boolean {
  const counts = new Map<string, number>();
  for (const s of scans) {
    const key = s.primary_name.trim().toLowerCase();
    if (!key) continue;
    const next = (counts.get(key) ?? 0) + 1;
    if (next >= 2) return true;
    counts.set(key, next);
  }
  return false;
}

/** True if any two consecutive scans (by time) are at least 7 days apart. */
function hasComeback(scans: ScanRow[]): boolean {
  if (scans.length < 2) return false;
  const times = scans
    .map((s) => new Date(s.created_at).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] >= 7 * 86400000) return true;
  }
  return false;
}

function weekdaysCovered(scans: ScanRow[]): Set<number> {
  return new Set(scans.map((s) => new Date(s.created_at).getDay()));
}

/** Evaluate progress and unlock any newly earned badges. Returns newly unlocked IDs. */
export async function evaluateAndUnlockBadges(opts?: {
  justShared?: boolean;
}): Promise<string[]> {
  const [scans, unlocked] = await Promise.all([
    getAllScansForBadges(),
    getUnlockedBadgeIds(),
  ]);

  const unlockedSet = new Set(unlocked);
  const newly: string[] = [];

  const identified = scans.length;
  const favorited = scans.filter((s) => s.is_favorite).length;
  const streak = longestStreak(scans.map((s) => s.created_at));
  const weekdays = weekdaysCovered(scans);
  const maxConfidence = scans.reduce((m, s) => Math.max(m, s.confidence), 0);
  const uniqueSpecies = uniqueSpeciesCount(scans);
  const maxDay = maxScansInOneDay(scans);
  const igneous = countByClass(scans, 'igneous');
  const sedimentary = countByClass(scans, 'sedimentary');
  const metamorphic = countByClass(scans, 'metamorphic');
  const mineralGem = countMineralGem(scans);
  const hasMineral = countByClass(scans, 'mineral') >= 1;
  const hasGemstone = countByClass(scans, 'gemstone') >= 1;
  const hasRockClass =
    igneous >= 1 || sedimentary >= 1 || metamorphic >= 1 || countByClass(scans, 'rock') >= 1;

  const hours = scans.map((s) => new Date(s.created_at).getHours());
  const earlyBird = hours.some((h) => h < 8);
  const nightOwl = hours.some((h) => h >= 20);
  const monthStarter = scans.some((s) => new Date(s.created_at).getDate() === 1);

  const shareCount = await getShareCount();
  const entitlement = await getEntitlementState().catch(() => null);
  const isPremium =
    !!entitlement &&
    (entitlement.isLifetime ||
      entitlement.subscriptionStatus === 'active' ||
      entitlement.subscriptionStatus === 'trialing');

  const typeCounts: Record<string, number> = {
    igneous,
    sedimentary,
    metamorphic,
    mineral_gem: mineralGem,
  };

  const checks: Array<[string, boolean]> = [
    ...ROCK_MILESTONES.map(
      (count) =>
        [count === 1 ? 'first_rock' : `rocks_${count}`, identified >= count] as [
          string,
          boolean,
        ]
    ),
    ...DIVERSITY_MILESTONES.map(
      (count) => [`species_${count}`, uniqueSpecies >= count] as [string, boolean]
    ),
    ...TYPE_LADDERS.flatMap((ladder) =>
      ladder.steps.map(
        (step) =>
          [step.id, (typeCounts[ladder.key] ?? 0) >= step.count] as [string, boolean]
      )
    ),
    ['rock_trinity', igneous >= 1 && sedimentary >= 1 && metamorphic >= 1],
    ['full_spectrum', hasRockClass && hasMineral && hasGemstone],
    ...NAMED_FINDS.map(
      (find) => [find.id, hasName(scans, find.needle)] as [string, boolean]
    ),
    ...CONFIDENCE_THRESHOLDS.map(
      (t) => [t.id, maxConfidence >= t.min] as [string, boolean]
    ),
    ...FAVORITE_MILESTONES.map((count) => {
      const id =
        count === 1 ? 'first_favorite' : count === 10 ? 'curator' : `favorites_${count}`;
      return [id, favorited >= count] as [string, boolean];
    }),
    ['share_the_find', shareCount >= 1 || !!opts?.justShared],
    ['share_5', shareCount >= 5],
    ...STREAK_MILESTONES.map(
      (days) => [`streak_${days}`, streak >= days] as [string, boolean]
    ),
    ['weekend_geologist', weekdays.has(0) && weekdays.has(6)],
    ['early_bird', earlyBird],
    ['night_owl', nightOwl],
    ['busy_day', maxDay >= 3],
    ['field_day', maxDay >= 10],
    ['week_complete', weekdays.size >= 7],
    ['month_starter', monthStarter],
    ['twin_find', hasTwinFind(scans)],
    ['comeback_kid', hasComeback(scans)],
    ['pro_member', isPremium],
    ['lifetime_legend', !!entitlement?.isLifetime],
  ];

  for (const [id, earned] of checks) {
    if (earned && !unlockedSet.has(id)) {
      await unlockBadge(id);
      newly.push(id);
      unlockedSet.add(id);
    }
  }

  // Ultimate badge: unlock only when every other badge is claimed
  const standardIds = getStandardBadges().map((b) => b.id);
  const allStandardUnlocked = standardIds.every((id) => unlockedSet.has(id));
  if (allStandardUnlocked && !unlockedSet.has(ULTIMATE_BADGE_ID)) {
    await unlockBadge(ULTIMATE_BADGE_ID);
    newly.push(ULTIMATE_BADGE_ID);
    unlockedSet.add(ULTIMATE_BADGE_ID);
  }

  return newly;
}

export async function getBadgeStatuses(): Promise<BadgeStatus[]> {
  const unlockedRows = await getUnlockedBadges();
  const unlockedMap = new Map(unlockedRows.map((r) => [r.id, r.unlocked_at]));

  return BADGES.map((badge) => ({
    ...badge,
    unlocked: unlockedMap.has(badge.id),
    unlockedAt: unlockedMap.get(badge.id),
  }));
}

