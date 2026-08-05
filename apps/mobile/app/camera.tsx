import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography, clayShadow, CLAY_DEPTH } from '../theme';
import {
  ClaySurface,
  ClayButton,
  ClayIconWell,
} from '../components/ClaySurface';
import { identifySpecimen } from '../lib/api';
import { persistScanImage } from '../lib/files';
import { saveScan, getSettings, getScanCount } from '../lib/db';
import { IdentificationResult } from '../lib/types';
import { evaluateAndCelebrate } from '../lib/celebrateBadges';
import { useBadgeUnlockOptional } from '../context/BadgeUnlockContext';
import { assertCanScan, recordLifetimeScan } from '../lib/entitlements';
import { PaywallModal } from '../components/PaywallModal';
import { useT } from '../lib/i18n/I18nContext';

export default function CameraScreen() {
  const t = useT();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [paywallVisible, setPaywallVisible] = useState(false);
  const unlock = useBadgeUnlockOptional();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  const cameraRef = useRef<any>(null);

  const ensureCanScan = async (): Promise<boolean> => {
    const result = await assertCanScan();
    if (!result.ok) {
      setPaywallVisible(true);
      return false;
    }
    return true;
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="small" color={colors.accentDark} />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <ClaySurface borderRadius={radius.xl} style={styles.permissionCard}>
          <ClayIconWell size={84} fill={colors.accent} round>
            <Ionicons name="camera-outline" size={36} color={colors.accentIcon} />
          </ClayIconWell>
          <Text style={styles.permissionTitle}>{t('camera.permissionTitle')}</Text>
          <Text style={styles.permissionText}>{t('camera.permissionBody')}</Text>
          <ClayButton
            title={t('camera.grantPermission')}
            onPress={requestPermission}
            textStyle={{ color: colors.textOnAccent }}
            style={styles.permissionBtn}
          />
          <ClayButton
            title={t('camera.goBack')}
            onPress={() => router.back()}
            variant="alt"
            style={styles.permissionBtn}
          />
        </ClaySurface>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (isLandscape) return;
    if (!cameraRef.current) return;
    if (!(await ensureCanScan())) return;
    try {
      setLoading(true);
      setLoadingMessage(t('camera.loading.capturing'));
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo');
      }

      await processImage(photo.uri, photo.base64 || '');
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        t('camera.alert.captureError'),
        error.message || 'An error occurred during capture.'
      );
    }
  };

  const handlePickImage = async () => {
    if (isLandscape) return;
    if (!(await ensureCanScan())) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('camera.alert.libraryPermission'),
          t('camera.alert.libraryBody')
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const asset = pickerResult.assets[0];
      setLoading(true);
      setLoadingMessage(t('camera.loading.processing'));
      await processImage(asset.uri, asset.base64 || '');
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        t('camera.importFailed.title'),
        error.message || t('camera.importFailed.body')
      );
    }
  };

  const processImage = async (uri: string, base64: string) => {
    try {
      setLoadingMessage(t('camera.loading.saving'));
      const { localUri, base64: finalBase64 } = await persistScanImage(uri, base64);

      setLoadingMessage(t('camera.loading.analyzing'));

      const result = await identifySpecimen({
        image_base64: finalBase64,
        expert: false,
      });

      setLoading(false);
      await finalizeScan(result, localUri);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        t('camera.identifyFailed.title'),
        error?.message
          ? `${t('camera.identifyFailed.body')}\n\n${error.message}`
          : t('camera.identifyFailed.body'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('camera.identifyFailed.retry'),
            onPress: () => {
              setLoading(true);
              setLoadingMessage(t('camera.loading.analyzing'));
              void processImage(uri, base64);
            },
          },
        ]
      );
    }
  };

  const finalizeScan = async (result: IdentificationResult, imageUri: string) => {
    try {
      const settings = await getSettings();
      const priorCount = await getScanCount().catch(() => 0);
      const isFirstScan = priorCount === 0;
      await saveScan({
        id: result.scan_id,
        image_uri: imageUri,
        primary_name: result.primary_identification,
        classification: result.classification,
        confidence: result.confidence,
        raw_json: JSON.stringify(result),
        created_at: new Date().toISOString(),
        is_favorite: false,
      });
      await recordLifetimeScan().catch(() => {});
      await evaluateAndCelebrate(unlock?.celebrateBadges).catch(() => {});

      const isTemp = !settings.auto_save;
      router.replace({
        pathname: '/result/[id]',
        params: {
          id: result.scan_id,
          ...(isTemp ? { is_temp: 'true' } : {}),
          ...(isFirstScan ? { first_scan: 'true' } : {}),
        },
      });
    } catch (error) {
      console.error('Failed to save scan record:', error);
      router.replace({ pathname: '/result/[id]', params: { id: result.scan_id } });
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      {!loading && (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          {/* Overlay Box HUD */}
          <View style={styles.overlayContainer}>
            {/* Top Bar */}
            <View style={styles.hudTop}>
              <Pressable onPress={() => router.back()} style={styles.hudBtn}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.hudTitle}>{t('camera.hudTitle')}</Text>
              <Pressable
                onPress={toggleCameraFacing}
                style={styles.hudBtn}
                disabled={isLandscape}
              >
                <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Target Reticle */}
            {!isLandscape ? (
              <View style={styles.reticleContainer}>
                <View style={styles.reticleCornerTL} />
                <View style={styles.reticleCornerTR} />
                <View style={styles.reticleCornerBL} />
                <View style={styles.reticleCornerBR} />
                <Text style={styles.reticleText}>{t('camera.reticleHint')}</Text>
              </View>
            ) : (
              <View style={styles.reticleSpacer} />
            )}

            {/* Bottom Bar Controls */}
            <View style={[styles.hudBottom, isLandscape && styles.hudBottomDisabled]}>
              <Pressable
                onPress={handlePickImage}
                style={styles.hudBottomBtn}
                disabled={isLandscape}
              >
                <Ionicons name="images-outline" size={28} color="#FFFFFF" />
                <Text style={styles.hudBottomText}>{t('camera.import')}</Text>
              </Pressable>

              <Pressable
                onPress={handleCapture}
                style={[styles.shutterOuter, isLandscape && styles.shutterDisabled]}
                disabled={isLandscape}
              >
                <View style={styles.shutterInner} />
              </Pressable>

              <View style={styles.hudPlaceholder} />
            </View>
          </View>

          {isLandscape ? (
            <View style={styles.rotateGate}>
              <Pressable onPress={() => router.back()} style={styles.rotateClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
              <View style={styles.rotateCard}>
                <View style={styles.rotateIconWell}>
                  <Ionicons name="phone-portrait-outline" size={36} color={colors.accentIcon} />
                </View>
                <Text style={styles.rotateTitle}>{t('camera.rotateTitle')}</Text>
                <Text style={styles.rotateText}>{t('camera.rotateBody')}</Text>
              </View>
            </View>
          ) : null}
        </CameraView>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ClaySurface borderRadius={radius.xl} style={styles.loadingCard}>
            <ClayIconWell size={72} fill={colors.mint} round>
              <ActivityIndicator size="small" color={colors.accentDark} />
            </ClayIconWell>
            <Text style={styles.loadingTitle}>{t('camera.analyzingTitle')}</Text>
            <Text style={styles.loadingMessage}>{loadingMessage}</Text>
          </ClaySurface>
        </View>
      )}

      <PaywallModal
        visible={paywallVisible}
        required
        onClose={() => {
          setPaywallVisible(false);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: 20,
  },
  hudTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hudBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleContainer: {
    alignSelf: 'center',
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('window').width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.accent,
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.accent,
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.accent,
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.accent,
  },
  reticleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
    position: 'absolute',
    bottom: -32,
  },
  hudBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: 20,
  },
  hudBottomBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  hudBottomText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  hudPlaceholder: {
    width: 60,
  },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    boxShadow: clayShadow(CLAY_DEPTH.cameraButton, colors.accentShadow, { opacity: 0.35 }),
  } as ViewStyle,
  shutterDisabled: {
    opacity: 0.35,
  },
  hudBottomDisabled: {
    opacity: 0.35,
  },
  reticleSpacer: {
    flex: 1,
  },
  rotateGate: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 22, 28, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 20,
  },
  rotateClose: {
    position: 'absolute',
    top: 40,
    left: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotateCard: {
    maxWidth: 420,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  rotateIconWell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  rotateTitle: {
    ...typography.heading,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  rotateText: {
    ...typography.body,
    fontSize: 16,
    textAlign: 'center',
    color: colors.textMutedStrong,
    lineHeight: 22,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  permissionCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  permissionTitle: {
    ...typography.heading,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  permissionBtn: {
    alignSelf: 'stretch',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 24,
  },
  loadingTitle: {
    ...typography.heading,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  loadingMessage: {
    ...typography.caption,
    textAlign: 'center',
  },
});
