import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
  Platform,
  ViewStyle,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { deleteScanImage } from '../../lib/files';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';
import {
  ClaySurface,
  ClayIconButton,
  ClayIconWell,
  ClayButton,
  ClayChip,
} from '../../components/ClaySurface';
import { LimitationBanner } from '../../components/LimitationBanner';
import { FirstScanCelebrationModal } from '../../components/FirstScanCelebrationModal';
import { getScan, toggleFavorite, deleteScan, getSettings } from '../../lib/db';
import { incrementShareCount } from '../../lib/db';
import { IdentificationResult, ScanRecord, AppSettings } from '../../lib/types';
import { evaluateAndCelebrate } from '../../lib/celebrateBadges';
import { useBadgeUnlockOptional } from '../../context/BadgeUnlockContext';
import { useT } from '../../lib/i18n/I18nContext';

export default function ResultDetailScreen() {
  const t = useT();
  const { id, is_temp, first_scan } = useLocalSearchParams<{
    id: string;
    is_temp?: string;
    first_scan?: string;
  }>();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [firstScanOpen, setFirstScanOpen] = useState(first_scan === 'true');
  const unlock = useBadgeUnlockOptional();

  useEffect(() => {
    async function loadData() {
      try {
        const record = await getScan(id);
        const appSettings = await getSettings();
        setSettings(appSettings);
        if (record) {
          setScan(record);
          setIsFavorited(record.is_favorite);
          setResult(JSON.parse(record.raw_json) as IdentificationResult);
        }
      } catch (error) {
        console.error('Failed to load scan detail:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleFavoriteToggle = async () => {
    try {
      setIsFavorited(await toggleFavorite(id));
      await evaluateAndCelebrate(unlock?.celebrateBadges).catch(() => {});
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const confidence = Math.round(result.confidence * 100);
    const message = t('result.share.message', {
      name: result.primary_identification,
      classification: result.classification,
      confidence,
    });
    try {
      const imageUri = scan?.image_uri;
      if (imageUri && Platform.OS === 'ios') {
        await Share.share({ message, url: imageUri });
      } else if (imageUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: message,
          UTI: 'public.jpeg',
        });
      } else {
        await Share.share({ message });
      }
      await incrementShareCount().catch(() => {});
      await evaluateAndCelebrate(unlock?.celebrateBadges, { justShared: true }).catch(() => {});
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert(t('result.share.errorTitle'), t('result.share.errorBody'));
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Scan', 'Permanently delete this scan and its photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (scan?.image_uri) {
              deleteScanImage(scan.image_uri);
            }
            await deleteScan(id);
            router.back();
          } catch (error) {
            console.error('Failed to delete scan:', error);
          }
        },
      },
    ]);
  };

  const handleSaveToHistory = () => {
    Alert.alert('Saved', 'Scan saved to your history.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  const handleDiscardTemp = async () => {
    try {
      if (scan?.image_uri) {
        deleteScanImage(scan.image_uri);
      }
      await deleteScan(id);
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={colors.accentDark} />
      </View>
    );
  }

  if (!scan || !result) {
    return (
      <View style={styles.errorContainer}>
        <ClayIconWell size={70} fill={colors.errorSoft} round>
          <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
        </ClayIconWell>
        <Text style={styles.errorText}>{t('result.notFound')}</Text>
        <ClayButton
          title={t('result.goHome')}
          onPress={() => router.replace('/(tabs)')}
          textStyle={{ color: colors.textOnAccent }}
        />
      </View>
    );
  }

  const confidencePercentage = (result.confidence * 100).toFixed(0);
  const facts = result.specimen_facts;
  const colorsLabel = result.visual_features.dominant_colors?.join(', ') || 'Various';

  const usesLabel = Array.isArray(facts?.common_uses)
    ? facts.common_uses.join(', ')
    : 'Unknown';
  const factColorsLabel =
    Array.isArray(facts?.colors) && facts.colors.length
      ? facts.colors.join(', ')
      : colorsLabel;

  const detailRows = [
    {
      icon: 'flask-outline' as const,
      label: 'Chemical Composition',
      value: facts?.chemical_composition || 'Unknown',
    },
    {
      icon: 'earth-outline' as const,
      label: 'Formation',
      value: facts?.formation || 'Unknown',
    },
    {
      icon: 'hammer-outline' as const,
      label: 'Common Uses',
      value: usesLabel,
    },
    {
      icon: 'location-outline' as const,
      label: 'Found In',
      value: facts?.found_in || 'Unknown',
    },
  ];

  const aboutBody =
    facts?.about ||
    result.reasoning ||
    'No detailed description is available for this specimen yet.';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FirstScanCelebrationModal
        visible={firstScanOpen}
        rockName={result.primary_identification}
        onClose={() => setFirstScanOpen(false)}
        onViewBadges={() => {
          setFirstScanOpen(false);
          router.push('/badges');
        }}
      />
      <View style={styles.navBar}>
        <ClayIconButton onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={21} color={colors.textMutedStrong} />
        </ClayIconButton>
        <Text style={styles.navTitle} numberOfLines={1}>
          {result.primary_identification}
        </Text>
        <ClayIconButton onPress={handleDelete}>
          <Ionicons name="ellipsis-horizontal" size={19} color={colors.textMutedStrong} />
        </ClayIconButton>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}>
          <ClayChip
            label={result.classification}
            variant="alt"
            textStyle={{ color: colors.textMutedStrong }}
          />
          {settings?.show_confidence && (
            <ClayChip
              label={t('result.matchPct', { n: confidencePercentage })}
              variant="alt"
              textStyle={{ color: colors.textMutedStrong }}
            />
          )}
        </View>

        {scan.image_uri ? (
          <ClaySurface
            borderRadius={radius.xl}
            noPadding
            clip
            style={styles.photoCard}
          >
            <Image source={{ uri: scan.image_uri }} style={styles.photo} resizeMode="contain" />
          </ClaySurface>
        ) : null}

        {/* Quick facts — 3-column clay stats card */}
        <ClaySurface style={styles.quickBar} noPadding borderRadius={radius.xl} large>
          <View style={styles.quickItem}>
            <ClayIconWell size={44} fill={colors.surface} round>
              <Ionicons name="diamond" size={18} color={colors.textMutedStrong} />
            </ClayIconWell>
            <Text style={styles.quickLbl}>Rock Type</Text>
            <Text style={styles.quickVal} numberOfLines={2}>
              {facts?.rock_type || result.classification.split(' ')[0] || 'Unknown'}
            </Text>
          </View>
          <View style={styles.quickDivider} />
          <View style={styles.quickItem}>
            <ClayIconWell size={44} fill={colors.surface} round>
              <Ionicons name="location" size={18} color={colors.textMutedStrong} />
            </ClayIconWell>
            <Text style={styles.quickLbl}>Hardness</Text>
            <Text style={styles.quickVal} numberOfLines={2}>
              {facts?.hardness ? `${facts.hardness} (Mohs)` : 'Unknown'}
            </Text>
          </View>
          <View style={styles.quickDivider} />
          <View style={styles.quickItem}>
            <ClayIconWell size={44} fill={colors.surface} round>
              <Ionicons name="triangle" size={17} color={colors.textMutedStrong} />
            </ClayIconWell>
            <Text style={styles.quickLbl}>Color</Text>
            <Text style={styles.quickVal} numberOfLines={2}>
              {colorsLabel}
            </Text>
          </View>
        </ClaySurface>

        {(result.limitations.length > 0 || result.recommend_physical_test) && (
          <LimitationBanner
            limitations={result.limitations}
            recommendPhysicalTest={result.recommend_physical_test}
          />
        )}

        {/* About */}
        <ClaySurface variant="surface" borderRadius={radius.xl} style={styles.aboutCard} large>
          <Text style={styles.sectionTitle}>
            {t('result.about', { name: result.primary_identification })}
          </Text>
          <Text style={styles.aboutText}>{aboutBody}</Text>

          {facts?.about && result.reasoning ? (
            <>
              <Text style={styles.aboutSubhead}>{t('result.whyMatch')}</Text>
              <Text style={styles.aboutText}>{result.reasoning}</Text>
            </>
          ) : null}

          {result.observations?.length ? (
            <>
              <Text style={styles.aboutSubhead}>{t('result.noticed')}</Text>
              {result.observations.map((obs, i) => (
                <Text key={`${obs}-${i}`} style={styles.aboutBullet}>
                  • {obs}
                </Text>
              ))}
            </>
          ) : null}

          {facts ? (
            <>
              <Text style={styles.aboutSubhead}>{t('result.keyFacts')}</Text>
              <Text style={styles.aboutFact}>
                <Text style={styles.aboutFactLabel}>Type: </Text>
                {facts.rock_type}
              </Text>
              <Text style={styles.aboutFact}>
                <Text style={styles.aboutFactLabel}>Hardness: </Text>
                {facts.hardness}
              </Text>
              <Text style={styles.aboutFact}>
                <Text style={styles.aboutFactLabel}>Typical colors: </Text>
                {factColorsLabel}
              </Text>
              <Text style={styles.aboutFact}>
                <Text style={styles.aboutFactLabel}>Composition: </Text>
                {facts.chemical_composition}
              </Text>
              <Text style={styles.aboutFact}>
                <Text style={styles.aboutFactLabel}>Formation: </Text>
                {facts.formation}
              </Text>
              <Text style={styles.aboutFact}>
                <Text style={styles.aboutFactLabel}>Common uses: </Text>
                {usesLabel}
              </Text>
              <Text style={styles.aboutFact}>
                <Text style={styles.aboutFactLabel}>Where found: </Text>
                {facts.found_in}
              </Text>
            </>
          ) : null}

          {result.assumptions?.length ? (
            <>
              <Text style={styles.aboutSubhead}>Assumptions</Text>
              {result.assumptions.map((a, i) => (
                <Text key={`${a}-${i}`} style={styles.aboutBullet}>
                  • {a}
                </Text>
              ))}
            </>
          ) : null}

          <ClayButton
            title="Learn More"
            onPress={() =>
              Linking.openURL(
                `https://en.wikipedia.org/wiki/${encodeURIComponent(
                  result.primary_identification
                )}`
              ).catch(() => {})
            }
            icon={<Ionicons name="book-outline" size={18} color={colors.textOnAccent} />}
            textStyle={{ color: colors.textOnAccent }}
            style={styles.learnMoreBtn}
          />
        </ClaySurface>

        {/* Details */}
        <Text style={styles.groupLabel}>Details</Text>
        <ClaySurface noPadding style={styles.detailsCard}>
          {detailRows.map((row, i) => (
            <View key={row.label}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.detailRow}>
                <ClayIconWell size={40} fill={colors.surface}>
                  <Ionicons name={row.icon} size={17} color={colors.textMutedStrong} />
                </ClayIconWell>
                <View style={styles.detailText}>
                  <Text style={styles.detailLbl}>{row.label}</Text>
                  <Text style={styles.detailVal} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ClaySurface>

        {/* Visual features */}
        <Text style={styles.groupLabel}>Visual Features</Text>
        <ClaySurface noPadding style={styles.detailsCard}>
          {[
            ['Grain Size', result.visual_features.grain_size],
            ['Texture', result.visual_features.texture],
            ['Luster', result.visual_features.luster],
            ['Colors', colorsLabel],
          ].map(([lbl, val], i) => (
            <View key={lbl as string}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.featureRow}>
                <Text style={styles.featureLbl}>{lbl}</Text>
                <Text style={styles.featureVal}>{val || 'Unknown'}</Text>
              </View>
            </View>
          ))}
        </ClaySurface>

        {/* Actions */}
        <View style={styles.actionsGroup}>
          {is_temp === 'true' ? (
            <>
              <ClayButton
                title="Save to History"
                onPress={handleSaveToHistory}
                textStyle={{ color: colors.textOnAccent }}
              />
              <ClayButton
                title="Discard Scan"
                onPress={handleDiscardTemp}
                variant="alt"
              />
            </>
          ) : (
            <View style={styles.buttonRow}>
              <ClayButton
                title={isFavorited ? t('result.favorited') : t('result.favorite')}
                onPress={handleFavoriteToggle}
                variant="alt"
                icon={
                  <Ionicons
                    name={isFavorited ? 'star' : 'star-outline'}
                    size={18}
                    color={colors.textMutedStrong}
                  />
                }
                textStyle={{ color: colors.textMutedStrong }}
                style={{ flex: 1 }}
              />
              <ClayButton
                title={t('result.share')}
                onPress={handleShare}
                variant="alt"
                icon={<Ionicons name="share-outline" size={18} color={colors.textMutedStrong} />}
                textStyle={{ color: colors.textMutedStrong }}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    ...typography.subheading,
    color: colors.textLight,
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  navTitle: {
    ...typography.heading,
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  photoCard: {
    height: 260,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceSunken,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 22,
    paddingHorizontal: 8,
    marginBottom: spacing.md,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  quickDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    opacity: 0.45,
    marginVertical: 8,
  },
  quickLbl: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMutedStrong,
  },
  quickVal: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMutedStrong,
    textAlign: 'center',
    lineHeight: 18,
  },
  aboutCard: {
    marginBottom: spacing.lg,
    alignItems: 'stretch',
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  aboutText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  aboutSubhead: {
    ...typography.subheading,
    fontSize: 15,
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  aboutBullet: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginBottom: 4,
  },
  aboutFact: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 2,
  },
  aboutFactLabel: {
    fontWeight: '600',
    color: colors.textDark,
  },
  learnMoreBtn: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    minWidth: '70%',
  },
  groupLabel: {
    ...typography.subheading,
    fontSize: 15,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  detailsCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  detailText: {
    flex: 1,
  },
  detailLbl: {
    ...typography.small,
    marginBottom: 2,
  },
  detailVal: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    gap: spacing.md,
  },
  featureLbl: {
    ...typography.body,
    fontSize: 15,
  },
  featureVal: {
    ...typography.bodyBold,
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'right',
  },
  actionsGroup: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
