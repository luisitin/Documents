/**
 * Pure theme-name resolution (07 WP7 "Theme"; contract (f)). Shared by the native and web hooks so
 * the precedence rules are tested once.
 *
 * - Native: the user's setting (`Settings.theme`, 02 §6) wins; `'system'` follows `useColorScheme`.
 * - Web (artifact): the host's `document.documentElement.dataset.theme` ("dark" | "light", set when
 *   the viewer picked a theme) wins; otherwise `prefers-color-scheme`. The in-app setting is ignored
 *   on web, so the page always matches the host chrome (contract (f)).
 */
import type { ThemeName } from './theme';

export type ThemeSetting = 'system' | 'light' | 'dark';

/** Native precedence: explicit setting → system scheme → light. */
export function resolveNativeThemeName(setting: ThemeSetting | null | undefined, scheme: string | null | undefined): ThemeName {
  if (setting === 'light' || setting === 'dark') return setting;
  return scheme === 'dark' ? 'dark' : 'light';
}

/** Web precedence: host `data-theme` attribute → `prefers-color-scheme: dark` → light. */
export function resolveWebThemeName(dataTheme: string | null | undefined, prefersDark: boolean): ThemeName {
  if (dataTheme === 'dark' || dataTheme === 'light') return dataTheme;
  return prefersDark ? 'dark' : 'light';
}
