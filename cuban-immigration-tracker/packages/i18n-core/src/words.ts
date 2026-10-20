/**
 * Word tables used by `fmt` and `probWord`. The words themselves live in `locales/{es,en}/common.json`
 * (one source for UI, reviewer and formatter); this module only indexes them.
 *
 * - Month abbreviations: es `ene feb mar abr may jun jul ago sept oct nov dic`, en `Jan … Dec`
 *   (02-data-model.md §9).
 * - Probability words and thresholds: 04-estimation-model.md §8 item 2.
 */
import type { Lang } from '@caa/data-schemas';
import { resources } from './resources';

const MONTH_NUMBERS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const;

function common(lang: Lang, key: string): string {
  const v = resources[lang].common[key];
  if (v === undefined) throw new Error(`@caa/i18n-core: missing common:${key} for ${lang}`);
  return v;
}

/** Long month names, index 0 = January (`common:month.01` …). */
export function monthNames(lang: Lang): readonly string[] {
  return MONTH_NUMBERS.map((m) => common(lang, `month.${m}`));
}

/** Short month names, index 0 = January (`common:monthShort.01` …; 02 §9). */
export function monthShortNames(lang: Lang): readonly string[] {
  return MONTH_NUMBERS.map((m) => common(lang, `monthShort.${m}`));
}

/** The five probability bands of 04 §8 item 2, as `common:prob.*` key suffixes. */
export type ProbBand = 'veryUnlikely' | 'unlikely' | 'possible' | 'likely' | 'veryLikely';

/**
 * 04 §8 item 2: < 5 % very unlikely; 5–20 % unlikely; 20–50 % possible; 50–80 % likely; > 80 % very
 * likely. Each lower bound is inclusive and 80 % itself is still "likely"
 * (07 WP4 acceptance: 0.0499 → muy poco probable, 0.05 → poco probable, 0.2 → posible,
 * 0.5 → probable, 0.8 → probable, 0.8001 → muy probable).
 */
export function probBand(p: number): ProbBand | null {
  if (!Number.isFinite(p)) return null;
  if (p < 0.05) return 'veryUnlikely';
  if (p < 0.2) return 'unlikely';
  if (p < 0.5) return 'possible';
  if (p <= 0.8) return 'likely';
  return 'veryLikely';
}

/** Thresholds of `probBand`, for documentation and for the Method screen. */
export const PROB_THRESHOLDS = { veryUnlikelyBelow: 0.05, unlikelyBelow: 0.2, possibleBelow: 0.5, likelyAtMost: 0.8 } as const;

/** Reads one `common:` word; exported for `fmt` and `probWord`. */
export function commonWord(lang: Lang, key: string): string {
  return common(lang, key);
}
