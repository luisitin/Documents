/**
 * Lognormal CDF for the post-interview and post-expedite clocks (04-estimation-model.md §4;
 * golden T10, T27–T29). Post-interview: median 3 months, σ 0.857 (doc 08 §7.5 [S′]; attorney
 * reports, low confidence [I]). Post-expedite: median 2 months, σ 0.857 (doc 15 §9.3 [I]).
 */

/**
 * Complementary error function with fractional error < 1.2e-7 everywhere (Chebyshev fit,
 * Press et al., Numerical Recipes 2nd ed. §6.2 `erfcc`). Relative accuracy in the tail matters
 * because the conditional clocks divide by 1 − F(s).
 */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}

/** Standard normal CDF Φ(z). */
export function normalCdf(z: number): number {
  return 0.5 * erfc(-z / Math.SQRT2);
}

/** Lognormal CDF F(t) = Φ((ln t − ln median)/σ); 0 for t ≤ 0 (T10: F(3) = 0.5 for median 3). */
export function lognormalCdf(t: number, median: number, sigma: number): number {
  if (!(t > 0)) return 0;
  return normalCdf((Math.log(t) - Math.log(median)) / sigma);
}

/** 1 − F(t), computed from erfc directly so the far tail keeps its relative accuracy. */
export function lognormalSurvival(t: number, median: number, sigma: number): number {
  if (!(t > 0)) return 1;
  return 0.5 * erfc((Math.log(t) - Math.log(median)) / (sigma * Math.SQRT2));
}

/**
 * 04 §4 post_interview / post_expedite: conditioned on s months already elapsed,
 * P(≤ t) = (F(s+t) − F(s)) / (1 − F(s)), so S_c(t) = (1 − F(s+t)) / (1 − F(s)), t = 0..horizon.
 */
export function conditionalLognormalSurvival(s: number, median: number, sigma: number, horizon: number): number[] {
  const base = lognormalSurvival(s, median, sigma);
  const out: number[] = [];
  for (let t = 0; t <= horizon; t++) out.push(base > 0 ? lognormalSurvival(s + t, median, sigma) / base : 0);
  out[0] = 1;
  return out;
}

/**
 * A lognormal clock that starts `delta` > 0 months after today (a pending RFE/NOID due date in the
 * lognormal modes; milestones.ts): S(t) = 1 for t ≤ zeroUntil (= monthsCeil of the due date, EST-10),
 * then 1 − F(t − delta), t = 0..horizon.
 */
export function delayedLognormalSurvival(delta: number, zeroUntil: number, median: number, sigma: number, horizon: number): number[] {
  const out: number[] = [];
  for (let t = 0; t <= horizon; t++) out.push(t <= zeroUntil ? 1 : lognormalSurvival(t - delta, median, sigma));
  return out;
}
