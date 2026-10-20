/**
 * WP1 acceptance: "Tests cover each schema with one valid and two invalid fixtures, plus the two
 * 02 §8 exemption fixtures (future cardExpiry; parole_termination_notice before the receipt) as
 * valid cases" (07-implementation-plan.md WP1).
 */
import { describe, expect, it } from 'vitest';
import { INVALID, PARSERS, VALID, buildInvalid, parserKeyOf } from './helpers';

const TODAY = '2026-10-20'; // the plan's fixed "today" (07 §9 P6; 04 §9.1)

describe('fixture coverage', () => {
  it.each(Object.keys(PARSERS))('%s has ≥ 1 valid and ≥ 2 invalid fixtures', (key) => {
    const valid = Object.keys(VALID).filter((k) => parserKeyOf(k.replace('valid/', '')) === key);
    const invalid = Object.keys(INVALID).filter((k) => parserKeyOf(k.replace('invalid/', '')) === key);
    expect(valid.length).toBeGreaterThanOrEqual(1);
    expect(invalid.length).toBeGreaterThanOrEqual(2);
  });
});

describe('valid fixtures parse', () => {
  it.each(Object.keys(VALID))('%s', (name) => {
    const parse = PARSERS[parserKeyOf(name.replace('valid/', ''))]!;
    const r = parse(VALID[name], TODAY);
    if (!r.ok) throw new Error(`${name}:\n${r.issues.join('\n')}`);
    expect(r.ok).toBe(true);
  });
});

describe('invalid fixtures are rejected with the expected issue', () => {
  it.each(Object.keys(INVALID))('%s', (name) => {
    const spec = INVALID[name]!;
    const parse = PARSERS[parserKeyOf(name.replace('invalid/', ''))]!;
    const r = parse(buildInvalid(spec), spec.today);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join('\n')).toMatch(new RegExp(spec.expect));
  });
});

describe('02 §8 exemption fixtures (valid)', () => {
  it('a future ead_c9.meta.cardExpiry is allowed (EAD 2025-09-15, expiry 2030-09-14)', () => {
    const r = PARSERS.case!(VALID['valid/case.card-expiry'], TODAY);
    expect(r.ok).toBe(true);
  });
  it('a parole_termination_notice before the receipt is allowed (notice 2025-06-12, receipt 2025-08-01)', () => {
    const r = PARSERS.case!(VALID['valid/case.parole-notice'], TODAY);
    expect(r.ok).toBe(true);
  });
});
