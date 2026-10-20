/**
 * Scenario weights: one pure function, one ledger (04-estimation-model.md §6.2–§6.3, must-fix).
 *
 * Steps (frozen in contract v1, 07 §6.0):
 * 1. w ← the policy priors (S0 0.30 / S1 0.40 / S2 0.15 / S3 0.15; doc 08 §8.2).
 * 2. Alert effects: every published alert with date ≤ today, `expires` absent or ≥ today and not
 *    superseded by a later published alert, in (date, id) order. For each activated rule, each
 *    effect whose condition holds multiplies w[s] by its factor; then normalize. Conditions:
 *    `always`; `redEagleProtects` = flags.redEagleAppearsInClass && Red Eagle PI in force;
 *    `redEagleNotProtecting` = its negation; `dorcasPending` = Dorcas vacatur in force, appeal
 *    pending. With `flags = null` (the pipeline's case-independent part) only `always` and
 *    `dorcasPending` can hold.
 *    Effective litigation state: an ACTIVE alert for an event overrides a curated state that has
 *    not caught up yet (DORCAS_REVERSED/AFFIRMED → Dorcas no longer pending; RED_EAGLE_DISSOLVED →
 *    PI not in force). This is what makes "DORCAS_REVERSED + RED_EAGLE_DISSOLVED never compound
 *    past × 3" hold whatever the curated state says (04 §6.3 rule table; golden T32).
 * 3. Likelihood, for each observed monthly row after the anchor, in order: L_s = exp(−½·λ·z_s²),
 *    z_s = (ln C_obs − ln max(μ_s, floorLevel)) / σ for the likelihood-updated scenarios (S0–S2);
 *    then exactly: (i) multiply, (ii) normalize S0–S2 to 1, (iii) floor each at `weightFloor` (a
 *    fraction of the S0–S2 SUB-mass), (iv) renormalize, (v) multiply by (1 − w[S3]). S3 is never
 *    likelihood-updated (it is a future-freeze risk; §6.1). C_obs is floored at `floorLevel` too,
 *    so a zero-completion month cannot produce ln 0 (all S0–S2 then just compare with the floor).
 * 4. Every multiplication appends a trace entry {reason, ruleId, alertId, observedMonth, before, after}.
 * Golden T31 (σ 0.30, λ 0.5 → σ_eff 0.424): weights after the Sep 2026 CSV, by C_Sep; T25, T32.
 */
import type {
  Alert, AlertsFile, DerivedFlags, EstimatorParams, ISODate, MonthlyRow, PolicyFile, ScenarioDef, ScenarioId, YearMonth,
} from '@caa/data-schemas';
import { completionsPath } from './project';
import { addMonths, monthsBetween } from './dates';

export const SCENARIO_IDS: readonly ScenarioId[] = ['S0', 'S1', 'S2', 'S3'];

/** A weight-trace entry; assignable to `EstimateOk['weightTrace'][number]` (extra fields feed the ledger). */
export interface WeightTraceEntry {
  reason: 'alert_rule' | 'likelihood';
  ruleId?: string; alertId?: string; observedMonth?: YearMonth; observedCompletions?: number;
  before: Record<string, number>; after: Record<string, number>;
}

type Condition = 'always' | 'redEagleProtects' | 'redEagleNotProtecting' | 'dorcasPending';

/** Scenarios in EST-4 order (S0, S1, S2, S3), whatever order the policy file lists them in. */
export function orderedScenarios(policy: PolicyFile): ScenarioDef[] {
  return SCENARIO_IDS.map((id) => policy.scenarios.find((s) => s.id === id)).filter((s): s is ScenarioDef => s !== undefined);
}

function normalize(w: Record<string, number>): Record<string, number> {
  let z = 0;
  for (const k of Object.keys(w)) z += w[k]!;
  const out: Record<string, number> = {};
  for (const k of Object.keys(w)) out[k] = z > 0 ? w[k]! / z : 0;
  return out;
}

