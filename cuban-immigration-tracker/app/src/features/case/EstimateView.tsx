/**
 * S3 — Su estimado / Your estimate (00-product-spec.md S3; 04-estimation-model.md §8).
 *
 * Renders `useEstimate()` (WP6: deriveFlags → clockFor → estimate) for the tab's case subject, top
 * to bottom: clock card, headline P(≤12) with its word label and BOTH bands right below it (never a
 * footnote), ladder 3/6/12/24/36, calendar row (31 Dec of this year, +1, +2), median line, fan chart,
 * scenario cards, driver bar, queue facts, office line with the official yardstick, entry notes,
 * peer card, the separate approval card, and the footer (chips, as-of, method link, disclaimer).
 *
 * Rules enforced here (tests: app/__tests__/screens-b-*):
 * - every figure comes from the estimator / case-rules output through `fmt` (no hard-coded "9 %",
 *   "306" or "≈10 de ellos"); the headline holds no calendar date (04 §8 rule 1);
 * - the pool is the national mixed group: the copy says "el promedio del grupo nacional de I-485
 *   cubanos" and never "casos como el suyo" (00 §3 principle 5);
 * - the approval card is separate (case-rules `approvalCard`), shows the population shares and the
 *   baselines with equal prominence, and the 70–90 % range only when every basic document is
 *   checked (00 §3 principle 6; U8);
 * - special states: no_estimate (I-220A / EWI / INA 236) → S9 content with no numbers; decided →
 *   the outcome and the denial branch; RFE/NOID pending → a red deadline card (the only red);
 *   post-interview / interview-scheduled / post-expedite notes (04 §4); estimator failure →
 *   "No pudimos calcular" with the inputs echoed.
 */
import { View } from 'react-native';
import type { CaseTimeline, DerivedFlags, EstimateOk, EstimateResult, Milestone, PolicyFile } from '@caa/data-schemas';
import { addDays, approvalCard, monthsSince } from '@caa/case-rules';
import { localize, probWord } from '@caa/i18n-core';
import { useData } from '@/data/useData';
import { useEstimate } from '@/data/useEstimate';
import { useLang } from '@/i18n/useLang';
import {
  AppText, Banner, Button, Card, ConfidenceChip, DriverBar, FanChart, ProbabilityLadder, RegimeStrip, ScenarioBars, useTheme,
} from '@/ui';
import { approxHundred, approxMonths, channelLabel, daysLabel, holdRanges, medianPhrase, monthsLabel, officeName, type T } from './format';
import { IneligibleContent } from './IneligibleView';
import { Paragraphs, useCaseNav } from './parts';
import type { CaseSubject } from './subject';

/** CHIRLA stay vacated (D.C. Cir. 25-5289): expedited-removal risk returns (doc 16 §6, §8.4; key facts §9). */
export const CHIRLA_STAY_VACATED = '2026-08-11';

type Fmt = ReturnType<typeof useLang>['fmt'];

const first = (c: CaseTimeline, key: Milestone['key']) => c.milestones.find((m) => m.key === key) ?? null;

/** The RFE / NOID still waiting for a response, with its due date (04 §4: d = dueDate ?? r + 84 d / n + 33 d). */
export function pendingResponse(c: CaseTimeline, policy: PolicyFile): { kind: 'rfe' | 'noid'; due: string } | null {
  const pa = policy.pa202605;
  for (const [kind, resp, days] of [['noid', 'noid_response', pa.noidDays + pa.noidMailDays], ['rfe', 'rfe_response', pa.rfeMaxDays]] as const) {
    const m = first(c, kind);
    if (!m || first(c, resp)) continue;
    const due = m.meta?.dueDate ?? (m.date !== null ? addDays(m.date, days) : null);
    if (due !== null) return { kind, due };
  }
  return null;
}

