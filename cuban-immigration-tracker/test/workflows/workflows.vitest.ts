/**
 * Regression tests for /.github/workflows/caa-*.yml (review round 1).
 *
 * 1. caa-data-refresh least privilege (05 §3.1): only the `commit` job holds contents: write, it runs no
 *    npm/tsx/node code, and the job that runs the parsers over downloaded files gets no write token
 *    (checkout persist-credentials: false, no GITHUB_TOKEN / github.token in any step env).
 * 2. shellcheck SC2016 (single-quoted `${...}` in a run block): actionlint in caa-probe's lint-workflows
 *    job reports it as an error when shellcheck is installed (ubuntu-latest), so every such line needs an
 *    explicit `# shellcheck disable=SC2016` directive. When ACTIONLINT (path to the binary) is set, the
 *    real linter runs too.
 *
 * Line-based on purpose (no YAML dependency): the workflows use the standard 2-space layout.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const wfDir = fileURLToPath(new URL('../../../.github/workflows/', import.meta.url));
const read = (name: string): string => readFileSync(wfDir + name, 'utf8');
const caaFiles = readdirSync(wfDir).filter((f) => /^caa-.*\.ya?ml$/.test(f)).sort();

/** Splits the `jobs:` section into { jobId: text }. */
function jobs(src: string): Record<string, string> {
  const lines = src.split('\n');
  const start = lines.findIndex((l) => l === 'jobs:');
  const out: Record<string, string> = {};
  let cur: string | null = null;
  for (const l of lines.slice(start + 1)) {
    const m = /^ {2}([A-Za-z_][\w-]*):\s*$/.exec(l);
    if (m) { cur = m[1]!; out[cur] = ''; continue; }
    if (cur && /^\S/.test(l) && !l.startsWith('#')) cur = null;
    if (cur) out[cur] += l + '\n';
  }
  return out;
}

/** Splits a job into its steps (each starts with `      - `). */
function steps(job: string): string[] {
  const body = job.slice(job.indexOf('    steps:\n'));
  return body.split(/\n(?= {6}- )/).slice(1);
}

/** Every `run: |` script in a workflow, with the line number of its `run:` key. */
function runBlocks(src: string): { line: number; script: string[] }[] {
  const lines = src.split('\n');
  const out: { line: number; script: string[] }[] = [];
  lines.forEach((l, i) => {
    const m = /^(\s*)(?:- )?run: \|\s*$/.exec(l);
    if (!m) return;
    const indent = m[1]!.length;
    const script: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const s = lines[j]!;
      if (s.trim() !== '' && s.length - s.trimStart().length <= indent) break;
      script.push(s.trim());
    }
    out.push({ line: i + 1, script });
  });
  return out;
}

/** Lines that shellcheck flags as SC2016 and that carry no disable directive on the line before. */
function sc2016Offenders(src: string): string[] {
  const bad: string[] = [];
  for (const { line, script } of runBlocks(src)) {
    script.forEach((s, k) => {
      if (s.startsWith('#')) return;
      // A single-quoted word holding `$` followed by `{`, `(` or a name (crude, but exactly SC2016's shape).
      if (!/'[^']*\$[{(A-Za-z_][^']*'/.test(s)) return;
      let p = k - 1;
      while (p >= 0 && script[p]!.startsWith('#') && !/shellcheck disable=.*SC2016/.test(script[p]!)) p--;
      if (p >= 0 && /shellcheck disable=.*SC2016/.test(script[p]!)) return;
      bad.push(`run block at line ${line}: ${s.slice(0, 80)}`);
    });
  }
  return bad;
}

describe('caa-data-refresh least privilege', () => {
  const src = read('caa-data-refresh.yml');
  const j = jobs(src);

  it('has no workflow-level permissions', () => expect(src).toMatch(/^permissions: \{\}$/m));

  it('only the commit job has contents: write', () => {
    const writers = Object.entries(j).filter(([, t]) => /contents: write/.test(t)).map(([k]) => k);
    expect(writers).toEqual(['commit']);
    expect(j.refresh).toMatch(/permissions:\n\s+contents: read\n/);
  });

  it('the ingest job never sees a token: persist-credentials false and no GITHUB_TOKEN in any env', () => {
    expect(j.refresh).toMatch(/actions\/checkout@[0-9a-f]{40}[\s\S]*?persist-credentials: false/);
    expect(j.refresh).not.toMatch(/^\s+(GITHUB_TOKEN|GH_TOKEN):/m);
    expect(j.refresh).not.toMatch(/\$\{\{\s*(github\.token|secrets\.GITHUB_TOKEN)/);
  });

  it('the commit job runs no npm / npx / tsx / node code and only pinned checkout + download-artifact', () => {
    const commit = j.commit!;
    for (const s of steps(commit)) {
      const uses = /uses: ([^\s@]+)@([0-9a-f]{40})/.exec(s);
      if (/uses:/.test(s)) {
        expect(uses, s).not.toBeNull();
        expect(['actions/checkout', 'actions/download-artifact']).toContain(uses![1]);
      }
    }
    for (const { script } of runBlocks(commit)) {
      for (const l of script.filter((x) => !x.startsWith('#'))) expect(l).not.toMatch(/\b(npm|npx|tsx|node|yarn|pnpm)\b/);
    }
    expect(commit).toMatch(/git pull --rebase origin "\$BRANCH" && git push origin "HEAD:\$BRANCH"/);
    expect(commit).toMatch(/git reset -q -- data\/curated data\/.refresh-request/);
  });

  it('notify still has issues: write only and also reports a failed commit job', () => {
    expect(j.notify).toMatch(/permissions:\n\s+issues: write\n/);
    expect(j.notify).not.toMatch(/contents: write/);
    expect(j.notify).toMatch(/needs\.commit\.result == 'failure'/);
  });
});

describe('shellcheck SC2016 in caa-* run blocks', () => {
  it('detects the round-1 offender shape (node -e with template literals in single quotes)', () => {
    const old = [
      'jobs:', '  web:', '    steps:', '      - name: Summary', '        run: |', '          {',
      "            node -e 'console.log(`Prove: ${r.passed}`)'", '          } >> "$GITHUB_STEP_SUMMARY"', '',
    ].join('\n');
    expect(sc2016Offenders(old)).toHaveLength(1);
    const fixed = old.replace("            node -e", '            # shellcheck disable=SC2016\n            node -e');
    expect(sc2016Offenders(fixed)).toEqual([]);
  });

  it.each(caaFiles)('%s has no undirected SC2016 line', (f) => {
    expect(sc2016Offenders(read(f))).toEqual([]);
  });

  const actionlint = process.env.ACTIONLINT;
  it.skipIf(!actionlint)('actionlint (with shellcheck) passes on caa-*.yml', () => {
    const args = ['-no-color', ...(process.env.SHELLCHECK ? ['-shellcheck', process.env.SHELLCHECK] : []), ...caaFiles.map((f) => wfDir + f)];
    expect(() => execFileSync(actionlint!, args, { encoding: 'utf8', stdio: 'pipe' })).not.toThrow();
  });
});
