/**
 * S5 — Permiso de trabajo (c)(9) / Work permit (c)(9) (`/case/ead`; 00-product-spec.md S5).
 *
 * Facts (research 00-key-facts-for-the-app.md §2 row 4, §10; curated in `policy.ead`):
 * - cards issued before 2025-12-05: up to 5 years; from 2025-12-05: up to 18 months; the expiry the
 *   user enters (read from the card) wins (case-rules `eadStatus`, `eadExpirySource`);
 * - renewals filed on or after 2025-10-30 get no automatic extension (final rule 2026-10-14);
 *   renewal planner: file at least 180 days before expiry; reminders −180/−90/−30 days (native);
 * - pending (c)(9): the I-765 147-C9 inquiry date at NBC and the e-Request state (case-rules rung
 *   `a_c9`); the national I-765 "Adjustment Of Status" quarterly row, labelled "todas las
 *   nacionalidades" (doc 04 §1.2 [F]); the earlier FY26 Q1 figure for context only; press-reported
 *   waits of 12–12.5 months [S-sec CiberCuba 2026-10-17, master timeline]. NO EAD estimate model.
 * - (c)(11) parole EADs were revoked 2025-06-12 (CHNV) and 2026-04-24 (CBP One) (key facts §10).
 */
import { useState } from 'react';
import { View } from 'react-native';
import type { CaseTimeline, QuarterRow } from '@caa/data-schemas';
import { C9_OFFICE, C9_SUBTYPE, EAD_RENEW_LEAD_DAYS, daysBetween, eadExpirySource, eadStatus, latestRecord } from '@caa/case-rules';
import { useData } from '@/data/useData';
import { useEstimate } from '@/data/useEstimate';
import { useLang } from '@/i18n/useLang';
import { notifications } from '@/notifications';
import { useCases } from '@/storage/cases';
import { useSettings } from '@/storage/settings';
import { AppText, Banner, Button, Card, StatTile, quarterLabel, useTheme } from '@/ui';
import { CaseFrame, ExampleBanner, Paragraphs } from './parts';
import { useCaseSubject } from './subject';

/** Press-reported (c)(9) waits, Oct 2026 [S-sec] (master timeline 2026-10-17, CiberCuba). Not official. */
export const PRESS_EAD_WAIT = { lo: 12, hi: 12.5, month: '2026-10' } as const;
/** (c)(11) parole EAD revocations (key facts §10 glossary row I-765 (c)(11)). */
export const C11_REVOKED = { chnv: '2025-06', cbpOne: '2026-04' } as const;

const AOS_FORM: QuarterRow['form'] = 'I-765 (Adjustment Of Status)';

function Validity({ c }: { c: CaseTimeline | null }) {
  const { t, fmt } = useLang();
  const { policy, today } = useData();
  const cut = fmt.date(policy.ead.fiveYearIfIssuedBefore);
  const lines = [t('ead:validity.rule5y', { cut }), t('ead:validity.rule18m', { cut: fmt.date(policy.ead.eighteenMonthsFrom) })];
  const ead = c?.milestones.find((m) => m.key === 'ead_c9') ?? null;
  if (c && ead) {
    const st = eadStatus(c, policy, today);
    const issued = ead.date === null ? '—' : ead.dateGranularity === 'month' ? fmt.month(ead.date.slice(0, 7)) : fmt.date(ead.date);
    lines.push(st.validityRule === '5y' ? t('ead:validity.yours5y', { issued }) : st.validityRule === '18m' ? t('ead:validity.yours18m', { issued }) : t('ead:validity.yoursUnknown'));
    const src = eadExpirySource(c, policy);
    if (st.expiry && src === 'card') lines.push(t('ead:validity.expiryCard', { date: fmt.date(st.expiry) }));
    else if (st.expiry) lines.push(t('ead:validity.expiryEstimated', { date: fmt.date(st.expiry) }));
  }
  lines.push(t('ead:validity.readCard'));
  return (
    <Card title={t('ead:validity.title')} testID="ead-validity">
      <Paragraphs items={lines} />
    </Card>
  );
}