function ModeNotes({ c, r, policy, today, t, fmt }: { c: CaseTimeline; r: EstimateOk; policy: PolicyFile; today: string; t: T; fmt: Fmt }) {
  const { params } = useData();
  const notes: { tone: 'info' | 'warning' | 'deadline'; text: string; id: string }[] = [];
  if (r.mode === 'post_interview') notes.push({ id: 'post-interview', tone: 'info', text: t('estimate:mode.post_interview', { months: monthsLabel(params.milestone.postInterview.medianMonths, t, fmt) }) });
  if (r.mode === 'post_expedite') notes.push({ id: 'post-expedite', tone: 'info', text: t('estimate:mode.post_expedite', { months: monthsLabel(params.milestone.expediteGranted.medianMonths, t, fmt) }) });
  const notice = first(c, 'interview_notice');
  const at = notice?.meta?.scheduledFor;
  if (at !== undefined) {
    if (at > today) notes.push({ id: 'interview-scheduled', tone: 'info', text: t('estimate:mode.interview_scheduled', { date: fmt.date(at) }) });
    else if (!first(c, 'interview')) notes.push({ id: 'interview-passed', tone: 'warning', text: t('estimate:mode.interviewPassed', { date: fmt.date(at) }) });
  }
  const pending = pendingResponse(c, policy);
  if (pending) {
    const overdue = pending.due < today;
    const parts = [
      t(pending.kind === 'rfe' ? 'estimate:deadline.rfe' : 'estimate:deadline.noid', { date: fmt.date(pending.due) }),
      t('estimate:deadline.rule', { since: fmt.date(policy.pa202605.effective), weeks: fmt.int(Math.round(policy.pa202605.rfeMaxDays / 7)), noid: fmt.int(policy.pa202605.noidDays) }),
      overdue || r.delays.nonResponseRisk ? t('estimate:deadline.nonResponse') : t('estimate:deadline.applied'),
    ];
    // Red only for a true deadline still ahead (00 §3 principle 8); a passed date is amber.
    notes.push({ id: 'deadline', tone: overdue ? 'warning' : 'deadline', text: parts.join(' ') });
  }
  if (notes.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      {notes.map((n) => (
        <Banner key={n.id} testID={`estimate-note-${n.id}`} tone={n.tone} text={n.text} />
      ))}
    </View>
  );
}

function Guards({ r, t, fmt }: { r: EstimateOk; t: T; fmt: Fmt }) {
  const { manifest } = useData();
  const texts: { id: string; text: string }[] = [];
  for (const g of r.guards) {
    if (g.id === 'T20a') texts.push({ id: g.id, text: t('estimate:guard.T20a', { month: fmt.month(manifest.latestOfficialMonth) }) });
    if (g.id === 'T20b') texts.push({ id: g.id, text: t('estimate:guard.T20b', { months: (g.months ?? []).map((m) => fmt.month(m)).join(', ') }) });
    if (g.id === 'qa_degraded') texts.push({ id: g.id, text: t('estimate:guard.qa_degraded') });
  }
  if (texts.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      {texts.map((x) => (
        <Banner key={x.id} testID={`estimate-guard-${x.id}`} tone="warning" text={x.text} />
      ))}
    </View>
  );
}

function ClockCard({ c, r, t, fmt }: { c: CaseTimeline; r: EstimateOk; t: T; fmt: Fmt }) {
  const { policy, today } = useData();
  const clock = r.clock;
  const holdDays = Math.max(0, clock.calendarDays - clock.adjudicableDays);
  const lines = [t('estimate:clock.filed', { months: monthsLabel(monthsSince(clock.calendarDays), t, fmt) })];
  lines.push(
    holdDays > 0
      ? t('estimate:clock.holds', { holdMonths: fmt.int(approxMonths(holdDays)), holdDays: daysLabel(holdDays, t, fmt), ranges: holdRanges(policy, clock.holdsApplied, t, fmt) })
      : t('estimate:clock.noHolds'),
  );
  lines.push(t('estimate:clock.adjudicable', { adjDays: daysLabel(clock.adjudicableDays, t, fmt), adjMonths: monthsLabel(approxMonths(clock.adjudicableDays), t, fmt) }));
  if (clock.adjudicableDaysAltOps !== clock.adjudicableDays) lines.push(t('estimate:clock.altOps', { adjDays: daysLabel(clock.adjudicableDaysAltOps, t, fmt) }));
  const text = lines.join(' ');
  return (
    <Card title={t('estimate:clock.title')} testID="estimate-clock">
      <AppText testID="estimate-clock-text">{text}</AppText>
      <RegimeStrip clock={clock} regimes={policy.regimes} receipt={c.i485ReceiptDate} today={today} unknownChannelClocks={clock.unknownChannelClocks} />
      {holdDays > 0 ? (
        <AppText size="sm" muted>
          {t('estimate:clock.vacated')}
        </AppText>
      ) : null}
    </Card>
  );
}

