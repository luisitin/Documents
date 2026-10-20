/**
 * Vintage-pool reconstruction (04-estimation-model.md §3.1, EST-1, EST-2; doc 08 §11.5).
 *
 * EST-1: model rows start at 2024-09, the first month after the missing Aug 2024 file (doc 04
 * §1.0). Legacy vintages: `legacy>6mo` = pendingOver6 at age 12; `legacy<6mo` = pending −
 * pendingOver6 at age 3. EST-2 monthly order: ages += 1 → push the receipts vintage (age 0.5,
 * label = ym) → (fit only) record the model mean age of completions → remove C = approved + denied
 * in proportion to n·e^{βa}, flooring at 0 → rescale every vintage to the official pending total.
 *
 * Golden (T13): Σn = 355,520 over 25 vintages, min 1,210.8, scales 0.9932–1.0025, Mar-2025
 * vintage age 17.5 with n ≈ 23,096.5, 175,220.8 older.
 */
import type { MonthlyRow, YearMonth } from '@caa/data-schemas';
import type { Vintage } from './types';

/** EST-2 step 4: remove C in proportion to n·e^{βa}, flooring each vintage at 0. */
export function removeCompletions(pool: Vintage[], C: number, beta: number): void {
  const w = pool.map((v) => v.n * Math.exp(beta * v.age));
  let W = 0;
  for (const x of w) W += x;
  if (!(W > 0)) return;
  pool.forEach((v, i) => { v.n = Math.max(0, v.n - (C * w[i]!) / W); });
}

/** Model mean age of completions now: Σ n e^{βa}·a / Σ n e^{βa} (EST-3 targets). */
export function meanCompletionAge(pool: Vintage[], beta: number): number {
  let W = 0;
  let A = 0;
  for (const v of pool) {
    const w = v.n * Math.exp(beta * v.age);
    W += w;
    A += w * v.age;
  }
  return W > 0 ? A / W : 0;
}

/**
 * 04 §3.1 / EST-1, EST-2: replay `rows` (first row = pool origin, needs `pendingOver6`) into the
 * vintage pool. With `targets`, also returns the EST-3 SSE of (model mean age − avgMonths).
 */
export function reconstructPool(rows: MonthlyRow[], beta: number, targets?: readonly YearMonth[]): { pool: Vintage[]; scales: number[]; sse?: number } {
  const first = rows[0];
  if (!first) throw new Error('reconstructPool: no rows');
  if (first.pendingOver6 === null) throw new Error(`reconstructPool: first row ${first.ym} has no pendingOver6 (EST-1)`);
  const pool: Vintage[] = [
    { label: 'legacy>6mo', age: 12, n: first.pendingOver6 },
    { label: 'legacy<6mo', age: 3, n: first.pending - first.pendingOver6 },
  ];
  const scales: number[] = [];
  const tset = targets ? new Set(targets) : null;
  let sse = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]!;
    for (const v of pool) v.age += 1;
    pool.push({ label: r.ym, age: 0.5, n: r.received });
    if (tset && tset.has(r.ym) && r.avgMonths !== null) sse += (meanCompletionAge(pool, beta) - r.avgMonths) ** 2;
    removeCompletions(pool, r.approved + r.denied, beta);
    let total = 0;
    for (const v of pool) total += v.n;
    const s = total > 0 ? r.pending / total : 1;
    scales.push(s);
    for (const v of pool) v.n *= s;
  }
  return tset ? { pool, scales, sse } : { pool, scales };
}

/** The model rows: `firstModelMonth` ≤ ym ≤ `through` (EST-1). */
export function modelRows(rows: MonthlyRow[], firstModelMonth: YearMonth, through?: YearMonth): MonthlyRow[] {
  return rows.filter((r) => r.ym >= firstModelMonth && (through === undefined || r.ym <= through));
}

/**
 * 04 §3.3 vintage of a case: its receipt month, or a legacy vintage up to the pool origin month
 * (≥ 6 months before `firstModelMonth` → 'legacy>6mo', else 'legacy<6mo', matching EST-1's split
 * of the origin row), or the forecast vintage `f${k}` when filed after `dataThrough`.
 */
export function vintageLabel(receiptYm: YearMonth, firstModelMonth: YearMonth, dataThrough: YearMonth, monthsBetween: (a: YearMonth, b: YearMonth) => number): string {
  // The origin row's own receipts are inside its pending total (no '2024-09' vintage is pushed).
  if (receiptYm <= firstModelMonth) return monthsBetween(receiptYm, firstModelMonth) >= 6 ? 'legacy>6mo' : 'legacy<6mo';
  if (receiptYm > dataThrough) return `f${monthsBetween(dataThrough, receiptYm)}`;
  return receiptYm;
}
