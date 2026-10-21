/**
 * Carried over from WP0's foundation test (WP0 acceptance (c), (e); spike V8), which this WP
 * replaces: jest-expo resolves `@caa/*` from ../packages and `zod` from app/node_modules only
 * (07 §4 moduleNameMapper; ARCH-1 "exactly one zod").
 */
import { z } from 'zod';
import { ISODateSchema, SCHEMA_VERSION, parseManifest } from '@caa/data-schemas';
import { quantile } from '@caa/estimator';
import sample from '../../test/fixtures/manifest.sample.json';

describe('@caa/* packages through jest moduleNameMapper', () => {
  it('parses the labelled sample manifest fixture with the app copy of zod', () => {
    const r = parseManifest(sample);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.canary.q50).toBe(54); // GOLDEN T15 (04 §9.2)
    expect(parseManifest({ ...sample, schemaVersion: 2 }).ok).toBe(false);
    expect(SCHEMA_VERSION).toBe(1);
  });

  it('resolves zod from app/node_modules (one zod copy, ARCH-1)', () => {
    const resolve = (require as unknown as { resolve(id: string): string }).resolve;
    expect(resolve('zod').replace(/\\/g, '/')).toMatch(/\/app\/node_modules\/zod\//);
    expect(ISODateSchema instanceof z.ZodString).toBe(true);
  });

  it('imports @caa/estimator (EST-8 quantile)', () => {
    expect(quantile([1, 0.4], 0.5)).toBe(1);
  });
});
