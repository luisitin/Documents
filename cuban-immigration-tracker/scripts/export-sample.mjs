#!/usr/bin/env node
/**
 * `npm run data:sample` = `node scripts/export-sample.mjs --from data --to app/src/data/sample`
 * (07-implementation-plan.md WP5; 02-data-model.md §2; 03-data-pipeline.md §8).
 *
 * Freezes the published snapshot into the app's BUNDLED SAMPLE: the manifest plus the 7 v1 files
 * (national, quarterly, offices, policy, alerts, content, params), copied byte for byte so the
 * manifest's sha256 / byte counts stay valid. The sample manifest is marked `origin: "bundled_sample"`
 * (machine-readable sample label; the app shows "Muestra") and carries a bilingual note saying it is a
 * sample copy; `artifactBuiltAt` is dropped (it belongs to web-artifact/ only).
 *
 * For v1 the bundled sample is the FROZEN GOLDEN SNAPSHOT (dataThrough 2026-08): Prove's sample variant
 * and the Jest sample tests assert golden literals against it, so it is NOT refreshed on routine data
 * updates. Refreshing it is a deliberate, owner-approved `sample: refresh` commit (02 §2). The script
 * therefore checks the canary against GOLDEN T15 and refuses to overwrite the sample with a snapshot
 * whose canary differs, unless `--allow-non-golden` is given.
 *
 * After copying it validates the target with `cli.ts validate` (same zod schemas as the app).
 */
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'];
const SAMPLE_NOTE = {
  es: 'Copia de muestra incluida en la aplicación. Puede no ser la versión más reciente de los datos.',
  en: 'Sample copy bundled with the app. It may not be the latest version of the data.',
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

async function main() {
  const from = resolve(ROOT, arg('from', 'data'));
  const to = resolve(ROOT, arg('to', 'app/src/data/sample'));
  const manifest = JSON.parse(await readFile(join(from, 'manifest.json'), 'utf8'));
  for (const f of FILES) {
    if (!manifest.files?.[f]) throw new Error(`manifest.json has no entry for ${f}`);
  }

  // G1 gate: the canary must equal GOLDEN T15 (04 §9.2) — 5e-6 on P12, exact on q50.
  const golden = JSON.parse(await readFile(join(ROOT, 'packages/estimator/golden/vph1.golden.json'), 'utf8')).cases.T15;
  const dp = Math.abs(manifest.canary.pWithin12 - golden.pWithin.m12);
  const golden_ok = dp <= 5e-6 && manifest.canary.q50 === golden.quantiles.q50;
  console.log(`[sample] canary P12 ${manifest.canary.pWithin12} q50 ${manifest.canary.q50}; GOLDEN T15 P12 ${golden.pWithin.m12} q50 ${golden.quantiles.q50} → ${golden_ok ? 'equal' : 'DIFFERENT'}`);
  if (!golden_ok && !has('allow-non-golden')) {
    throw new Error('the snapshot canary differs from GOLDEN T15: the bundled sample is the frozen golden snapshot (02 §2). Use --allow-non-golden only for an owner-approved "sample: refresh".');
  }

  const tmp = `${to}.tmp-${process.pid}`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  for (const f of FILES) await writeFile(join(tmp, `${f}.json`), await readFile(join(from, manifest.files[f].path)));
  const { artifactBuiltAt: _drop, ...rest } = manifest;
  void _drop;
  const notes = (rest.qa?.notes ?? []).filter((n) => n.en !== SAMPLE_NOTE.en);
  const sample = { ...rest, qa: { ...rest.qa, notes: [...notes, SAMPLE_NOTE] }, origin: 'bundled_sample' };
  await writeFile(join(tmp, 'manifest.json'), `${JSON.stringify(sample, null, 2)}\n`);

  // Replace the directory contents (only *.json the script owns).
  await mkdir(to, { recursive: true });
  for (const f of await readdir(to)) if (f.endsWith('.json')) await rm(join(to, f));
  for (const f of await readdir(tmp)) await rename(join(tmp, f), join(to, f));
  await rm(tmp, { recursive: true, force: true });

  const v = spawnSync(process.execPath, [join(ROOT, 'node_modules/tsx/dist/cli.mjs'), '--tsconfig', join(ROOT, 'packages/ingestion/tsconfig.json'), join(ROOT, 'packages/ingestion/src/cli.ts'), 'validate', to], { stdio: 'inherit', cwd: ROOT });
  if (v.status !== 0) throw new Error(`validation of ${to} failed`);
  console.log(`[sample] wrote ${FILES.length + 1} files to ${to} (dataThrough ${manifest.latestOfficialMonth}, origin bundled_sample)`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
