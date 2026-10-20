/**
 * WP0 foundation tests: the package skeletons resolve through tsconfig `paths` / vitest aliases
 * (spike V7) and behave per their cited spec. WP1–WP5 replace the skeletons; these tests only
 * pin behaviour that the final contract (07 §6.0) keeps.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SCHEMA_VERSION, parseManifest } from '@caa/data-schemas';
import { quantile } from '@caa/estimator';
import { NAMESPACES } from '@caa/i18n-core';

const sample = JSON.parse(readFileSync(new URL('../fixtures/manifest.sample.json', import.meta.url), 'utf8')) as Record<string, unknown>;

describe('@caa/data-schemas skeleton (02 §2.1)', () => {
  it('SCHEMA_VERSION is 1', () => expect(SCHEMA_VERSION).toBe(1));

  it('parses the labelled sample manifest fixture', () => {
    const r = parseManifest(sample);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.origin).toBe('bundled_sample');
      expect(r.value.latestOfficialMonth).toBe('2026-08');
      // GOLDEN T15 (04 §9.2): P12 0.09229, q50 54.
      expect(r.value.canary.pWithin12).toBeCloseTo(0.09229, 5);
      expect(r.value.canary.q50).toBe(54);
    }
  });

  it('rejects an unknown schemaVersion and a missing v1 file name', () => {
    const bad = parseManifest({ ...sample, schemaVersion: 2 });
    expect(bad.ok).toBe(false);
    const files = { ...(sample.files as Record<string, unknown>) };
    delete files.params;
    const missing = parseManifest({ ...sample, files });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.issues.join('\n')).toMatch(/files\.params/);
  });

  it('rejects a Localized note with an empty side (02 §1)', () => {
    const r = parseManifest({ ...sample, qa: { status: 'ok', lastGoodRunId: 'x', notes: [{ es: '', en: 'x' }] } });
    expect(r.ok).toBe(false);
  });
});

describe('@caa/estimator skeleton: quantile (EST-8)', () => {
  // S_c(0..72): linear survival from 1 to 0.28 so q50 and q75 cross inside the window.
  const S = Array.from({ length: 73 }, (_, t) => 1 - t * 0.01);
  it('returns the smallest whole month with 1 - S(t) >= q', () => {
    expect(quantile(S, 0.1)).toBe(10);
    expect(quantile(S, 0.5)).toBe(50);
  });
  it('returns null beyond 72 months ("más de 6 años")', () => {
    expect(quantile(S, 0.75)).toBeNull();
  });
  it('applies the 1e-12 tolerance', () => {
    const s = [1, 0.5 + 5e-13];
    expect(quantile(s, 0.5)).toBe(1);
  });
});

describe('@caa/i18n-core skeleton (I18N-3)', () => {
  it('declares the 14 namespaces of 07 §6.0', () => {
    expect(NAMESPACES).toHaveLength(14);
    expect(new Set(NAMESPACES).size).toBe(14);
    expect(NAMESPACES).toContain('notifications');
  });
});
