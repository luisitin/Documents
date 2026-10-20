/**
 * State known, office unknown: a mixture of survival CURVES (04-estimation-model.md §5.3, must-fix).
 *
 * 1. Candidates = offices.stateOffices[state] with humanitarian pending > 0 in the latest quarter;
 *    if more than 8, keep the 8 largest and fold the rest into one pseudo-office with m = 1.
 * 2. Prior office weight w_o = pending_o / Σ pending.
 * 3. Each office runs the full grid with its m̂_o (1.0 if none) → conditioned mixture S_o(t) and
 *    U_o = Σ_paths prior·S(k₀).
 * 4. π_o ∝ w_o·U_o and S(t) = Σ_o π_o S_o(t). Averaging multipliers is WRONG and is not done.
 * Golden FL-4 (T30): π = 0.2799 / 0.3082 / 0.1543 / 0.2576 (HIA/KND/MIA/TAM), P12 10.49 %, q50 51;
 * the averaged-multiplier contrast (m = 1.169) would give 10.64 %.
 *
 * Equivalence used here: S(t) = Σ_o π_o S_o(t) equals the EST-6 mixture of the union of all office
 * paths with priors w_o·prior_i, and π_o is that union's posterior mass on office o.
 */
import type { OfficesFile } from '@caa/data-schemas';
import type { Path } from './types';
import { latestPending } from './office';
import { conditionedCurve, mixCurves, posteriorWeights } from './mix';

export const STATE_MIX_MAX_OFFICES = 8;
export const OTHER_OFFICES = 'OTHER';

/** 04 §5.3: S(t) = Σ_o π_o S_o(t) with π_o ∝ (pending_o / Σ pending) · U_o. */
export function stateMixture(perOffice: { code: string; pending: number; paths: Path[] }[], kOrigin: number): { S: number[]; weights: Record<string, number> } {
  const r = stateMixtureDetailed(perOffice, kOrigin);
  return { S: r.S, weights: r.weights };
}

/** As `stateMixture`, also returning the union paths and their posterior (for perScenario, drivers). */
export function stateMixtureDetailed(perOffice: { code: string; pending: number; paths: Path[] }[], kOrigin: number):
  { S: number[]; weights: Record<string, number>; paths: Path[]; posterior: number[]; owner: string[] } {
  const total = perOffice.reduce((a, o) => a + o.pending, 0);
  if (!(total > 0)) throw new Error('stateMixture: no pending in the candidate offices');
  const paths: Path[] = [];
  const owner: string[] = [];
  for (const o of perOffice) {
    for (const p of o.paths) {
      paths.push({ sid: p.sid, betaMult: p.betaMult, officeMult: p.officeMult, extraMult: p.extraMult, prior: p.prior * (o.pending / total), S: p.S });
      owner.push(o.code);
    }
  }
  const posterior = posteriorWeights(paths, kOrigin);
  const S = mixCurves(paths.map((p) => conditionedCurve(p, kOrigin)), posterior);
  const weights: Record<string, number> = {};
  for (const o of perOffice) weights[o.code] = 0;
  owner.forEach((c, i) => { weights[c] = weights[c]! + posterior[i]!; });
  return { S, weights, paths, posterior, owner };
}

/** 04 §5.3 step 1: the candidate offices of a state (with pending > 0 in the latest quarter), with their multipliers. */
export function stateCandidates(offices: OfficesFile, state: string, multiplier: (code: string) => number | undefined): { code: string; pending: number; multiplier: number }[] {
  const codes = offices.stateOffices[state] ?? [];
  const list: { code: string; pending: number; multiplier: number }[] = [];
  for (const code of codes) {
    const pending = latestPending(offices, code);
    if (pending !== null && pending > 0) list.push({ code, pending, multiplier: multiplier(code) ?? 1 });
  }
  list.sort((a, b) => b.pending - a.pending || (a.code < b.code ? -1 : 1));
  if (list.length <= STATE_MIX_MAX_OFFICES) return list;
  const rest = list.slice(STATE_MIX_MAX_OFFICES);
  return [...list.slice(0, STATE_MIX_MAX_OFFICES), { code: OTHER_OFFICES, pending: rest.reduce((a, o) => a + o.pending, 0), multiplier: 1 }];
}
