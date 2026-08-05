import * as SQLite from 'expo-sqlite';
import { AppSettings, DEFAULT_SETTINGS, ScanRecord } from '@/lib/types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('geolens.db');
    await initSchema(db);
  }
  return db;
}

async function ensureSetting(
  database: SQLite.SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  const existing = await database.getFirstAsync<{ key: string }>(
    'SELECT key FROM settings WHERE key = ?',
    [key]
  );
  if (!existing) {
    await database.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }
}

/** Existing installs skip onboarding; brand-new DBs start the flow. */
async function migrateOnboardingComplete(database: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await database.getFirstAsync<{ key: string }>(
    'SELECT key FROM settings WHERE key = ?',
    ['onboarding_complete']
  );
  if (existing) return;

  const scanRow = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM scans'
  );
  const hasScans = (scanRow?.count ?? 0) > 0;
  await database.runAsync(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
    ['onboarding_complete', hasScans ? 'true' : 'false']
  );
}

async function initSchema(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY NOT NULL,
      image_uri TEXT NOT NULL,
      primary_name TEXT NOT NULL,
      classification TEXT NOT NULL,
      confidence REAL NOT NULL,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_favorite INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY NOT NULL,
      unlocked_at TEXT NOT NULL
    );
  `);

  // Seed defaults (also migrates older DBs missing profile fields)
  await ensureSetting(database, 'auto_save', String(DEFAULT_SETTINGS.auto_save));
  await ensureSetting(database, 'show_confidence', String(DEFAULT_SETTINGS.show_confidence));
  await ensureSetting(database, 'units', DEFAULT_SETTINGS.units);
  await ensureSetting(database, 'offline_mode', String(DEFAULT_SETTINGS.offline_mode));
  await ensureSetting(
    database,
    'notifications_enabled',
    String(DEFAULT_SETTINGS.notifications_enabled)
  );
  await ensureSetting(database, 'language', DEFAULT_SETTINGS.language);
  await ensureSetting(database, 'username', DEFAULT_SETTINGS.username);
  await ensureSetting(database, 'handle', DEFAULT_SETTINGS.handle);
  await ensureSetting(database, 'bio', DEFAULT_SETTINGS.bio);
  await ensureSetting(database, 'profile_picture', DEFAULT_SETTINGS.profile_picture);
  await ensureSetting(database, 'appearance', DEFAULT_SETTINGS.appearance);
  await migrateOnboardingComplete(database);
  await ensureSetting(database, 'share_count', '0');
  // Freemium / subscription entitlement defaults
  await ensureSetting(database, 'lifetime_scans_used', '0');
  await ensureSetting(database, 'has_used_trial', 'false');
  await ensureSetting(database, 'trial_started_at', '');
  await ensureSetting(database, 'trial_ends_at', '');
  await ensureSetting(database, 'selected_plan', '');
  await ensureSetting(database, 'subscription_status', 'none');
  await ensureSetting(database, 'is_lifetime', 'false');
}

/**
 * Permanently deletes all user data and resets the database to its initial state.
 * Used by the Account Deletion flow in ProfileSettingsViewController.
 */
export async function deleteAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DROP TABLE IF EXISTS scans;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS badges;
  `);
  // Re-initialise with default schema + settings
  await initSchema(database);
}

export async function getAllScansForBadges(): Promise<
  Array<{
    primary_name: string;
    classification: string;
    confidence: number;
    created_at: string;
    is_favorite: boolean;
  }>
> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    primary_name: string;
    classification: string;
    confidence: number;
    created_at: string;
    is_favorite: number;
  }>('SELECT primary_name, classification, confidence, created_at, is_favorite FROM scans');
  return rows.map((row) => ({
    ...row,
    is_favorite: row.is_favorite === 1,
  }));
}

export async function getUnlockedBadgeIds(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ id: string }>('SELECT id FROM badges');
  return rows.map((r) => r.id);
}

export async function getUnlockedBadges(): Promise<Array<{ id: string; unlocked_at: string }>> {
  const database = await getDatabase();
  return database.getAllAsync<{ id: string; unlocked_at: string }>(
    'SELECT id, unlocked_at FROM badges ORDER BY unlocked_at DESC'
  );
}

export async function unlockBadge(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO badges (id, unlocked_at) VALUES (?, ?)',
    [id, new Date().toISOString()]
  );
}



