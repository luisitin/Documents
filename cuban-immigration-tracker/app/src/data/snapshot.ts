/**
 * One complete data snapshot (the manifest plus the 7 v1 files; 02-data-model.md §2) and the
 * bundled sample.
 *
 * The bundled sample (`./sample/*.json`, owned by WP5, written only by `npm run data:sample`) is
 * the FROZEN GOLDEN SNAPSHOT (dataThrough 2026-08; 02 §2). Its manifest carries
 * `origin: "bundled_sample"`, and the app labels it "Muestra / Sample" everywhere (owner rule: no
 * made-up data presented as real). It is the last-resort fallback when nothing was fetched or
 * cached (01-architecture.md §4).
 */
import {
  DATA_FILE_NAMES, parseDataFile, parseManifest,
  type DataFileMap, type DataFileName, type Manifest,
} from '@caa/data-schemas';
import sampleAlerts from './sample/alerts.json';
import sampleContent from './sample/content.json';
import sampleManifest from './sample/manifest.json';
import sampleNational from './sample/national.json';
import sampleOffices from './sample/offices.json';
import sampleParams from './sample/params.json';
import samplePolicy from './sample/policy.json';
import sampleQuarterly from './sample/quarterly.json';

export type DataSnapshot = DataFileMap & { manifest: Manifest };

const SAMPLE_JSON: Record<DataFileName | 'manifest', unknown> = {
  manifest: sampleManifest,
  national: sampleNational,
  quarterly: sampleQuarterly,
  offices: sampleOffices,
  policy: samplePolicy,
  alerts: sampleAlerts,
  content: sampleContent,
  params: sampleParams,
};

/**
 * Validates a raw snapshot (manifest + 7 files) with the shared zod schemas. Returns the issues
 * per file when anything fails.
 */
export function parseSnapshot(raw: Record<DataFileName | 'manifest', unknown>): { ok: true; value: DataSnapshot } | { ok: false; issues: Record<string, string[]> } {
  const issues: Record<string, string[]> = {};
  const m = parseManifest(raw.manifest);
  if (!m.ok) issues.manifest = m.issues;
  const out: Partial<DataFileMap> = {};
  for (const n of DATA_FILE_NAMES) {
    const r = parseDataFile(n, raw[n]);
    if (r.ok) (out as Record<string, unknown>)[n] = r.value;
    else issues[n] = r.issues;
  }
  if (Object.keys(issues).length || !m.ok) return { ok: false, issues };
  return { ok: true, value: { ...(out as DataFileMap), manifest: m.value } };
}

let sample: DataSnapshot | null = null;

/**
 * The bundled sample, validated once (WP5 guarantees it validates; the platform tests assert it).
 * If it ever failed validation the raw JSON is used as is rather than crashing the app.
 */
export function sampleSnapshot(): DataSnapshot {
  if (sample) return sample;
  const r = parseSnapshot(SAMPLE_JSON);
  sample = r.ok ? r.value : (SAMPLE_JSON as unknown as DataSnapshot);
  return sample;
}

/** The sha256 the sample manifest declares for each file (the sample files are byte copies). */
export function sampleSha(name: DataFileName): string {
  return sampleSnapshot().manifest.files[name].sha256;
}

let current: DataSnapshot | null = null;

/**
 * The snapshot the UI currently shows, for code outside React (notification planning needs the
 * policy file). Set by `<DataProvider>`; defaults to the bundled sample.
 */
export function getCurrentSnapshot(): DataSnapshot {
  return current ?? sampleSnapshot();
}

export function setCurrentSnapshot(s: DataSnapshot): void {
  current = s;
}
