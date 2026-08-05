import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text, ViewStyle } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  radius,
  spacing,
  typography,
  clayElevated,
  claySageElevated,
  getAppearance,
} from '../../theme';
import { PaywallModal } from '../../components/PaywallModal';
import { openScanner } from '../../lib/openScanner';
import { useT } from '../../lib/i18n/I18nContext';
import { useThemeOptional } from '../../theme/ThemeContext';
import { colors as fallbackColors } from '../../theme';

/** White ring + sage disc camera control (spec nested circles) */
function CameraTabButton() {
  const theme = useThemeOptional();
  const colors = theme?.colors ?? fallbackColors;
  const classic = getAppearance() === 'classic';

  return (
    <View style={styles.cameraWrap}>
      <View
        style={[
          styles.cameraRing,
          {
            backgroundColor: colors.ring,
            boxShadow: clayElevated(0.9),
            borderWidth: classic ? StyleSheet.hairlineWidth * 2 : 0,
            borderColor: colors.border,
          } as ViewStyle,
        ]}
      >
        <View
          style={[
            styles.cameraDisc,
            {
              backgroundColor: colors.accent,
              boxShadow: claySageElevated(0.85),
            } as ViewStyle,
          ]}
        >
          <Ionicons name="camera" size={24} color={colors.accentIcon} />
        </View>
      </View>
    </View>
  );
}

/** Soft squircle nav tile — icon above label, same family as canvas */
function TabIcon({
  name,
  focused,
  label,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}) {
  const theme = useThemeOptional();
  const colors = theme?.colors ?? fallbackColors;
  const classic = getAppearance() === 'classic';

  return (
    <View
      style={[
        styles.tabTile,
        {
          backgroundColor: colors.surface,
          boxShadow: clayElevated(0.7),
          borderWidth: classic ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: colors.border,
        } as ViewStyle,
      ]}
    >
      <Ionicons name={name} size={22} color={colors.textMutedStrong} />
      <Text style={[styles.tabLabel, { color: colors.textMutedStrong }]}>{label}</Text>
      {focused ? (
        <View style={[styles.activeDot, { backgroundColor: colors.textMutedStrong }]} />
      ) : (
        <View style={styles.activeDotSpacer} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const [paywallVisible, setPaywallVisible] = useState(false);
  const t = useT();
  const theme = useThemeOptional();
  const colors = theme?.colors ?? fallbackColors;
  const classic = getAppearance() === 'classic';

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: colors.surface,
              boxShadow: clayElevated(1.05),
              borderWidth: classic ? StyleSheet.hairlineWidth * 2 : 0,
              borderColor: colors.border,
            } as ViewStyle,
          ],
          tabBarShowLabel: false,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={focused ? 'home' : 'home-outline'}
                focused={focused}
                label={t('tabs.home')}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="camera_trigger"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openScanner().then((result) => {
                if (!result.allowed) setPaywallVisible(true);
              });
            },
          }}
          options={{
            title: '',
            tabBarIcon: () => <CameraTabButton />,
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: t('tabs.history'),
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={focused ? 'time' : 'time-outline'}
                focused={focused}
                label={t('tabs.history')}
              />
            ),
          }}
        />
      </Tabs>

      <PaywallModal
        visible={paywallVisible}
        required
        onClose={() => setPaywallVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: spacing.md,
    right: spacing.md,
    height: 96,
    borderRadius: radius.xl,
    borderTopWidth: 0,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
  },
  tabBarItem: {
    height: 74,
  },
  tabTile: {
    width: 72,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
  },
  tabLabel: {
    ...typography.small,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 0,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  activeDotSpacer: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
  cameraWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 68,
  },
  cameraRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraDisc: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
