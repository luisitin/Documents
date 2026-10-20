/**
 * Shared expectations for `createFmt` (02-data-model.md §9 table, verbatim), run under Node
 * (fmt.vitest.ts) and under jsdom (fmt.jsdom.vitest.ts) — 07 WP4 acceptance.
 */
import { expect } from 'vitest';
import { createFmt } from '@caa/i18n-core';

const NBSP = ' ';

/** [call, es, en] — the 02 §9 table plus the WP4 acceptance pct(0.00906) row. */
export const TABLE: readonly [string, (f: ReturnType<typeof createFmt>) => string, string, string][] = [
  ['int(355520)', (f) => f.int(355520), '355,520', '355,520'],
  ['dec(20.6, 1)', (f) => f.dec(20.6, 1), '20.6', '20.6'],
  ['pct(0.0923)', (f) => f.pct(0.0923), `9${NBSP}%`, '9%'],
  ['pct(0.00906)', (f) => f.pct(0.00906), `<1${NBSP}%`, '<1%'],
  ['date(2026-10-20)', (f) => f.date('2026-10-20'), '20 oct 2026', 'Oct 20, 2026'],
  ['month(2026-08)', (f) => f.month('2026-08'), 'ago 2026', 'Aug 2026'],
  ['monthLong(2026-08)', (f) => f.monthLong('2026-08'), 'agosto de 2026', 'August 2026'],
  ['relative(3)', (f) => f.relative(3), 'hace 3 h', '3 h ago'],
  ['relative(48)', (f) => f.relative(48), 'hace 2 días', '2 days ago'],
];

/** Asserts every row of TABLE for both languages. */
export function assertTable(): void {
  const es = createFmt('es');
  const en = createFmt('en');
  for (const [name, call, wantEs, wantEn] of TABLE) {
    expect(call(es), `es ${name}`).toBe(wantEs);
    expect(call(en), `en ${name}`).toBe(wantEn);
  }
}