function Headline({ c, r, t, fmt, lang }: { c: CaseTimeline; r: EstimateOk; t: T; fmt: Fmt; lang: 'es' | 'en' }) {
  const theme = useTheme();
  const p = fmt.pct(r.pWithin.m12);
  const word = probWord(r.pWithin.m12, lang);
  const hasEad = c.milestones.some((m) => m.key === 'ead_c9');
  const policyBand = t('estimate:band.policy', { lo: fmt.pct(r.policyBand12[0]), hi: fmt.pct(r.policyBand12[1]) });
  const structural = t(hasEad ? 'estimate:band.structuralEad' : 'estimate:band.structuralNoEad', { lo: fmt.pct(r.structuralBand12[0]), hi: fmt.pct(r.structuralBand12[1]) });
  return (
    <Card testID="estimate-headline">
      <View accessible accessibilityLabel={t('estimate:headline.a11y', { p, word })} style={{ gap: theme.space(1) }}>
        <AppText weight="medium" header>
          {t('estimate:headline.label')}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: theme.space(2) }}>
          <AppText size="xl" weight="bold" testID="estimate-headline-pct" style={{ fontSize: 34, lineHeight: 40 }}>
            {p}
          </AppText>
          <AppText size="lg" testID="estimate-headline-word">
            {t('estimate:headline.word', { word })}
          </AppText>
        </View>
      </View>
      <AppText testID="estimate-band-policy">{policyBand}</AppText>
      <AppText testID="estimate-band-structural">{structural}</AppText>
      <AppText size="sm" muted>
        {t('estimate:headline.group')}
      </AppText>
    </Card>
  );
}

function CalendarRow({ r, t, fmt }: { r: EstimateOk; t: T; fmt: Fmt }) {
  const items = r.byDate
    .filter((b) => b.date.endsWith('-12-31'))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3)
    .map((b) => {
      const pct = fmt.pct(b.p);
      const p = b.p < 0.01 ? pct : t('estimate:calendar.approx', { p: pct });
      return { date: b.date, text: t('estimate:calendar.item', { date: fmt.date(b.date), p }) };
    });
  return (
    <Card title={t('estimate:calendar.title')} testID="estimate-calendar">
      {items.map((i) => (
        <AppText key={i.date} testID={`estimate-calendar-${i.date}`}>
          {i.text}
        </AppText>
      ))}
    </Card>
  );
}

function MedianLine({ r, t, fmt }: { r: EstimateOk; t: T; fmt: Fmt }) {
  const s2 = r.perScenario.find((s) => s.id === 'S2');
  const parts = [t('estimate:median.mixed', { median: medianPhrase(r.quantiles.q50, t, fmt) })];
  if (s2 && s2.q50 !== null) parts.push(t('estimate:median.s2', { months: monthsLabel(s2.q50, t, fmt) }));
  return <AppText testID="estimate-median">{parts.join(' ')}</AppText>;
}

function QueueCard({ r, t, fmt }: { r: EstimateOk; t: T; fmt: Fmt }) {
  const q = r.queue;
  const text = t('estimate:queue.body', {
    pending: fmt.int(q.pendingTotal), month: fmt.month(r.dataThrough), older: fmt.int(approxHundred(q.olderThanYou)),
    same: fmt.int(approxHundred(q.sameMonthAsYou)), completions: fmt.int(q.completionsLastMonth),
  });
  return (
    <Card title={t('estimate:queue.title')} testID="estimate-queue">
      <AppText>{text}</AppText>
      <AppText size="sm" muted>
        {t('estimate:queue.nonFifo')}
      </AppText>
    </Card>
  );
}

