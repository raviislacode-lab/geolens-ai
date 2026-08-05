import { evaluateAndUnlockBadges } from './badges';

type CelebrateFn = (ids: string[]) => void;

/** Evaluate unlocks and hand any new badge IDs to the celebration overlay. */
export async function evaluateAndCelebrate(
  celebrate: CelebrateFn | undefined,
  opts?: { justShared?: boolean }
): Promise<string[]> {
  const newly = await evaluateAndUnlockBadges(opts);
  if (newly.length && celebrate) {
    celebrate(newly);
  }
  return newly;
}
