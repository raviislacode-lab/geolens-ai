import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getSettings } from '../lib/db';
import {
  AppearanceMode,
  ThemeColors,
  applyAppearance,
  getAppearance,
  getColors,
} from './index';

type ThemeContextValue = {
  appearance: AppearanceMode;
  colors: ThemeColors;
  setAppearance: (mode: AppearanceMode) => void;
  isClay: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppearanceMode>(getAppearance());
  const [, bump] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        const mode =
          settings.appearance === 'classic' ? 'classic' : ('clay' as AppearanceMode);
        if (!cancelled) {
          applyAppearance(mode);
          setAppearanceState(mode);
          bump((n) => n + 1);
        }
      } catch {
        // keep default clay
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAppearance = useCallback((mode: AppearanceMode) => {
    applyAppearance(mode);
    setAppearanceState(mode);
    bump((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({
      appearance,
      colors: getColors(),
      setAppearance,
      isClay: appearance === 'clay',
    }),
    [appearance, setAppearance]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** Safe for components that may render during Fast Refresh before providers mount. */
export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}