function OfficeCard({ r, t, fmt }: { r: EstimateOk; t: T; fmt: Fmt }) {
  const { offices, params } = useData();
  const o = r.office;
  const lines: string[] = [];
  if (o.basis === 'office' && o.code) {
    const q = params.officeMultipliers.find((m) => m.code === o.code)?.quarters.length ?? 0;
    lines.push(t('estimate:office.known', { office: officeName(o.code, offices), mult: fmt.dec(o.multiplier ?? 1, 2), n: fmt.int(o.nCompletions ?? 0), q: fmt.int(q) }));
    if (o.weak) lines.push(t('estimate:office.weak'));
  } else if (o.basis === 'state_mixture' && o.state) {
    lines.push(t('estimate:office.state', { state: o.state }));
  } else {
    lines.push(t('estimate:office.national'));
  }
  const y = r.yardstick;
  if (y.officeCode !== undefined || y.months80 !== null || y.inquiryDate !== null) {
    const time = y.months80 === null ? t('estimate:yardstick.noTime') : t('common:unit.month.other', { n: fmt.dec(y.months80, 1) });
    const inquiry = y.inquiryDate === null ? t('common:state.notAvailable') : fmt.date(y.inquiryDate);
    let s = t('estimate:yardstick.body', { p80: fmt.pct(0.8), time, inquiry });
    if (y.publicationDate) s += ` ${t('estimate:yardstick.published', { date: fmt.date(y.publicationDate) })}`;
    lines.push(s);
  }
  lines.push(t('estimate:office.channel'));
  return (
    <Card title={t('estimate:office.title')} testID="estimate-office">
      <Paragraphs items={lines} />
    </Card>
  );
}

/** Entry-channel and class notes (00 F4; key facts §1; doc 16 §5, §8). */
export function entryNotes(c: CaseTimeline, flags: DerivedFlags, policy: PolicyFile, t: T, fmt: Fmt): { id: string; tone: 'info' | 'warning'; text: string }[] {
  const out: { id: string; tone: 'info' | 'warning'; text: string }[] = [];
  if (flags.isParoleBased) out.push({ id: 'paroled', tone: 'info', text: t('estimate:entry.paroled') });
  if (c.entryChannel === 'VISA') out.push({ id: 'visa', tone: 'info', text: t('estimate:entry.visa') });
  if (c.entryChannel === 'UNKNOWN') out.push({ id: 'unknown', tone: 'info', text: t('estimate:entry.unknown') });
  const k = policy.classes;
  if (flags.redEagleAppearsInClass) out.push({ id: 'red-eagle', tone: 'info', text: t('estimate:entry.redEagle', { docket: k.redEagle.docket, date: fmt.date(k.redEagle.notFinallyAdjudicatedOn) }) });
  else if (flags.filedAfterRedEagle) out.push({ id: 'after-red-eagle', tone: 'info', text: t('estimate:entry.filedAfterRedEagle', { date: fmt.date(k.redEagle.notFinallyAdjudicatedOn) }) });
  if (flags.doeDhsAppearsInClass === true) out.push({ id: 'doe-dhs', tone: 'info', text: t('estimate:entry.doeDhs', { docket: k.doeDhs.docket }) });
  else if (flags.doeDhsAppearsInClass === 'unknown') out.push({ id: 'doe-dhs-unknown', tone: 'info', text: t('estimate:entry.doeDhsUnknown', { docket: k.doeDhs.docket }) });
  if (flags.frpI485Carveout) out.push({ id: 'frp', tone: 'info', text: t('estimate:entry.frp', { fr: k.frpCarveout.fr, date: fmt.date(k.frpCarveout.i485PendingBy) }) });
  if (flags.reTerminationDateSuspicious && c.paroleEndDateOriginal) out.push({ id: 're-termination', tone: 'warning', text: t('case:warn.reTermination', { date: fmt.date(c.paroleEndDateOriginal) }) });
  if (flags.oneYearWarning && c.paroleDate) out.push({ id: 'one-year', tone: 'warning', text: t('case:warn.oneYear', { date: fmt.date(c.paroleDate) }) });
  if (flags.expeditedRemovalWarning) out.push({ id: 'enforcement', tone: 'warning', text: t('common:disclaimer.enforcement', { date: fmt.date(CHIRLA_STAY_VACATED) }) });
  return out;
}

