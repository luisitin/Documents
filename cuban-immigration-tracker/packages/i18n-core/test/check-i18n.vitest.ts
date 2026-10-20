/**
 * scripts/check-i18n.mjs (07 WP4): passes on the repo and catches every seeded violation in
 * test/fixtures/seeded/ (a labelled test fixture, not real data).
 */
// eslint-disable-next-line no-restricted-imports -- test-only: runs in Node under vitest, never bundled into the app
import { execFileSync } from 'node:child_process';
// eslint-disable-next-line no-restricted-imports -- test-only: runs in Node under vitest, never bundled into the app
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { NAMESPACES } from '@caa/i18n-core';

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
const script = fileURLToPath(new URL('../../../scripts/check-i18n.mjs', import.meta.url));
const seeded = fileURLToPath(new URL('./fixtures/seeded/', import.meta.url));

interface Finding { rule: string; file: string; key: string; lang: string | null; message: string }
interface Report { ok: boolean; violations: Finding[]; warnings: Finding[]; stats: Record<string, number> }

function run(args: string[]): { code: number; out: string } {
  try {
    const out = execFileSync(process.execPath, [script, ...args], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status: number; stdout: string };
    return { code: err.status, out: err.stdout };
  }
}

function seededReport(): Report {
  const { code, out } = run(['--root', seeded, '--locales', 'locales', '--data', 'curated', '--allowlist', 'allowlist.json', '--json']);
  expect(code).toBe(1);
  return JSON.parse(out) as Report;
}

const has = (r: Report, rule: string, file: string, key: string, lang?: string | null, term?: string) =>
  r.violations.some((v) => v.rule === rule && v.file === file && v.key === key
    && (lang === undefined || v.lang === lang) && (term === undefined || v.message.includes(`"${term}"`)));

describe('check-i18n on the repository', () => {
  it('passes', () => {
    const { code, out } = run(['--json']);
    const report = JSON.parse(out) as Report;
    expect(report.violations).toEqual([]);
    expect(code).toBe(0);
    expect(report.stats.localeFiles).toBe(28);
    expect(report.stats.localized).toBeGreaterThan(0); // data/curated/** was scanned
  });

  it('lists the same namespaces as @caa/i18n-core', () => {
    const { out } = run(['--list-namespaces']);
    expect(JSON.parse(out)).toEqual([...NAMESPACES]);
  });

  it('rejects unknown arguments with exit code 2', () => {
    expect(run(['--bogus']).code).toBe(2);
  });
});

describe('check-i18n on the seeded fixture', () => {
  const r = seededReport();
  const es = (ns: string) => `locales/es/${ns}.json`;
  const en = (ns: string) => `locales/en/${ns}.json`;

  it('file structure: missing file, unknown namespace, non-flat value', () => {
    expect(has(r, 'missing-file', en('welcome'), '', 'en')).toBe(true);
    expect(has(r, 'unknown-namespace', es('extra'), '', 'es')).toBe(true);
    expect(has(r, 'not-flat', es('home'), 'nested', 'es')).toBe(true);
    // the non-string key still counts for parity: no spurious key-mismatch for it
    expect(has(r, 'key-mismatch', es('home'), 'nested')).toBe(false);
  });

  it('key-set mismatch between es and en', () => {
    expect(has(r, 'key-mismatch', en('case'), 'onlyEs', 'en')).toBe(true);
    expect(has(r, 'key-mismatch', es('case'), 'onlyEn', 'es')).toBe(true);
  });

  it('empty strings', () => {
    expect(has(r, 'empty', es('case'), 'blank', 'es')).toBe(true);
  });

  it('interpolation-variable mismatch', () => {
    expect(has(r, 'var-mismatch', es('case'), 'due')).toBe(true);
    expect(has(r, 'var-mismatch', 'curated/policy.json', '$.items[2].label')).toBe(true);
  });

  it('register guard: tú, tu caso, puedes (I18N-1)', () => {
    expect(has(r, 'register', es('case'), 'tuteo', 'es', 'tú')).toBe(true);
    expect(has(r, 'register', es('case'), 'tuteo', 'es', 'puedes')).toBe(true);
    expect(has(r, 'register', es('case'), 'possessive', 'es', 'tu')).toBe(true);
    // "Su caso" (usted) is fine
    expect(r.violations.some((v) => v.key === 'ok')).toBe(false);
  });

  it('register allowlist suppresses only the listed term and key, and reports unused entries', () => {
    expect(r.violations.some((v) => v.file === es('more'))).toBe(false);
    expect(r.warnings.some((w) => w.rule === 'unused-allowlist' && w.file === 'locales/en/nothing.json')).toBe(true);
  });

  it('banned phrases in either language', () => {
    expect(has(r, 'banned', es('case'), 'peers', 'es', 'casos como el suyo')).toBe(true);
    expect(has(r, 'banned', es('case'), 'directive', 'es', 'presente ahora')).toBe(true);
    expect(has(r, 'banned', en('case'), 'directive', 'en', 'file now')).toBe(true);
    expect(has(r, 'banned', es('home'), 'court', 'es', 'inconstitucional')).toBe(true);
    expect(has(r, 'banned', en('home'), 'court', 'en', 'unconstitutional')).toBe(true);
    expect(has(r, 'banned', 'curated/policy.json', '$.items[1].label', 'es', 'será aprobado')).toBe(true);
    expect(has(r, 'banned', 'curated/alerts/a1.json', '$.title', 'en', 'garantizado')).toBe(true);
  });

  it('curated Localized with an empty or missing side', () => {
    expect(has(r, 'curated-empty', 'curated/policy.json', '$.items[0].label', 'es')).toBe(true);
    expect(has(r, 'curated-empty', 'curated/policy.json', '$.items[3].label', 'es')).toBe(true);
    // a correct Localized produces nothing
    expect(r.violations.some((v) => v.key === '$.items[4].label')).toBe(false);
  });

  it('prints a human-readable report and exits 1 without --json', () => {
    const { code, out } = run(['--root', seeded, '--locales', 'locales', '--data', 'curated', '--allowlist', 'allowlist.json']);
    expect(code).toBe(1);
    expect(out).toMatch(/check-i18n: FAILED/);
  });
});
