import { router } from 'expo-router';
import { Alert } from 'react-native';

import { updateSetting } from './db';
import { notifyOnboardingChanged } from './onboardingEvents';

/** Persist + navigate into the first-run flow (language → name → photo → tutorial). */
export async function startOnboardingFlow(): Promise<void> {
  try {
    await updateSetting('onboarding_complete', false);
    notifyOnboardingChanged(false);
    router.replace('/onboarding/language');
  } catch (error) {
    console.error('startOnboardingFlow failed:', error);
    Alert.alert('Could not open onboarding', 'Please reload the app and try again.');
  }
}
