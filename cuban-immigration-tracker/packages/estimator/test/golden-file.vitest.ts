/**
 * The golden file itself (EST-13): the `@caa/estimator/golden` entry exposes every key the oracle
 * writes, the file says where it comes from, and the inputs are labelled as test data.
 */
import { describe, expect, it } from 'vitest';
import raw from '../golden/vph1.golden.json';
import { GOLDEN } from '@caa/estimator/golden';

describe('golden file', () => {
  it('the entry re-exports every top-level key, in the oracle order', () => {
    expect(Object.keys(GOLDEN)).toEqual(Object.keys(raw));
    for (const k of Object.keys(raw)) expect((GOLDEN as Record<string, unknown>)[k]).toEqual((raw as Record<string, unknown>)[k]);
  });
  it('declares its generator, spec, tolerances and the sample/test-data label', () => {
    expect(GOLDEN.meta.generatedBy).toMatch(/golden_cases\.py/);
    expect(GOLDEN.meta.spec).toMatch(/04-estimation-model\.md §9/);
    expect(GOLDEN.meta.tolerances).toEqual({ probability: 5e-4, quantile: 0, days: 0, oracleCheck: 1e-6 });
    expect(GOLDEN.meta.note).toMatch(/SAMPLE\/TEST DATA/);
    expect(GOLDEN.inputs.rows.length).toBe(24);
    expect(GOLDEN.inputs.rows[0]!.ym).toBe('2024-09');
    expect(GOLDEN.inputs.rows[23]!.ym).toBe('2026-08');
  });
});
