// scripts/export-schema.mjs — WP1 (07-implementation-plan.md §2, §4).
//
// Exports the zod schemas of @caa/data-schemas as JSON Schema into data/schema/*.schema.json
// (02-data-model.md intro: "JSON Schema files are exported from zod into data/schema/*.schema.json,
// and CI fails on drift"; 03-data-pipeline.md §6.3 `npm run schema:export -- --check`).
//
//   npm run schema:export              write data/schema/ (and delete stale *.schema.json files)
//   npm run schema:export -- --check   exit 1 if data/schema/ differs from the schemas (no writes)
//
// Runs under `tsx --tsconfig tsconfig.json` so it can import the TypeScript source directly.
// The output is deterministic: sorted keys, 2-space indent, trailing newline (03 §5).
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkJsonSchemaDir, jsonSchemaFiles } from '../packages/data-schemas/src/node.ts';

const outDir = fileURLToPath(new URL('../data/schema/', import.meta.url));
const check = process.argv.includes('--check');

if (check) {
  const drift = await checkJsonSchemaDir(outDir);
  if (drift.length) {
    console.error(`schema:export --check: data/schema/ is out of date (${drift.length}):`);
    for (const d of drift) console.error(`  - ${d}`);
    console.error('Run `npm run schema:export` and commit data/schema/.');
    process.exit(1);
  }
  console.log(`schema:export --check: ${Object.keys(jsonSchemaFiles()).length} schemas up to date`);
} else {
  const files = jsonSchemaFiles();
  await mkdir(outDir, { recursive: true });
  for (const f of (await readdir(outDir)).filter((x) => x.endsWith('.schema.json') && !(x in files))) {
    await rm(join(outDir, f));
    console.log(`removed stale ${f}`);
  }
  for (const [f, content] of Object.entries(files)) await writeFile(join(outDir, f), content);
  console.log(`schema:export: wrote ${Object.keys(files).length} schemas to data/schema/`);
}
