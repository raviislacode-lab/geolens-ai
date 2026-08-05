import { getDatabase, getStats } from './db';

/** Free tier: lifetime scan allowance before paywall */
export const FREE_LIFETIME_SCANS = 3;
/** Trial length after choosing a plan on the paywall */
export const TRIAL_DAYS = 3;

export type PlanKey = 'weekly' | 'monthly' | 'annual' | 'annualSpecial' | 'lifetime';

export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'expired';

export type AccessTier = 'free' | 'trial' | 'premium' | 'locked';

export type EntitlementState = {
  lifetimeScansUsed: number;
  freeScansRemaining: number;
  hasUsedTrial: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  selectedPlan: PlanKey | '';
  subscriptionStatus: SubscriptionStatus;
  isLifetime: boolean;
  tier: AccessTier;
  /** Whether the user may run a new identification right now */
  canScan: boolean;
  /** True when the user must go through paywall to continue scanning */
  paywallRequired: boolean;
  /** Trial still available to start */
  trialAvailable: boolean;
  trialDaysRemaining: number;
};

const KEYS = {
  lifetimeScansUsed: 'lifetime_scans_used',
  hasUsedTrial: 'has_used_trial',
  trialStartedAt: 'trial_started_at',
  trialEndsAt: 'trial_ends_at',
  selectedPlan: 'selected_plan',
  subscriptionStatus: 'subscription_status',
  isLifetime: 'is_lifetime',
} as const;

async function getRaw(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

async function setRaw(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    key,
    value,
  ]);
}

