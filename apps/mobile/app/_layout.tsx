import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BadgeUnlockProvider } from '../context/BadgeUnlockContext';
import { BadgeUnlockOverlay } from '../components/BadgeUnlockOverlay';
import { I18nProvider } from '../lib/i18n/I18nContext';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { getSettings } from '../lib/db';
import {
  getOnboardingCompleteFlag,
  notifyOnboardingChanged,
  subscribeOnboardingChanged,
} from '../lib/onboardingEvents';

// Keep the native splash (your rock logo) up until the app is ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);
  const [, bump] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        if (!cancelled) {
          notifyOnboardingChanged(settings.onboarding_complete);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          notifyOnboardingChanged(false);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeOnboardingChanged(() => {
      bump((n) => n + 1);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    const needsOnboarding = !getOnboardingCompleteFlag();

    // Only auto-enter onboarding. Never auto-kick out of it here —
    // finishing the tutorial calls replace('/(tabs)') itself.
    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding/language');
    }
  }, [ready, segments, router, bump]);

  if (!ready) {
    // Native splash stays visible while we bootstrap.
    return <View style={[styles.root, { backgroundColor: '#E5E1EE' }]} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="camera"
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="result/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile_settings" />
        <Stack.Screen name="badges" />
      </Stack>
      <BadgeUnlockOverlay />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ThemeProvider>
          <BadgeUnlockProvider>
            <RootNavigator />
          </BadgeUnlockProvider>
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
