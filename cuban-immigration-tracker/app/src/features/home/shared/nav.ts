/**
 * Navigation helpers shared by the WP8a screens.
 *
 * Expo Router's typed routes (`experiments.typedRoutes`, 07 WP0 step 3) are generated into
 * `.expo/types/router.d.ts`, which is git-ignored and may predate routes that sibling work
 * packages add in parallel (WP8b's `/case/edit`, `/case/ead`). Paths are therefore built as plain
 * strings and cast once here, so a stale generated file never breaks `tsc`.
 */
import type { Href, useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/** A route path as an `Href` (see the module note). */
export function hrefOf(path: string): Href {
  return path as Href;
}

/**
 * The back action of a detail screen (07 WP6 rules: detail routes stay inside their tab with a
 * back action). Goes back when there is history inside the tab's Stack; otherwise (a deep link, or
 * the artifact booting on a detail path) replaces the screen with the tab index.
 */
export function goBackOr(router: Router, fallback: string): void {
  if (router.canGoBack()) router.back();
  else router.replace(hrefOf(fallback));
}

/** Encodes one path segment (office codes and alert ids are plain ASCII today; this keeps it safe). */
export function seg(s: string): string {
  return encodeURIComponent(s);
}
