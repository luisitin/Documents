/**
 * `estimate()` — VPH-1.1 end to end (02-data-model.md §4; 04-estimation-model.md §3–§8).
 *
 * Pure and deterministic: no I/O, never reads a clock (`input.today` is the only date), and the
 * output depends on no language (U1). Steps:
 * 1. Mode (04 §4): decided / no_estimate return early; post_interview / post_expedite use the
 *    conditioned lognormal; interview_scheduled and queue use the VPH grid.
 * 2. Pool: replay `national.rows` from `firstModelMonth` to `params.dataThrough` with β̂ (§3.1).
 * 3. k₀ = months(dataThrough → month of today), H = k₀ + 72 (EST-5).
 * 4. Scenario weights from `scenarioWeights()` (§6.3), case-dependent conditions included.
 * 5. Grid (EST-4): scenario → β multiplier → office multiplier (→ structural extra for the band).
 *    Office known → m̂_o (EST-11); state known, office unknown → state mixture of curves (§5.3,
 *    only with `opts.bands`, default true); else national (m = 1).
 * 6. EST-6 conditioning and mixing; then the read-outs: pWithin, byDate (EST-9), quantiles (EST-8),
 *    perScenario, policyBand12, structuralBand12 (§7), drivers (§8), queue facts, yardstick,
 *    guards and confidence (§10.3). `clock` is echoed unchanged from `input.clock` (case-rules).
 * The approval card is NOT here (it comes from case-rules and never touches timing; 02 §4).
 */
import type { EstimateInput, EstimateOk, EstimateResult, ScenarioId } from '@caa/data-schemas';
import { daysBetween, monthsBetween, monthsCeil, DAYS_PER_MONTH, ym } from './dates';
import { modelRows, reconstructPool, vintageLabel } from './pool';
import { completionsPath, pathRatios, survivalFromRatios } from './project';
import { conditionedCurve, mixCurves, posteriorWeights } from './mix';
import { stateCandidates, stateMixtureDetailed } from './stateMix';
import { driverShares } from './drivers';
import { structuralBand } from './structural';
import { calendarDates, pByDate, quantile } from './quantiles';
import { decideMode, effectiveMilestones, interviewTransform, lognormalClock, milestoneMultiplier, rfeNoidEvents } from './milestones';
import { conditionalLognormalSurvival, delayedLognormalSurvival } from './lognormal';
import { orderedScenarios, scenarioWeights } from './weights';
import { WEAK_OFFICE_N, yardstickRecord } from './office';
import { computeGuards, confidenceLevel } from './guards';
import type { Path } from './types';

interface RunOut { paths: Path[]; post: number[]; curves: number[][]; S: number[]; stateWeights: Record<string, number> | null }

