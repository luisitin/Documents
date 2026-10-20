/**
 * WP1 acceptance (07-implementation-plan.md WP1) beyond the per-schema fixtures:
 * - every Localized requires both languages to be non-empty;
 * - JSON Schema export is deterministic and data/schema/ is in sync (`schema:export -- --check`);
 * - unknown keys: strict for curated files, passthrough (with a warning) for pipeline files;
 * - Manifest.files requires exactly the 7 v1 names; a manifest without `community` is valid;
 * - zod runs jitless (artifact CSP, Prove P3);
 * - FIELD_KINDS covers real numeric fields of the sample.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  DATA_FILE_NAMES, FIELD_KINDS, ISODateSchema, ISODateTimeSchema, LocalizedSchema, ManifestSchema, SCHEMA_VERSION, UrlSchema,
  YearMonthSchema, dataFileWarnings, nextYm, parseDataFile, parseManifest,
} from '@caa/data-schemas';
import { checkJsonSchemaDir, jsonSchemaFiles } from '@caa/data-schemas/node';
import { G0, VALID, clone } from './helpers';

const wp0Manifest = Object.values(import.meta.glob('../../../test/fixtures/manifest.sample.json', { eager: true, import: 'default' }))[0];

describe('primitives (02 §1)', () => {
  it('ISODate rejects impossible days and other shapes', () => {
    expect(ISODateSchema.safeParse('2026-10-20').success).toBe(true);
    expect(ISODateSchema.safeParse('2024-02-29').success).toBe(true);
    for (const bad of ['2026-02-30', '2025-02-29', '2026-13-01', '2026-10-20T00:00:00Z', '20261020']) {
      expect(ISODateSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
  it('YearMonth, ISODateTime and URL', () => {
    expect(YearMonthSchema.safeParse('2026-08').success).toBe(true);
    expect(YearMonthSchema.safeParse('2026-8').success).toBe(false);
    expect(ISODateTimeSchema.safeParse('2026-10-20T06:17:04Z').success).toBe(true);
    expect(ISODateTimeSchema.safeParse('2026-10-20T06:17:04.123Z').success).toBe(true);
    expect(ISODateTimeSchema.safeParse('2026-10-20T06:17:04+02:00').success).toBe(false);
    expect(UrlSchema.safeParse('https://egov.uscis.gov/processing-times/historic-pt').success).toBe(true);
    expect(UrlSchema.safeParse('egov.uscis.gov').success).toBe(false);
  });
  it('nextYm rolls the year', () => {
    expect(nextYm('2024-12')).toBe('2025-01');
    expect(nextYm('2026-08')).toBe('2026-09');
  });
  it('Localized: both sides required and non-blank; no extra keys', () => {
    expect(LocalizedSchema.safeParse({ es: 'Inicio', en: 'Home' }).success).toBe(true);
    for (const bad of [{ es: '', en: 'Home' }, { es: 'Inicio', en: ' ' }, { es: 'Inicio' }, { es: 'a', en: 'b', fr: 'c' }]) {
      expect(LocalizedSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe('zod configuration', () => {
  it('runs jitless (no `new Function` probe under the artifact CSP; WP0 hand-over)', () => {
    expect(z.config().jitless).toBe(true);
  });
  it('SCHEMA_VERSION is 1', () => expect(SCHEMA_VERSION).toBe(1));
});

describe('manifest files (02 §2.1)', () => {
  const g0 = () => clone(G0['sample-handbuilt/manifest']) as Record<string, Record<string, unknown>>;
  it('requires each of the 7 v1 names', () => {
    for (const n of DATA_FILE_NAMES) {
      const m = g0();
      delete m.files![n];
      const r = parseManifest(m);
      expect(r.ok, n).toBe(false);
      if (!r.ok) expect(r.issues.join('\n')).toMatch(new RegExp(`files\\.${n}`));
    }
  });
  it('a manifest without community is valid, and one with the v1.1 community entry too', () => {
    expect(parseManifest(g0()).ok).toBe(true);
    expect(parseManifest(VALID['valid/manifest']).ok).toBe(true);
  });
  it('rejects a file path that does not match its name', () => {
    const m = g0();
    (m.files!.national as Record<string, unknown>).path = 'other.json';
    expect(parseManifest(m).ok).toBe(false);
  });
  it('still parses the WP0 sample manifest fixture (test/fixtures/manifest.sample.json)', () => {
    expect(parseManifest(wp0Manifest).ok).toBe(true);
  });
});

describe('unknown keys: strict curated files, passthrough pipeline files (02 §8)', () => {
  it.each(['policy', 'alerts', 'content'] as const)('%s rejects an unknown top-level key', (n) => {
    const v = { ...(clone(VALID[`valid/${n}`]) as object), extra: 1 };
    expect(parseDataFile(n, v).ok).toBe(false);
  });
  it.each(['national', 'quarterly', 'offices', 'params'] as const)('%s keeps an unknown key and reports a warning', (n) => {
    const v = { ...(clone(VALID[`valid/${n}`]) as object), futureField: { a: 1 } };
    const r = parseDataFile(n, v);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.value as unknown as Record<string, unknown>).futureField).toEqual({ a: 1 });
    expect(dataFileWarnings(n, v)).toContain('futureField: unknown key kept by passthrough parsing (02 §8)');
  });
  it('reports nested unknown keys with their path', () => {
    const v = clone(VALID['valid/national']) as { rows: Record<string, unknown>[] };
    v.rows[1]!.note = 'x';
    expect(dataFileWarnings('national', v)).toContain('rows[1].note: unknown key kept by passthrough parsing (02 §8)');
  });
  it('the manifest is passthrough as well (additive v1.x fields)', () => {
    const m = { ...(clone(G0['sample-handbuilt/manifest']) as object), newField: true };
    expect(ManifestSchema.safeParse(m).success).toBe(true);
  });
  it('warns when a Localized has es === en (allowed only for proper names)', () => {
    const p = clone(VALID['valid/policy']) as { regimes: { label: { es: string; en: string } }[] };
    p.regimes[0]!.label = { es: 'R0', en: 'R0' };
    expect(parseDataFile('policy', p).ok).toBe(true);
    expect(dataFileWarnings('policy', p).join('\n')).toMatch(/regimes\[0\]\.label: es equals en/);
  });
});

describe('every Localized requires both languages (JSON Schema view)', () => {
  it('each {es, en} object in every exported schema requires both with minLength ≥ 1', () => {
    let found = 0;
    const visit = (node: unknown): void => {
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (!node || typeof node !== 'object') return;
      const o = node as Record<string, unknown>;
      const props = o.properties as Record<string, Record<string, unknown>> | undefined;
      if (props && Object.keys(props).sort().join() === 'en,es') {
        found++;
        expect((o.required as string[]).slice().sort()).toEqual(['en', 'es']);
        expect(props.es!.minLength).toBeGreaterThanOrEqual(1);
        expect(props.en!.minLength).toBeGreaterThanOrEqual(1);
        expect(o.additionalProperties).toBe(false);
      }
      Object.values(o).forEach(visit);
    };
    for (const content of Object.values(jsonSchemaFiles())) visit(JSON.parse(content));
    expect(found).toBeGreaterThanOrEqual(20);
  });
});

describe('JSON Schema export (schema:export)', () => {
  it('is deterministic', () => {
    expect(jsonSchemaFiles()).toEqual(jsonSchemaFiles());
    expect(Object.keys(jsonSchemaFiles())).toContain('policy.schema.json');
  });
  it('curated schemas forbid additional properties; pipeline schemas allow them', () => {
    const f = jsonSchemaFiles();
    expect(JSON.parse(f['policy.schema.json']!).additionalProperties).toBe(false);
    expect(JSON.parse(f['national.schema.json']!).additionalProperties).toEqual({});
  });
  it('data/schema/ is in sync with the zod schemas (no drift)', async () => {
    expect(await checkJsonSchemaDir(new URL('../../../data/schema/', import.meta.url))).toEqual([]);
  });
});

describe('FIELD_KINDS (02 §1)', () => {
  const resolve = (key: string): unknown[] => {
    const [file, ...rest] = key.split('.');
    let nodes: unknown[] = [G0[`sample-handbuilt/${file}`]];
    for (const part of rest) {
      const arr = part.endsWith('[]');
      const k = arr ? part.slice(0, -2) : part;
      nodes = nodes.flatMap((n) => {
        const v = (n as Record<string, unknown>)[k];
        return arr ? (v as unknown[]) : [v];
      });
    }
    return nodes;
  };
  it('every data-file key exists in the sample and holds numbers (dates for unit "date") or null', () => {
    for (const [key, fk] of Object.entries(FIELD_KINDS)) {
      if (key.startsWith('estimate.')) continue; // estimator output, not a data file
      if (key.startsWith('national.i765National')) continue; // empty in G0 (no complete [F] I-765 row)
      const all = resolve(key);
      expect(all.length, key).toBeGreaterThan(0);
      expect(all.every((v) => v !== undefined), `${key} exists on every element`).toBe(true);
      for (const v of all.filter((x) => x !== null)) {
        if (fk.unit === 'date') expect(ISODateSchema.safeParse(v).success, key).toBe(true);
        else expect(typeof v, key).toBe('number');
      }
    }
  });
  it('labels the monthly average as a mean and the quarterly value as a median (doc 04 §1.1, §1.2)', () => {
    expect(FIELD_KINDS['national.rows[].avgMonths'].kind).toBe('mean_months_completed');
    expect(FIELD_KINDS['quarterly.rows[].medianMonths'].kind).toBe('median_months_completed');
    expect(FIELD_KINDS['offices.processingTimes[].months80'].kind).toBe('p80_months_completed_6mo');
    expect(FIELD_KINDS['manifest.canary.pWithin12'].kind).toBe('model_probability');
  });
});
