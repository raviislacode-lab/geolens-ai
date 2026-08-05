type Listener = (complete: boolean) => void;

const listeners = new Set<Listener>();

/** Synchronous flag so navigation gates never read a stale React state. */
let onboardingComplete = true;

export function getOnboardingCompleteFlag(): boolean {
  return onboardingComplete;
}

export function notifyOnboardingChanged(complete: boolean): void {
  onboardingComplete = complete;
  listeners.forEach((listener) => listener(complete));
}

/** Call after persisting onboarding_complete so the root gate updates immediately. */
export function notifyOnboardingComplete(): void {
  notifyOnboardingChanged(true);
}

export function subscribeOnboardingChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
