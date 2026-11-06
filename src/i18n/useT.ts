import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { UR } from './ur';

export type Lang = 'en' | 'ur';

export function translate(lang: Lang | undefined, en: string): string {
  return lang === 'ur' ? (UR[en] ?? en) : en;
}

/** `t('Quick log')` → Urdu when the language setting is Urdu, else the English text. */
export function useT(): (en: string) => string {
  const lang = useAppStore((s) => s.settings?.language);
  return useCallback((en: string) => translate(lang, en), [lang]);
}

/**
 * Toggles the `lang-ur` class. The page stays lang="en" so Latin text and digits keep the
 * system font; CSS adds a Nastaliq face after it for Urdu glyphs only.
 */
export function applyLanguage(lang: Lang | undefined) {
  document.documentElement.classList.toggle('lang-ur', lang === 'ur');
}
