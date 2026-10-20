/**
 * (c)(9) work permit status (00-product-spec.md S5; 02-data-model.md §5 `eadStatus`).
 *
 * Facts (research 00-key-facts-for-the-app.md §2 row 4; curated in `policy.ead`):
 * - Validity up to 5 years for cards issued before 2025-12-05; up to 18 months for cards issued
 *   from 2025-12-05.
 * - No automatic extension for renewals filed on or after 2025-10-30 (final rule 2026-10-14).
 * - The expiry the user enters (`ead_c9.meta.cardExpiry`, read from the card) always wins; the rule
 *   only gives an approximate expiry when none was entered ("lea la fecha en su tarjeta", 00 S5).
 * - Renewal planner: file at least 180 days before expiry (00 S5). Reminders at −180/−90/−30 days
 *   (00 §7 notifications), only those not already in the past.
 */
import type { CaseTimeline, EadStatus, ISODate, PolicyFile } from '@caa/data-schemas';
import { addDays, addMonths, ym } from './dates';
import { eadOf } from './flags';

/** 00 S5 / 00 §7: reminder offsets before expiry, in days. */
export const EAD_REMINDER_OFFSETS = [180, 90, 30] as const;
/** 00 S5: suggested renewal lead time. */
export const EAD_RENEW_LEAD_DAYS = 180;

/** Validity rule for an issue date (month granularity in the cut-over month is ambiguous → 'unknown'). */
export function eadValidityRule(issued: ISODate | null, granularity: 'day' | 'month', policy: PolicyFile): EadStatus['validityRule'] {
  if (issued === null) return 'unknown';
  const cut = policy.ead.fiveYearIfIssuedBefore;
  if (granularity === 'month' && ym(issued) === ym(cut) && cut.slice(8, 10) !== '01') return 'unknown';
  if (granularity === 'month') return ym(issued) < ym(cut) ? '5y' : '18m';
  return issued < cut ? '5y' : '18m';
}

/** 02 §5 `eadStatus(case, policy, today)`. */
export function eadStatus(c: CaseTimeline, policy: PolicyFile, today: ISODate): EadStatus {
  const ead = eadOf(c);
  const renewal = c.milestones.find((m) => m.key === 'ead_renewal_filed' && m.date !== null);
  // Only a renewal filed before the cut-off kept the automatic extension (key facts §2 row 4).
  const autoExtension = renewal !== undefined && renewal.date !== null && renewal.date < policy.ead.noAutoExtensionIfRenewalFiledOnOrAfter;
  if (ead === null) return { validityRule: 'unknown', autoExtension, reminders: [] };

  const validityRule = eadValidityRule(ead.date, ead.dateGranularity, policy);
  let expiry: ISODate | undefined = ead.meta?.cardExpiry;
  if (expiry === undefined && ead.date !== null) {
    // Approximate card end: issue date + validity − 1 day (2025-09-15 → 2030-09-14). With "solo sé
    // el mes" the first day of the month is used, so the estimate is the EARLIEST possible expiry
    // and the reminders can only come early, never late.
    const issued = ead.dateGranularity === 'month' ? `${ym(ead.date)}-01` : ead.date;
    if (validityRule === '5y') expiry = addDays(addMonths(issued, 60), -1);
    else if (validityRule === '18m') expiry = addDays(addMonths(issued, 18), -1);
  }
  const out: EadStatus = { validityRule, autoExtension, reminders: [] };
  if (expiry !== undefined) {
    out.expiry = expiry;
    out.renewBy = addDays(expiry, -EAD_RENEW_LEAD_DAYS);
    out.reminders = EAD_REMINDER_OFFSETS.map((d) => addDays(expiry as ISODate, -d)).filter((d) => d >= today);
  }
  return out;
}

/**
 * Where `eadStatus().expiry` comes from, for the S5 copy: 'card' (the user typed the date on the
 * card, which always wins), 'estimated' (computed from the validity rule; "lea la fecha en su
 * tarjeta"), or null (no expiry known).
 */
export function eadExpirySource(c: CaseTimeline, policy: PolicyFile): 'card' | 'estimated' | null {
  const ead = eadOf(c);
  if (ead === null) return null;
  if (ead.meta?.cardExpiry !== undefined) return 'card';
  if (ead.date === null) return null;
  return eadValidityRule(ead.date, ead.dateGranularity, policy) === 'unknown' ? null : 'estimated';
}
