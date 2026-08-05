import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';
import {
  ClaySurface,
  ClayIconButton,
  ClayIconWell,
  ClayButton,
} from '../../components/ClaySurface';
import { ScanListItem } from '../../components/ScanListItem';
import { PaywallModal } from '../../components/PaywallModal';
import { getRecentScans, formatTimestamp } from '../../lib/db';
import { ScanRecord } from '../../lib/types';
import {
  EntitlementState,
  FREE_LIFETIME_SCANS,
  getEntitlementState,
} from '../../lib/entitlements';
import { openScanner } from '../../lib/openScanner';
import { useT } from '../../lib/i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';

export default function HomeScreen() {
  const t = useT();
  const { colors: themeColors } = useTheme();
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallRequired, setPaywallRequired] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementState | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      async function loadData() {
        try {
          const [scans, access] = await Promise.all([
            getRecentScans(5),
            getEntitlementState(),
          ]);
          if (isMounted) {
            setRecentScans(scans);
            setEntitlement(access);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error loading home data:', error);
          if (isMounted) setLoading(false);
        }
      }
      loadData();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleCapturePress = async () => {
    const result = await openScanner();
    if (!result.allowed) {
      setEntitlement(result.state);
      setPaywallRequired(true);
      setPaywallVisible(true);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ClayIconButton
            onPress={() => {
              setPaywallRequired(false);
              setPaywallVisible(true);
            }}
          >
            <MaterialCommunityIcons name="crown" size={22} color={colors.textMutedStrong} />
          </ClayIconButton>

          <View style={styles.headerCenter}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.appLogo}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>{t('home.title')}</Text>
            <Text style={styles.appSubtitle}>{t('home.subtitle')}</Text>
          </View>

          <ClayIconButton onPress={() => router.push('/profile_settings')}>
            <Ionicons name="person" size={21} color={colors.textMutedStrong} />
          </ClayIconButton>
        </View>

        {/* Hero capture card */}
        <ClaySurface borderRadius={radius.xl} style={styles.heroCard} large>
          <View style={styles.heroRow}>
            <ClayIconWell size={74} fill={colors.accent} round>
              <Ionicons name="camera" size={30} color={colors.accentIcon} />
            </ClayIconWell>

            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
              <Text style={styles.heroSubtitle}>{t('home.heroSubtitle')}</Text>
              {entitlement?.tier === 'free' ? (
                <Text style={styles.quotaText}>
                  {t('home.quota.free', {
                    n: entitlement.freeScansRemaining,
                    total: FREE_LIFETIME_SCANS,
                  })}
                </Text>
              ) : entitlement?.tier === 'trial' ? (
                <Text style={styles.quotaText}>
                  {entitlement.trialDaysRemaining === 1
                    ? t('home.quota.trial', { n: entitlement.trialDaysRemaining })
                    : t('home.quota.trial_plural', {
                        n: entitlement.trialDaysRemaining,
                      })}
                </Text>
              ) : entitlement?.tier === 'premium' ? (
                <Text style={styles.quotaText}>{t('home.quota.premium')}</Text>
              ) : entitlement?.tier === 'locked' ? (
                <Text style={styles.quotaText}>{t('home.quota.locked')}</Text>
              ) : null}
            </View>
          </View>

          <ClayButton
            title={t('home.captureCta')}
            onPress={handleCapturePress}
            variant="accent"
            icon={<Ionicons name="camera" size={19} color={colors.textOnAccent} />}
            textStyle={{ color: colors.textOnAccent }}
          />
        </ClaySurface>

        {/* Recent identifications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.recentTitle')}</Text>
          {recentScans.length > 0 && (
            <ClaySurface
              onPress={() => router.push('/history')}
              variant="alt"
              borderRadius={radius.full}
              noPadding
              compact
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
            </ClaySurface>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.accentDark}
            style={styles.loader}
          />
        ) : recentScans.length === 0 ? (
          <ClaySurface variant="inset" style={styles.emptyCard}>
            <ClayIconWell size={58} fill={colors.surface} round>
              <Ionicons name="scan-outline" size={26} color={colors.textMutedStrong} />
            </ClayIconWell>
            <Text style={styles.emptyText}>{t('home.emptyTitle')}</Text>
            <Text style={styles.emptySubtext}>{t('home.emptySubtitle')}</Text>
          </ClaySurface>
        ) : (
          <View>
            {recentScans.map((scan) => (
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
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        required={paywallRequired}
        onClose={() => {
          setPaywallVisible(false);
          setPaywallRequired(false);
        }}
        onEntitlementChange={setEntitlement}
      />
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
    paddingBottom: 130,
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  appLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginBottom: 6,
  },
  appTitle: {
    ...typography.heading,
    fontSize: 21,
  },
  appSubtitle: {
    ...typography.small,
    marginTop: 2,
  },
  heroCard: {
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...typography.caption,
    lineHeight: 20,
  },
  quotaText: {
    ...typography.small,
    fontWeight: '700',
    color: '#2F6F5E',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingLeft: 4,
  },
  sectionTitle: {
    ...typography.subheading,
  },
  seeAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  seeAllText: {
    ...typography.small,
    color: colors.textMutedStrong,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 24,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 34,
    gap: 10,
  },
  emptyText: {
    ...typography.subheading,
    color: colors.textLight,
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
});
