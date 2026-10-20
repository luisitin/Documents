/**
 * createFmt (02-data-model.md §9; ADR I18N-2) under Node, plus edge cases.
 */
import { describe, expect, it } from 'vitest';
import { createFmt, type Fmt } from '@caa/i18n-core';
import { assertTable } from './fmtCases';

const NBSP = ' ';
const es: Fmt = createFmt('es');
const en: Fmt = createFmt('en');

describe('02 §9 table (Node)', () => {
  it('produces the exact strings', () => {
    assertTable();
  });

  it('uses U+00A0 (not a plain space) in Spanish percentages', () => {
    expect(es.pct(0.0923)).toBe('9 %');
    expect(es.pct(0.0923)).not.toBe('9 %');
    expect(en.pct(0.0923)).not.toContain(NBSP);
  });

  it('memoizes one formatter per language', () => {
    expect(createFmt('es')).toBe(es);
    expect(createFmt('en')).toBe(en);
    expect(Object.isFrozen(es)).toBe(true);
  });
});

describe('numbers (US convention in both languages)', () => {
  it('groups thousands and rounds half away from zero', () => {
    for (const f of [es, en]) {
      expect(f.int(0)).toBe('0');
      expect(f.int(999)).toBe('999');
      expect(f.int(1000)).toBe('1,000');
      expect(f.int(1234567.5)).toBe('1,234,568');
      expect(f.int(-1234.5)).toBe('-1,235');
      expect(f.int(-0.4)).toBe('0');
      expect(f.int(461884)).toBe('461,884');
    }
  });

  it('dec keeps trailing zeros and rounds on the decimal value', () => {
    expect(es.dec(20, 1)).toBe('20.0');
    expect(es.dec(20.65, 1)).toBe('20.7'); // binary 20.6499… still rounds up
    expect(es.dec(1.005, 2)).toBe('1.01');
    expect(es.dec(91.7, 1)).toBe('91.7');
    expect(es.dec(6524.25, 1)).toBe('6,524.3');
    expect(es.dec(0.0923, 3)).toBe('0.092');
    expect(es.dec(-2.5, 0)).toBe('-3');
    expect(es.dec(12.34, 0)).toBe('12');
    expect(es.dec(1.5, -1)).toBe('2'); // dp clamped to 0
  });

  it('non-finite numbers render as a dash, never "NaN"', () => {
    for (const f of [es, en]) {
      expect(f.int(Number.NaN)).toBe('—');
      expect(f.dec(Number.POSITIVE_INFINITY, 1)).toBe('—');
      expect(f.pct(Number.NaN)).toBe('—');
    }
  });
});

describe('pct', () => {
  it('rounds to whole percent with the <1 and >99 guards', () => {
    expect(es.pct(0)).toBe(`0${NBSP}%`);
    expect(en.pct(0)).toBe('0%');
    expect(es.pct(0.0049)).toBe(`<1${NBSP}%`);
    expect(en.pct(0.00999)).toBe('<1%');
    expect(en.pct(0.01)).toBe('1%');
    expect(en.pct(0.125)).toBe('13%');
    expect(en.pct(0.26)).toBe('26%');
    expect(en.pct(0.99)).toBe('99%');
    expect(en.pct(0.995)).toBe('>99%');
    expect(es.pct(0.9999)).toBe(`>99${NBSP}%`);
    expect(en.pct(1)).toBe('100%');
  });

  it('clamps out-of-range probabilities', () => {
    expect(en.pct(-0.2)).toBe('0%');
    expect(en.pct(1.7)).toBe('100%');
  });

  it('renders the reference-case values used by WP8b (04 §9 T15, 07 WP8b)', () => {
    // Headline P(≤12) = 0.0923 (GOLDEN T15) → "9 %" / "9%"; bands 2 %–26 % and 4 %–20 %.
    expect(es.pct(0.0923)).toBe(`9${NBSP}%`);
    expect(es.pct(0.02)).toBe(`2${NBSP}%`);
    expect(es.pct(0.26)).toBe(`26${NBSP}%`);
  });
});

describe('dates and months', () => {
  it('formats every month abbreviation (02 §9)', () => {
    const esShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
    const enShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 1; m <= 12; m++) {
      const ym = `2026-${String(m).padStart(2, '0')}`;
      expect(es.month(ym)).toBe(`${esShort[m - 1]} 2026`);
      expect(en.month(ym)).toBe(`${enShort[m - 1]} 2026`);
    }
  });

  it('drops the leading zero of the day', () => {
    expect(es.date('2025-03-05')).toBe('5 mar 2025');
    expect(en.date('2025-03-05')).toBe('Mar 5, 2025');
    expect(es.date('2025-09-15')).toBe('15 sept 2025');
    expect(en.date('2025-09-15')).toBe('Sep 15, 2025');
  });

  it('accepts the date part of an ISODateTime (artifactBuiltAt)', () => {
    expect(es.date('2026-10-20T06:17:04Z')).toBe('20 oct 2026');
    expect(en.month('2026-10-20')).toBe('Oct 2026');
  });

  it('long months', () => {
    expect(es.monthLong('2025-01')).toBe('enero de 2025');
    expect(en.monthLong('2025-12')).toBe('December 2025');
  });

  it('returns malformed input unchanged instead of throwing', () => {
    expect(es.date('not a date')).toBe('not a date');
    expect(es.date('2026-13-01')).toBe('2026-13-01');
    expect(en.month('2026-00')).toBe('2026-00');
    expect(en.monthLong('')).toBe('');
  });

  it('never touches the time zone (date-only strings are calendar days)', () => {
    expect(en.date('2026-01-01')).toBe('Jan 1, 2026');
    expect(en.date('2026-12-31')).toBe('Dec 31, 2026');
  });
});

describe('relative', () => {
  it('hours, days and the sub-hour case', () => {
    expect(es.relative(0)).toBe('hace menos de 1 h');
    expect(en.relative(0.5)).toBe('less than 1 h ago');
    expect(es.relative(1)).toBe('hace 1 h');
    expect(es.relative(23.9)).toBe('hace 23 h');
    expect(es.relative(24)).toBe('hace 1 día');
    expect(en.relative(24)).toBe('1 day ago');
    expect(en.relative(47.9)).toBe('1 day ago');
    expect(es.relative(36 * 24)).toBe('hace 36 días');
    expect(en.relative(1000 * 24)).toBe('1,000 days ago');
  });

  it('treats negative or non-finite input (clock skew) as now', () => {
    expect(en.relative(-5)).toBe('less than 1 h ago');
    expect(es.relative(Number.NaN)).toBe('hace menos de 1 h');
  });
});

describe('createFmt guards', () => {
  it('rejects an unknown language', () => {
    expect(() => createFmt('fr' as never)).toThrow(/unknown language/);
  });
});
