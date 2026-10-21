/**
 * Web `useThemeName()` (07 §6.0; artifact contract (f)).
 *
 * The Claude artifact host sets `data-theme="dark" | "light"` on the root element when the viewer
 * chose a theme; otherwise only `prefers-color-scheme` applies. The attribute is observed with a
 * MutationObserver, so a theme switch in the host chrome repaints the app without a reload. The
 * in-app theme setting is ignored on web (WP7). Every DOM access is guarded: the hook must render
 * in any sandbox (no document, no matchMedia, a throwing observer).
 */
import { useSyncExternalStore } from 'react';
import type { ThemeName } from './theme';
import { resolveWebThemeName } from './themeName';

const QUERY = '(prefers-color-scheme: dark)';

function mediaList(): MediaQueryList | null {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
  } catch {
    return null;
  }
}

/** Current theme name read from the DOM (exported for tests). */
export function readWebThemeName(): ThemeName {
  let attr: string | undefined;
  try {
    attr = typeof document !== 'undefined' ? document.documentElement?.dataset?.theme : undefined;
  } catch {
    attr = undefined;
  }
  return resolveWebThemeName(attr, mediaList()?.matches === true);
}

/** Subscribes to `data-theme` mutations and to the colour-scheme media query (exported for tests). */
export function subscribeWebTheme(onChange: () => void): () => void {
  const cleanups: (() => void)[] = [];
  try {
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.documentElement) {
      const obs = new MutationObserver(onChange);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      cleanups.push(() => obs.disconnect());
    }
  } catch {
    /* no observer: the media query (or a static theme) still works */
  }
  try {
    const mql = mediaList();
    if (mql) {
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onChange);
        cleanups.push(() => mql.removeEventListener('change', onChange));
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(onChange);
        cleanups.push(() => mql.removeListener(onChange));
      }
    }
  } catch {
    /* ignore */
  }
  return () => {
    for (const c of cleanups) {
      try {
        c();
      } catch {
        /* ignore */
      }
    }
  };
}

const serverSnapshot = (): ThemeName => 'light';

export function useThemeName(): ThemeName {
  return useSyncExternalStore(subscribeWebTheme, readWebThemeName, serverSnapshot);
}