/** 04 §6.3 step 2: the alerts whose rules are in effect on `today`, in (date, id) order. */
export function activeAlerts(alerts: AlertsFile, today: ISODate): Alert[] {
  const pub = alerts.alerts.filter((a) => a.status === 'published' && a.date <= today);
  const live = pub.filter((a) => a.expires === undefined || a.expires >= today);
  const key = (a: Alert) => `${a.date}\u0000${a.id}`;
  const out = live.filter((a) => !pub.some((b) => (b.supersedes ?? []).includes(a.id) && key(b) > key(a)));
  return out.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

/** 04 §6.3: scenario weights (alert composition + tempered likelihood update) and their trace. */
export function scenarioWeights(
  policy: PolicyFile, alerts: AlertsFile, observed: MonthlyRow[], flags: DerivedFlags | null,
  observation: EstimatorParams['observation'], today: ISODate,
): { weights: Record<ScenarioId, number>; trace: WeightTraceEntry[] } {
  const defs = orderedScenarios(policy);
  let w: Record<string, number> = {};
  for (const s of defs) w[s.id] = s.prior;
  const trace: WeightTraceEntry[] = [];

  const act = activeAlerts(alerts, today);
  const fired = new Set<string>();
  for (const a of act) for (const r of a.ruleIds ?? []) fired.add(r);
  const dorcasPending = policy.litigationState.dorcas === 'vacatur_in_force_appeal_pending' && !fired.has('DORCAS_REVERSED') && !fired.has('DORCAS_AFFIRMED');
  const piInForce = policy.litigationState.redEagle.piInForce && !fired.has('RED_EAGLE_DISSOLVED');
  const protects = flags !== null && flags.redEagleAppearsInClass && piInForce;
  const holds: Record<Condition, boolean> = {
    always: true, dorcasPending, redEagleProtects: protects, redEagleNotProtecting: flags !== null && !protects,
  };
  for (const a of act) {
    for (const ruleId of a.ruleIds ?? []) {
      const rule = policy.alertRules.find((r) => r.ruleId === ruleId);
      if (!rule) continue;
      for (const e of rule.effects) {
        if (!holds[e.condition ?? 'always'] || w[e.scenario] === undefined) continue;
        const before = { ...w };
        w[e.scenario] = w[e.scenario]! * e.factor;
        w = normalize(w);
        trace.push({ reason: 'alert_rule', ruleId, alertId: a.id, before, after: { ...w } });
      }
    }
  }

  const upd = defs.filter((s) => s.likelihoodUpdated);
  if (upd.length) {
    let anchor = upd[0]!.anchorMonth;
    for (const s of upd) if (s.anchorMonth < anchor) anchor = s.anchorMonth;
    const paths = upd.map((s) => completionsPath(s, 0, defs));
    const lam = observation.tempering;
    const sig = observation.sigma;
    const fl = observation.floorLevel;
    const rows = observed.filter((r) => r.ym > anchor).sort((a, b) => (a.ym < b.ym ? -1 : a.ym > b.ym ? 1 : 0));
    for (const r of rows) {
      const C = r.approved + r.denied;
      const before = { ...w };
      let fixed = 0;
      for (const s of defs) if (!s.likelihoodUpdated) fixed += w[s.id]!;
      let sub: Record<string, number> = {};
      upd.forEach((s, i) => {
        const mu = paths[i]!(monthsBetween(s.anchorMonth, r.ym));
        const z = (Math.log(Math.max(C, fl)) - Math.log(Math.max(mu, fl))) / sig;
        sub[s.id] = w[s.id]! * Math.exp(-0.5 * lam * z * z); // (i)
      });
      sub = normalize(sub); // (ii)
      for (const k of Object.keys(sub)) sub[k] = Math.max(sub[k]!, observation.weightFloor); // (iii)
      sub = normalize(sub); // (iv)
      for (const k of Object.keys(sub)) w[k] = sub[k]! * (1 - fixed); // (v)
      trace.push({ reason: 'likelihood', observedMonth: r.ym, observedCompletions: C, before, after: { ...w } });
    }
  }
  const out = {} as Record<ScenarioId, number>;
  for (const id of SCENARIO_IDS) out[id] = w[id] ?? 0;
  return { weights: out, trace };
}

/**
 * v1.1 forecast ledger (04 §10.1, §6.2): for each of the next `months` months after
 * `params.dataThrough`, the predictive mixture of ln completions — one lognormal component per
 * scenario with μ = ln max(μ_s, floorLevel), the fitted σ and the case-independent weight.
 */
export function predictiveCompletions(params: EstimatorParams, policy: PolicyFile, months: number):
  { ym: YearMonth; components: { sid: ScenarioId; weight: number; mu: number; sigma: number }[] }[] {
  const defs = orderedScenarios(policy);
  const out: { ym: YearMonth; components: { sid: ScenarioId; weight: number; mu: number; sigma: number }[] }[] = [];
  const fns = defs.map((s) => completionsPath(s, monthsBetween(s.anchorMonth, params.dataThrough), defs));
  for (let j = 1; j <= months; j++) {
    out.push({
      ym: addMonths(params.dataThrough, j),
      components: defs.map((s, i) => ({
        sid: s.id, weight: params.scenarioWeights.weights[s.id] ?? 0,
        mu: Math.log(Math.max(fns[i]!(j), params.observation.floorLevel)), sigma: params.observation.sigma,
      })),
    });
  }
  return out;
}
