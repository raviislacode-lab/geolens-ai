import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
  ViewStyle,
  Modal,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography, clayInsetStack } from '../../theme';
import { ClaySurface, ClayIconButton, ClayIconWell } from '../../components/ClaySurface';
import { ScanListItem } from '../../components/ScanListItem';
import { searchScans, formatTimestamp } from '../../lib/db';
import { ScanRecord } from '../../lib/types';
import { useI18n } from '../../lib/i18n/I18nContext';
import type { TranslationKey } from '../../lib/i18n';
import { useTheme } from '../../theme/ThemeContext';

type SortKey = 'newest' | 'oldest' | 'name_az' | 'name_za' | 'confidence' | 'type';

const SORT_OPTION_META: Array<{
  key: SortKey;
  labelKey: TranslationKey;
  detailKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    key: 'newest',
    labelKey: 'history.sort.newest',
    detailKey: 'history.sort.newestDetail',
    icon: 'time-outline',
  },
  {
    key: 'oldest',
    labelKey: 'history.sort.oldest',
    detailKey: 'history.sort.oldestDetail',
    icon: 'hourglass-outline',
  },
  {
    key: 'name_az',
    labelKey: 'history.sort.nameAz',
    detailKey: 'history.sort.nameAzDetail',
    icon: 'text-outline',
  },
  {
    key: 'name_za',
    labelKey: 'history.sort.nameZa',
    detailKey: 'history.sort.nameZaDetail',
    icon: 'text-outline',
  },
  {
    key: 'confidence',
    labelKey: 'history.sort.confidence',
    detailKey: 'history.sort.confidenceDetail',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'type',
    labelKey: 'history.sort.type',
    detailKey: 'history.sort.typeDetail',
    icon: 'layers-outline',
  },
];

