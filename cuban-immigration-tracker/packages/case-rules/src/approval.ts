/**
 * The approval card "Si se decide, ¿se aprueba? / If it is decided, is it approved?"
 * (00-product-spec.md S3 item 12; 02-data-model.md §4 note and §5 `approvalCard`; 04 §7, §8 rule 9).
 *
 * It is SEPARATE from the timing estimate and never multiplied into it (M5). Contents:
 * - `populationShares`: the last two official months, approvals / (approvals + denials), from the
 *   monthly CSV [F]: Jul 2026 49 % (308 of 626), Aug 2026 47 % (386 of 820) (key facts §3, §7).
 * - `baselines`: the quarterly approval baselines computed by the pipeline (`quarterly.json`
 *   `approvalBaselines`): FY26 Q1 91.7 %, Q2 52.6 %, Q3 23.7 %, FYTD 83 % (key facts §2 row 9).
 * - `cleanRange`: the 70–90 % prior for a clean parole case, ONLY when every basic document is
 *   checked `true` (key facts §3; `policy.approval.requiresBasicDocs`); otherwise null. It is never
 *   shown for a channel the gate excludes (I-220A / EWI / INA 236), and never in a headline or in
 *   share text (U8; 05 §5).
 * - `unmodelledFactors`: what this model does not see (criminal history, prior orders, I-220A
 *   misclassification, parole history, expired I-693) from `policy.approval`.
 */
import type { ApprovalBaseline, ApprovalCard, CaseTimeline, Localized, MonthlyRow, NationalFile, PolicyFile, QuarterlyFile, YearMonth } from '@caa/data-schemas';
import { basicDocsComplete, NO_ESTIMATE_CHANNELS } from './flags';

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Long month label in both languages ("julio de 2026" / "July 2026"; 02 §9 `monthLong`). */
export function monthLabel(m: YearMonth): Localized {
  const y = m.slice(0, 4);
  const i = Number(m.slice(5, 7)) - 1;
  return { es: `${MONTHS_ES[i]} de ${y}`, en: `${MONTHS_EN[i]} ${y}` };
}

/** One month's approval share among completions (approved + denied). Null when nothing was decided. */
export function monthlyShare(r: MonthlyRow): ApprovalBaseline | null {
  const denominator = r.approved + r.denied;
  if (denominator <= 0) return null;
  return { label: monthLabel(r.ym), numerator: r.approved, denominator, share: r.approved / denominator, period: r.ym, kind: 'share' };
}

/** 02 §5 `approvalCard(case, quarterly, national, policy)`. */
export function approvalCard(c: CaseTimeline, q: QuarterlyFile, n: NationalFile, policy: PolicyFile): ApprovalCard {
  const rows = n.rows.slice().sort((a, b) => (a.ym < b.ym ? -1 : a.ym > b.ym ? 1 : 0));
  const populationShares: ApprovalBaseline[] = [];
  for (const r of rows.slice(-2)) {
    const s = monthlyShare(r);
    if (s) populationShares.push(s);
  }
  const eligibleChannel = NO_ESTIMATE_CHANNELS[c.entryChannel] === undefined;
  const clean = policy.approval.requiresBasicDocs ? basicDocsComplete(c) === true : true;
  return {
    populationShares,
    baselines: q.approvalBaselines.slice(),
    cleanRange: clean && eligibleChannel ? [policy.approval.cleanPrior.low, policy.approval.cleanPrior.high] : null,
    unmodelledFactors: policy.approval.unmodelledFactors.slice(),
  };
}
