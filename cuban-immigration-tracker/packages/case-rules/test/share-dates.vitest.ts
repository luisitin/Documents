/**
 * Share code (00 S12; 05 §4–§5) and date helpers (07 §6.0 `dates`; EST-10).
 *
 * The estimate passed to `shareCode` is a TEST object carrying the T15 golden numbers of 04 §9.2
 * (P12 0.09229, clock 584 / 306 days, data through 2026-08); it is not produced by the estimator here
 * (case-rules never imports @caa/estimator).
 */
import { describe, expect, it } from 'vitest';
import type { CaseTimeline, EstimateOk } from '@caa/data-schemas';
import {
  addDays, addMonths, clockFor, dates, daysBetween, endOfMonth, fullMonthsBetween, monthsBetween, monthsCeil, monthsSince,
  parseShareCode, shareCode, ym,
} from '@caa/case-rules';
import { TODAY, ms, policy, t15, variant } from './helpers';

function t15Estimate(c: CaseTimeline): EstimateOk {
  return {
    kind: 'estimate', modelVersion: 'VPH-1.1', dataThrough: '2026-08', k0: 2, mode: 'queue',
    clock: clockFor(c, policy, TODAY),
    pWithin: { m3: 0.01484, m6: 0.03665, m12: 0.09229, m24: 0.2205, m36: 0.35453 },
    byDate: [{ date: '2026-12-31', p: 0.00906 }, { date: '2027-12-31', p: 0.11271 }, { date: '2028-12-31', p: 0.24265 }],
    quantiles: { q10: 13, q25: 27, q50: 54, q75: null, q90: null },
    survival: [1],
    policyBand12: [0.02325, 0.2597], structuralBand12: [0.04352, 0.19801],
    perScenario: [], drivers: { scenario: 0.94135, beta: 0.0092, office: 0.02796 },
    queue: { pendingTotal: 355520, olderThanYou: 175221, sameMonthAsYou: 23097, completionsLastMonth: 820, beta: 0.037391 },
    office: { basis: 'national' },
    yardstick: { form: 'I-485', subtype: '131A-FAM', months80: null, inquiryDate: null, publicationDate: null, retrievedAt: null, isProxy: true },
    delays: {}, confidence: 'LOW', validated: false, guards: [], weightTrace: [],
  };
}

describe('shareCode', () => {
  const c = variant({ state: 'FL', officeCode: 'HIA', receiptPrefix: 'IOE', nickname: 'Mi caso' });

  it('Spanish: matches the 00 S12 layout', () => {
    expect(shareCode(c, t15Estimate(c), 'es')).toBe([
      '#AjusteCubano · CHNV · FL',
      'Presentado: 2025-03 · Huellas: 2025-07 · EAD: 2025-09 · Entrevista: — · Decisión: —',
      '19 meses (≈10 adjudicables) · Prob. decisión 12 meses: 9 % · datos USCIS ago 2026',
      'CAA Tracker (no oficial)',
    ].join('\n'));
  });

  it('English', () => {
    expect(shareCode(c, t15Estimate(c), 'en')).toBe([
      '#AjusteCubano · CHNV · FL',
      'Filed: 2025-03 · Biometrics: 2025-07 · EAD: 2025-09 · Interview: — · Decision: —',
      '19 months (≈10 adjudicable) · 12-month decision chance: 9% · USCIS data Aug 2026',
      'CAA Tracker (unofficial)',
    ].join('\n'));
  });

  it('no receipt digits or prefix, no day-level dates, no nickname, no office unless opted in, no approval range', () => {
    for (const lang of ['es', 'en'] as const) {
      const s = shareCode(c, t15Estimate(c), lang);
      expect(s).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(s).not.toMatch(/IOE|\d{10}/);
      expect(s).not.toContain('Mi caso');
      expect(s).not.toContain('HIA');
      expect(s).not.toMatch(/70|90\s?%/);
      expect(shareCode(c, t15Estimate(c), lang, { includeOffice: true }).split('\n')[0]).toBe('#AjusteCubano · CHNV · FL · HIA');
    }
  });

  it('without an estimate there are no numbers (S9)', () => {
    const i220a = variant({ entryChannel: 'I220A' });
    const s = shareCode(i220a, null, 'es');
    expect(s.split('\n')).toHaveLength(3);
    expect(s).not.toMatch(/%|meses/);
    expect(s.startsWith('#AjusteCubano · I-220A')).toBe(true);
  });

  it('pct below 1 % renders "<1 %"', () => {
    const e = t15Estimate(c);
    e.pWithin.m12 = 0.00906;
    expect(shareCode(c, e, 'es')).toContain('Prob. decisión 12 meses: <1 %');
    expect(shareCode(c, e, 'en')).toContain('12-month decision chance: <1%');
  });

  it('round-trips through parseShareCode (month level), in both languages', () => {
    const full = variant({ state: 'FL', officeCode: 'MIA', entryChannel: 'CBP_ONE' }, {
      add: [ms('interview', '2026-09-20'), ms('decision', '2026-10-01', { outcome: 'approved' })],
    });
    for (const lang of ['es', 'en'] as const) {
      const p = parseShareCode(shareCode(full, null, lang, { includeOffice: true }));
      expect(p).toEqual({
        entryChannel: 'CBP_ONE', state: 'FL', officeCode: 'MIA', i485ReceiptDate: '2025-03-15', i485ReceiptDateGranularity: 'month',
        milestones: [
          { key: 'biometrics', date: '2025-07-15', dateGranularity: 'month', dateSource: 'memory' },
          { key: 'ead_c9', date: '2025-09-15', dateGranularity: 'month', dateSource: 'memory' },
          { key: 'interview', date: '2026-09-15', dateGranularity: 'month', dateSource: 'memory' },
          { key: 'decision', date: '2026-10-15', dateGranularity: 'month', dateSource: 'memory', meta: { outcome: 'approved' } },
        ],
      });
    }
    const p = parseShareCode(shareCode(t15(), t15Estimate(t15()), 'es'))!;
    expect(p.entryChannel).toBe('CHNV');
    expect(p.state).toBeUndefined();
    expect(p.milestones!.map((m) => m.key)).toEqual(['biometrics', 'ead_c9']);
  });

  it('every channel round-trips; text around the code is tolerated; garbage → null', () => {
    for (const ch of ['CHNV', 'CBP_ONE', 'FRP_CFRP', 'U4U', 'OTHER_PAROLE', 'VISA', 'I220A', 'EWI', 'CONDITIONAL_PAROLE_236', 'UNKNOWN'] as const) {
      expect(parseShareCode(shareCode(variant({ entryChannel: ch }), null, 'en'))?.entryChannel).toBe(ch);
    }
    const pasted = `Mira mi caso:\n\n${shareCode(c, t15Estimate(c), 'es')}\n\nsaludos`;
    expect(parseShareCode(pasted)?.i485ReceiptDate).toBe('2025-03-15');
    expect(parseShareCode('hola')).toBeNull();
    expect(parseShareCode('#AjusteCubano · CHNV · FL')).toBeNull(); // no filing month
    expect(parseShareCode('#AjusteCubano · Marte\nPresentado: 2025-03')).toBeNull();
    expect(parseShareCode('x'.repeat(5000))).toBeNull();
  });

  it('a milestone with an unknown date is shared as "sí"/"yes" and parsed back with date null', () => {
    const u = variant({}, { drop: ['biometrics'], add: [ms('biometrics', null)] });
    expect(shareCode(u, null, 'es')).toContain('Huellas: sí');
    expect(parseShareCode(shareCode(u, null, 'en'))!.milestones![0]).toEqual({ key: 'biometrics', date: null, dateGranularity: 'month', dateSource: 'memory' });
  });
});

