/**
 * Driver bar (04-estimation-model.md §8 item 6): main-effect variance shares of the per-path
 * P(≤ horizon) under the posterior weights, share_f = Σ_g W_g (mean_g − mean)² / Var for
 * f ∈ {scenario, β, office}. Golden T15c: scenario 0.94135, office 0.02796, β 0.00920
 * ("Política 94 % · Oficina 3 % · Orden de la cola 1 %").
 */
import type { Path } from './types';

/** Shares from explicit per-path probabilities (used for transformed curves, e.g. interview_scheduled). */
export function driverShares(paths: Path[], posterior: number[], p: number[]): { scenario: number; beta: number; office: number } {
  let mean = 0;
  posterior.forEach((w, i) => { mean += w * p[i]!; });
  let variance = 0;
  posterior.forEach((w, i) => { variance += w * (p[i]! - mean) ** 2; });
  const share = (key: (q: Path) => string): number => {
    if (!(variance > 0)) return 0;
    const groups = new Map<string, { W: number; s: number }>();
    paths.forEach((q, i) => {
      const k = key(q);
      const g = groups.get(k) ?? { W: 0, s: 0 };
      g.W += posterior[i]!;
      g.s += posterior[i]! * p[i]!;
      groups.set(k, g);
    });
    let between = 0;
    for (const g of groups.values()) if (g.W > 0) between += g.W * (g.s / g.W - mean) ** 2;
    return between / variance;
  };
  return { scenario: share((q) => q.sid), beta: share((q) => String(q.betaMult)), office: share((q) => String(q.officeMult)) };
}

/** 04 §8 item 6 on raw paths: p_i = 1 − S_i(k₀+h)/S_i(k₀). */
export function drivers(paths: Path[], posterior: number[], kOrigin: number, horizon: 12): { scenario: number; beta: number; office: number } {
  const p = paths.map((q) => 1 - q.S[kOrigin + horizon]! / q.S[kOrigin]!);
  return driverShares(paths, posterior, p);
}
