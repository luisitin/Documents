/**
 * The litigation watch table (00-product-spec.md S8; key facts §9), rendered from
 * `policy.litigation` (curated; WP8a acceptance "The litigation table renders from policy.json").
 * Each row: caption, court and docket number (watchers key on dockets, not captions: Noem →
 * Mullin), status as of its date and "qué cambiaría". Court characterisation follows 05 §5.5: the
 * holds were vacated under the APA; the copy lives in the curated data, reviewed by WP9.
 * Under 480 px the kit's TableTwin stacks each row as a card (00 §5).
 */
import type { PolicyFile } from '@caa/data-schemas';
import { localize } from '@caa/i18n-core';
import { useLang } from '@/i18n/useLang';
import { AppText, Card, TableTwin } from '@/ui';

export function LitigationTable({ policy }: { policy: PolicyFile }) {
  const { t, fmt, lang } = useLang();
  const rows = policy.litigation.map((c) => [
    c.caption,
    t('alerts:lit.courtDocket', { court: c.court, docket: c.docket }),
    t('alerts:lit.status', { date: fmt.date(c.statusAsOf), status: localize(c.status, lang) }),
    localize(c.whatWouldChange, lang),
  ]);
  return (
    <Card title={t('alerts:lit.title')} testID="litigation">
      <AppText size="sm" muted>
        {t('alerts:lit.intro', { date: fmt.date(policy.litigationState.asOf) })}
      </AppText>
      {rows.length ? (
        <TableTwin
          testID="litigation-table"
          caption={t('alerts:lit.caption')}
          columns={[t('alerts:lit.col.case'), t('alerts:lit.col.court'), t('alerts:lit.col.status'), t('alerts:lit.col.change')]}
          rows={rows}
        />
      ) : (
        <AppText testID="litigation-empty">{t('alerts:lit.empty')}</AppText>
      )}
    </Card>
  );
}
