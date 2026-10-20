/**
 * Ingestion CLI (07-implementation-plan.md WP5 "Exports (CLI)"; 03-data-pipeline.md §8). Run with
 * `tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts <command>`:
 *
 * - `refresh --out data [--only a,b] [--dry-run] [--github-output <file>]` — one pipeline run (refresh.ts).
 * - `validate <dir>` — strict validation of a published snapshot and its `curated/` inputs (exit 1 on issues).
 * - `fixtures` — re-download the mirror parser fixtures and verify their sha256 (raw.githubusercontent.com).
 * - `probe --report-dir <dir> [--only id,…]` — the doc 13 §12 endpoint probes; never fails on a blocked
 *   endpoint (a blocked endpoint is a finding), only on programming errors.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { validateDataDir } from '@caa/data-schemas/node';
import { FIXTURE_FILES, FIXTURES_DIR } from './fixtures';
import { HttpClient } from './http';
import { runProbe } from './probe';
import { refresh } from './refresh';
import { loadCurated } from './sources/curated';
import { sha256Hex } from './util';

export interface ParsedArgs { command: string; positional: string[]; flags: Record<string, string | true> }

/** `--flag value`, `--flag=value`, bare `--flag` (true), positionals. An empty value (`--only ""`) is kept as "". */
export function parseArgs(argv: string[]): ParsedArgs {
  const [command = 'help', ...rest] = argv;
  const flags: Record<string, string | true> = {};
  const positional: string[] = [];
  const BOOLEAN = new Set(['dry-run', 'help']);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (!a.startsWith('--')) { positional.push(a); continue; }
    const eq = a.indexOf('=');
    if (eq > 0) { flags[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const name = a.slice(2);
    if (BOOLEAN.has(name)) { flags[name] = true; continue; }
    const next = rest[i + 1];
    if (next !== undefined && !next.startsWith('--')) { flags[name] = next; i++; } else flags[name] = true;
  }
  return { command, positional, flags };
}

const str = (v: string | true | undefined) => (typeof v === 'string' ? v : undefined);

async function cmdValidate(dir: string): Promise<number> {
  const report = await validateDataDir(dir);
  // The curated inputs (when the directory has them) are also checked as the refresh loads them
  // (strict schemas + every alert's ruleIds known to policy.alertRules).
  if (existsSync(join(dir, 'curated'))) {
    const curated = await loadCurated(join(dir, 'curated'));
    for (const [k, v] of Object.entries(curated.issues)) (report.issues[`curated/${k}`] ??= []).push(...v);
  }
  for (const [f, w] of Object.entries(report.warnings)) for (const m of w) console.log(`warn  ${f}: ${m}`);
  for (const [f, e] of Object.entries(report.issues)) for (const m of e) console.error(`ERROR ${f}: ${m}`);
  const ok = Object.keys(report.issues).length === 0;
  console.log(ok ? `validate ${dir}: OK` : `validate ${dir}: ${Object.values(report.issues).flat().length} issue(s)`);
  return ok ? 0 : 1;
}

async function cmdFixtures(): Promise<number> {
  const client = new HttpClient({ mode: 'refresh' });
  let bad = 0;
  await mkdir(join(FIXTURES_DIR, 'mirror'), { recursive: true });
  for (const f of FIXTURE_FILES) {
    const r = await client.fetch({ url: f.url });
    if (r.classification !== 'ok' || !r.body) { console.error(`FAIL ${f.name}: ${r.classification} ${r.status ?? ''} ${r.error ?? ''}`); bad++; continue; }
    const sha = sha256Hex(r.body);
    if (sha !== f.sha256) { console.error(`FAIL ${f.name}: sha256 ${sha} ≠ pinned ${f.sha256} (mirror changed; review before re-pinning)`); bad++; continue; }
    await writeFile(join(FIXTURES_DIR, 'mirror', f.name), r.body);
    console.log(`ok   ${f.name} (${r.body.byteLength} B, sha256 ${sha.slice(0, 12)}…)`);
  }
  return bad ? 1 : 0;
}

export async function main(argv: string[]): Promise<number> {
  const { command, positional, flags } = parseArgs(argv);
  switch (command) {
    case 'refresh': {
      const out = resolve(str(flags.out) ?? 'data');
      const onlyRaw = str(flags.only) ?? process.env.ONLY ?? '';
      const r = await refresh({
        out, dryRun: flags['dry-run'] === true, only: onlyRaw.split(',').filter((s) => s.trim()),
        ...(str(flags['github-output']) ? { githubOutput: str(flags['github-output']) } : {}),
        ...(str(flags.curated) ? { curatedDir: resolve(str(flags.curated)!) } : {}),
      });
      console.log(`[refresh] ${r.summary}${r.written.length ? `; wrote ${r.written.length} path(s)` : ''}`);
      return 0;
    }
    case 'validate':
      return cmdValidate(resolve(positional[0] ?? str(flags.dir) ?? 'data'));
    case 'fixtures':
      return cmdFixtures();
    case 'probe': {
      const dir = resolve(str(flags['report-dir']) ?? 'probe-out');
      const only = (str(flags.only) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
      const r = await runProbe({ reportDir: dir, only });
      console.log(`[probe] ${r.results.length} probes → ${join(dir, 'PROBE-REPORT.md')}`);
      return 0;
    }
    default:
      console.log('usage: cli.ts refresh --out data [--only k1,k2] [--dry-run] [--github-output FILE] | validate <dir> | fixtures | probe --report-dir <dir> [--only id,…]');
      return command === 'help' ? 0 : 2;
  }
}

const isEntry = process.argv[1] && /[\\/]cli\.ts$/.test(process.argv[1]);
if (isEntry) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => { console.error(e instanceof Error ? e.stack ?? e.message : e); process.exitCode = 1; });
}