export async function ensureEntitlementDefaults(): Promise<void> {
  const database = await getDatabase();
  const defaults: Array<[string, string]> = [
    [KEYS.lifetimeScansUsed, '0'],
    [KEYS.hasUsedTrial, 'false'],
    [KEYS.trialStartedAt, ''],
    [KEYS.trialEndsAt, ''],
    [KEYS.selectedPlan, ''],
    [KEYS.subscriptionStatus, 'none'],
    [KEYS.isLifetime, 'false'],
  ];
  for (const [key, value] of defaults) {
    const existing = await database.getFirstAsync<{ key: string }>(
      'SELECT key FROM settings WHERE key = ?',
      [key]
    );
    if (!existing) {
      await database.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / 86400000);
}

/** Read current entitlement, refreshing expired trials. */
export async function getEntitlementState(): Promise<EntitlementState> {
  await ensureEntitlementDefaults();

  const [
    usedRaw,
    hasUsedTrialRaw,
    trialStartedAt,
    trialEndsAt,
    selectedPlanRaw,
    statusRaw,
    isLifetimeRaw,
  ] = await Promise.all([
    getRaw(KEYS.lifetimeScansUsed),
    getRaw(KEYS.hasUsedTrial),
    getRaw(KEYS.trialStartedAt),
    getRaw(KEYS.trialEndsAt),
    getRaw(KEYS.selectedPlan),
    getRaw(KEYS.subscriptionStatus),
    getRaw(KEYS.isLifetime),
  ]);

  let lifetimeScansUsed = Math.max(0, parseInt(usedRaw ?? '0', 10) || 0);

  // Migrate: never under-count vs existing scan history (lifetime free quota)
  try {
    const stats = await getStats();
    if (stats.identified > lifetimeScansUsed) {
      lifetimeScansUsed = stats.identified;
      await setRaw(KEYS.lifetimeScansUsed, String(lifetimeScansUsed));
    }
  } catch {
    /* ignore */
  }

  let subscriptionStatus = (statusRaw as SubscriptionStatus) || 'none';
  const isLifetime = isLifetimeRaw === 'true';
  const hasUsedTrial = hasUsedTrialRaw === 'true';
  const endsAt = trialEndsAt?.trim() ? trialEndsAt.trim() : null;
  const startedAt = trialStartedAt?.trim() ? trialStartedAt.trim() : null;
  const now = new Date();

  let inTrial = false;
  let trialDaysRemaining = 0;

  if (subscriptionStatus === 'trialing' && endsAt) {
    const end = new Date(endsAt);
    if (now.getTime() < end.getTime()) {
      inTrial = true;
      trialDaysRemaining = Math.max(1, daysBetween(now, end));
    } else {
      subscriptionStatus = 'expired';
      await setRaw(KEYS.subscriptionStatus, 'expired');
    }
  }

  const isPaid = isLifetime || subscriptionStatus === 'active';
  const freeScansRemaining = Math.max(0, FREE_LIFETIME_SCANS - lifetimeScansUsed);
  const canScan = isPaid || inTrial || freeScansRemaining > 0;
  const selectedPlan = (selectedPlanRaw || '') as PlanKey | '';

  return {
    lifetimeScansUsed,
    freeScansRemaining,
    hasUsedTrial,
    trialStartedAt: startedAt,
    trialEndsAt: endsAt,
    selectedPlan,
    subscriptionStatus,
    isLifetime,
    tier: isPaid ? 'premium' : inTrial ? 'trial' : freeScansRemaining > 0 ? 'free' : 'locked',
    canScan,
    paywallRequired: !canScan,
    trialAvailable: !hasUsedTrial && !isPaid,
    trialDaysRemaining,
  };
}

/** Call after a successful identification — counts toward the free lifetime quota. */
export async function recordLifetimeScan(): Promise<EntitlementState> {
  await ensureEntitlementDefaults();
  const usedRaw = await getRaw(KEYS.lifetimeScansUsed);
  const next = Math.max(0, parseInt(usedRaw ?? '0', 10) || 0) + 1;
  await setRaw(KEYS.lifetimeScansUsed, String(next));
  return getEntitlementState();
}

/** Start the one-time 3-day free trial for a chosen plan. */
export async function startFreeTrial(plan: PlanKey): Promise<EntitlementState> {
  await ensureEntitlementDefaults();
  const state = await getEntitlementState();
  if (state.isLifetime || state.subscriptionStatus === 'active') {
    return state;
  }
  if (state.hasUsedTrial) {
    // Trial already consumed — require paid activation instead
    return state;
  }

  const start = new Date();
  const end = new Date(start.getTime() + TRIAL_DAYS * 86400000);

  await Promise.all([
    setRaw(KEYS.hasUsedTrial, 'true'),
    setRaw(KEYS.trialStartedAt, start.toISOString()),
    setRaw(KEYS.trialEndsAt, end.toISOString()),
    setRaw(KEYS.selectedPlan, plan),
    setRaw(KEYS.subscriptionStatus, 'trialing'),
    setRaw(KEYS.isLifetime, 'false'),
  ]);

  return getEntitlementState();
}

/**
 * Activate paid access for the selected plan.
 * Stub until StoreKit / Play Billing is wired — treats checkout as successful.
 */
export async function activatePaidPlan(plan: PlanKey): Promise<EntitlementState> {
  await ensureEntitlementDefaults();
  const isLifetime = plan === 'lifetime';
  await Promise.all([
    setRaw(KEYS.selectedPlan, plan),
    setRaw(KEYS.subscriptionStatus, 'active'),
    setRaw(KEYS.isLifetime, String(isLifetime)),
    setRaw(KEYS.hasUsedTrial, 'true'),
  ]);
  return getEntitlementState();
}

/** Dev-only: unlock unlimited Premium without checkout. */
export async function devBypassPaywall(): Promise<EntitlementState> {
  return activatePaidPlan('lifetime');
}

/** Whether the user may open the camera / run a scan. */
export async function assertCanScan(): Promise<
  { ok: true; state: EntitlementState } | { ok: false; state: EntitlementState }
> {
  const state = await getEntitlementState();
  return state.canScan ? { ok: true, state } : { ok: false, state };
}
