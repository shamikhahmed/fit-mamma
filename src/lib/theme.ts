import type { ThemeMode } from '../domain/types';

/** Fit Mamma ships one warm light theme; the setting is kept for backup compatibility. */
export function applyTheme(_theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', 'light');
}
