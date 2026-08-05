import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getSettings } from '../db';
import { translate, type TranslationKey } from './index';

type TFunction = (
  key: TranslationKey,
  vars?: Record<string, string | number>
) => string;

type I18nContextValue = {
  language: string;
  setLanguage: (code: string) => void;
  t: TFunction;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState('en');
  const userOverrideRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        // Don't clobber a language the user just picked (e.g. onboarding tap).
        if (!cancelled && settings.language && !userOverrideRef.current) {
          setLanguageState(settings.language);
        }
      } catch {
        // keep default
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((code: string) => {
    userOverrideRef.current = true;
    setLanguageState(code);
  }, []);

  const t = useCallback<TFunction>(
    (key, vars) => translate(language, key, vars),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

export function useT(): TFunction {
  return useI18n().t;
}