export async function saveScan(scan: ScanRecord): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO scans (id, image_uri, primary_name, classification, confidence, raw_json, created_at, is_favorite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      scan.id,
      scan.image_uri,
      scan.primary_name,
      scan.classification,
      scan.confidence,
      scan.raw_json,
      scan.created_at,
      scan.is_favorite ? 1 : 0,
    ]
  );
}

export async function getScan(id: string): Promise<ScanRecord | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    id: string;
    image_uri: string;
    primary_name: string;
    classification: string;
    confidence: number;
    raw_json: string;
    created_at: string;
    is_favorite: number;
  }>('SELECT * FROM scans WHERE id = ?', [id]);
  if (!row) return null;
  return { ...row, is_favorite: row.is_favorite === 1 };
}

export async function getAllScans(): Promise<ScanRecord[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string;
    image_uri: string;
    primary_name: string;
    classification: string;
    confidence: number;
    raw_json: string;
    created_at: string;
    is_favorite: number;
  }>('SELECT * FROM scans ORDER BY created_at DESC');
  return rows.map((row) => ({ ...row, is_favorite: row.is_favorite === 1 }));
}

export async function getScanCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM scans'
  );
  return row?.count ?? 0;
}

export async function getRecentScans(limit = 10): Promise<ScanRecord[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string;
    image_uri: string;
    primary_name: string;
    classification: string;
    confidence: number;
    raw_json: string;
    created_at: string;
    is_favorite: number;
  }>('SELECT * FROM scans ORDER BY created_at DESC LIMIT ?', [limit]);
  return rows.map((row) => ({ ...row, is_favorite: row.is_favorite === 1 }));
}

export async function searchScans(query: string): Promise<ScanRecord[]> {
  const database = await getDatabase();
  const pattern = `%${query}%`;
  const rows = await database.getAllAsync<{
    id: string;
    image_uri: string;
    primary_name: string;
    classification: string;
    confidence: number;
    raw_json: string;
    created_at: string;
    is_favorite: number;
  }>(
    'SELECT * FROM scans WHERE primary_name LIKE ? OR classification LIKE ? ORDER BY created_at DESC',
    [pattern, pattern]
  );
  return rows.map((row) => ({ ...row, is_favorite: row.is_favorite === 1 }));
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const database = await getDatabase();
  const scan = await getScan(id);
  if (!scan) return false;
  const newValue = scan.is_favorite ? 0 : 1;
  await database.runAsync('UPDATE scans SET is_favorite = ? WHERE id = ?', [newValue, id]);
  return newValue === 1;
}

export async function deleteScan(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM scans WHERE id = ?', [id]);
}

export async function getStats(): Promise<{ identified: number; favorited: number; daysActive: number }> {
  const database = await getDatabase();
  const identified = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM scans');
  const favorited = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM scans WHERE is_favorite = 1'
  );
  const days = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(DISTINCT date(created_at)) as count FROM scans'
  );
  return {
    identified: identified?.count ?? 0,
    favorited: favorited?.count ?? 0,
    daysActive: days?.count ?? 0,
  };
}

export async function getSettings(): Promise<AppSettings> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    auto_save: map.auto_save !== 'false',
    show_confidence: map.show_confidence !== 'false',
    units: (map.units as 'metric' | 'imperial') || DEFAULT_SETTINGS.units,
    offline_mode: map.offline_mode === 'true',
    notifications_enabled: map.notifications_enabled !== 'false',
    language: map.language?.trim() || DEFAULT_SETTINGS.language,
    appearance:
      map.appearance === 'classic' ? 'classic' : DEFAULT_SETTINGS.appearance,
    username: map.username?.trim() || DEFAULT_SETTINGS.username,
    handle: (map.handle || DEFAULT_SETTINGS.handle).replace(/^@/, ''),
    bio: map.bio?.trim() || DEFAULT_SETTINGS.bio,
    profile_picture: map.profile_picture || '',
    onboarding_complete: map.onboarding_complete === 'true',
    privacy_analytics: map.privacy_analytics !== 'false',
    privacy_personalized: map.privacy_personalized !== 'false',
  };
}

export async function updateSetting(key: keyof AppSettings, value: string | boolean): Promise<void> {
  const database = await getDatabase();
  const strValue = typeof value === 'boolean' ? String(value) : value;
  await database.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, strValue]);
}

export async function getShareCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ['share_count']
  );
  return Math.max(0, parseInt(row?.value ?? '0', 10) || 0);
}

export async function incrementShareCount(): Promise<number> {
  const database = await getDatabase();
  const next = (await getShareCount()) + 1;
  await database.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    'share_count',
    String(next),
  ]);
  return next;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
