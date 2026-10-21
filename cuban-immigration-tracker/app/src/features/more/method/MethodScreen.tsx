/**
 * S11 Cómo calculamos y datos / Method and data (00-product-spec.md S11; F22; 04-estimation-model.md).
 *
 * - A plain-language summary of VPH-1.1 (04 §3: vintage pool, β, scenarios, conditioning on
 *   "still pending today", adjudicable time).
 * - The bias catalogue (doc 08 §2.2): why each published statistic misleads for a pending case.
 * - Current parameters: β, σ, the office prior strength κ_o (`params.k0Office`; 04 EST-11), the
 *   scenario weights (prior vs current) and the weight ledger (04 §6.3).
 * - Little's law — only here, always as single-pace lines (00 S1 must-fix; T12).
 * - Known limitations, including the state-mixture limitation (04 §5.3 item 7) and the model
 *   risks (04 §12).
 * - Validation status and confidence (04 §10.3); the scorecard is v1.1.
 * - The pipeline canary: the reference example's 12-month probability on this data (a quality
 *   check of the calculation, 03 §5; the full estimate with its ranges is on "Mi caso").
 * - Sources with URL, period, retrieval date, sha256, mirror use and QA status (manifest), and the
 *   historic medians with their cut dates (doc 04 §2.6 [S-sec]).
 */
import { View } from 'react-native';
import { localize, pluralKey } from '@caa/i18n-core';
import { confidenceLevel } from '@caa/estimator';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppHeader, AppText, Card, ConfidenceChip, Screen, TableTwin, useTheme } from '@/ui';
import { BackLink, Bullets, DataBanners, Disclaimer, ExternalLink, shortSha } from '../../home/shared';
import { littlesLaw } from './model';

const BIASES = ['completionOnly', 'selection', 'immortal', 'regimeLag', 'aggregation', 'reportingLag'] as const;
const LIMITS = ['mixedPool', 'stateMixture', 'officeProxy', 'postInterview', 'unseen', 'policy'] as const;

function Little() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const l = littlesLaw(d.national, d.policy);
  if (!l) return null;
  const months = (m: number) => t(pluralKey('common:unit.month', Math.round(m)), { n: fmt.int(Math.round(m)) });
  const lines = [t('method:little.latest', { month: fmt.month(l.month), c: fmt.int(l.latest.perMonth), m: months(l.latest.months) })];
  if (l.fiscalYear) lines.push(t('method:little.fy', { fy: String(l.fiscalYear.fy), c: fmt.int(Math.round(l.fiscalYear.perMonth)), m: months(l.fiscalYear.months) }));
  if (l.scenario) lines.push(t('method:little.scenario', { label: localize(l.scenario.def.label, lang), c: fmt.int(l.scenario.perMonth), m: months(l.scenario.months) }));
  return (
    <Card title={t('method:little.title')} testID="method-little">
      <AppText>{t('method:little.intro', { pending: fmt.int(l.pending), month: fmt.month(l.month) })}</AppText>
      <View testID="method-little-lines" style={{ gap: theme.space(1) }}>
        <Bullets items={lines} />
      </View>
      <AppText weight="medium">{t('method:little.note')}</AppText>
    </Card>
  );
}

function Params() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const p = d.params;
  const rows = d.policy.scenarios.map((s) => [localize(s.label, lang), fmt.pct(s.prior), fmt.pct(p.scenarioWeights.weights[s.id] ?? s.prior)]);
  const reason = (e: (typeof p.weightLedger)[number]) => {
    switch (e.reason) {
      case 'alert_rule':
        return t('method:ledger.alertRule', { rule: e.ruleId ?? t('common:fmt.missing') });
      case 'likelihood':
        return t('method:ledger.likelihood', { month: e.observedMonth ? fmt.month(e.observedMonth) : t('common:fmt.missing'), n: e.observedCompletions === undefined ? t('common:fmt.missing') : fmt.int(e.observedCompletions) });
      case 'supersede':
        return t('method:ledger.supersede');
      default:
        return t('method:ledger.priorReset');
    }
  };
  const ledgerRows = p.weightLedger.map((e) => [
    fmt.date(e.at.slice(0, 10)),
    reason(e),
    d.policy.scenarios.map((s) => t('method:ledger.change', { id: s.id, before: fmt.pct(e.before[s.id] ?? 0), after: fmt.pct(e.after[s.id] ?? 0) })).join(' · '),
  ]);
  return (
    <Card title={t('method:params.title', { month: fmt.month(p.dataThrough) })} testID="method-params">
      <Bullets
        size="sm"
        items={[
          t('method:params.beta', { beta: fmt.dec(p.beta.value, 4) }),
          t('method:params.sigma', { sigma: fmt.dec(p.observation.sigma, 2) }),
          t('method:params.kappa', { k: fmt.int(p.k0Office) }),
          t('method:params.horizon', { months: fmt.int(p.horizonMonths), receipts: fmt.int(p.receiptsForecast) }),
        ]}
      />
      <TableTwin
        testID="method-weights"
        caption={t('method:weights.caption', { month: fmt.month(p.scenarioWeights.asOf) })}
        columns={[t('method:weights.col.scenario'), t('method:weights.col.prior'), t('method:weights.col.current')]}
        rows={rows}
      />
      <AppText weight="medium">{t('method:ledger.title')}</AppText>
      {ledgerRows.length ? (
        <TableTwin testID="method-ledger" caption={t('method:ledger.caption')} columns={[t('method:ledger.col.date'), t('method:ledger.col.reason'), t('method:ledger.col.change')]} rows={ledgerRows} />
      ) : (
        <AppText testID="method-ledger-empty" size="sm">
          {t('method:ledger.empty')}
        </AppText>
      )}
    </Card>
  );
}