describe('dates (UTC-safe, on ISO strings)', () => {
  it('daysBetween / addDays across leap years and DST-like boundaries', () => {
    expect(daysBetween('2025-03-15', '2026-10-20')).toBe(584);
    expect(daysBetween('2025-02-05', '2026-10-20')).toBe(622);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2); // US DST change on 2026-03-08 has no effect
    expect(daysBetween('2026-10-20', '2025-03-15')).toBe(-584);
    expect(addDays('2026-10-15', 472)).toBe('2028-01-30'); // +365 → 2027-10-15, +107 → 2028-01-30
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-01-01', -1)).toBe('2024-12-31');
    for (let n = -800; n <= 800; n += 37) expect(daysBetween('2025-03-15', addDays('2025-03-15', n))).toBe(n);
  });

  it('monthsBetween, endOfMonth, ym, addMonths, fullMonthsBetween', () => {
    expect(monthsBetween('2026-08', '2026-10')).toBe(2); // EST-5 k0
    expect(monthsBetween('2024-09', '2026-08')).toBe(23);
    expect(monthsBetween('2026-10', '2026-08')).toBe(-2);
    expect(endOfMonth('2024-02')).toBe('2024-02-29');
    expect(endOfMonth('2026-02')).toBe('2026-02-28');
    expect(endOfMonth('2026-12')).toBe('2026-12-31');
    expect(ym('2026-10-20')).toBe('2026-10');
    expect(addMonths('2025-08-31', 6)).toBe('2026-02-28');
    expect(addMonths('2025-03-15', 24)).toBe('2027-03-15');
    expect(fullMonthsBetween('2025-03-15', '2026-10-20')).toBe(19);
    expect(fullMonthsBetween('2025-03-15', '2027-03-14')).toBe(23);
    expect(fullMonthsBetween('2025-03-15', '2027-03-15')).toBe(24);
  });

  it('EST-10 monthsCeil / monthsSince with 30.4375-day months', () => {
    expect(monthsCeil(65)).toBe(3); // T18': RFE due 2026-12-24 is 65 days away → zero for t ≤ 3
    expect(monthsCeil(daysBetween(TODAY, '2026-12-15'))).toBe(2); // T27: t_D = 2
    expect(monthsCeil(0)).toBe(0);
    expect(monthsSince(584)).toBe(19); // "19 meses"
    expect(monthsSince(30)).toBe(0);
    expect(monthsSince(31)).toBe(1);
  });

  it('the frozen `dates` object exposes exactly the 07 §6.0 helpers', () => {
    expect(Object.keys(dates).sort()).toEqual(['addDays', 'daysBetween', 'endOfMonth', 'monthsBetween', 'monthsCeil', 'monthsSince', 'ym']);
    expect(dates.daysBetween('2025-03-15', TODAY)).toBe(584);
  });
});
