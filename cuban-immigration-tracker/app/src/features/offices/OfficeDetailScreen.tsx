/**
 * S6 office detail `/offices/[code]` (00-product-spec.md S6):
 * - the office facts (OfficeFacts), the quarterly humanitarian trend as a table, and the published
 *   history of the 131A-FAM case-inquiry date;
 * - "Si presentó el {fecha}, la fecha de consulta tendría que llegar a ella: ≈ {mes} (cálculo
 *   aproximado)" — the pinned remedy ETA of case-rules `remedyEta` (07 WP3: rate of advance of the
 *   inquiry date between its first and latest publication, extended forward; doc 15 §2.2). With
 *   fewer than two published points there is no ETA and no gate decision.
 * The receipt date is the active case's when one is saved (and discreet mode is off); otherwise the
 * user picks one here. It is used on this screen only and never stored.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { ISODate } from '@caa/data-schemas';
import { remedyEta } from '@caa/case-rules';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { useCases } from '@/storage/cases';
import { useSettings } from '@/storage/settings';
import { AppHeader, AppText, Card, DateField, Screen, TableTwin, quarterLabel, useTheme } from '@/ui';
import { BackLink, DataBanners, Disclaimer } from '../home/shared';
import { OfficeFacts } from './OfficeFacts';
import { inquiryHistory, summarize } from './model';

function Eta({ code }: { code: string }) {
  const d = useData();
  const { t, fmt } = useLang();
  const { active } = useCases();
  const { settings } = useSettings();
  const initial: ISODate | null = active && !settings.discreet ? active.i485ReceiptDate : null;
  const [receipt, setReceipt] = useState<ISODate | null>(initial);
  const [granularity, setGranularity] = useState<'day' | 'month'>(active && !settings.discreet ? active.i485ReceiptDateGranularity : 'day');
  const history = inquiryHistory(d.offices, code);
  const points = history?.points ?? [];
  const latest = points.reduce<(typeof points)[number] | null>((b, p) => (!b || p.publicationDate > b.publicationDate ? p : b), null);
  const first = points.reduce<(typeof points)[number] | null>((b, p) => (!b || p.publicationDate < b.publicationDate ? p : b), null);
  const shownDate = (v: ISODate) => (granularity === 'month' ? fmt.month(v.slice(0, 7)) : fmt.date(v));
  let result: string;
  if (!receipt) result = t('offices:eta.pick');
  else if (!history || points.length < 2 || !latest) result = t('offices:eta.depends', { n: fmt.int(points.length) });
  else if (receipt < latest.inquiryDate) result = t('offices:eta.passed', { date: shownDate(receipt), inquiry: fmt.date(latest.inquiryDate) });
  else {
    const eta = history ? remedyEta(history, receipt) : null;
    result = eta ? t('offices:eta.result', { date: shownDate(receipt), month: fmt.month(eta.etaMonth) }) : t('offices:eta.depends', { n: fmt.int(points.length) });
  }
  return (
    <Card title={t('offices:eta.title')} testID="office-eta">
      {initial ? <AppText size="sm" muted>{t('offices:eta.fromCase')}</AppText> : null}
      <DateField
        testID="office-eta-date"
        label={t('offices:eta.receipt')}
        value={receipt}
        granularity={granularity}
        max={d.today}
        onChange={(v, g) => {
          setReceipt(v);
          setGranularity(g);
        }}
      />
      <AppText testID="office-eta-result" weight="medium">
        {result}
      </AppText>
      {first && latest && points.length >= 2 ? (
        <AppText size="sm" muted>
          {t('offices:eta.method', { from: fmt.date(first.publicationDate), to: fmt.date(latest.publicationDate) })}
        </AppText>
      ) : null}
      <AppText size="xs" muted>
        {t('offices:eta.privacy')}
      </AppText>
    </Card>
  );
}

export function OfficeDetailScreen() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const raw = Array.isArray(params.code) ? params.code[0] : params.code;
  const code = (raw ?? '').toUpperCase();
  const office = d.offices.offices.find((o) => o.code === code);
  if (!office) {
    return (
      <Screen testID="screen-office-missing">
        <AppHeader title={t('offices:title')} />
        <BackLink label={t('offices:detail.back')} fallback="/offices" />
        <Card testID="office-not-found">
          <AppText>{t('offices:detail.notFound', { code: code || t('common:fmt.missing') })}</AppText>
        </Card>
        <Disclaimer />
      </Screen>
    );
  }
  const s = summarize(d.offices, d.params, office);
  const dash = t('common:fmt.missing');
  const cell = (v: number | null, suppressed: boolean) => (suppressed ? t('offices:hum.suppressed') : v === null ? dash : fmt.int(v));
  const trendRows = s.quarters.map((q) => [quarterLabel(q.quarter, lang), cell(q.received, q.suppressed), cell(q.approved, q.suppressed), cell(q.denied, q.suppressed), cell(q.pending, q.suppressed)]);
  const history = inquiryHistory(d.offices, code);
  const historyRows = (history?.points ?? [])
    .slice()
    .sort((a, b) => (a.publicationDate < b.publicationDate ? -1 : 1))
    .map((p) => [fmt.date(p.publicationDate), fmt.date(p.inquiryDate)]);
  return (
    <Screen testID={`screen-office-${code}`}>
      <AppHeader title={t('offices:detail.title', { name: office.name, code: office.code })} />
      <BackLink label={t('offices:detail.back')} fallback="/offices" />
      <DataBanners />
      <Card title={t('offices:detail.facts', { state: office.state })}>
        <OfficeFacts s={s} />
      </Card>
      <Card title={t('offices:trend.title')} testID="office-trend">
        {trendRows.length ? (
          <TableTwin
            testID="office-trend-table"
            caption={t('offices:trend.caption', { name: office.name })}
            columns={[t('offices:col.quarter'), t('offices:col.received'), t('offices:col.approved'), t('offices:col.denied'), t('offices:col.pending')]}
            rows={trendRows}
          />
        ) : (
          <AppText>{t('offices:hum.none')}</AppText>
        )}
        <AppText size="xs" muted>
          {t('offices:hum.note')}
        </AppText>
      </Card>
      <Card title={t('offices:history.title')} testID="office-history">
        {historyRows.length ? (
          <TableTwin
            testID="office-history-table"
            caption={t('offices:history.caption', { name: office.name })}
            columns={[t('offices:col.published'), t('offices:col.inquiry')]}
            rows={historyRows}
          />
        ) : (
          <AppText>{t('offices:history.none')}</AppText>
        )}
      </Card>
      <Eta code={code} />
      <View style={{ gap: theme.space(1) }}>
        <AppText size="xs" muted>
          {t('offices:detail.sources')}
        </AppText>
      </View>
      <Disclaimer />
    </Screen>
  );
}
