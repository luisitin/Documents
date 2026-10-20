/**
 * @caa/estimator — WP0 SKELETON (07-implementation-plan.md §2, declared ownership exception 2).
 *
 * WP1 writes the full §6.0 signature stubs and WP2 implements VPH-1.1 (04-estimation-model.md).
 * Pure: no I/O, never reads a clock (07 §6.0). WP0 only needs one real export so the hello-world
 * app proves Metro bundles `../packages/estimator` from source (spike V6) and jest maps it (V8).
 */

/**
 * EST-8 (04-estimation-model.md §1): q_x is the smallest whole month t ∈ [1, 72] with
 * 1 − S_c(t) ≥ x − 1e-12, else null ("más de 6 años"). `S` is S_c(0..72).
 */
export function quantile(S: number[], q: number): number | null {
  const last = Math.min(72, S.length - 1);
  for (let t = 1; t <= last; t++) {
    const s = S[t];
    if (s !== undefined && 1 - s >= q - 1e-12) return t;
  }
  return null;
}
