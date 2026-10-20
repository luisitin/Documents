/**
 * v1.1 crowd utilities (04-estimation-model.md §11; doc 08 §4.2, §10.1, §11.9 T7–T9). Not used by
 * `estimate()` in v1; shipped with their tests so the v1.1 community job can rely on them.
 * Naive medians or trimmed quantiles of completed durations are banned (§11 must-fix).
 */

export interface KmStep { t: number; atRisk: number; events: number; S: number }

/** Kaplan–Meier Ŝ(t) = Π_{t_j ≤ t} (1 − d_j / n_j); censored cases stay at risk until their time. */
export function kaplanMeier(data: { t: number; event: boolean }[]): KmStep[] {
  const times = Array.from(new Set(data.filter((d) => d.event).map((d) => d.t))).sort((a, b) => a - b);
  let S = 1;
  return times.map((t) => {
    const atRisk = data.filter((d) => d.t >= t).length;
    const events = data.filter((d) => d.t === t && d.event).length;
    S *= 1 - events / atRisk;
    return { t, atRisk, events, S };
  });
}

/** Ŝ(t) from the KM steps (right-continuous step function). */
export function kmAt(km: KmStep[], t: number): number {
  let s = 1;
  for (const step of km) if (step.t <= t) s = step.S;
  return s;
}

/** Ŝ(t | survived to s) = Ŝ(t) / Ŝ(s) (T8). */
export function kmConditional(km: KmStep[], t: number, s: number): number {
  const base = kmAt(km, s);
  return base > 0 ? kmAt(km, t) / base : 0;
}

/** Discrete-time CRPS = Σ_k (F̂(k) − 1{y ≤ k})², F[i] = F̂(month i + 1) (T9: uniform 1–4, y = 2 → 0.375). */
export function discreteCrps(F: number[], y: number): number {
  let s = 0;
  F.forEach((f, i) => { s += (f - (y <= i + 1 ? 1 : 0)) ** 2; });
  return s;
}