function EntryCard({ c, flags, t, fmt }: { c: CaseTimeline; flags: DerivedFlags; t: T; fmt: Fmt }) {
  const { policy } = useData();
  const notes = entryNotes(c, flags, policy, t, fmt);
  if (notes.length === 0) return null;
  return (
    <Card title={t('estimate:entry.title')} testID="estimate-entry">
      <View style={{ gap: 8 }}>
        {notes.map((n) => (
          <Banner key={n.id} testID={`entry-note-${n.id}`} tone={n.tone} text={n.text} />
        ))}
      </View>
    </Card>
  );
}

/** The separate approval card (00 S3 item 12; case-rules `approvalCard`). */
export function ApprovalCardView({ c }: { c: CaseTimeline }) {
  const { t, fmt, lang } = useLang();
  const { quarterly, national, policy } = useData();
  const a = approvalCard(c, quarterly, national, policy);
  const pct1 = (x: number) => t('common:fmt.pct', { n: fmt.dec(x * 100, 1) });
  const shares = a.populationShares
    .map((s) => t('estimate:approval.share', { month: fmt.month(s.period), p: fmt.pct(s.share), num: fmt.int(s.numerator), den: fmt.int(s.denominator) }))
    .join(t('estimate:approval.listJoin'));
  const baselines = a.baselines.map((b) => t('estimate:approval.baseline', { label: localize(b.label, lang), p: pct1(b.share), num: fmt.int(b.numerator), den: fmt.int(b.denominator) }));
  return (
    <Card title={t('estimate:approval.title')} testID="estimate-approval">
      <AppText size="sm" muted>
        {t('estimate:approval.separate')}
      </AppText>
      {shares ? <AppText testID="approval-shares">{t('estimate:approval.recent', { shares })}</AppText> : null}
      <AppText weight="medium">{t('estimate:approval.quarters')}</AppText>
      <Paragraphs testID="approval-baselines" items={baselines} />
      {a.cleanRange ? (
        <View testID="approval-range" style={{ gap: 6 }}>
          <AppText>{t('estimate:approval.clean', { lo: fmt.pct(a.cleanRange[0]), hi: fmt.pct(a.cleanRange[1]) })}</AppText>
          <AppText weight="medium">{t('estimate:approval.unmodelled')}</AppText>
          <Paragraphs muted items={a.unmodelledFactors.map((f) => `• ${localize(f, lang)}`)} />
        </View>
      ) : (
        <AppText size="sm" muted testID="approval-no-range">
          {t('estimate:approval.noRange')}
        </AppText>
      )}
    </Card>
  );
}

function Footer({ r, t, fmt, isSample }: { r: EstimateOk; t: T; fmt: Fmt; isSample: boolean }) {
  const { params, today } = useData();
  const nav = useCaseNav();
  const theme = useTheme();
  const lines = [
    t('estimate:footer.data', { n: monthsLabel(params.confidenceGates.r4MonthsOfData, t, fmt) }),
    t('estimate:footer.asOf', { today: fmt.date(today), month: fmt.month(r.dataThrough) }),
  ];
  if (isSample) lines.push(t('estimate:footer.sample'));
  return (
    <View testID="estimate-footer" style={{ gap: theme.space(2) }}>
      <ConfidenceChip level={r.confidence} validated={r.validated} />
      <Paragraphs muted items={lines} />
      <View style={{ alignSelf: 'flex-start' }}>
        <Button testID="estimate-method" variant="link" label={t('estimate:footer.method')} onPress={() => nav.push('/more/method')} />
      </View>
      <AppText size="sm" muted testID="case-disclaimer">
        {t('common:disclaimer.full')}
      </AppText>
    </View>
  );
}

