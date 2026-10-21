/**
 * Notification planning: pure, platform-independent (00-product-spec.md §7; 02-data-model.md §6
 * `caa:v1:notif:scheduled`). The native module turns these plans into local notifications; the
 * web build never schedules anything (web = in-app badges only).
 *
 * Triggers (00 §7):
 * - EAD (c)(9) expiry −180 / −90 / −30 days, at 10:00 local (dates from case-rules `eadStatus`,
 *   which uses the card's own expiry when the user typed it; key facts §2 row 4: renewals filed on
 *   or after 2025-10-30 get no automatic extension).
 * - RFE / NOID response due −21 / −7 days, at 10:00 local. The due date is the notice's `dueDate`,
 *   else derived from PA-2026-05 (key facts; `policy.pa202605`): RFE ≤ 84 days, NOID 30 days + 3
 *   mailing days.
 * - Foreground events (new official month, (c)(9) inquiry window, high-severity alert) are shown
 *   immediately when the app comes to the foreground, never during quiet hours (21:00–08:00).
 *
 * Copy is informational ("puede presentar…"), never a directive (00 §7 must-fix; 05 §5), and
 * every text is built in the language passed in, so a language change reschedules everything with
 * the new text (owner requirement 1). Privacy: texts carry dates only — never a name, nickname or
 * receipt number — and in discreet mode a generic text hides even the dates (00 F20; 05 §3).
 */
import type { CaseTimeline, ISODate, Lang, PolicyFile } from '@caa/data-schemas';
import { addDays, decisionOf, eadStatus } from '@caa/case-rules';
import { createFmt, translate } from '@caa/i18n-core';

export type NotificationKind = 'ead_expiry' | 'rfe_due' | 'noid_due' | 'data_month' | 'c9_inquiry' | 'alert';

/** One local notification to schedule. `fireAt` is LOCAL wall time `YYYY-MM-DDTHH:mm:00`. */
export interface PlannedNotification {
  id: string;
  kind: NotificationKind;
  caseId: string;
  fireAt: string;
  title: string;
  body: string;
  /** In-app route opened when the notification is tapped (00 §7 deep link `data.url`). */
  url: string;
}

/** 02 §6 `caa:v1:notif:scheduled` entry. */
export interface ScheduledRecord {
  id: string;
  kind: string;
  caseId: string;
  fireAt: string;
}

/** 00 §7 offsets. */
export const EAD_OFFSETS_DAYS = [180, 90, 30] as const;
export const RESPONSE_OFFSETS_DAYS = [21, 7] as const;
/** Deadline reminders fire at 10:00 local (00 §7 "DATE trigger 10:00 local"). */
export const REMINDER_HOUR = 10;
/** Quiet hours 21:00–08:00 (00 §7). */
export const QUIET_START_HOUR = 21;
export const QUIET_END_HOUR = 8;

/** True during quiet hours for a local hour 0–23. */
export function isQuietHour(hour: number): boolean {
  return hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR;
}

/** `YYYY-MM-DD` + hour → local wall-time string. */
export function localAt(d: ISODate, hour: number): string {
  return `${d}T${String(hour).padStart(2, '0')}:00:00`;
}