export default function HistoryScreen() {
  const { t, language } = useI18n();
  const { colors: themeColors } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const sortOptions = useMemo(
    () =>
      SORT_OPTION_META.map((option) => ({
        ...option,
        label: t(option.labelKey),
        detail: t(option.detailKey),
      })),
    [t]
  );

  const loadScans = async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await searchScans(searchQuery);
      setScans(results);
    } catch (error) {
      console.error('Error searching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadScans(query);
    }, [query])
  );

  const displayedScans = useMemo(() => {
    const base = filter === 'favorites' ? scans.filter((s) => s.is_favorite) : scans;
    const list = [...base];

    switch (sort) {
      case 'oldest':
        list.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'name_az':
        list.sort((a, b) => a.primary_name.localeCompare(b.primary_name));
        break;
      case 'name_za':
        list.sort((a, b) => b.primary_name.localeCompare(a.primary_name));
        break;
      case 'confidence':
        list.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'type':
        list.sort((a, b) => {
          const byType = a.classification.localeCompare(b.classification);
          if (byType !== 0) return byType;
          return a.primary_name.localeCompare(b.primary_name);
        });
        break;
      case 'newest':
      default:
        list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    return list;
  }, [scans, filter, sort]);

  const groupedData = useMemo(() => {
    if (sort === 'type') {
      const groups: { [key: string]: ScanRecord[] } = {};
      displayedScans.forEach((scan) => {
        const title = scan.classification.trim() || t('history.group.other');
        if (!groups[title]) groups[title] = [];
        groups[title].push(scan);
      });
      return Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([title, data]) => ({ title, data }));
    }

    if (sort === 'name_az' || sort === 'name_za' || sort === 'confidence') {
      return [
        {
          title:
            sortOptions.find((o) => o.key === sort)?.label ??
            t('history.sort.newest'),
          data: displayedScans,
        },
      ];
    }

    // Date groups for newest / oldest
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    const locale = language.startsWith('es') ? 'es' : language;

    const groups: { [key: string]: ScanRecord[] } = {};
    const order: string[] = [];

    displayedScans.forEach((scan) => {
      const date = new Date(scan.created_at);
      const dateStr = date.toDateString();
      let groupTitle = date.toLocaleDateString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (dateStr === today) groupTitle = t('history.group.today');
      else if (dateStr === yesterdayStr) groupTitle = t('history.group.yesterday');
      if (!groups[groupTitle]) {
        groups[groupTitle] = [];
        order.push(groupTitle);
      }
      groups[groupTitle].push(scan);
    });

    return order.map((title) => ({ title, data: groups[title] }));
  }, [displayedScans, sort, sortOptions, t, language]);

  const activeSortLabel =
    sortOptions.find((o) => o.key === sort)?.label ?? t('history.sort.newest');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <ClayIconButton onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={21} color={themeColors.textMutedStrong} />
        </ClayIconButton>

        <Text style={styles.title}>{t('history.title')}</Text>

        <ClayIconButton onPress={() => setSortOpen(true)}>
          <Ionicons name="funnel-outline" size={19} color={themeColors.textMutedStrong} />
        </ClayIconButton>
      </View>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchWell,
            {
              backgroundColor: themeColors.surfaceSunken,
              boxShadow: clayInsetStack(),
            } as ViewStyle,
          ]}
        >
          <Ionicons name="search-outline" size={19} color={themeColors.textLight} />
          <TextInput
            placeholder={t('history.searchPlaceholder')}
            placeholderTextColor={themeColors.textLight}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={19}
              color={colors.textLight}
              onPress={() => setQuery('')}
            />
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        <ClaySurface
          variant={filter === 'all' ? 'accent' : 'alt'}
          onPress={() => setFilter('all')}
          borderRadius={radius.md}
          noPadding
          compact
          style={styles.filterBtn}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            {t('history.filter.all')}
          </Text>
        </ClaySurface>
        <ClaySurface
          variant={filter === 'favorites' ? 'accent' : 'alt'}
          onPress={() => setFilter('favorites')}
          borderRadius={radius.md}
          noPadding
          compact
          style={styles.filterBtn}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'favorites' && styles.filterTextActive,
            ]}
          >
            {t('history.filter.favorites')}
          </Text>
        </ClaySurface>
      </View>

      <Text style={styles.sortHint}>
        {t('history.sortedBy', { label: activeSortLabel })}
      </Text>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.accentDark}
          style={styles.loader}
        />
      ) : groupedData.length === 0 || displayedScans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ClaySurface variant="inset" style={styles.emptyCard}>
            <ClayIconWell size={64} fill={colors.surface} round>
              <Ionicons
                name={filter === 'favorites' ? 'star-outline' : 'search-outline'}
                size={28}
                color={colors.textMutedStrong}
              />
            </ClayIconWell>
            <Text style={styles.emptyText}>
              {filter === 'favorites'
                ? t('history.empty.favoritesTitle')
                : t('history.empty.searchTitle')}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'favorites'
                ? t('history.empty.favoritesSubtitle')
                : t('history.empty.searchSubtitle')}
            </Text>
          </ClaySurface>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{item.title}</Text>
              {item.data.map((scan) => (
                <ScanListItem
                  key={scan.id}
                  name={scan.primary_name}
                  classification={scan.classification}
                  timestamp={formatTimestamp(scan.created_at)}
                  imageUri={scan.image_uri}
                  onPress={() => router.push(`/result/${scan.id}` as never)}
                />
              ))}
            </View>
          )}
        />
      )}

      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setSortOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('history.sort.sheetTitle')}</Text>
            <Text style={styles.sheetSubtitle}>
              {t('history.sort.sheetSubtitle')}
            </Text>

            {sortOptions.map((option) => {
              const active = sort === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    setSort(option.key);
                    setSortOpen(false);
                  }}
                  style={[styles.sortRow, active && styles.sortRowActive]}
                >
                  <View
                    style={[
                      styles.sortIconWell,
                      active && { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={active ? colors.accentIcon : colors.textMutedStrong}
                    />
                  </View>
                  <View style={styles.sortTextCol}>
                    <Text style={[styles.sortLabel, active && styles.sortLabelActive]}>
                      {option.label}
                    </Text>
                    <Text style={styles.sortDetail}>{option.detail}</Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accentIcon} />
                  ) : (
                    <View style={{ width: 22 }} />
                  )}
                </Pressable>
              );
            })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 22,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchWell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    height: 50,
    borderRadius: radius.full,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 15,
    color: colors.textDark,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  filterText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 14,
    color: colors.textMutedStrong,
  },
  filterTextActive: {
    color: colors.textOnAccent,
  },
  sortHint: {
    ...typography.small,
    fontWeight: '600',
    color: colors.textLight,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    width: '100%',
    gap: 10,
  },
  emptyText: {
    ...typography.subheading,
    color: colors.textLight,
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 19,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 130,
  },
  groupContainer: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    ...typography.small,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 45, 66, 0.4)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '78%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceSunken,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.heading,
    fontSize: 22,
    textAlign: 'center',
  },
  sheetSubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    marginBottom: 6,
    backgroundColor: colors.surface,
  },
  sortRowActive: {
    backgroundColor: colors.accentSoft,
  },
  sortIconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortTextCol: {
    flex: 1,
  },
  sortLabel: {
    ...typography.subheading,
    fontSize: 15,
  },
  sortLabelActive: {
    color: '#2F6F5E',
  },
  sortDetail: {
    ...typography.small,
    color: colors.textLight,
    marginTop: 2,
  },
});
