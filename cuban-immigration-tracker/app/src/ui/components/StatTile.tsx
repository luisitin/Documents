/**
 * `StatTile { value; fieldKey; period; source; format }` (07 §6.0; 00 §3 principle 3 "No bare
 * numbers. Every number carries a StatisticKind, a period/cut date and a source chip"; 02 §1
 * `FIELD_KINDS`).
 *
 * The kind chip comes from `FIELD_KINDS[fieldKey].kind`, so a mean is never shown as a median
 * (README §2.8 #2: the "11.8 vs 12.3 vs 16.3 vs 20.6" confusion). The inquiry-date kind reads
 * "≈93 %, según fuentes secundarias" (the 93rd-percentile figure is [T]/secondary, docs 04 §2.1
 * and 15 §2.2). `label` (additive) overrides the default field label.
 */
import { View } from 'react-native';
import { FIELD_KINDS, type FiscalQuarter, type SourceRef, type StatisticKind, type YearMonth } from '@caa/data-schemas';
import { pluralKey } from '@caa/i18n-core';
import { useLang } from '../deps';
import { periodLabel } from '../format';
import { useTheme } from '../theme';
import { AppText } from './AppText';
import { Chip } from './Chip';

export type FieldKey = keyof typeof FIELD_KINDS;

export interface StatTileProps {
  value: number;
  fieldKey: FieldKey;
  period: YearMonth | FiscalQuarter;
  source: SourceRef;
  format: 'int' | 'dec1' | 'pct';
  label?: string;
  testID?: string;
}

/** Percentile shown in the kind chip for the two percentile kinds (doc 04 §2.1; doc 15 §2.2). */
const KIND_P: Partial<Record<StatisticKind, number>> = { p80_months_completed_6mo: 0.8, inquiry_date_p93: 0.93 };

export function StatTile({ value, fieldKey, period, source, format, label, testID }: StatTileProps) {
  const theme = useTheme();
  const { t, fmt, lang } = useLang();
  const fk = FIELD_KINDS[fieldKey];
  const num = format === 'pct' ? fmt.pct(value) : format === 'dec1' ? fmt.dec(value, 1) : fmt.int(value);
  const shown = fk.unit === 'months' && format !== 'pct' ? t(pluralKey('common:unit.month', value), { n: num }) : num;
  const kp = KIND_P[fk.kind];
  const kind = t(`ui:kind.${fk.kind}`, kp === undefined ? undefined : { p: fmt.pct(kp) });
  const title = label ?? t(`ui:field.${fieldKey}`);
  const when = periodLabel(period, fmt, lang);
  const sourceName = t(`ui:source.${source.sourceId}`);
  const sourceText = t('common:source.label', { source: source.via.startsWith('mirror') ? t('ui:source.viaMirror', { source: sourceName }) : sourceName });
  const a11y = t('ui:stat.a11y', { title, value: shown, period: when, kind, source: sourceText });
  return (
    <View
      testID={testID ?? `stat-${fieldKey}`}
      accessible
      accessibilityLabel={a11y}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius,
        padding: theme.space(3),
        gap: theme.space(1),
        flexGrow: 1,
        flexBasis: 150,
        minWidth: 0,
      }}
    >
      <AppText size="sm" weight="medium" muted>
        {title}
      </AppText>
      <AppText size="xl" weight="bold">
        {shown}
      </AppText>
      <AppText size="xs" muted>
        {when}
      </AppText>
      <Chip label={kind} tone={fk.kind === 'model_probability' ? 'warning' : 'neutral'} />
      <AppText size="xs" muted>
        {sourceText}
      </AppText>
    </View>
  );
}
