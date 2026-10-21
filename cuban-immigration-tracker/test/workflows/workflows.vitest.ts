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
 * 3. caa-data-refresh push boundary (review round 2): the write-token `commit` job takes its checkout ref
 *    from the trusted event context (`github.sha`), never from an output of the untrusted `refresh` job,
 *    and a push guard refuses to push anything but ONE commit touching only data/** (not data/curated/).
 *    The guard is exercised for real: the commit job's run script runs against local git repos, including
 *    the attack where the checked-out commit is a foreign (fork / PR head) grafted root.
 *
 * Line-based on purpose (no YAML dependency): the workflows use the standard 2-space layout.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
    expect(commit).toMatch(/git pull --rebase origin "\$BRANCH" && guard && git push origin "HEAD:\$BRANCH"/);
    expect(commit).toMatch(/git reset -q -- data\/curated data\/.refresh-request/);
  });

  it('notify still has issues: write only and also reports a failed commit job', () => {
    expect(j.notify).toMatch(/permissions:\n\s+issues: write\n/);
    expect(j.notify).not.toMatch(/contents: write/);
    expect(j.notify).toMatch(/needs\.commit\.result == 'failure'/);
  });
});

describe('caa-data-refresh push boundary (review round 2)', () => {
  const src = read('caa-data-refresh.yml');
  const j = jobs(src);
  const BR = 'claude/cuban-immigration-tracker-b6y4b1';

  it('no checkout ref comes from a job output; both jobs check out github.sha', () => {
    for (const [id, t] of Object.entries(j)) {
      for (const s of steps(t).filter((x) => /actions\/checkout@/.test(x))) {
        expect(s, id).not.toMatch(/ref:\s*\$\{\{\s*needs\./);
        expect(s, id).toMatch(/^\s+ref: \$\{\{ github\.sha \}\}$/m);
      }
    }
    expect(j.refresh).not.toMatch(/^\s+sha: \$\{\{/m);
    expect(j.commit).not.toMatch(/needs\.refresh\.outputs\.sha/);
  });

  const commitScript = runBlocks(j.commit!)[0]!.script.join('\n');
  const hasRsync = spawnSync('sh', ['-c', 'command -v rsync']).status === 0;

  /** Runs `git` with a clean config in `cwd`. */
  const git = (cwd: string, ...args: string[]): string =>
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'init.defaultBranch=main', ...args], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: gitEnv,
    }).trim();
  let root = '';
  let gitEnv: NodeJS.ProcessEnv = {};
  const put = (dir: string, rel: string, body: string): void => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  };

  /** A bare "origin" with the branch, plus a working clone checked out the way actions/checkout does. */
  function setup(checkoutRef: 'branch' | 'foreign', upstreamMovesAfterCheckout = false) {
    root = mkdtempSync(join(tmpdir(), 'caa-guard-'));
    gitEnv = { PATH: process.env.PATH, HOME: root, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: join(root, 'gitconfig') };
    writeFileSync(join(root, 'gitconfig'), '[protocol "file"]\n\tallow = always\n');
    const origin = join(root, 'origin.git');
    git(root, 'init', '-q', '--bare', origin);
    const seed = join(root, 'seed');
    git(root, 'init', '-q', seed);
    put(seed, 'cuban-immigration-tracker/package.json', '{}\n');
    put(seed, 'cuban-immigration-tracker/packages/a.ts', 'export {};\n');
    put(seed, 'cuban-immigration-tracker/data/x.json', '1\n');
    put(seed, 'cuban-immigration-tracker/data/curated/c.json', '1\n');
    git(seed, 'add', '-A');
    git(seed, 'commit', '-qm', 'seed');
    git(seed, 'push', '-q', `file://${origin}`, `HEAD:refs/heads/${BR}`);
    // A fork / PR head: an unrelated commit whose tree is the branch tree plus a non-data file.
    git(seed, 'checkout', '-q', '--orphan', 'fork');
    put(seed, 'cuban-immigration-tracker/packages/evil.ts', 'export const pwned = 1;\n');
    git(seed, 'add', '-A');
    git(seed, 'commit', '-qm', 'foreign');
    git(seed, 'push', '-q', `file://${origin}`, 'HEAD:refs/pull/1/head');
    const work = join(root, 'work');
    git(root, 'init', '-q', work);
    git(work, 'remote', 'add', 'origin', `file://${origin}`);
    git(work, 'fetch', '-q', '--depth', '1', 'origin', checkoutRef === 'branch' ? `refs/heads/${BR}` : 'refs/pull/1/head');
    git(work, 'checkout', '-q', '--detach', 'FETCH_HEAD');
    if (upstreamMovesAfterCheckout) {
      git(seed, 'fetch', '-q', `file://${origin}`, `refs/heads/${BR}`);
      git(seed, 'checkout', '-q', '-B', 'other', 'FETCH_HEAD');
      put(seed, 'cuban-immigration-tracker/packages/b.ts', 'export {};\n');
      git(seed, 'add', '-A');
      git(seed, 'commit', '-qm', 'someone else pushed code');
      git(seed, 'push', '-q', `file://${origin}`, `HEAD:refs/heads/${BR}`);
    }
    const tmp = join(root, 'runner-temp');
    put(tmp, 'caa-data/new.json', '{"sample":true}\n');
    const bin = join(root, 'bin');
    mkdirSync(bin);
    if (!hasRsync) {
      // Local stand-in (this sandbox has no rsync; ubuntu-latest does): copy SRC/ into DEST/.
      writeFileSync(join(bin, 'rsync'), '#!/bin/sh\nfor a; do s="$d"; d="$a"; done\ncp -R "$s." "$d"\n');
      chmodSync(join(bin, 'rsync'), 0o755);
    }
    return { origin, work, tmp, bin };
  }

  function runCommit(env: ReturnType<typeof setup>, script = commitScript) {
    const out = join(root, 'github-output');
    writeFileSync(out, '');
    const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script], {
      cwd: join(env.work, 'cuban-immigration-tracker'), encoding: 'utf8',
      env: { ...gitEnv, PATH: `${env.bin}:${process.env.PATH}`, RUNNER_TEMP: env.tmp, GITHUB_OUTPUT: out,
        SUMMARY: 'test', NEW_MONTH: 'false', DATA_MONTH: '', BRANCH: BR },
      timeout: 30_000,
    });
    const tipFiles = git(root, '--git-dir', env.origin, 'ls-tree', '-r', '--name-only', `refs/heads/${BR}`).split('\n');
    return { status: r.status, log: r.stdout + r.stderr, output: readFileSync(out, 'utf8'), tipFiles };
  }

  it('pushes a data-only commit on top of the branch', () => {
    const r = runCommit(setup('branch'));
    try {
      expect(r.status, r.log).toBe(0);
      expect(r.output).toContain('committed=true');
      expect(r.tipFiles).toContain('cuban-immigration-tracker/data/new.json');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('still pushes when someone else moved the branch (rebase onto new code is fine)', () => {
    const r = runCommit(setup('branch', true));
    try {
      expect(r.status, r.log).toBe(0);
      expect(r.tipFiles).toEqual(expect.arrayContaining(['cuban-immigration-tracker/data/new.json', 'cuban-immigration-tracker/packages/b.ts']));
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('refuses to push when the checked-out commit is a foreign grafted root (fork / PR head)', () => {
    const env = setup('foreign');
    try {
      // Non-vacuous: without the guard the same script would push packages/evil.ts to the branch.
      const unguarded = runCommit(env, commitScript.replace('&& guard &&', '&&'));
      expect(unguarded.tipFiles, unguarded.log).toContain('cuban-immigration-tracker/packages/evil.ts');
    } finally { rmSync(root, { recursive: true, force: true }); }
    const r = runCommit(setup('foreign'));
    try {
      expect(r.status, r.log).not.toBe(0);
      expect(r.log).toMatch(/push guard/);
      expect(r.output).not.toContain('committed=true');
      expect(r.tipFiles).not.toContain('cuban-immigration-tracker/packages/evil.ts');
      expect(r.tipFiles).not.toContain('cuban-immigration-tracker/data/new.json');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('the guard rejects a commit that touches data/curated/', () => {
    const env = setup('branch');
    try {
      // Smuggle a curated change into the bot commit (the script's own `git reset` normally drops it).
      const script = commitScript.replace('git commit -m', 'echo 2 > data/curated/c.json && git add data/curated && git commit -m');
      const r = runCommit(env, script);
      expect(r.status, r.log).not.toBe(0);
      expect(r.log).toMatch(/push guard: paths outside data\/ \(or curated\) changed/);
    } finally { rmSync(root, { recursive: true, force: true }); }
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
