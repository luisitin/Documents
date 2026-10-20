/**
 * Scenario completion paths and the projection of one path (04-estimation-model.md §3.3, §6.1,
 * EST-4, EST-5, EST-7).
 *
 * §6.1 (anchorMonth 2026-08; k = months after the anchor): S0 800 flat; S1 800 + 3,800·min(k,12)/12;
 * S2 800 + 8,400·min(k,6)/6; S3 re-anchored at `dataThrough`: 0 for the first 6 projected months,
 * then S1(offset + j − 6). `offset` = months(anchorMonth → dataThrough) (0 today).
 *
 * §3.3 / EST-7, per step k = 1..H: every vintage ages 1 month; a receipts vintage (1,000; age 0.5;
 * label `f${k}`) is pushed; C = completions(k); W = Σ n·e^{βa}; t = k − k₀;
 * h = min(0.95, C·e^{β·a_u}/W · m · milestoneMult(t)) with milestoneMult = 1 for t ≤ 0 (the cap is
 * applied after all multipliers); every vintage loses C·n·e^{βa}/W (floored at 0); S[k] = S[k−1]·(1−h).
 *
 * The pool evolution does not depend on the multiplier or the milestones, so the work is split:
 * `pathRatios` replays the pool once per (scenario, β) and returns r_k = C·e^{β a_u}/W; then
 * `survivalFromRatios` applies any multiplier in O(H). `projectPath` is exactly their composition
 * (one implementation, so the cached grid in estimate.ts can never drift from it). Math.exp is
 * cached per age inside a path (07 WP2 step 5): ages are integers or half-integers.
 */
import type { ScenarioDef } from '@caa/data-schemas';
import type { Vintage } from './types';

/** The 04 §6.1 S1 path, used when a freeze scenario's `then` is not among the given defs. */
const DEFAULT_S1: ScenarioDef['path'] = { kind: 'ramp', from: 800, to: 4600, months: 12 };

/**
 * 04 §6.1: completions(k) for k months after `dataThrough`; `offset` = months(anchorMonth →
 * dataThrough). `all` (additive to contract v1) resolves a freeze scenario's `then` (S1).
 */
export function completionsPath(def: ScenarioDef, offset: number, all?: readonly ScenarioDef[]): (k: number) => number {
  const p = def.path;
  if (p.kind === 'flat') {
    const level = p.level;
    return () => level;
  }
  if (p.kind === 'ramp') {
    const a = p.from;
    const b = p.to;
    const n = p.months;
    return (k: number) => a + ((b - a) * Math.min(Math.max(offset + k, 0), n)) / n;
  }
  const thenDef = all?.find((s) => s.id === p.then);
  const then = completionsPath(thenDef ?? { ...def, id: 'S1', path: DEFAULT_S1, likelihoodUpdated: true }, offset, all);
  const f = p.freezeMonths;
  return (k: number) => (k <= f ? 0 : then(k - f));
}

export interface RatioArgs {
  pool: Vintage[]; vintage: string; beta: number; completions: (k: number) => number; H: number; receipts: number;
}

/**
 * r[k] = C_k·e^{β·a_u(k)} / W_k for k = 1..H (r[0] = 0). A forecast vintage `f${j}` (filed after
 * dataThrough) has r = 0 until it is pushed at step j. Throws if the vintage is unknown.
 */
export function pathRatios(a: RatioArgs): Float64Array {
  const pool = a.pool.map((v) => ({ label: v.label, age: v.age, n: v.n }));
  let u: Vintage | undefined = pool.find((v) => v.label === a.vintage);
  let futureStep = 0;
  if (!u) {
    const m = /^f(\d+)$/.exec(a.vintage);
    if (!m) throw new Error(`projectPath: vintage ${a.vintage} is not in the pool`);
    futureStep = Number(m[1]);
  }
  const cache = new Map<number, number>();
  const ex = (age: number) => {
    let e = cache.get(age);
    if (e === undefined) { e = Math.exp(a.beta * age); cache.set(age, e); }
    return e;
  };
  const r = new Float64Array(a.H + 1);
  const w: number[] = [];
  for (let k = 1; k <= a.H; k++) {
    for (const v of pool) v.age += 1;
    const fv = { label: `f${k}`, age: 0.5, n: a.receipts };
    pool.push(fv);
    if (!u && futureStep === k) u = fv;
    const C = a.completions(k);
    let W = 0;
    for (let i = 0; i < pool.length; i++) { const x = pool[i]!.n * ex(pool[i]!.age); w[i] = x; W += x; }
    if (W > 0) {
      r[k] = u ? (C * ex(u.age)) / W : 0;
      for (let i = 0; i < pool.length; i++) { const v = pool[i]!; v.n = Math.max(0, v.n - (C * w[i]!) / W); }
    }
  }
  return r;
}

/** EST-7: S[k] = S[k−1]·(1 − min(0.95, r_k·m·milestoneMult(k − k₀))), milestoneMult(t ≤ 0) = 1. */
export function survivalFromRatios(r: Float64Array, multiplier: number, kOrigin: number, milestoneMult?: (t: number) => number): number[] {
  const S = new Array<number>(r.length);
  S[0] = 1;
  for (let k = 1; k < r.length; k++) {
    const t = k - kOrigin;
    const mm = milestoneMult && t >= 1 ? milestoneMult(t) : 1;
    const h = Math.min(0.95, r[k]! * multiplier * mm);
    S[k] = S[k - 1]! * (1 - h);
  }
  return S;
}

/** 04 §3.3: survival S[0..H] of one path. */
export function projectPath(a: {
  pool: Vintage[]; vintage: string; beta: number; completions: (k: number) => number; multiplier: number;
  H: number; kOrigin: number; receipts: number; milestoneMult?: (t: number) => number;
}): number[] {
  const r = pathRatios({ pool: a.pool, vintage: a.vintage, beta: a.beta, completions: a.completions, H: a.H, receipts: a.receipts });
  return survivalFromRatios(r, a.multiplier, a.kOrigin, a.milestoneMult);
}