/** Local wall-time string → `Date` in the device's time zone. */
export function toLocalDate(fireAt: string): Date {
  const y = Number(fireAt.slice(0, 4));
  const mo = Number(fireAt.slice(5, 7));
  const d = Number(fireAt.slice(8, 10));
  const h = Number(fireAt.slice(11, 13));
  const mi = Number(fireAt.slice(14, 16));
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

/** The device-local date of `now` as `YYYY-MM-DD`. */
export function localIsoDate(now: Date): ISODate {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

interface Copy {
  title: string;
  body: string;
}

function text(lang: Lang, discreet: boolean, title: string, body: string): Copy {
  if (discreet) return { title: translate(lang, 'notifications:discreet.title'), body: translate(lang, 'notifications:discreet.body') };
  return { title, body };
}

/** The RFE / NOID response deadline of a notice milestone, or null when already answered. */
function responseDue(c: CaseTimeline, key: 'rfe' | 'noid', policy: PolicyFile): ISODate | null {
  const notices = c.milestones.filter((m) => m.key === key && m.date !== null);
  const last = notices[notices.length - 1];
  if (!last || last.date === null) return null;
  const answered = c.milestones.some((m) => m.key === (key === 'rfe' ? 'rfe_response' : 'noid_response') && m.date !== null && m.date >= (last.date as string));
  if (answered) return null;
  if (last.meta?.dueDate) return last.meta.dueDate;
  const pa = policy.pa202605;
  return addDays(last.date, key === 'rfe' ? pa.rfeMaxDays : pa.noidDays + pa.noidMailDays);
}

/**
 * Plans the deadline reminders of one case for `now` (only future fire times). Decided cases get
 * none. `discreet` hides dates in the text.
 */
export function planCaseReminders(c: CaseTimeline, policy: PolicyFile, lang: Lang, now: Date, discreet = false): PlannedNotification[] {
  if (decisionOf(c) !== null) return [];
  const fmt = createFmt(lang);
  const today = localIsoDate(now);
  const nowMs = now.getTime();
  const out: PlannedNotification[] = [];
  const push = (kind: NotificationKind, day: ISODate, copy: Copy, url: string) => {
    const fireAt = localAt(day, REMINDER_HOUR);
    if (toLocalDate(fireAt).getTime() <= nowMs) return;
    out.push({ id: `caa:${c.localId}:${kind}:${day}`, kind, caseId: c.localId, fireAt, url, ...copy });
  };

  const ead = eadStatus(c, policy, today);
  if (ead.expiry) {
    const expiry = ead.expiry;
    const copy = text(lang, discreet, translate(lang, 'notifications:ead.title'), translate(lang, 'notifications:ead.body', { date: fmt.date(expiry) }));
    for (const off of EAD_OFFSETS_DAYS) push('ead_expiry', addDays(expiry, -off), copy, '/case/ead');
  }

  for (const key of ['rfe', 'noid'] as const) {
    const due = responseDue(c, key, policy);
    if (due === null) continue;
    const copy = text(lang, discreet, translate(lang, `notifications:${key}.title`), translate(lang, 'notifications:response.body', { date: fmt.date(due) }));
    for (const off of RESPONSE_OFFSETS_DAYS) push(key === 'rfe' ? 'rfe_due' : 'noid_due', addDays(due, -off), copy, '/case');
  }

  out.sort((a, b) => (a.fireAt < b.fireAt ? -1 : a.fireAt > b.fireAt ? 1 : a.id < b.id ? -1 : 1));
  return out;
}

/** An event shown when the app returns to the foreground (00 §7 "on foreground"). */
export type ForegroundEvent =
  | { kind: 'data_month'; month: string }
  | { kind: 'c9_inquiry'; caseId: string }
  | { kind: 'alert'; alertId: string; title: { es: string; en: string } };

/** Text of a foreground event in `lang` (discreet → generic text). */
export function foregroundCopy(e: ForegroundEvent, lang: Lang, discreet = false): { title: string; body: string; url: string } {
  const fmt = createFmt(lang);
  switch (e.kind) {
    case 'data_month':
      return { ...text(lang, discreet, translate(lang, 'notifications:dataMonth.title'), translate(lang, 'notifications:dataMonth.body', { month: fmt.monthLong(e.month) })), url: '/' };
    case 'c9_inquiry':
      return { ...text(lang, discreet, translate(lang, 'notifications:c9Inquiry.title'), translate(lang, 'notifications:c9Inquiry.body')), url: '/case/remedies' };
    case 'alert':
      return { ...text(lang, discreet, e.title[lang], e.title[lang]), url: `/alerts/${e.alertId}` };
  }
}
