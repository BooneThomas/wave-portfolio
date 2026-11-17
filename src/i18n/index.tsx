import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { defaultLocale, type Locale, type Text } from '../content/types';
import { en, type UiStrings } from './en';

/**
 * To add Dutch:
 * 1. copy en.ts to nl.ts and translate it (type it as UiStrings),
 * 2. register it below,
 * 3. add 'nl' to `locales` in src/content/types.ts,
 * 4. turn content strings into { en: '...', nl: '...' } where needed.
 */
const dictionaries: Partial<Record<Locale, UiStrings>> = { en };

/** Resolves a content Text to a string for the given locale, falling back to English. */
export function tr(text: Text, locale: Locale = defaultLocale): string {
  if (typeof text === 'string') return text;
  return text[locale] ?? text.en;
}

interface I18n {
  locale: Locale;
  ui: UiStrings;
  t: (text: Text) => string;
}

const I18nContext = createContext<I18n>({
  locale: defaultLocale,
  ui: en,
  t: (text) => tr(text, defaultLocale),
});

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18n>(
    () => ({
      locale,
      ui: dictionaries[locale] ?? en,
      t: (text) => tr(text, locale),
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
