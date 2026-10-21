/**
 * One curated alert (00-product-spec.md S8 card): severity chip; kind; date; title; "qué significa
 * para usted" (the body, plain and informational, 05 §5.3); "a quién afecta" chips; "qué cambió en
 * su estimado" (the curated `whatChangedForYou`, plus any scenario-weight change the pipeline
 * recorded for this alert in `params.weightLedger`, e.g. "Nueva pausa: 15 % → 30 %", 04 §6.3);
 * the sources with their evidence tags. All text comes from the data's `Localized` fields or the
 * locale files (02 §1: every user-facing string in a data file is Localized).
 */
import { View } from 'react-native';
import type { Alert, ScenarioDef, WeightLedgerEntry } from '@caa/data-schemas';
import { localize } from '@caa/i18n-core';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppText, Button, Card, Chip, useTheme } from '@/ui';
import { ExternalLink } from '../home/shared';
import { CHANNEL_KEY, EVIDENCE_KEY, KIND_KEY, SEVERITY_KEY, SEVERITY_TONE } from './copy';

export interface AlertCardProps {
  alert: Alert;
  unread?: boolean;
  /** Detail view: show sources and docket; the list shows a "Leer más" button instead. */
  full?: boolean;
  onOpen?(): void;
}

/** Scenario-weight changes the pipeline recorded for this alert ("Nueva pausa: 15 % → 30 %"). */
export function ledgerChanges(a: Alert, ledger: WeightLedgerEntry[], scenarios: ScenarioDef[]): { scenario: ScenarioDef; before: number; after: number }[] {
  const out: { scenario: ScenarioDef; before: number; after: number }[] = [];
  for (const e of ledger) {
    if (e.alertId !== a.id) continue;
    for (const sc of scenarios) {
      const before = e.before[sc.id];
      const after = e.after[sc.id];
      if (before === undefined || after === undefined || Math.abs(before - after) < 1e-9) continue;
      out.push({ scenario: sc, before, after });
    }
  }
  return out;
}

export function AlertCard({ alert: a, unread = false, full = false, onOpen }: AlertCardProps) {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const affects: string[] = [];
  for (const ch of a.affects.channels ?? []) affects.push(t(CHANNEL_KEY[ch]));
  if (a.affects.filedBefore) affects.push(t('alerts:affects.filedBefore', { date: fmt.date(a.affects.filedBefore) }));
  if (a.affects.filedAfter) affects.push(t('alerts:affects.filedAfter', { date: fmt.date(a.affects.filedAfter) }));
  if (a.affects.hasEad !== undefined) affects.push(t(a.affects.hasEad ? 'alerts:affects.hasEad' : 'alerts:affects.noEad'));
  const changes = ledgerChanges(a, d.params.weightLedger, d.policy.scenarios).map((c) =>
    t('alerts:ledgerLine', { scenario: localize(c.scenario.label, lang), before: fmt.pct(c.before), after: fmt.pct(c.after) }),
  );
  const title = localize(a.title, lang);
  return (
    <Card testID={`alert-${a.id}`} tone={SEVERITY_TONE[a.severity]}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(1.5), alignItems: 'center' }}>
        <Chip tone={SEVERITY_TONE[a.severity]} label={t(SEVERITY_KEY[a.severity])} />
        <Chip label={t(KIND_KEY[a.kind])} />
        {unread ? <Chip testID={`alert-new-${a.id}`} tone="info" label={t('alerts:new')} /> : null}
        <AppText size="sm" muted>
          {fmt.date(a.date)}
        </AppText>
      </View>
      <AppText header size="lg" weight="bold">
        {title}
      </AppText>
      <View style={{ gap: theme.space(0.5) }}>
        <AppText size="sm" weight="medium" muted>
          {t('alerts:meaning')}
        </AppText>
        <AppText>{localize(a.body, lang)}</AppText>
      </View>
      {affects.length ? (
        <View style={{ gap: theme.space(1) }}>
          <AppText size="sm" weight="medium" muted>
            {t('alerts:affects')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(1.5) }}>
            {affects.map((x) => (
              <Chip key={x} label={x} />
            ))}
          </View>
        </View>
      ) : null}
      {a.whatChangedForYou || changes.length ? (
        <View style={{ gap: theme.space(0.5) }}>
          <AppText size="sm" weight="medium" muted>
            {t('alerts:changed')}
          </AppText>
          {a.whatChangedForYou ? <AppText>{localize(a.whatChangedForYou, lang)}</AppText> : null}
          {changes.map((c) => (
            <AppText key={c} size="sm" testID="alert-ledger-line">
              {c}
            </AppText>
          ))}
        </View>
      ) : null}
      {a.expires && a.expires < d.today ? (
        <AppText size="sm" muted>
          {t('alerts:expired', { date: fmt.date(a.expires) })}
        </AppText>
      ) : null}
      {full ? (
        <View style={{ gap: theme.space(1.5) }}>
          {a.docket ? (
            <AppText size="sm">{t('alerts:docket', { court: a.docket.court, number: a.docket.number })}</AppText>
          ) : null}
          <AppText size="sm" weight="medium" muted>
            {t('alerts:sources')}
          </AppText>
          {a.sources.map((s) => (
            <ExternalLink key={s.url} label={t('alerts:sourceItem', { label: s.label, evidence: t(EVIDENCE_KEY[s.evidence]) })} url={s.url} />
          ))}
        </View>
      ) : onOpen ? (
        <Button variant="link" testID={`alert-open-${a.id}`} label={t('alerts:readMore')} accessibilityHint={t('alerts:readMore.hint', { title })} onPress={onOpen} />
      ) : null}
    </Card>
  );
}
