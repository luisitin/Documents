/**
 * The per-office facts of S6 (00-product-spec.md S6), shared by the list rows and the detail:
 * - the I-485 131A-FAM 80 % time and its publication date, labelled as a family-based proxy
 *   ("no existe categoría de Ajuste Cubano"; doc 13 §1.3, key facts §6 rule 4);
 * - the case-inquiry date with its kind chip "≈93 %, según fuentes secundarias" (doc 04 §2.1,
 *   doc 15 §2.2; 00 §3 principle 3). A missing date says "no disponible (fuente, fecha)" and
 *   makes no gate decision (00 S6 must-fix on the jzebedee dependency);
 * - humanitarian pending/approved/denied for the latest quarter, labelled "incluye refugiados y
 *   asilados" (doc 04 §1.3 [F]);
 * - the shrunk multiplier with N, and "dato débil" when N < 50 (04 EST-11; doc 08 §7.3).
 */
import { View } from 'react-native';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppText, Chip, quarterLabel, useTheme } from '@/ui';
import { monthsText } from '../home/shared';
import type { OfficeSummary } from './model';

export function OfficeFacts({ s, compact = false }: { s: OfficeSummary; compact?: boolean }) {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const y = s.yardstick;
  const sourceName = (id: string) => t(`ui:source.${id}`);
  const missingSource = y ? sourceName(y.source.sourceId) : t('common:source.uscis');
  const missingDate = y ? fmt.date(y.publicationDate) : d.manifest.latestProcessingTimesPublication ? fmt.date(d.manifest.latestProcessingTimesPublication) : t('common:fmt.missing');
  const ptText = y && y.months80 !== null
    ? t('offices:pt.months', { p: fmt.pct(0.8), months: monthsText(t, fmt, y.months80), date: fmt.date(y.publicationDate) })
    : t('offices:pt.missing', { p: fmt.pct(0.8), source: missingSource, date: missingDate });
  const inquiryText = y && y.inquiryDate
    ? t('offices:inquiry.line', { date: fmt.date(y.inquiryDate), pub: fmt.date(y.publicationDate) })
    : t('offices:inquiry.missing', { source: missingSource, date: missingDate });
  const dash = t('common:fmt.missing');
  const n = (v: number | null, suppressed: boolean) => (suppressed ? t('offices:hum.suppressed') : v === null ? dash : fmt.int(v));
  const hum = s.latest
    ? t('offices:hum.line', {
        quarter: quarterLabel(s.latest.quarter, lang),
        pending: n(s.latest.pending, s.latest.suppressed),
        approved: n(s.latest.approved, s.latest.suppressed),
        denied: n(s.latest.denied, s.latest.suppressed),
      })
    : t('offices:hum.none');
  const m = s.multiplier;
  const mult = m
    ? t('offices:mult.line', { m: fmt.dec(m.shrunk, 2), n: fmt.int(m.completions), q: fmt.int(m.quarters.length) })
    : t('offices:mult.none');
  return (
    <View style={{ gap: theme.space(1.5) }}>
      <View style={{ gap: theme.space(0.5) }}>
        <AppText size="sm" weight="medium">
          {t('offices:pt.title')}
        </AppText>
        <AppText size="sm">{ptText}</AppText>
        <AppText size="sm" testID={`office-inquiry-${s.office.code}`}>
          {inquiryText}
        </AppText>
        {compact ? null : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(1.5) }}>
            <Chip label={t('ui:kind.p80_months_completed_6mo', { p: fmt.pct(0.8) })} />
            <Chip label={t('ui:kind.inquiry_date_p93', { p: fmt.pct(0.93) })} />
          </View>
        )}
        <AppText size="xs" muted>
          {t('offices:pt.proxy')}
        </AppText>
      </View>
      <View style={{ gap: theme.space(0.5) }}>
        <AppText size="sm">{hum}</AppText>
        <AppText size="xs" muted>
          {t('offices:hum.note')}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space(1.5) }}>
        <AppText size="sm">{mult}</AppText>
        {s.weak ? <Chip testID={`office-weak-${s.office.code}`} tone="warning" label={t('offices:mult.weak')} /> : null}
      </View>
    </View>
  );
}
