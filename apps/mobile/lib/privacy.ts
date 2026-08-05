import { API_BASE_URL } from './api';
import { getSettings, updateSetting } from './db';

export type PrivacyPreferences = {
  analytics_enabled: boolean;
  personalized_tips: boolean;
};

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  analytics_enabled: true,
  personalized_tips: true,
};

/** Load privacy prefs from local settings (source of truth offline). */
export async function getPrivacyPreferences(): Promise<PrivacyPreferences> {
  const settings = await getSettings();
  return {
    analytics_enabled: settings.privacy_analytics,
    personalized_tips: settings.privacy_personalized,
  };
}

/** Persist locally, then best-effort sync to `/api/user/privacy`. */
export async function savePrivacyPreferences(
  prefs: PrivacyPreferences
): Promise<void> {
  await Promise.all([
    updateSetting('privacy_analytics', prefs.analytics_enabled),
    updateSetting('privacy_personalized', prefs.personalized_tips),
  ]);

  try {
    await fetch(`${API_BASE_URL}/api/user/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
  } catch {
    // Local save already succeeded; remote sync is optional.
  }
}
