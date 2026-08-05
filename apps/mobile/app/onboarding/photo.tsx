import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ClayButton, ClayIconButton, ClaySurface } from '../../components/ClaySurface';
import { updateSetting } from '../../lib/db';
import { persistProfileImage } from '../../lib/files';
import { useT } from '../../lib/i18n/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme';

export default function OnboardingPhotoScreen() {
  const t = useT();
  const { colors } = useTheme();
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveAvatar = async (sourceUri: string) => {
    setBusy(true);
    try {
      const localUri = await persistProfileImage(sourceUri);
      await updateSetting('profile_picture', localUri);
      setUri(localUri);
    } catch (error: any) {
      Alert.alert(t('common.ok'), error?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('camera.permissionTitle'), t('camera.permissionBody'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await saveAvatar(result.assets[0].uri);
    }
  };

  const chooseLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('camera.alert.libraryPermission'), t('camera.alert.libraryBody'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await saveAvatar(result.assets[0].uri);
    }
  };

  const useDefault = async () => {
    await updateSetting('profile_picture', '');
    setUri(null);
  };

  const goNext = () => {
    router.push('/onboarding/tutorial');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.nav}>
        <ClayIconButton onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={21} color={colors.textMutedStrong} />
        </ClayIconButton>
        <Text style={[styles.navTitle, { color: colors.textDark }]}>
          {t('onboarding.photo.title')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          {t('onboarding.photo.subtitle')}
        </Text>

        <ClaySurface borderRadius={radius.xl} style={styles.card}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
            ]}
          >
            <Image
              source={
                uri
                  ? { uri }
                  : require('../../assets/images/profile_icon_asset.png')
              }
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>

          <ClayButton
            title={t('onboarding.photo.take')}
            onPress={takePhoto}
            disabled={busy}
            icon={<Ionicons name="camera-outline" size={18} color={colors.textOnAccent} />}
            textStyle={{ color: colors.textOnAccent }}
            style={styles.action}
          />
          <ClayButton
            title={t('onboarding.photo.library')}
            onPress={chooseLibrary}
            disabled={busy}
            variant="alt"
            icon={<Ionicons name="images-outline" size={18} color={colors.textMutedStrong} />}
            textStyle={{ color: colors.textMutedStrong }}
            style={styles.action}
          />
          <Pressable onPress={useDefault} style={styles.defaultBtn}>
            <Text style={{ color: colors.textMutedStrong }}>
              {t('onboarding.photo.default')}
            </Text>
          </Pressable>
        </ClaySurface>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={goNext} style={styles.skip}>
          <Text style={{ color: colors.textMutedStrong }}>{t('onboarding.photo.skip')}</Text>
        </Pressable>
        <ClayButton
          title={t('common.continue')}
          onPress={goNext}
          disabled={busy}
          textStyle={{ color: colors.textOnAccent }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  navTitle: { ...typography.heading, fontSize: 20 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  subtitle: { ...typography.body, marginBottom: spacing.lg },
  card: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: spacing.sm,
  },
  avatarImage: { width: '100%', height: '100%' },
  action: { alignSelf: 'stretch' },
  defaultBtn: { paddingVertical: 8 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 10,
  },
  skip: { alignSelf: 'center', paddingVertical: 4 },
});
