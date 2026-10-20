/**
 * 02-data-model.md §1 `FIELD_KINDS`: the statistic kind, population and unit of every numeric
 * field the UI may show, so no number is rendered without its kind chip (the `StatTile` takes
 * `fieldKey: keyof typeof FIELD_KINDS`, 07 §6.0).
 *
 * Keys are JSON paths into the data files, `[]` marking an array element. Kinds follow the source
 * definitions in docs/research/04-uscis-data-sources.md: monthly CSV "Avg. Processing Time" is a
 * MEAN over completions (§1.1); quarterly workbook and historic-pt values are MEDIANS (§1.2, §2.6);
 * the Processing Times tool headline is the 80th percentile of cases completed in the last six
 * months and its case-inquiry date sits near the 93rd percentile [T/secondary] (§2.1; doc 15 §2.2).
 * The by-office "Humanitarian-based" column is Cuban + Refugee + Asylee (§1.3).
 */
import type { StatisticKind } from './primitives';

export type FieldPopulation = 'all_cuban_i485' | 'completed' | 'pending' | 'office_humanitarian' | 'i765_all';
export type FieldUnit = 'cases' | 'months' | 'share' | 'date';
export interface FieldKind { kind: StatisticKind; population: FieldPopulation; unit: FieldUnit }

const k = (kind: StatisticKind, population: FieldPopulation, unit: FieldUnit): FieldKind => ({ kind, population, unit });

/** 07 §6.0 `FIELD_KINDS` (typed with literal keys so `keyof typeof FIELD_KINDS` is a key union). */
export const FIELD_KINDS = {
  // national.json — monthly CSV, row "I-485 (Cuban)"
  'national.rows[].received': k('count_flow', 'all_cuban_i485', 'cases'),
  'national.rows[].approved': k('count_flow', 'completed', 'cases'),
  'national.rows[].denied': k('count_flow', 'completed', 'cases'),
  'national.rows[].pending': k('count_stock', 'pending', 'cases'),
  'national.rows[].pendingOver6': k('count_stock_over_6mo', 'pending', 'cases'),
  'national.rows[].avgMonths': k('mean_months_completed', 'completed', 'months'),
  // national.json — monthly CSV, one I-765 line for all categories
  'national.i765National[].received': k('count_flow', 'i765_all', 'cases'),
  'national.i765National[].approved': k('count_flow', 'i765_all', 'cases'),
  'national.i765National[].denied': k('count_flow', 'i765_all', 'cases'),
  'national.i765National[].pending': k('count_stock', 'i765_all', 'cases'),
  'national.i765National[].avgMonths': k('mean_months_completed', 'i765_all', 'months'),
  // quarterly.json — all-forms workbook (pending = "informe trimestral", never headline)
  'quarterly.rows[].received': k('count_flow', 'all_cuban_i485', 'cases'),
  'quarterly.rows[].approved': k('count_flow', 'completed', 'cases'),
  'quarterly.rows[].denied': k('count_flow', 'completed', 'cases'),
  'quarterly.rows[].completions': k('count_flow', 'completed', 'cases'),
  'quarterly.rows[].pendingWorkbook': k('count_stock', 'pending', 'cases'),
  'quarterly.rows[].medianMonths': k('median_months_completed', 'completed', 'months'),
  'quarterly.historicMedians[].months': k('median_months_completed', 'completed', 'months'),
  'quarterly.approvalBaselines[].share': k('share', 'completed', 'share'),
  // offices.json — by-office workbook (humanitarian column) and the Processing Times tool
  'offices.quarterly[].received': k('count_flow', 'office_humanitarian', 'cases'),
  'offices.quarterly[].approved': k('count_flow', 'office_humanitarian', 'cases'),
  'offices.quarterly[].denied': k('count_flow', 'office_humanitarian', 'cases'),
  'offices.quarterly[].pending': k('count_stock', 'office_humanitarian', 'cases'),
  'offices.processingTimes[].months80': k('p80_months_completed_6mo', 'completed', 'months'),
  'offices.processingTimes[].inquiryDate': k('inquiry_date_p93', 'completed', 'date'),
  // our model (never official)
  'manifest.canary.pWithin12': k('model_probability', 'all_cuban_i485', 'share'),
  'estimate.pWithin': k('model_probability', 'all_cuban_i485', 'share'),
  'estimate.byDate[].p': k('model_probability', 'all_cuban_i485', 'share'),
  'estimate.quantiles': k('model_probability', 'all_cuban_i485', 'months'),
} as const satisfies Record<string, FieldKind>;

export type FieldKey = keyof typeof FIELD_KINDS;
