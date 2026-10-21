/**
 * S1 Inicio / Home (00-product-spec.md S1; F1, F2, F13): what USCIS is doing right now.
 *
 * - Pulse tiles from the latest monthly row of the "I-485 (Cuban)" CSV (doc 04 §1.1 [F]), each a
 *   kit `StatTile` with its statistic-kind chip, period and source (00 §3 principle 3). Headline
 *   pending comes from the monthly CSV only (principle 4).
 * - The mean-months tile explains, on tap, why the mean age of completed cases is not a forecast
 *   (doc 08 §2.3).
 * - `MonthlyChart` (approved/denied bars, pending lines, R0–R4 band; "ver como tabla" twin).
 * - The quarterly approval tile always shows its baselines (doc 14 §8.1; WP8a acceptance), with
 *   the workbook pending labelled "informe trimestral".
 * - The (c)(9) card: national I-765 "Adjustment Of Status" row, all nationalities (doc 04 §1.2).
 * - "Próximos datos oficiales", the CTA to the estimate and the latest high-severity alert.
 * - Deliberately absent: the Little's-law line (it lives only on Method, 00 S1 must-fix).
 * - On web, first launch shows the welcome content inline (WP6 tab layout note; 00 S0).
 */
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { localize } from '@caa/i18n-core';
import { monthlyShare } from '@caa/case-rules';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { useCases } from '@/storage/cases';
import { useSettings } from '@/storage/settings';
import {
  AppHeader, AppText, Banner, Button, Card, MonthlyChart, Screen, StatTile, quarterLabel, useTheme, type MonthlyMetric,
} from '@/ui';
import { WelcomeContent } from '../welcome/WelcomeContent';
import { DataBanners, Disclaimer, FilterChip, hrefOf, monthsText, pct1, seg } from './shared';
import { latestHighAlert, latestQuarterRow, monthlyRows, nextFiles } from './model';

const METRICS: { metric: MonthlyMetric; key: 'ui:chart.decisions' | 'ui:chart.pending' | 'ui:chart.received' }[] = [
  { metric: 'completions', key: 'ui:chart.decisions' },
  { metric: 'pending', key: 'ui:chart.pending' },
  { metric: 'received', key: 'ui:chart.received' },
];

function Pulse() {
  const d = useData();
  const { t, fmt } = useLang();
  const theme = useTheme();
  const [explain, setExplain] = useState(false);
  const rows = monthlyRows(d.national);
  const last = rows[rows.length - 1];
  if (!last) {
    return (
      <Card testID="home-empty">
        <AppText>{t('home:empty')}</AppText>
      </Card>
    );
  }
  const src = last.source;
  const decisions = last.approved + last.denied;
  return (
    <View testID="home-pulse" style={{ gap: theme.space(2) }}>
      <AppText header size="lg" weight="bold" testID="home-pulse-title">
        {t('home:pulse.title', { month: fmt.month(last.ym) })}
      </AppText>
      <AppText size="sm" muted>
        {t('home:pulse.note')}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        <StatTile value={last.pending} fieldKey="national.rows[].pending" period={last.ym} source={src} format="int" />
        <StatTile value={last.received} fieldKey="national.rows[].received" period={last.ym} source={src} format="int" />
        <StatTile value={last.approved} fieldKey="national.rows[].approved" period={last.ym} source={src} format="int" />
        <StatTile value={last.denied} fieldKey="national.rows[].denied" period={last.ym} source={src} format="int" />
        <StatTile value={decisions} fieldKey="national.rows[].approved" label={t('home:tile.decisions')} testID="stat-decisions" period={last.ym} source={src} format="int" />
        {last.pendingOver6 !== null ? <StatTile value={last.pendingOver6} fieldKey="national.rows[].pendingOver6" period={last.ym} source={src} format="int" /> : null}
      </View>
      {last.avgMonths !== null ? (
        <Pressable
          testID="home-avg-tile"
          accessibilityRole="button"
          accessibilityHint={t('home:avg.hint')}
          accessibilityState={{ expanded: explain }}
          onPress={() => setExplain((v) => !v)}
        >
          <StatTile value={last.avgMonths} fieldKey="national.rows[].avgMonths" period={last.ym} source={src} format="dec1" />
        </Pressable>
      ) : null}
      {last.avgMonths !== null ? (
        explain ? (
          <Card testID="home-avg-explain" tone="info" title={t('home:avg.title')}>
            <AppText>{t('home:avg.body', { month: fmt.month(last.ym), avg: monthsText(t, fmt, last.avgMonths), n: fmt.int(decisions), pending: fmt.int(last.pending) })}</AppText>
          </Card>
        ) : (
          <AppText size="sm" muted>
            {t('home:avg.hint')}
          </AppText>
        )
      ) : null}
    </View>
  );
}

function Chart() {
  const d = useData();
  const { t } = useLang();
  const theme = useTheme();
  const [metric, setMetric] = useState<MonthlyMetric>('completions');
  return (
    <Card title={t('home:chart.title')} testID="home-chart">
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        {METRICS.map((m) => (
          <FilterChip key={m.metric} testID={`home-metric-${m.metric}`} label={t(m.key)} selected={metric === m.metric} onPress={() => setMetric(m.metric)} />
        ))}
      </View>
      <MonthlyChart rows={d.national.rows} regimes={d.policy.regimes} metric={metric} />
      <AppText size="sm" muted>
        {t('home:chart.note')}
      </AppText>
    </Card>
  );
}

