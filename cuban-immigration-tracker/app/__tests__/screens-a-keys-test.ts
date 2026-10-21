/**
 * WP8a i18n completeness (owner requirement 1: no hard-coded English anywhere): every literal
 * `namespace:key` used by the WP8a screens exists in BOTH languages and is non-empty, and the
 * dynamic key families resolve for every value of their enums. `i18n:check` covers parity, the
 * usted register and the banned phrases; this covers "the code asks for a key that exists".
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs') as { readFileSync(p: string, e: string): string; readdirSync(p: string, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] };
const path = require('path') as { join(...p: string[]): string };
/* eslint-enable @typescript-eslint/no-require-imports */
import { hasKey } from '@caa/i18n-core';
import { CHANNEL_KEY, EVIDENCE_KEY, KIND_KEY, SEVERITY_KEY } from '@/features/alerts/copy';

declare const __dirname: string;
const SRC = path.join(__dirname, '..', 'src');
const DIRS = ['features/home', 'features/offices', 'features/alerts', 'features/more', 'features/welcome', 'app'];

function files(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...files(p));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const KEY_RE = /'((?:common|ui|home|offices|alerts|more|method|welcome|notifications):[A-Za-z0-9_.\-[\]]+)'/g;
const PLURAL_BASES = new Set(['common:unit.month', 'common:unit.day']);

describe('WP8a i18n keys', () => {
  const used = new Set<string>();
  for (const d of DIRS) for (const f of files(path.join(SRC, d))) for (const m of fs.readFileSync(f, 'utf8').matchAll(KEY_RE)) used.add(m[1]!);

  it('finds the screens\' keys', () => {
    expect(used.size).toBeGreaterThan(300);
  });

  it('every literal key exists in es and en', () => {
    const missing = [...used].filter((k) => !PLURAL_BASES.has(k) && !hasKey(k));
    expect(missing).toEqual([]);
  });

  it('every dynamic key family resolves in es and en', () => {
    const dynamic = [
      ...Object.values(CHANNEL_KEY), ...Object.values(EVIDENCE_KEY), ...Object.values(KIND_KEY), ...Object.values(SEVERITY_KEY),
      ...['settings', 'myths', 'glossary', 'method', 'about', 'privacy'].flatMap((r) => [`more:row.${r}`, `more:row.${r}.desc`]),
      ...['system', 'light', 'dark'].map((x) => `more:settings.theme.${x}`),
      ...['false', 'misleading', 'true', 'unknown'].map((x) => `more:verdict.${x}`),
      ...['es', 'en'].map((x) => `more:glossary.otherLang.${x}`),
      ...['not_validated', 'validated_r0r2', 'validated_current'].map((x) => `method:validation.${x}`),
      ...['completionOnly', 'selection', 'immortal', 'regimeLag', 'aggregation', 'reportingLag'].map((x) => `method:bias.${x}`),
      ...['mixedPool', 'stateMixture', 'officeProxy', 'postInterview', 'unseen', 'policy'].map((x) => `method:limits.${x}`),
      ...['common:unit.month.one', 'common:unit.month.other', 'common:unit.day.one', 'common:unit.day.other'],
    ];
    expect(dynamic.filter((k) => !hasKey(k))).toEqual([]);
  });
});
