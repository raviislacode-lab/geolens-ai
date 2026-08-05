import { router } from 'expo-router';
import { assertCanScan, EntitlementState } from './entitlements';

/**
 * Navigate to camera if the user can scan; otherwise signal paywall required.
 */
export async function openScanner(): Promise<
  { allowed: true; state: EntitlementState } | { allowed: false; state: EntitlementState }
> {
  const result = await assertCanScan();
  if (!result.ok) {
    return { allowed: false, state: result.state };
  }
  router.push('/camera');
  return { allowed: true, state: result.state };
}