/** The approval tile: latest quarter plus every baseline, always (WP8a acceptance; doc 14 §8.1). */
function Approval() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const q = latestQuarterRow(d.quarterly, 'I-485 (Cuban)');
  if (!q) return null;
  const share = q.completions > 0 ? q.approved / q.completions : null;
  const months = monthlyRows(d.national).slice(-2).map(monthlyShare).filter((s): s is NonNullable<typeof s> => s !== null);
  const monthly = months
    .map((s) => t('home:approval.monthItem', { month: fmt.month(s.period), share: fmt.pct(s.share), num: fmt.int(s.numerator), den: fmt.int(s.denominator) }))
    .join(' · ');
  return (
    <Card title={t('home:approval.title')} testID="approval-tile">
      <AppText testID="approval-quarter">
        {t('home:approval.quarter', {
          quarter: quarterLabel(q.quarter, lang),
          approved: fmt.int(q.approved),
          denied: fmt.int(q.denied),
          completions: fmt.int(q.completions),
          share: share === null ? t('common:fmt.missing') : pct1(t, fmt, share),
        })}
      </AppText>
      <View testID="approval-baselines" style={{ gap: theme.space(1) }}>
        <AppText weight="medium">{t('home:approval.baselines')}</AppText>
        {d.quarterly.approvalBaselines.map((b) => (
          <AppText key={b.period} size="sm">
            {t('home:approval.baselineItem', { label: localize(b.label, lang), share: pct1(t, fmt, b.share), num: fmt.int(b.numerator), den: fmt.int(b.denominator) })}
          </AppText>
        ))}
        {monthly ? (
          <AppText size="sm" testID="approval-monthly">
            {t('home:approval.monthly', { items: monthly })}
          </AppText>
        ) : null}
      </View>
      {share !== null && share < 0.5 ? (
        <AppText size="sm" muted testID="approval-caveat">
          {t('home:approval.caveat')}
        </AppText>
      ) : null}
      <AppText size="sm" muted>
        {t('home:approval.separate')}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        {q.medianMonths !== null ? <StatTile value={q.medianMonths} fieldKey="quarterly.rows[].medianMonths" period={q.quarter} source={q.source} format="dec1" /> : null}
        <StatTile value={q.pendingWorkbook} fieldKey="quarterly.rows[].pendingWorkbook" period={q.quarter} source={q.source} format="int" />
      </View>
      <AppText size="xs" muted>
        {t('home:approval.pendingNote')}
      </AppText>
    </Card>
  );
}

function C9() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const router = useRouter();
  const theme = useTheme();
  const q = latestQuarterRow(d.quarterly, 'I-765 (Adjustment Of Status)');
  if (!q) return null;
  return (
    <Card title={t('home:c9.title')} testID="home-c9">
      <AppText>
        {t('home:c9.line', {
          pending: fmt.int(q.pendingWorkbook),
          median: q.medianMonths === null ? t('common:state.notAvailable') : monthsText(t, fmt, q.medianMonths),
          quarter: quarterLabel(q.quarter, lang),
        })}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        <StatTile value={q.pendingWorkbook} fieldKey="quarterly.rows[].pendingWorkbook" label={t('home:c9.pendingLabel')} testID="stat-c9-pending" period={q.quarter} source={q.source} format="int" />
        {q.medianMonths !== null ? (
          <StatTile value={q.medianMonths} fieldKey="quarterly.rows[].medianMonths" label={t('home:c9.medianLabel')} testID="stat-c9-median" period={q.quarter} source={q.source} format="dec1" />
        ) : null}
      </View>
      <Button variant="link" testID="home-c9-link" label={t('home:c9.link')} onPress={() => router.push(hrefOf('/case/ead'))} />
    </Card>
  );
}

function NextFiles() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const n = nextFiles(d.asOf.latestOfficialMonth, d.manifest.latestOfficialQuarter);
  return (
    <AppText size="sm" muted testID="home-next">
      {t('home:next.line', { month: fmt.monthLong(n.month), quarter: quarterLabel(n.quarter, lang), expected: fmt.monthLong(n.quarterExpected) })}
    </AppText>
  );
}

function HighAlert() {
  const d = useData();
  const { t, lang } = useLang();
  const { active } = useCases();
  const router = useRouter();
  const a = latestHighAlert(d.alerts, d.today, active);
  if (!a) return null;
  return (
    <Banner
      testID="home-alert"
      tone="warning"
      text={localize(a.title, lang)}
      action={{ label: t('home:alert.action'), onPress: () => router.push(hrefOf(`/alerts/${seg(a.id)}`)) }}
    />
  );
}

export function HomeScreen() {
  const { t } = useLang();
  const router = useRouter();
  const { settings } = useSettings();
  const showWelcome = Platform.OS === 'web' && !settings.onboardingDone;
  return (
    <Screen testID="screen-home">
      <AppHeader title={t('home:title')} />
      {showWelcome ? <WelcomeContent inline testID="home-welcome" onDone={() => undefined} onSetup={() => router.push(hrefOf('/case/edit'))} /> : null}
      <DataBanners showSample />
      <HighAlert />
      <Pulse />
      <Chart />
      <Approval />
      <C9 />
      <NextFiles />
      <Button testID="home-cta" label={t('home:cta')} onPress={() => router.push(hrefOf('/case'))} />
      <Disclaimer />
    </Screen>
  );
}
