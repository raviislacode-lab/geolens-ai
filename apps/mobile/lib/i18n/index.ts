import { en, type TranslationKey, type Translations } from './en';
import allLocales from './locales/all.json';

export type { TranslationKey, Translations };

const catalogs: Record<string, Translations> = allLocales as Record<
  string,
  Translations
>;

// Ensure English from typed source remains authoritative
catalogs.en = en;

export function getCatalog(languageCode: string): Translations {
  if (catalogs[languageCode]) return catalogs[languageCode];
  const base = languageCode.split('-')[0]?.toLowerCase() ?? 'en';
  return catalogs[base] ?? en;
}

export function translate(
  languageCode: string,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const catalog = getCatalog(languageCode);
  let text: string = catalog[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function supportedLanguageCodes(): string[] {
  return Object.keys(catalogs);
}

export { en };