export function estimate(input: EstimateInput): EstimateResult {
  const c = input.case;
  const today = input.today;
  const params = input.params;
  const national = input.national;
  const decision = decideMode(c, input.flags, today);
  if (decision.kind === 'decided') return { kind: 'decided', outcome: decision.outcome, date: decision.date };
  if (decision.kind === 'no_estimate') return { kind: 'no_estimate', reason: decision.reason, flags: input.flags };
  const mode = decision.mode;
  const bands = input.opts?.bands !== false;

  // 2–3. pool and time origin
  let rows = modelRows(national.rows, national.firstModelMonth, params.dataThrough);
  if (!rows.length || rows[rows.length - 1]!.ym !== params.dataThrough) rows = modelRows(national.rows, national.firstModelMonth);
  const last = rows[rows.length - 1];
  if (!last) throw new Error('estimate: no monthly rows in the model window');
  const dataThrough = last.ym;
  const beta = params.beta.value;
  const pool = reconstructPool(rows, beta).pool;
  const kOrigin = Math.max(0, monthsBetween(dataThrough, ym(today)));
  const horizon = params.horizonMonths;
  const H = kOrigin + horizon;
  const label = vintageLabel(ym(c.i485ReceiptDate), national.firstModelMonth, dataThrough, monthsBetween);

  // 4. weights
  const sw = scenarioWeights(input.policy, input.alerts, national.rows, input.flags, params.observation, today);
  const defs = orderedScenarios(input.policy);

  // queue facts (00 S3 item 9)
  const u = pool.find((v) => v.label === label);
  let older = 0;
  for (const v of pool) if (!u || v.age > u.age) older += v.n; // a case filed after dataThrough: everyone pending is older
  const queue: EstimateOk['queue'] = {
    pendingTotal: last.pending, olderThanYou: older, sameMonthAsYou: u ? u.n : 0,
    completionsLastMonth: last.approved + last.denied, beta,
  };

  // 5. office. m̂_o is applied only to offices in params.officeGroup (the cubanFocus offices r_G is
  // measured on): elsewhere the humanitarian columns are mostly refugee/asylee adjustments and m̂_o
  // does not measure Cuban I-485 throughput, so those offices get m = 1 and `weak` (review round 1).
  const multOf = (code: string) => (params.officeGroup.includes(code) ? params.officeMultipliers.find((m) => m.code === code) : undefined);
  let mOffice = 1;
  let office: EstimateOk['office'] = { basis: 'national' };
  let groups: { code: string; pending: number; multiplier: number }[] | null = null;
  if (c.officeCode !== undefined) {
    const om = multOf(c.officeCode);
    mOffice = om ? om.shrunk : 1;
    const known = input.offices.offices.find((o) => o.code === c.officeCode);
    office = { basis: 'office', code: c.officeCode, multiplier: mOffice, weak: om ? om.completions < WEAK_OFFICE_N : true };
    const st = c.state ?? known?.state;
    if (st !== undefined) office.state = st;
    if (om) office.nCompletions = om.completions;
  } else if (c.state !== undefined && bands) {
    const cands = stateCandidates(input.offices, c.state, (code) => multOf(code)?.shrunk);
    if (cands.length) { groups = cands; office = { basis: 'state_mixture', state: c.state }; }
    else office = { basis: 'national', state: c.state };
  } else if (c.state !== undefined) {
    office = { basis: 'national', state: c.state };
  }
  const rec = c.officeCode !== undefined ? yardstickRecord(input.offices.processingTimes, c.officeCode) : null;
  const yardstick: EstimateOk['yardstick'] = {
    form: 'I-485', subtype: '131A-FAM', months80: rec ? rec.months80 : null, inquiryDate: rec ? rec.inquiryDate : null,
    publicationDate: rec ? rec.publicationDate : null, retrievedAt: rec ? rec.source.retrievedAt : null, isProxy: true,
  };
  if (c.officeCode !== undefined) yardstick.officeCode = c.officeCode;

  // guards + confidence (§10.3)
  const guards = computeGuards({ today, dataThrough, quarterly: input.quarterly, status: input.data.status, manifest: input.data.manifest });
  const groupKeys = [c.officeCode, c.state, 'all'].filter((k): k is string => k !== undefined);
  const confidence = confidenceLevel(guards, params, groupKeys);
  const validated = params.validation.status === 'validated_current';
  const hasEad = c.milestones.some((m) => m.key === 'ead_c9');

  const head = {
    kind: 'estimate' as const, modelVersion: params.modelVersion, dataThrough, k0: kOrigin, mode, clock: input.clock,
  };
  const readout = (S: number[]) => ({
    pWithin: { m3: 1 - S[3]!, m6: 1 - S[6]!, m12: 1 - S[12]!, m24: 1 - S[24]!, m36: 1 - S[36]! },
    byDate: calendarDates(today).map((d) => ({ date: d, p: pByDate(S, today, d) })),
    quantiles: { q10: quantile(S, 0.1), q25: quantile(S, 0.25), q50: quantile(S, 0.5), q75: quantile(S, 0.75), q90: quantile(S, 0.9) },
    survival: S,
  });

  const mm = milestoneMultiplier(c, today, params, input.policy);
  const lnClock = lognormalClock(decision.start ?? today, rfeNoidEvents(effectiveMilestones(c.milestones, today), today, input.policy));

  // post-interview / post-expedite: conditioned lognormal clock (§4), no grid. A pending RFE/NOID
  // holds S at 1 until its due date and the clock starts there; a later response restarts it.
  if (mode === 'post_interview' || mode === 'post_expedite') {
    const ln = mode === 'post_interview' ? params.milestone.postInterview : params.milestone.expediteGranted;
    let S: number[];
    if (lnClock.pendingDue !== null) {
      const days = daysBetween(today, lnClock.pendingDue);
      S = delayedLognormalSurvival(days / DAYS_PER_MONTH, monthsCeil(days), ln.medianMonths, ln.sigma, horizon);
    } else {
      S = conditionalLognormalSurvival(daysBetween(lnClock.clockStart, today) / DAYS_PER_MONTH, ln.medianMonths, ln.sigma, horizon);
    }
    const p12 = 1 - S[12]!;
    // TODO(EST-13): the bands collapse to P12 here because golden T28/T29 pin [p12, p12]; a real
    // low-confidence band needs an owner-approved 04 §9 edit + oracle change (review round 1).
    return {
      ...head, ...readout(S), policyBand12: [p12, p12], structuralBand12: [p12, p12], perScenario: [],
      drivers: { scenario: 0, beta: 0, office: 0 }, queue, office: groups ? { basis: 'national', state: c.state } : office, yardstick,
      delays: mm.delays, confidence, validated, guards, weightTrace: sw.trace,
    };
  }

  // 5–6. grid, conditioning, mixture
  const tStart = lnClock.pendingDue !== null ? monthsCeil(daysBetween(today, lnClock.pendingDue)) : undefined;
  const transform = mode === 'interview_scheduled' && decision.start !== undefined
    ? interviewTransform(monthsCeil(daysBetween(today, decision.start)), params.milestone.postInterview.medianMonths, params.milestone.postInterview.sigma, tStart)
    : null;
  const ratioCache = new Map<string, Float64Array>();
  const ratios = (sid: ScenarioId, bm: number): Float64Array => {
    const key = `${sid}|${bm}`;
    let r = ratioCache.get(key);
    if (!r) {
      const def = defs.find((d) => d.id === sid)!;
      r = pathRatios({
        pool, vintage: label, beta: beta * bm, H, receipts: params.receiptsForecast,
        completions: completionsPath(def, monthsBetween(def.anchorMonth, dataThrough), defs),
      });
      ratioCache.set(key, r);
    }
    return r;
  };
  const buildPaths = (m: number, extra: number): Path[] => {
    const out: Path[] = [];
    for (const def of defs) {
      for (const bg of params.grids.beta) {
        for (const og of params.grids.office) {
          const S = survivalFromRatios(ratios(def.id, bg[0]), m * og[0] * extra, kOrigin, mm.mult ?? undefined);
          out.push({ sid: def.id, betaMult: bg[0], officeMult: og[0], extraMult: extra, prior: (sw.weights[def.id] ?? 0) * bg[1] * og[1], S });
        }
      }
    }
    return out;
  };
  const run = (extra: number): RunOut => {
    let paths: Path[];
    let post: number[];
    let stateWeights: Record<string, number> | null = null;
    if (groups) {
      const det = stateMixtureDetailed(groups.map((g) => ({ code: g.code, pending: g.pending, paths: buildPaths(g.multiplier, extra) })), kOrigin);
      paths = det.paths;
      post = det.posterior;
      stateWeights = det.weights;
    } else {
      paths = buildPaths(mOffice, extra);
      post = posteriorWeights(paths, kOrigin);
    }
    let curves = paths.map((p) => conditionedCurve(p, kOrigin, horizon));
    if (transform) curves = curves.map(transform);
    return { paths, post, curves, S: mixCurves(curves, post, horizon), stateWeights };
  };

  const main = run(1);
  if (main.stateWeights) office.stateWeights = main.stateWeights;
  const perScenario: EstimateOk['perScenario'] = defs.map((def) => {
    const idx: number[] = [];
    main.paths.forEach((p, i) => { if (p.sid === def.id) idx.push(i); });
    let pw = 0;
    for (const i of idx) pw += main.post[i]!;
    const Ss = mixCurves(idx.map((i) => main.curves[i]!), idx.map((i) => (pw > 0 ? main.post[i]! / pw : 0)), horizon);
    return { id: def.id, weight: sw.weights[def.id] ?? 0, posteriorWeight: pw, p12: 1 - Ss[12]!, q50: quantile(Ss, 0.5) };
  });
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of perScenario) { lo = Math.min(lo, p.p12); hi = Math.max(hi, p.p12); }
  const p12 = 1 - main.S[12]!;
  const structuralBand12 = bands ? structuralBand((x) => 1 - run(x).S[12]!, hasEad) : [p12, p12] as [number, number];

  return {
    ...head, ...readout(main.S),
    policyBand12: perScenario.length ? [lo, hi] : [p12, p12],
    structuralBand12,
    perScenario,
    drivers: driverShares(main.paths, main.post, main.curves.map((cv) => 1 - cv[12]!)),
    queue, office, yardstick, delays: mm.delays, confidence, validated, guards, weightTrace: sw.trace,
  };
}
