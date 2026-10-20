/**
 * Conditioning and mixing (04-estimation-model.md EST-6; doc 08 §4.6, §11.5).
 *
 * Posterior path weight ∝ prior × S_path(k₀); S_c(t) = Σ post_i · S_i(k₀+t) / S_i(k₀), t = 0..72.
 * Golden T5 (no alerts, no observations): posterior scenario mass 0.3006 / 0.3998 / 0.1487 /
 * 0.1509, summing to 1 ± 1e-12.
 */
import type { Path } from './types';

export const HORIZON = 72;

/** Posterior weights ∝ prior·S(k₀), normalized. */
export function posteriorWeights(paths: Path[], kOrigin: number): number[] {
  const raw = paths.map((p) => p.prior * (p.S[kOrigin] ?? 0));
  const Z = raw.reduce((a, x) => a + x, 0);
  if (!(Z > 0)) throw new Error('mixAndCondition: zero posterior mass');
  return raw.map((x) => x / Z);
}

/** One path's survival conditioned on surviving to k₀: c(t) = S(k₀+t)/S(k₀), t = 0..horizon. */
export function conditionedCurve(p: Path, kOrigin: number, horizon: number = HORIZON): number[] {
  const base = p.S[kOrigin]!;
  const out = new Array<number>(horizon + 1);
  for (let t = 0; t <= horizon; t++) out[t] = p.S[kOrigin + t]! / base;
  return out;
}

/**
 * Σ w_i · c_i(t) / Σ w_i over the given curves. Dividing by the weight sum (accumulated in the
 * same order) keeps the mixture exactly 1 wherever every curve is exactly 1 (e.g. the RFE zero
 * months of T18', P3 = 0 exactly) and never above 1.
 */
export function mixCurves(curves: number[][], weights: number[], horizon: number = HORIZON): number[] {
  const S = new Array<number>(horizon + 1).fill(0);
  let Z = 0;
  curves.forEach((c, i) => {
    const w = weights[i]!;
    Z += w;
    for (let t = 0; t <= horizon; t++) S[t] = S[t]! + w * c[t]!;
  });
  if (!(Z > 0)) throw new Error('mixCurves: zero total weight');
  for (let t = 0; t <= horizon; t++) S[t] = Math.min(1, S[t]! / Z);
  return S;
}

/** EST-6: S = S_c(0..72) and the posterior path weights. */
export function mixAndCondition(paths: Path[], kOrigin: number): { S: number[]; posterior: number[] } {
  if (!paths.length) throw new Error('mixAndCondition: no paths');
  const posterior = posteriorWeights(paths, kOrigin);
  const S = mixCurves(paths.map((p) => conditionedCurve(p, kOrigin)), posterior);
  return { S, posterior };
}
