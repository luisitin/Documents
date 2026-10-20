/**
 * 07 WP4 acceptance: `createFmt` gives the exact 02 §9 strings under jsdom too (the web artifact
 * runs the same code in a browser).
 *
 * jsdom is not a root dependency (07 §3.2 has none); it is present in `app/node_modules` (via
 * jest-expo). This test loads it from the root or from the app, and:
 *   1. bundles `@caa/i18n-core` with esbuild (shipped with the pinned tsx/vitest) and runs it
 *      *inside* the jsdom window's own JS realm (its own globals, `navigator.language = 'fr-FR'`);
 *   2. runs the formatter in this realm with jsdom's window/document/navigator installed as globals
 *      and a hostile `Intl` that throws on any use (I18N-2: no `Intl` in the output path).
 * When jsdom is not installed (the CI `tools` job installs only the root), the suite is skipped
 * with a visible reason; the CI `web` job installs both packages and runs it.
 * TODO(WP11): run `npx vitest run packages/i18n-core` in a CI job that has app/node_modules.
 */
// eslint-disable-next-line no-restricted-imports -- test-only: runs in Node under vitest, never bundled into the app
import { createRequire } from 'node:module';
// eslint-disable-next-line no-restricted-imports -- test-only: runs in Node under vitest, never bundled into the app
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertTable, TABLE } from './fmtCases';

interface JsdomWindow {
  eval(code: string): unknown;
  document: unknown;
  navigator: unknown;
  close(): void;
}
interface JsdomCtor { new (html: string, opts: Record<string, unknown>): { window: JsdomWindow } }

function loadJsdom(): JsdomCtor | null {
  for (const from of ['../../../package.json', '../../../app/package.json']) {
    try {
      const req = createRequire(fileURLToPath(new URL(from, import.meta.url)));
      return (req('jsdom') as { JSDOM: JsdomCtor }).JSDOM;
    } catch {
      // try the next location
    }
  }
  return null;
}

const JSDOM = loadJsdom();
if (!JSDOM) console.warn('fmt.jsdom.vitest.ts: jsdom not installed (root or app/node_modules); suite skipped');

const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const dataSchemas = fileURLToPath(new URL('../../data-schemas/src/index.ts', import.meta.url));

describe.skipIf(!JSDOM)('createFmt under jsdom', () => {
  let window: JsdomWindow;

  beforeAll(() => {
    const dom = new JSDOM!('<!doctype html><html><body><div id="root"></div></body></html>', {
      url: 'http://localhost/x/y/z/index.html',
      runScripts: 'outside-only',
      pretendToBeVisual: true,
    });
    window = dom.window;
    window.eval("Object.defineProperty(navigator, 'language', { value: 'fr-FR' });");
  });

  afterAll(() => {
    window?.close();
  });

  it('runs inside the jsdom realm with the exact 02 §9 strings', async () => {
    const out = await build({
      entryPoints: [entry],
      bundle: true,
      format: 'iife',
      globalName: 'I18N',
      platform: 'browser',
      write: false,
      logLevel: 'silent',
      // Only types are imported from data-schemas; alias it anyway so the bundle never pulls zod.
      alias: { '@caa/data-schemas': dataSchemas },
    });
    const code = out.outputFiles[0]?.text ?? '';
    expect(code).not.toMatch(/\bIntl\./);
    const rows = TABLE.map(([name]) => name);
    const calls = JSON.stringify(rows);
    // One script: the bundle declares `var I18N`, then the probe reads it in the same realm.
    const results = window.eval(`${code}
      ;(function () {
        var es = I18N.createFmt('es'), en = I18N.createFmt('en');
        var call = {
          'int(355520)': function (f) { return f.int(355520); },
          'dec(20.6, 1)': function (f) { return f.dec(20.6, 1); },
          'pct(0.0923)': function (f) { return f.pct(0.0923); },
          'pct(0.00906)': function (f) { return f.pct(0.00906); },
          'date(2026-10-20)': function (f) { return f.date('2026-10-20'); },
          'month(2026-08)': function (f) { return f.month('2026-08'); },
          'monthLong(2026-08)': function (f) { return f.monthLong('2026-08'); },
          'relative(3)': function (f) { return f.relative(3); },
          'relative(48)': function (f) { return f.relative(48); }
        };
        return JSON.stringify(${calls}.map(function (n) { return [n, call[n](es), call[n](en), typeof document, navigator.language]; }));
      })()
    `) as string;
    const parsed = JSON.parse(results) as [string, string, string, string, string][];
    expect(parsed).toHaveLength(TABLE.length);
    for (const [i, [name, gotEs, gotEn, docType, navLang]] of parsed.entries()) {
      const row = TABLE[i]!;
      expect(name).toBe(row[0]);
      expect(gotEs, `es ${name}`).toBe(row[2]);
      expect(gotEn, `en ${name}`).toBe(row[3]);
      expect(docType).toBe('object');
      expect(navLang).toBe('fr-FR');
    }
  });

  it('gives the same strings with jsdom globals installed and Intl poisoned', () => {
    const g = globalThis as Record<string, unknown>;
    const saved = { window: g.window, document: g.document, navigator: Object.getOwnPropertyDescriptor(g, 'navigator'), Intl: g.Intl };
    g.window = window;
    g.document = window.document;
    Object.defineProperty(g, 'navigator', { value: window.navigator, configurable: true, writable: true });
    g.Intl = new Proxy({}, { get() { throw new Error('Intl used'); } });
    try {
      assertTable();
    } finally {
      g.Intl = saved.Intl;
      g.window = saved.window;
      g.document = saved.document;
      if (saved.navigator) Object.defineProperty(g, 'navigator', saved.navigator);
      else delete g.navigator;
    }
  });
});