function Validation() {
  const d = useData();
  const { t, fmt } = useLang();
  const level = confidenceLevel(d.guards, d.params, []);
  const c = d.manifest.canary;
  return (
    <Card title={t('method:validation.title')} testID="method-validation">
      <ConfidenceChip level={level} validated={d.params.validation.status === 'validated_current'} />
      <AppText>{t(`method:validation.${d.params.validation.status}`)}</AppText>
      <AppText size="sm" muted>
        {t('method:validation.gates', { months: fmt.int(d.params.confidenceGates.r4MonthsOfData) })}
      </AppText>
      <AppText size="sm" testID="method-canary">
        {t('method:canary', { month: fmt.month(d.asOf.latestOfficialMonth), p: fmt.pct(c.pWithin12), q50: c.q50 === null ? t('common:unit.moreThanSixYears') : t(pluralKey('common:unit.month', c.q50), { n: fmt.int(c.q50) }) })}
      </AppText>
      <AppText size="sm" muted>
        {t('method:validation.scorecard')}
      </AppText>
    </Card>
  );
}

function Sources() {
  const d = useData();
  const { t, fmt } = useLang();
  const theme = useTheme();
  const m = d.manifest;
  const files = Object.entries(m.files).map(([name, f]) => [name, fmt.int(f.bytes), shortSha(f.sha256) ?? t('common:fmt.missing')]);
  return (
    <Card title={t('method:sources.title')} testID="method-sources">
      <AppText size="sm">{t(`ui:provenance.qa.${m.qa.status}`)}</AppText>
      <View style={{ gap: theme.space(2) }}>
        {m.sources.map((s) => {
          const sha = shortSha(s.sha256);
          const lines = [t('ui:provenance.sourceLine', { source: t(`ui:source.${s.id}`), status: t(`ui:sourceStatus.${s.status}`) })];
          if (s.publishedPeriod) lines.push(t('method:sources.period', { period: s.publishedPeriod }));
          if (s.lastSuccessAt) lines.push(t('method:sources.retrieved', { date: fmt.date(s.lastSuccessAt.slice(0, 10)) }));
          if (sha) lines.push(t('method:sources.sha', { sha }));
          return (
            <View key={`${s.id}-${s.url}`} testID={`method-source-${s.id}`} style={{ gap: theme.space(0.5), borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.space(2) }}>
              {lines.map((x, i) => (
                <AppText key={x} size="sm" weight={i === 0 ? 'medium' : 'regular'}>
                  {x}
                </AppText>
              ))}
              <ExternalLink label={t('method:sources.url')} url={s.url} />
            </View>
          );
        })}
      </View>
      <TableTwin testID="method-files" caption={t('method:files.caption')} columns={[t('method:files.col.file'), t('method:files.col.bytes'), t('method:files.col.sha')]} rows={files} />
    </Card>
  );
}

function Medians() {
  const d = useData();
  const { t, fmt } = useLang();
  const rows = d.quarterly.historicMedians
    .slice()
    .sort((a, b) => a.fy - b.fy || ((a.cutDate ?? '') < (b.cutDate ?? '') ? -1 : 1))
    .map((h) => [
      t(h.fyToDate ? 'method:medians.fyToDate' : 'method:medians.fy', { fy: String(h.fy) }),
      t(pluralKey('common:unit.month', h.months), { n: fmt.dec(h.months, 1) }),
      h.cutDate ? fmt.date(h.cutDate) : t('method:medians.fullYear'),
    ]);
  return (
    <Card title={t('method:medians.title')} testID="method-medians">
      <TableTwin testID="method-medians-table" caption={t('method:medians.caption')} columns={[t('method:medians.col.fy'), t('method:medians.col.median'), t('method:medians.col.cut')]} rows={rows} />
      <AppText size="sm" muted>
        {t('method:medians.note')}
      </AppText>
    </Card>
  );
}

export function MethodScreen() {
  const d = useData();
  const { t, fmt } = useLang();
  const first = d.national.firstModelMonth;
  const last = d.national.rows.reduce<(typeof d.national.rows)[number] | null>((b, r) => (!b || r.ym > b.ym ? r : b), null);
  const decided = last ? last.approved + last.denied : 0;
  const biasVars = last
    ? { month: fmt.month(last.ym), n: fmt.int(decided), pending: fmt.int(last.pending), share: fmt.pct(last.pending > 0 ? decided / last.pending : 0) }
    : { month: t('common:fmt.missing'), n: t('common:fmt.missing'), pending: t('common:fmt.missing'), share: t('common:fmt.missing') };
  return (
    <Screen testID="screen-more-method">
      <AppHeader title={t('method:title')} />
      <BackLink label={t('more:back')} fallback="/more" />
      <DataBanners />
      <Card title={t('method:summary.title')} testID="method-summary">
        <Bullets
          items={[
            t('method:summary.pool', { month: fmt.month(first) }),
            t('method:summary.beta', { beta: fmt.dec(d.params.beta.value, 4) }),
            t('method:summary.scenarios'),
            t('method:summary.conditioning'),
            t('method:summary.holds'),
            t('method:summary.group'),
          ]}
        />
      </Card>
      <Card title={t('method:bias.title')} testID="method-bias">
        <Bullets size="sm" items={BIASES.map((b) => t(`method:bias.${b}`, biasVars))} />
      </Card>
      <Params />
      <Little />
      <Card title={t('method:limits.title')} testID="method-limits">
        <Bullets size="sm" items={LIMITS.map((k) => t(`method:limits.${k}`))} />
      </Card>
      <Validation />
      <Sources />
      <Medians />
      <Disclaimer />
    </Screen>
  );
}
