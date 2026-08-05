import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { getAllScans } from './db';
import type { ScanRecord } from './types';

function exportsDirectory(): Directory {
  const dir = new Directory(Paths.cache, 'exports');
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function toCsv(scans: ScanRecord[]): string {
  const header = [
    'id',
    'primary_name',
    'classification',
    'confidence',
    'created_at',
    'is_favorite',
    'image_uri',
  ];
  const escape = (value: string | number | boolean) => {
    const s = String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    header.join(','),
    ...scans.map((s) =>
      [
        s.id,
        s.primary_name,
        s.classification,
        s.confidence,
        s.created_at,
        s.is_favorite,
        s.image_uri,
      ]
        .map(escape)
        .join(',')
    ),
  ];
  return lines.join('\n');
}

/** Write scan history to a JSON file and open the system share sheet. */
export async function exportScanHistory(): Promise<{ count: number }> {
  const scans = await getAllScans();
  const payload = {
    exported_at: new Date().toISOString(),
    app: 'GeoLens',
    count: scans.length,
    scans: scans.map((s) => ({
      id: s.id,
      primary_name: s.primary_name,
      classification: s.classification,
      confidence: s.confidence,
      created_at: s.created_at,
      is_favorite: s.is_favorite,
      image_uri: s.image_uri,
      result: (() => {
        try {
          return JSON.parse(s.raw_json);
        } catch {
          return null;
        }
      })(),
    })),
  };

  const dir = exportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonFile = new File(dir, `geolens-export-${stamp}.json`);
  const csvFile = new File(dir, `geolens-export-${stamp}.csv`);

  if (!jsonFile.exists) jsonFile.create();
  if (!csvFile.exists) csvFile.create();
  jsonFile.write(JSON.stringify(payload, null, 2));
  csvFile.write(toCsv(scans));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  // Prefer JSON (full detail); CSV is also written beside it for the user.
  await Sharing.shareAsync(jsonFile.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export GeoLens history',
    UTI: 'public.json',
  });

  return { count: scans.length };
}

/** Remove orphaned scan image files not referenced by any saved scan. */
export async function clearOrphanScanCache(): Promise<{
  removed: number;
  kept: number;
}> {
  const scans = await getAllScans();
  const referenced = new Set(scans.map((s) => s.image_uri));
  const scansDir = new Directory(Paths.document, 'scans');
  if (!scansDir.exists) {
    return { removed: 0, kept: 0 };
  }

  let removed = 0;
  let kept = 0;
  for (const item of scansDir.list()) {
    if (!(item instanceof File)) continue;
    if (referenced.has(item.uri)) {
      kept += 1;
      continue;
    }
    try {
      item.delete();
      removed += 1;
    } catch {
      // keep going
    }
  }

  // Also clear old export temp files
  const exportDir = new Directory(Paths.cache, 'exports');
  if (exportDir.exists) {
    for (const item of exportDir.list()) {
      if (item instanceof File) {
        try {
          item.delete();
        } catch {
          // ignore
        }
      }
    }
  }

  return { removed, kept };
}