function EstimateOkView({ c, r, flags }: { c: CaseTimeline; r: EstimateOk; flags: DerivedFlags }) {
  const { t, fmt, lang } = useLang();
  const { policy, today, status } = useData();
  const nav = useCaseNav();
  const theme = useTheme();
  const labels = Object.fromEntries(policy.scenarios.map((s) => [s.id, localize(s.label, lang)]));
  const ladder = [
    { months: 3, p: r.pWithin.m3 }, { months: 6, p: r.pWithin.m6 }, { months: 12, p: r.pWithin.m12 },
    { months: 24, p: r.pWithin.m24 }, { months: 36, p: r.pWithin.m36 },
  ];
  return (
    <View testID="estimate-ok" style={{ gap: theme.space(3) }}>
      <ModeNotes c={c} r={r} policy={policy} today={today} t={t} fmt={fmt} />
      <Guards r={r} t={t} fmt={fmt} />
      <ClockCard c={c} r={r} t={t} fmt={fmt} />
      <Headline c={c} r={r} t={t} fmt={fmt} lang={lang} />
      <Card title={t('estimate:ladder.title')}>
        <ProbabilityLadder rows={ladder} />
      </Card>
      <CalendarRow r={r} t={t} fmt={fmt} />
      <MedianLine r={r} t={t} fmt={fmt} />
      <Card title={t('estimate:fan.title')}>
        <FanChart survival={r.survival} startYm={today.slice(0, 7)} />
      </Card>
      <Card title={t('estimate:scenarios.title')}>
        <ScenarioBars perScenario={r.perScenario} labels={labels} />
        <View style={{ alignSelf: 'flex-start' }}>
          <Button testID="estimate-ledger" variant="link" label={t('estimate:scenarios.ledger')} onPress={() => nav.push('/more/method')} />
        </View>
      </Card>
      <Card title={t('estimate:drivers.title')}>
        <DriverBar drivers={r.drivers} />
      </Card>
      <QueueCard r={r} t={t} fmt={fmt} />
      <OfficeCard r={r} t={t} fmt={fmt} />
      <EntryCard c={c} flags={flags} t={t} fmt={fmt} />
      <Card title={t('estimate:peers.title')} testID="estimate-peers">
        <AppText>{t('estimate:peers.body')}</AppText>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button testID="estimate-peers-open" variant="secondary" label={t('estimate:peers.open')} onPress={() => nav.push('/case/peers')} />
        </View>
      </Card>
      <ApprovalCardView c={c} />
      <Footer r={r} t={t} fmt={fmt} isSample={status === 'sample'} />
    </View>
  );
}

function DecidedView({ outcome, date }: { outcome: string; date: string | null }) {
  const { t, fmt } = useLang();
  const nav = useCaseNav();
  const known = ['approved', 'denied', 'withdrawn', 'admin_closed'].includes(outcome) ? outcome : 'unknown';
  const text = t('estimate:decided.body', { outcome: t(`case:outcome.${known}`), date: date ? fmt.date(date) : t('estimate:decided.noDate') });
  return (
    <Card title={t('estimate:decided.title')} testID="estimate-decided">
      <AppText>{text}</AppText>
      {outcome === 'denied' ? (
        <View style={{ alignSelf: 'flex-start' }}>
          <Button testID="estimate-denial" variant="secondary" label={t('estimate:decided.denialLink')} onPress={() => nav.push('/case/remedies')} />
        </View>
      ) : null}
    </Card>
  );
}

function ErrorView({ c }: { c: CaseTimeline }) {
  const { t, fmt } = useLang();
  const text = t('estimate:error.body', { channel: channelLabel(c.entryChannel, t), month: fmt.month(c.i485ReceiptDate.slice(0, 7)) });
  return (
    <Card title={t('estimate:error.title')} tone="warning" testID="estimate-error">
      <AppText>{text}</AppText>
    </Card>
  );
}

/** The estimate for the tab's case subject, or its special state. */
export function EstimateBody({ subject }: { subject: CaseSubject }) {
  const est = useEstimate(subject.estimateId);
  const c = subject.timeline;
  if (!c) return null;
  const r: EstimateResult | null = est.result;
  if (r === null || est.flags === null) return <ErrorView c={c} />;
  if (r.kind === 'decided') return <DecidedView outcome={r.outcome} date={r.date} />;
  if (r.kind === 'no_estimate') return r.reason ? <IneligibleContent reason={r.reason} /> : <ErrorView c={c} />;
  return <EstimateOkView c={c} r={r} flags={est.flags} />;
}
