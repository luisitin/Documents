/**
 * Structural band (04-estimation-model.md §7, must-fix): the point-estimate machinery rerun at the
 * extreme combined multipliers. Class-mix axis κ ∈ {0.5, 1, 2}; EAD axis {0.9, 1.0, 1.2} only when
 * an EAD was received. Extremes: no EAD {0.5, 2}; EAD received {0.5·0.9, 2·1.2} = {0.45, 2.4}.
 * Golden T15d: reference case [0.04352, 0.19801]; without the EAD [0.04815, 0.17021].
 */

export const STRUCTURAL_EXTREMES_NO_EAD: readonly number[] = [0.5, 2];
export const STRUCTURAL_EXTREMES_EAD: readonly number[] = [0.45, 2.4];

/** [min, max] of P(≤12) at the two extreme structural multipliers. */
export function structuralBand(runP12: (extraMult: number) => number, hasEad: boolean): [number, number] {
  const ext = hasEad ? STRUCTURAL_EXTREMES_EAD : STRUCTURAL_EXTREMES_NO_EAD;
  const p = ext.map(runP12);
  return [Math.min(...p), Math.max(...p)];
}
