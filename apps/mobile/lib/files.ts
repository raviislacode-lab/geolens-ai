import { Directory, File, Paths } from 'expo-file-system';

const SCANS_DIR = 'scans';
const PROFILE_DIR = 'profile';

function getScansDirectory(): Directory {
  return new Directory(Paths.document, SCANS_DIR);
}

function ensureScansDirectory(): Directory {
  const scansDir = getScansDirectory();
  if (!scansDir.exists) {
    scansDir.create({ intermediates: true, idempotent: true });
  }
  return scansDir;
}

function ensureProfileDirectory(): Directory {
  const profileDir = new Directory(Paths.document, PROFILE_DIR);
  if (!profileDir.exists) {
    profileDir.create({ intermediates: true, idempotent: true });
  }
  return profileDir;
}

/** Copy a picked/captured avatar into durable app storage and return its URI. */
export async function persistProfileImage(sourceUri: string): Promise<string> {
  const profileDir = ensureProfileDirectory();
  const destFile = new File(profileDir, `avatar_${Date.now()}.jpg`);
  const sourceFile = new File(sourceUri);

  if (!sourceFile.exists) {
    throw new Error('Could not read the selected profile photo. Please try again.');
  }

  sourceFile.copy(destFile);
  return destFile.uri;
}

/** Copy a captured/picked image into app storage and return its URI + base64 payload. */
export async function persistScanImage(
  sourceUri: string,
  existingBase64?: string
): Promise<{ localUri: string; base64: string }> {
  const scansDir = ensureScansDirectory();
  const destFile = new File(scansDir, `${Date.now()}.jpg`);
  const sourceFile = new File(sourceUri);

  if (!sourceFile.exists) {
    throw new Error('Could not read the selected image. Please try again.');
  }

  sourceFile.copy(destFile);

  const base64 = existingBase64?.length
    ? existingBase64
    : await destFile.base64();

  if (!base64) {
    throw new Error('Could not encode the image for analysis.');
  }

  return { localUri: destFile.uri, base64 };
}

/** Delete a saved scan image if it still exists on disk. */
export function deleteScanImage(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('Failed to delete scan image:', error);
  }
}
