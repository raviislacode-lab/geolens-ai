/**
 * Profile screen — pastel claymorphic layout.
 * Username, handle, bio, and avatar persist locally in SQLite + documents.
 */
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  ActionSheetIOS,
  Platform,
  ViewStyle,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography, clayInset, clayElevated } from '../theme';
import { ClaySurface, ClayIconButton, ClayIconWell, ClayButton } from '../components/ClaySurface';
import { BadgeSection } from '../components/BadgeSection';
import { PrivacySettingsModal } from '../components/PrivacySettingsModal';
import { HelpSupportModal } from '../components/HelpSupportModal';
import { RateAppModal } from '../components/RateAppModal';
import { getSettings, updateSetting, getStats, deleteAllData } from '../lib/db';
import { persistProfileImage, deleteScanImage } from '../lib/files';
import { DEFAULT_SETTINGS } from '../lib/types';
import { useT } from '../lib/i18n/I18nContext';
import { startOnboardingFlow } from '../lib/startOnboarding';
import { useTheme } from '../theme/ThemeContext';

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
  tint?: string;
  iconColor?: string;
  danger?: boolean;
};

function ProfileRow({ icon, title, subtitle, onPress, tint, iconColor, danger }: RowProps) {
  const interactive = typeof onPress === 'function';
  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      style={({ pressed }) => [
        styles.row,
        interactive && pressed && { opacity: 0.6 },
      ]}
    >
      <ClayIconWell
        size={44}
        fill={danger ? colors.errorSoft : tint ?? colors.surface}
      >
        <Ionicons
          name={icon}
          size={19}
          color={danger ? colors.error : iconColor ?? colors.textMutedStrong}
        />
      </ClayIconWell>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && { color: colors.error }]}>{title}</Text>
        <Text style={styles.rowDesc}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? colors.error : colors.textLight}
      />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const t = useT();
  const { colors: themeColors } = useTheme();
  const [stats, setStats] = useState({ identified: 0, favorited: 0, daysActive: 0 });
  const [loading, setLoading] = useState(true);
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [username, setUsername] = useState(DEFAULT_SETTINGS.username);
  const [handle, setHandle] = useState(DEFAULT_SETTINGS.handle);
  const [bio, setBio] = useState(DEFAULT_SETTINGS.bio);

  const [editVisible, setEditVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [rateVisible, setRateVisible] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftHandle, setDraftHandle] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function loadAll() {
        try {
          const [settingsData, currentStats] = await Promise.all([
            getSettings(),
            getStats(),
          ]);
          if (isMounted) {
            setStats(currentStats);
            setUsername(settingsData.username);
            setHandle(settingsData.handle);
            setBio(settingsData.bio);
            setProfilePicUri(
              settingsData.profile_picture?.length ? settingsData.profile_picture : null
            );
            setLoading(false);
          }
        } catch (error) {
          console.error('Profile: failed to load data:', error);
          if (isMounted) setLoading(false);
        }
      }
      loadAll();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const saveAvatarFromUri = async (sourceUri: string) => {
    try {
      const previousUri = profilePicUri;
      const localUri = await persistProfileImage(sourceUri);
      await updateSetting('profile_picture', localUri);
      setProfilePicUri(localUri);
      // Clean up previous persisted avatar (not the default asset)
      if (previousUri && previousUri !== localUri && previousUri.includes('/profile/')) {
        deleteScanImage(previousUri);
      }
    } catch (error: any) {
      console.error('Failed to save profile picture:', error);
      Alert.alert('Could Not Save Photo', error?.message || 'Please try again.');
    }
  };

  const handleProfilePictureTap = async () => {
    const doLaunchCamera = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please allow camera access in Settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        await saveAvatarFromUri(result.assets[0].uri);
      }
    };

    const doLaunchLibrary = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo Library Permission Required', 'Please allow photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        await saveAvatarFromUri(result.assets[0].uri);
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Profile Photo',
          message: 'Take a new photo or choose one from your library.',
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) doLaunchCamera();
          else if (buttonIndex === 2) doLaunchLibrary();
        }
      );
    } else {
      Alert.alert('Profile Photo', undefined, [
        { text: 'Take Photo', onPress: doLaunchCamera },
        { text: 'Choose from Library', onPress: doLaunchLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const openEditProfile = () => {
    setDraftUsername(username);
    setDraftHandle(handle);
    setDraftBio(bio);
    setEditVisible(true);
  };

  const saveProfileInfo = async () => {
    const nextUsername = draftUsername.trim() || DEFAULT_SETTINGS.username;
    const nextHandle = draftHandle.trim().replace(/^@/, '') || DEFAULT_SETTINGS.handle;
    const nextBio = draftBio.trim() || DEFAULT_SETTINGS.bio;

    setSavingProfile(true);
    try {
      await Promise.all([
        updateSetting('username', nextUsername),
        updateSetting('handle', nextHandle),
        updateSetting('bio', nextBio),
      ]);
      setUsername(nextUsername);
      setHandle(nextHandle);
      setBio(nextBio);
      setEditVisible(false);
    } catch (error) {
      console.error('Failed to save profile info:', error);
      Alert.alert('Could Not Save', 'Your profile changes could not be saved. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all scan history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your scans, favorites, and settings will be deleted forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (profilePicUri?.includes('/profile/')) {
                        deleteScanImage(profilePicUri);
                      }
                      await deleteAllData();
                      setProfilePicUri(null);
                      setUsername(DEFAULT_SETTINGS.username);
                      setHandle(DEFAULT_SETTINGS.handle);
                      setBio(DEFAULT_SETTINGS.bio);
                      setStats({ identified: 0, favorited: 0, daysActive: 0 });
                      Alert.alert('Account Deleted', 'All data has been removed.', [
                        { text: 'OK', onPress: () => router.replace('/') },
                      ]);
                    } catch {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.accentDark} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.navBar}>
        <ClayIconButton onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={21} color={themeColors.textMutedStrong} />
        </ClayIconButton>
        <Text style={styles.navTitle}>{t('profile.title')}</Text>
        <ClayIconButton onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={20} color={colors.textMutedStrong} />
        </ClayIconButton>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <ClaySurface borderRadius={radius.xl} style={styles.profileCard}>
          <Pressable onPress={handleProfilePictureTap} style={styles.avatarWrapper}>
            <View style={styles.avatarWell}>
              <Image
                source={
                  profilePicUri
                    ? { uri: profilePicUri }
                    : require('../assets/images/profile_icon_asset.png')
                }
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={13} color={colors.textMutedStrong} />
            </View>
          </Pressable>

          <Pressable onPress={openEditProfile} style={styles.nameBlock}>
            <Text style={styles.profileName}>{username}</Text>
            <Text style={styles.profileHandle}>@{handle}</Text>
            <Text style={styles.profileBio}>{bio}</Text>
            <Text style={styles.editHint}>{t('profile.editHint')}</Text>
          </Pressable>

          <View style={styles.statsDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <ClayIconWell size={40} fill={colors.surface} round>
                <Ionicons name="diamond-outline" size={17} color={colors.textMutedStrong} />
              </ClayIconWell>
              <Text style={styles.statVal}>{stats.identified}</Text>
              <Text style={styles.statLbl}>{t('profile.stat.identified').replace(' ', '\n')}</Text>
            </View>
            <View style={styles.statCol}>
              <ClayIconWell size={40} fill={colors.surface} round>
                <Ionicons name="star" size={17} color={colors.textMutedStrong} />
              </ClayIconWell>
              <Text style={styles.statVal}>{stats.favorited}</Text>
              <Text style={styles.statLbl}>{t('profile.stat.favorited')}</Text>
            </View>
            <View style={styles.statCol}>
              <ClayIconWell size={40} fill={colors.surface} round>
                <Ionicons name="calendar-outline" size={17} color={colors.textMutedStrong} />
              </ClayIconWell>
              <Text style={styles.statVal}>{stats.daysActive}</Text>
              <Text style={styles.statLbl}>{t('profile.stat.daysActive').replace(' ', '\n')}</Text>
            </View>
          </View>
        </ClaySurface>

        <BadgeSection />

        {/* Account */}
        <Text style={styles.sectionTitle}>{t('profile.section.account')}</Text>
        <ClaySurface noPadding style={styles.groupCard}>
          <ProfileRow
            icon="person-outline"
            title={t('profile.personalInfo')}
            subtitle={t('profile.personalInfo.subtitle')}
            onPress={openEditProfile}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="camera-outline"
            title={t('profile.photo')}
            subtitle={t('profile.photo.subtitle')}
            onPress={handleProfilePictureTap}
            tint={colors.accentSoft}
            iconColor={colors.accentIcon}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="options-outline"
            title={t('profile.preferences')}
            subtitle={t('profile.preferences.subtitle')}
            onPress={() => router.push('/settings')}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="shield-checkmark-outline"
            title={t('profile.privacy')}
            subtitle={t('profile.privacy.subtitle')}
            onPress={() => setPrivacyVisible(true)}
            tint={colors.accentSoft}
            iconColor={colors.accentIcon}
          />
        </ClaySurface>

        {/* More */}
        <Text style={styles.sectionTitle}>{t('profile.section.more')}</Text>
        <ClaySurface noPadding style={styles.groupCard}>
          <ProfileRow
            icon="map-outline"
            title={t('settings.replayOnboarding')}
            subtitle={t('settings.replayOnboarding.subtitle')}
            onPress={startOnboardingFlow}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="help-circle-outline"
            title={t('profile.help')}
            subtitle={t('profile.help.subtitle')}
            onPress={() => setHelpVisible(true)}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="star-outline"
            title={t('profile.rate')}
            subtitle={t('profile.rate.subtitle')}
            onPress={() => setRateVisible(true)}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="information-circle-outline"
            title={t('profile.about')}
            subtitle={t('profile.about.subtitle')}
            onPress={() => router.push('/settings')}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="trash-outline"
            title={t('profile.delete')}
            subtitle={t('profile.delete.subtitle')}
            onPress={handleDeleteAccount}
            danger
          />
        </ClaySurface>

        <Text style={styles.footer}>GeoLens v1.0.0</Text>
      </ScrollView>

      <PrivacySettingsModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
      />

      <HelpSupportModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />

      <RateAppModal
        visible={rateVisible}
        onClose={() => setRateVisible(false)}
      />

      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setEditVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('profile.edit.title')}</Text>

            <Text style={styles.fieldLabel}>{t('profile.edit.username')}</Text>
            <View style={styles.fieldWell}>
              <TextInput
                value={draftUsername}
                onChangeText={setDraftUsername}
                placeholder="Your display name"
                placeholderTextColor={colors.textLight}
                style={styles.fieldInput}
                maxLength={40}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.fieldLabel}>{t('profile.edit.handle')}</Text>
            <View style={[styles.fieldWell, styles.handleRow]}>
              <Text style={styles.handlePrefix}>@</Text>
              <TextInput
                value={draftHandle}
                onChangeText={(text) =>
                  setDraftHandle(text.replace(/[^a-zA-Z0-9._]/g, ''))
                }
                placeholder="rock.explorer"
                placeholderTextColor={colors.textLight}
                style={[styles.fieldInput, styles.handleInput]}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.fieldLabel}>{t('profile.edit.bio')}</Text>
            <View style={[styles.fieldWell, styles.bioWell]}>
              <TextInput
                value={draftBio}
                onChangeText={setDraftBio}
                placeholder="A short bio"
                placeholderTextColor={colors.textLight}
                style={[styles.fieldInput, styles.bioInput]}
                maxLength={120}
                multiline
              />
            </View>

            <ClayButton
              title={
                savingProfile ? t('profile.edit.saving') : t('profile.edit.save')
              }
              onPress={saveProfileInfo}
              disabled={savingProfile}
              textStyle={{ color: colors.textOnAccent }}
              style={styles.saveBtn}
            />
            <Pressable onPress={() => setEditVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t('profile.edit.cancel')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarWell: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: clayInset,
  } as ViewStyle,
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: clayElevated(0.5),
  } as ViewStyle,
  nameBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  profileName: {
    ...typography.heading,
    fontSize: 21,
  },
  profileHandle: {
    ...typography.caption,
    color: colors.textMutedStrong,
    fontWeight: '600',
    marginTop: 2,
  },
  profileBio: {
    ...typography.caption,
    marginTop: 8,
    textAlign: 'center',
  },
  editHint: {
    ...typography.small,
    color: colors.textLight,
    marginTop: 8,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.separator,
    alignSelf: 'stretch',
    marginVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  statVal: {
    ...typography.heading,
    fontSize: 20,
  },
  statLbl: {
    ...typography.small,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 15,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  groupCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  rowDesc: {
    ...typography.small,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginLeft: 58,
  },
  footer: {
    ...typography.small,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 45, 66, 0.35)',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceSunken,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMutedStrong,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  fieldWell: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 4,
    boxShadow: clayInset,
  } as ViewStyle,
  fieldInput: {
    ...typography.body,
    paddingVertical: 12,
    color: colors.textDark,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handlePrefix: {
    ...typography.bodyBold,
    color: colors.textMutedStrong,
    marginRight: 4,
  },
  handleInput: {
    flex: 1,
  },
  bioWell: {
    paddingVertical: 10,
  },
  bioInput: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  saveBtn: {
    marginTop: spacing.lg,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMutedStrong,
  },
});