function Renewal({ c, isExample }: { c: CaseTimeline | null; isExample: boolean }) {
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const { policy, today } = useData();
  const { save } = useCases();
  const { settings } = useSettings();
  const [permission, setPermission] = useState<'unknown' | 'denied'>('unknown');
  const from = fmt.date(policy.ead.noAutoExtensionIfRenewalFiledOnOrAfter);
  const lines = [t('ead:renewal.rule', { from, rule: fmt.date(policy.ead.finalRule) })];
  const st = c ? eadStatus(c, policy, today) : null;
  const hasEad = !!c?.milestones.some((m) => m.key === 'ead_c9');
  if (st?.renewBy) lines.push(t('ead:renewal.planner', { days: fmt.int(EAD_RENEW_LEAD_DAYS), date: fmt.date(st.renewBy) }));
  const renewal = c?.milestones.find((m) => m.key === 'ead_renewal_filed' && m.date !== null);
  if (renewal?.date) {
    lines.push(t('ead:renewal.filed', { date: fmt.date(renewal.date) }));
    lines.push(st?.autoExtension ? t('ead:renewal.filedAuto', { from }) : t('ead:renewal.filedNoAuto'));
  }
  const reminders = st?.reminders ?? [];
  const markRenewal = () => {
    if (!c || isExample) return;
    const now = new Date().toISOString();
    save({ ...c, milestones: [...c.milestones, { key: 'ead_renewal_filed', date: today, dateGranularity: 'day', dateSource: 'memory' }], updatedAt: now < c.createdAt ? c.createdAt : now });
  };
  const enable = async () => {
    const ok = await notifications.enable();
    if (!ok) setPermission('denied');
    else if (c && !isExample) await notifications.scheduleCaseReminders(c, lang);
  };
  // Within 30 days of expiry the expiry is a true deadline (00 §3 principle 8): the only red here.
  const left = st?.expiry !== undefined ? daysBetween(today, st.expiry) : null;
  const soon = hasEad && left !== null && left >= 0 && left <= 30;
  return (
    <Card title={t('ead:renewal.title')} testID="ead-renewal">
      <Paragraphs items={lines} />
      {soon && st?.expiry ? <Banner tone="deadline" text={t('ead:validity.expiryCard', { date: fmt.date(st.expiry) })} /> : null}
      {hasEad && !renewal ? (
        isExample ? (
          <AppText size="sm" muted>
            {t('ead:renewal.markExample')}
          </AppText>
        ) : (
          <View style={{ alignSelf: 'flex-start' }}>
            <Button testID="ead-mark-renewal" variant="secondary" label={t('ead:renewal.mark')} onPress={markRenewal} />
          </View>
        )
      ) : null}
      {hasEad ? (
        <View testID="ead-reminders" style={{ gap: theme.space(2) }}>
          <AppText weight="medium">{t('ead:reminders.title')}</AppText>
          <AppText>
            {reminders.length > 0 ? t('ead:reminders.dates', { dates: reminders.map((d) => fmt.date(d)).join(t('ead:reminders.join')) }) : t('ead:reminders.none')}
          </AppText>
          {!notifications.available ? (
            <AppText size="sm" muted testID="ead-reminders-web">
              {t('ead:reminders.web')}
            </AppText>
          ) : settings.notifications.enabled ? (
            <AppText size="sm" muted>
              {t('ead:reminders.enabled')}
            </AppText>
          ) : (
            <View style={{ alignSelf: 'flex-start', gap: theme.space(1) }}>
              <Button testID="ead-reminders-enable" variant="secondary" label={t('ead:reminders.enable')} onPress={() => void enable()} />
              {permission === 'denied' ? (
                <AppText size="sm" muted>
                  {t('ead:reminders.denied')}
                </AppText>
              ) : null}
            </View>
          )}
        </View>
      ) : null}
    </Card>
  );
}

function Pending({ subjectId }: { subjectId: string }) {
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const { quarterly, offices } = useData();
  const est = useEstimate(subjectId);
  const rec = latestRecord(offices, 'I-765', C9_SUBTYPE, C9_OFFICE);
  const rows = quarterly.rows.filter((r) => r.form === AOS_FORM).sort((a, b) => a.quarter.fy - b.quarter.fy || a.quarter.q - b.quarter.q);
  const latest = rows[rows.length - 1];
  const earliest = rows.length > 1 ? rows[0] : undefined;
  const c9 = est.remedies.find((s) => s.rung === 'a_c9');
  const lines: string[] = [];
  if (rec?.inquiryDate) lines.push(t('ead:pending.inquiry', { date: fmt.date(rec.inquiryDate), pub: fmt.date(rec.publicationDate) }));
  if (c9) lines.push(t('ead:pending.erequest', { state: t(`ead:pending.state.${c9.state}`) }));
  return (
    <Card title={t('ead:pending.title')} testID="ead-pending">
      <Paragraphs items={lines} />
      {latest ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
          <StatTile testID="ead-tile-pending" value={latest.pendingWorkbook} fieldKey="quarterly.rows[].pendingWorkbook" period={latest.quarter} source={latest.source} format="int" label={t('ead:pending.tile.pending')} />
          {latest.medianMonths !== null ? (
            <StatTile testID="ead-tile-median" value={latest.medianMonths} fieldKey="quarterly.rows[].medianMonths" period={latest.quarter} source={latest.source} format="dec1" label={t('ead:pending.tile.median')} />
          ) : null}
        </View>
      ) : null}
      <AppText size="sm" muted>
        {t('ead:pending.allNationalities')}
      </AppText>
      {earliest ? (
        <AppText size="sm" muted testID="ead-earlier">
          {t('ead:pending.earlier', { quarter: quarterLabel(earliest.quarter, lang), pending: fmt.int(earliest.pendingWorkbook) })}
        </AppText>
      ) : null}
      <AppText size="sm" muted>
        {t('ead:pending.press', { lo: fmt.int(PRESS_EAD_WAIT.lo), hi: fmt.dec(PRESS_EAD_WAIT.hi, 1), month: fmt.month(PRESS_EAD_WAIT.month) })}
      </AppText>
      <AppText size="sm" weight="medium">
        {t('ead:pending.noModel')}
      </AppText>
    </Card>
  );
}

export function EadScreen() {
  const { t, fmt } = useLang();
  const subject = useCaseSubject();
  const c = subject.timeline;
  const hasEad = !!c?.milestones.some((m) => m.key === 'ead_c9');
  return (
    <CaseFrame title={t('ead:title')} testID="screen-case-ead" back>
      <ExampleBanner />
      <AppText>{t('ead:intro')}</AppText>
      {c ? null : <Banner tone="info" text={t('ead:noCase')} />}
      <Validity c={c} />
      <Renewal c={c} isExample={subject.isExample} />
      {hasEad ? null : <Pending subjectId={subject.estimateId} />}
      <Card title={t('ead:c11.title')}>
        <AppText>{t('ead:c11.body', { chnv: fmt.month(C11_REVOKED.chnv), cbp: fmt.month(C11_REVOKED.cbpOne) })}</AppText>
      </Card>
      <AppText size="sm" muted testID="case-disclaimer">
        {t('common:disclaimer.full')}
      </AppText>
    </CaseFrame>
  );
}
