import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BadgeDef, BADGES } from '@/lib/badges';

export type FlightTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type BadgeUnlockContextValue = {
  celebrateBadges: (ids: string[]) => void;
  activeBadge: BadgeDef | null;
  isLanding: (id: string) => boolean;
  reportFlightTarget: (target: FlightTarget) => void;
  /** Latest measured slot (may update as the badges page re-measures) */
  getLatestFlightTarget: () => FlightTarget | null;
  waitForFlightTarget: (timeoutMs?: number) => Promise<FlightTarget>;
  clearFlightTarget: () => void;
  finishCelebration: () => void;
};

const BadgeUnlockContext = createContext<BadgeUnlockContextValue | null>(null);

function isPlausibleTarget(t: FlightTarget): boolean {
  return (
    t.width >= 24 &&
    t.height >= 24 &&
    Number.isFinite(t.x) &&
    Number.isFinite(t.y) &&
    t.y > 40 // below status/nav junk
  );
}

export function BadgeUnlockProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [landingId, setLandingId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const queueRef = useRef<string[]>([]);
  const latestTarget = useRef<FlightTarget | null>(null);

  const targetWaiters = useRef<Array<(t: FlightTarget) => void>>([]);

  activeIdRef.current = activeId;
  queueRef.current = queue;

  const activeBadge = useMemo(
    () => (activeId ? BADGES.find((b) => b.id === activeId) ?? null : null),
    [activeId]
  );

  const clearFlightTarget = useCallback(() => {
    latestTarget.current = null;
  }, []);

  const celebrateBadges = useCallback(
    (ids: string[]) => {
      const unique = [...new Set(ids)].filter((id) => BADGES.some((b) => b.id === id));
      if (!unique.length) return;

      if (activeIdRef.current) {
        const pending = new Set(queueRef.current);
        pending.add(activeIdRef.current);
        const toAdd = unique.filter((id) => !pending.has(id));
        if (toAdd.length) setQueue((prev) => [...prev, ...toAdd]);
        return;
      }

      const [next, ...rest] = unique;
      latestTarget.current = null;
      setActiveId(next);
      setLandingId(next);
      setQueue(rest);
    },
    []
  );

  const reportFlightTarget = useCallback((target: FlightTarget) => {
    if (!isPlausibleTarget(target)) return;
    latestTarget.current = target;
    const waiters = targetWaiters.current;
    targetWaiters.current = [];
    waiters.forEach((resolve) => resolve(target));
  }, []);

  const getLatestFlightTarget = useCallback(() => latestTarget.current, []);

  const waitForFlightTarget = useCallback((timeoutMs = 4000) => {
    return new Promise<FlightTarget>((resolve, reject) => {
      if (latestTarget.current && isPlausibleTarget(latestTarget.current)) {
        resolve(latestTarget.current);
        return;
      }

      targetWaiters.current.push(resolve);

      setTimeout(() => {
        const idx = targetWaiters.current.indexOf(resolve);
        if (idx >= 0) {
          targetWaiters.current.splice(idx, 1);
          if (latestTarget.current && isPlausibleTarget(latestTarget.current)) {
            resolve(latestTarget.current);
          } else {
            reject(new Error('Badge slot was not measured in time'));
          }
        }
      }, timeoutMs);
    });
  }, []);

  const finishCelebration = useCallback(() => {
    setLandingId(null);
    setActiveId(null);
    latestTarget.current = null;

    setTimeout(() => {
      setQueue((prev) => {
        if (!prev.length) return prev;
        const [next, ...rest] = prev;
        setActiveId(next);
        setLandingId(next);
        return rest;
      });
    }, 280);
  }, []);

  const isLanding = useCallback((id: string) => landingId === id, [landingId]);

  const value = useMemo(
    () => ({
      celebrateBadges,
      activeBadge,
      isLanding,
      reportFlightTarget,
      getLatestFlightTarget,
      waitForFlightTarget,
      clearFlightTarget,
      finishCelebration,
    }),
    [
      celebrateBadges,
      activeBadge,
      isLanding,
      reportFlightTarget,
      getLatestFlightTarget,
      waitForFlightTarget,
      clearFlightTarget,
      finishCelebration,
    ]
  );

  return (
    <BadgeUnlockContext.Provider value={value}>{children}</BadgeUnlockContext.Provider>
  );
}

export function useBadgeUnlock() {
  const ctx = useContext(BadgeUnlockContext);
  if (!ctx) {
    throw new Error('useBadgeUnlock must be used within BadgeUnlockProvider');
  }
  return ctx;
}

export function useBadgeUnlockOptional() {
  return useContext(BadgeUnlockContext);
}
