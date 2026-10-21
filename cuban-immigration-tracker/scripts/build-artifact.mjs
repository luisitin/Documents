#!/usr/bin/env node
// scripts/build-artifact.mjs — WP10: builds the Claude artifact page from the Expo web export
// (07-implementation-plan.md WP10 steps 0–7; 01-architecture.md §5; artifact contract a–i).
//
//   0.  known-routes list from app/src/app → <out>/.build/routes.json (prelude-only, WEB-1).
//       `(group)` folders are dropped, `[p]` → `[^/]+`, `[...p]` → `.+`, `index` → `/`,
//       `_layout` and `+…` files are skipped.
//   0b. `npx expo export --platform web --output-dir <dist>` in app/ (inherits process.env;
//       sets EXPO_OFFLINE=1 itself when CI is unset and --online is not given). Skipped with
//       --skip-export (reuses an existing dist).
//   1.  parse dist/index.html: exactly one <script src>, the stylesheets, the root id.
//   2.  "/assets/<path>" literals → data: URIs (fail if missing or > 200 KB; fail on font files
//       or references: no icon fonts, contract b).
//   3.  fail on residual "/_expo/" or "/assets/" literals, or any http(s):// inside src=, href=,
//       url( or import( in the HTML shell, CSS or JS (plain documentation URLs inside string
//       constants are allowed). `</script` → `<\/script`, `<script` → `<script`.
//   4.  the prelude (WEB-1: data base capture, history shim with a virtual cursor, unknown-path
//       guard) with the step-0 routes embedded.
//   5.  emit <out>/index.html, exactly
//       `<title>CAA Tracker</title>\n<style>…</style>\n<div id="root"></div>\n<script>{prelude};\n{bundle}</script>\n`
//       — an HTML fragment (contract a): no doctype/html/head/body, ONE inline script. The
//       <style> holds the theme tokens LIGHT/DARK, checked against WP7's app/src/ui/theme.ts
//       (contract f; the build fails on drift).
//   6.  copy data/manifest.json + the 7 v1 files (+ any additive file the manifest lists) to
//       <out>/data/, set `artifactBuiltAt`, recompute sha256/bytes and validate the shipped
//       folder with @caa/data-schemas/node `validateDataDir` (strict zod + cross checks).
//       Without data/manifest.json → warning and a sample-only fragment (no data/ folder).
//   7.  print {bytes, inlinedAssets, routes, dataFiles, …}; warn above 4 MB, fail at 15 MB.
//
// The page then loads its data with RELATIVE URLs only (window.__CAA_DATA_BASE__ = ./data/),
// because the host CSP blocks every other origin, GitHub raw included (contract b).
//
// CLI: node scripts/build-artifact.mjs --app app --data data --out web-artifact
//        [--skip-export] [--dist app/dist] [--online] [--check-single-zod]
//      node scripts/build-artifact.mjs --self-test      (unit checks of steps 0, 3, 4 and 5)
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const KB = 1024;
const MB = 1024 * KB;
const ASSET_MAX = 200 * KB;
const WARN_BYTES = 4 * MB;
const FAIL_BYTES = 15 * MB;
/** The 7 v1 data files (02-data-model.md §2; `DATA_FILE_NAMES` in @caa/data-schemas). */
export const DATA_FILES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'];
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');

export class BuildError extends Error {}

function fail(msg) {
  throw new BuildError(msg);
}

function parseArgs(argv) {
  const a = { app: 'app', data: 'data', out: 'web-artifact', dist: null, skipExport: false, online: false, checkSingleZod: false, selfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) fail(`missing value for ${k}`);
      return v;
    };
    if (k === '--app') a.app = next();
    else if (k === '--data') a.data = next();
    else if (k === '--out') a.out = next();
    else if (k === '--dist') a.dist = next();
    else if (k === '--skip-export') a.skipExport = true;
    else if (k === '--online') a.online = true;
    else if (k === '--check-single-zod') a.checkSingleZod = true;
    else if (k === '--self-test') a.selfTest = true;
    else fail(`unknown argument ${k}`);
  }
  a.dist ??= path.join(a.app, 'dist');
  return a;
}

// ── step 0: known routes ────────────────────────────────────────────────────────────────────
/** Route files → anchored path regex sources (sorted, de-duplicated). */
export function routesFrom(appDir) {
  const root = path.join(appDir, 'src', 'app');
  const out = new Set();
  const walk = (dir, segs) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.isDirectory()) {
        walk(path.join(dir, ent.name), /^\(.*\)$/.test(ent.name) ? segs : [...segs, ent.name]);
        continue;
      }
      const m = ent.name.match(/^(.+?)(\.(web|native|ios|android))?\.(tsx|ts|jsx|js)$/);
      if (!m) continue;
      const base = m[1];
      if (base === '_layout' || base.startsWith('+')) continue;
      const parts = base === 'index' ? segs : [...segs, base];
      const re = parts
        .map((p) => (/^\[\.\.\..+\]$/.test(p) ? '.+' : /^\[.+\]$/.test(p) ? '[^/]+' : p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        .join('/');
      out.add(re === '' ? '^/$' : `^/${re}/?$`);
    }
  };
  if (!fs.existsSync(root)) fail(`no routes directory at ${root}`);
  walk(root, []);
  return [...out].sort();
}

// ── step 0b: export ─────────────────────────────────────────────────────────────────────────
function runExport(appDir, distAbs, { online, sourceMaps = false }) {
  const env = { ...process.env };
  if (!env.CI && !online) env.EXPO_OFFLINE = '1';
  const args = ['expo', 'export', '--platform', 'web', '--output-dir', distAbs];
  if (sourceMaps) args.push('--source-maps');
  console.log(`build-artifact: npx ${args.join(' ')} (cwd ${appDir}${env.EXPO_OFFLINE ? ', EXPO_OFFLINE=1' : ''})`);
  const r = spawnSync('npx', args, { cwd: appDir, env, stdio: 'inherit' });
  if (r.status !== 0) fail(`expo export failed with exit code ${r.status}`);
}

// ── steps 1–3: inline ───────────────────────────────────────────────────────────────────────
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' };
const FONT_RE = /\.(ttf|otf|woff2?)\b/i;
/** An external URL in a position the browser would fetch (contract b). Plain-text URLs pass. */
const EXTERNAL_FETCH_RE = /(?:\bsrc\s*=|\bhref\s*=|\burl\(|\bimport\()\s*["'`]?\s*(?:https?:)?\/\/[a-z0-9]/i;

/**
 * Makes JS safe inside one inline <script>: `</script` can never close the element early and no
 * second `<script` tag appears even to a naive scan (P14). `<\/` and `s` are valid in strings,
 * regexes, templates and comments alike. `<!--` stays: once every `<script` is escaped the HTML
 * tokenizer can never enter the double-escaped state.
 */
export function escapeScript(js) {
  return js.replace(/<\/script/gi, (m) => `<\\/${m.slice(2)}`).replace(/<(s)(cript)/gi, (_m, c, rest) => `<\\u00${c.charCodeAt(0).toString(16)}${rest}`);
}

/** Fails on residual absolute export paths or fetchable external URLs (step 3). */
export function assertNoExternal(label, text) {
  for (const bad of ['"/_expo/', '"/assets/', "'/_expo/", "'/assets/"]) if (text.includes(bad)) fail(`residual absolute URL ${bad} in ${label}`);
  const m = text.match(EXTERNAL_FETCH_RE);
  if (m) fail(`external URL in a fetch position in ${label} (contract b): …${text.slice(Math.max(0, m.index - 40), m.index + 80)}…`);
}

function inline(distDir) {
  const htmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(htmlPath)) fail(`${htmlPath} not found (run without --skip-export, or pass --dist)`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g)].map((m) => m[1]);
  if (scripts.length !== 1) fail(`expected exactly 1 <script src> in dist/index.html, got ${scripts.length} (asyncRoutes must be false, ARCH-4)`);
  const sheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  const inlineStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  const rootId = html.match(/<div id="([^"]+)"><\/div>/)?.[1];
  if (!rootId) fail('root <div id> not found in dist/index.html');
  for (const s of [...scripts, ...sheets]) if (/^(?:https?:)?\/\//i.test(s)) fail(`external resource in dist/index.html: ${s}`);

  const assetFiles = fs.existsSync(path.join(distDir, 'assets')) ? listFiles(path.join(distDir, 'assets')) : [];
  const fonts = assetFiles.filter((f) => FONT_RE.test(f));
  if (fonts.length) fail(`font files are not allowed (no icon fonts; contract b): ${fonts.join(', ')}`);

  let js = fs.readFileSync(path.join(distDir, scripts[0].replace(/^\//, '')), 'utf8');
  let inlinedAssets = 0;
  let inlinedBytes = 0;
  js = js.replace(/"\/assets\/([^"]+)"/g, (_m, rel) => {
    if (FONT_RE.test(rel)) fail(`font asset referenced by the bundle: ${rel}`);
    const ext = rel.split('.').pop().toLowerCase();
    const mime = MIME[ext];
    if (!mime) fail(`unsupported asset type: ${rel}`);
    const file = path.join(distDir, 'assets', rel);
    if (!fs.existsSync(file)) fail(`asset missing: ${file}`);
    const buf = fs.readFileSync(file);
    if (buf.length > ASSET_MAX) fail(`asset larger than 200 KB: ${rel} (${buf.length} B)`);
    inlinedAssets++;
    inlinedBytes += buf.length;
    return JSON.stringify(`data:${mime};base64,${buf.toString('base64')}`);
  });
  const css = [...inlineStyles, ...sheets.map((h) => fs.readFileSync(path.join(distDir, h.replace(/^\//, '')), 'utf8'))].join('\n');

  assertNoExternal('the JS bundle', js);
  assertNoExternal('the CSS', css);
  if (FONT_RE.test(css) && /@font-face/i.test(css)) fail('@font-face in the CSS (contract b: system fonts only)');
  return { js: escapeScript(js), css: css.replace(/<\/style/gi, '<\\/style'), rootId, inlinedAssets, inlinedBytes };
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(path.join(dir, e.name)).map((f) => path.join(e.name, f)) : [e.name],
  );
}

// ── step 4: prelude (WEB-1) ─────────────────────────────────────────────────────────────────
/**
 * Runs first, in its own try/catch IIFE, in this order: (a) capture the data base before anything
 * changes the URL, (b) the history shim, (c) the unknown-path guard.
 *
 * The shim wraps pushState/replaceState in try/catch (the host may block them; P10) and keeps a
 * virtual cursor over the entries this document created, so `go(n)` / `back()` can never leave
 * the page: when pushState throws or the stack is shorter than the router thinks, the call is
 * clamped (expo-router's adapter then resolves after its fallback timeout). Without the clamp,
 * returning to a tab after a swallowed pushState navigated the frame away from the artifact (seen
 * in the WP0 Prove run).
 */
export function prelude(routes) {
  return `(function(){try{
try{window.__CAA_DATA_BASE__=new URL('./data/',document.baseURI).href}catch(e){window.__CAA_DATA_BASE__='./data/'}
var H=window.History&&window.History.prototype,pos=0,len=0;
if(H){
var oP=H.pushState,oR=H.replaceState,oG=H.go;
if(typeof oP==='function')H.pushState=function(){try{oP.apply(this,arguments);pos++;len=pos}catch(e){}};
if(typeof oR==='function')H.replaceState=function(){try{oR.apply(this,arguments)}catch(e){}};
if(typeof oG==='function'){H.go=function(n){try{n=Number(n)||0;var t=Math.max(0,Math.min(len,pos+n)),d=t-pos;if(!d)return;pos=t;oG.call(this,d)}catch(e){}};
H.back=function(){this.go(-1)};H.forward=function(){this.go(1)}}
}
var R=${JSON.stringify(routes)}.map(function(s){return new RegExp(s)});
var p='/';try{p=window.location.pathname}catch(e){}
if(!R.some(function(r){return r.test(p)})){try{window.history.replaceState(null,'','/')}catch(e){}}
}catch(e){}})()`;
}

// ── step 5: fragment ────────────────────────────────────────────────────────────────────────
/**
 * WP7's palette (`LIGHT_COLORS` / `DARK_COLORS` in app/src/ui/theme.ts: bg, surface, text), used to
 * check that the fragment tokens below match, so the page background and the React tree always
 * agree (WP0 TODO: "sync the fragment theme tokens with WP7"). theme.ts imports react-native, so it
 * is parsed, not imported.
 */
export function themeTokens(appDir) {
  const file = path.join(appDir, 'src', 'ui', 'theme.ts');
  if (!fs.existsSync(file)) fail(`theme tokens not found: ${file} (WP7)`);
  const src = fs.readFileSync(file, 'utf8');
  const read = (name) => {
    const block = src.match(new RegExp(`export const ${name}\\b[^=]*=\\s*Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\)`))?.[1];
    if (!block) fail(`${name} not found in ${file}`);
    const pick = (k) => {
      const v = block.match(new RegExp(`\\b${k}:\\s*'(#[0-9a-fA-F]{3,8})'`))?.[1];
      if (!v) fail(`${name}.${k} not found in ${file}`);
      return v.toLowerCase();
    };
    return { bg: pick('bg'), surface: pick('surface'), text: pick('text') };
  };
  return { light: read('LIGHT_COLORS'), dark: read('DARK_COLORS') };
}

export const cssVars = (t) => `--caa-bg:${t.bg};--caa-surface:${t.surface};--caa-text:${t.text};`;

/**
 * The fragment's theme tokens (contract f). They stay literal here because WP7's
 * app/__tests__/ui-theme-test.tsx reads these two constants and compares them with `CSS_TOKENS`;
 * `assertThemeInSync` makes the build fail if they ever drift from app/src/ui/theme.ts.
 */
export const LIGHT = '--caa-bg:#f7f7f5;--caa-surface:#ffffff;--caa-text:#16181d;';
export const DARK = '--caa-bg:#111317;--caa-surface:#1b1e24;--caa-text:#eceef2;';

/** Fails when the fragment tokens differ from WP7's palette (the page and the React tree must agree). */
export function assertThemeInSync(theme) {
  const want = { light: cssVars(theme.light), dark: cssVars(theme.dark) };
  if (want.light !== LIGHT || want.dark !== DARK) fail(`fragment theme tokens drifted from app/src/ui/theme.ts: expected LIGHT='${want.light}' DARK='${want.dark}'`);
}

export function fragment({ js, css, rootId, routes }) {
  const style = [
    `:root{color-scheme:light;${LIGHT}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;${DARK}}}`,
    `:root[data-theme="dark"]{color-scheme:dark;${DARK}}`,
    `:root[data-theme="light"]{color-scheme:light;${LIGHT}}`,
    `html,body,#${rootId}{background:var(--caa-bg);color:var(--caa-text)}`,
    `html,body{margin:0;max-width:100%;overflow-x:hidden}`,
    css,
  ].join('\n');
  const out = `<title>CAA Tracker</title>\n<style>${style}</style>\n<div id="${rootId}"></div>\n<script>${prelude(routes)};\n${js}</script>\n`;
  const shell = out.slice(0, out.indexOf('<script>'));
  if (/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(shell)) fail('fragment must not contain doctype/html/head/body');
  assertNoExternal('the fragment shell', shell);
  if ((out.match(/<script\b/gi) ?? []).length !== 1) fail('fragment must contain exactly one <script>');
  if ((out.match(/<\/script/gi) ?? []).length !== 1) fail('fragment must contain exactly one </script>');
  if (!out.startsWith('<title>CAA Tracker</title>\n<style>')) fail('fragment must start with <title>CAA Tracker</title> and a <style> block');
  return out;
}

// ── step 6: data ────────────────────────────────────────────────────────────────────────────
function loadTs(rel) {
  // tsx's CJS loader handles the packages' `require('../locales/…json')` and tsconfig paths.
  const { require: tsxRequire } = createRequire(import.meta.url)('tsx/cjs/api');
  return tsxRequire(path.join(PROJECT_ROOT, rel), import.meta.url);
}

function isoSeconds(d) {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function copyData(dataDir, outDir) {
  const manifestPath = path.join(dataDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.warn(`build-artifact: WARNING ${manifestPath} not found → sample-only fragment (no data/ folder)`);
    return { copied: 0 };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const dest = path.join(outDir, 'data');
  fs.mkdirSync(dest, { recursive: true });
  const names = [...DATA_FILES, ...Object.keys(manifest.files ?? {}).filter((n) => !DATA_FILES.includes(n))];
  for (const name of names) {
    const entry = manifest.files?.[name];
    if (!entry?.path) fail(`manifest.files.${name} missing`);
    if (path.isAbsolute(entry.path) || entry.path.split(/[\\/]/).includes('..')) fail(`manifest.files.${name}.path escapes the data folder: ${entry.path}`);
    const src = path.join(dataDir, entry.path);
    if (!fs.existsSync(src)) fail(`data file missing: ${src}`);
    const buf = fs.readFileSync(src);
    fs.mkdirSync(path.dirname(path.join(dest, entry.path)), { recursive: true });
    fs.writeFileSync(path.join(dest, entry.path), buf);
    entry.sha256 = createHash('sha256').update(buf).digest('hex');
    entry.bytes = buf.length;
  }
  manifest.artifactBuiltAt = isoSeconds(new Date());
  fs.writeFileSync(path.join(dest, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  // Never ship data the app would reject (strict zod + sha256 + cross checks; 02 §2, 03 §4).
  const { validateDataDir } = loadTs('packages/data-schemas/src/node.ts');
  const report = await validateDataDir(dest);
  if (!report.ok) fail(`shipped data does not validate:\n${JSON.stringify(report.issues, null, 2).slice(0, 4000)}`);
  return { copied: names.length + 1, latestOfficialMonth: manifest.latestOfficialMonth, artifactBuiltAt: manifest.artifactBuiltAt };
}

// ── optional: one zod copy (WP0 acceptance (e); 03 §6.3 web job) ──────────────────────────
function checkSingleZod(appDir, online) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'caa-zodmap-'));
  try {
    runExport(appDir, tmp, { online, sourceMaps: true });
    const dir = path.join(tmp, '_expo', 'static', 'js', 'web');
    const maps = fs.readdirSync(dir).filter((f) => f.endsWith('.map'));
    if (maps.length !== 1) fail(`expected one source map, got ${maps.length}`);
    const j = JSON.parse(fs.readFileSync(path.join(dir, maps[0]), 'utf8'));
    const sources = j.sources ?? (j.sections ?? []).flatMap((s) => s.map?.sources ?? []);
    const zod = sources.filter((s) => /[\\/]node_modules[\\/]zod[\\/]/.test(s));
    const roots = [...new Set(zod.map((s) => s.replace(/\\/g, '/').replace(/zod\/.*$/, 'zod/')))];
    if (zod.length === 0) fail('no zod sources in the bundle (expected one copy via @caa/data-schemas)');
    if (roots.length !== 1 || roots[0] !== '/node_modules/zod/') fail(`zod must come only from app/node_modules/zod; roots: ${roots.join(', ')}`);
    console.log(`build-artifact: one zod copy OK (${zod.length} source files from app/node_modules/zod/)`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ── self-test (no export, no browser) ───────────────────────────────────────────────────────
async function selfTest() {
  const assert = (await import('node:assert/strict')).default;
  let n = 0;
  const t = (name, fn) => {
    fn();
    n++;
    console.log(`ok ${n} ${name}`);
  };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'caa-build-selftest-'));
  try {
    // step 0
    const app = path.join(tmp, 'app');
    for (const f of ['_layout.tsx', '+not-found.tsx', 'welcome.tsx', '(tabs)/_layout.tsx', '(tabs)/index.tsx', '(tabs)/offices/_layout.tsx', '(tabs)/offices/index.tsx',
      '(tabs)/offices/[code].tsx', '(tabs)/more/method.tsx', '(tabs)/more/settings.web.tsx', 'docs/[...rest].tsx', 'README.md']) {
      fs.mkdirSync(path.dirname(path.join(app, 'src/app', f)), { recursive: true });
      fs.writeFileSync(path.join(app, 'src/app', f), '');
    }
    const routes = routesFrom(app);
    t('routesFrom drops groups/_layout/+not-found, maps index and params', () =>
      assert.deepEqual(routes, ['^/$', '^/docs/.+/?$', '^/more/method/?$', '^/more/settings/?$', '^/offices/?$', '^/offices/[^/]+/?$', '^/welcome/?$']));
    const real = routesFrom(path.join(PROJECT_ROOT, 'app'));
    t('the real app has the five tabs and the four Prove deep routes', () => {
      for (const p of ['/', '/case', '/offices', '/alerts', '/more', '/offices/MIA', '/alerts/x-1', '/case/peers', '/more/method'])
        assert.ok(real.some((r) => new RegExp(r).test(p)), p);
      assert.ok(!real.some((r) => new RegExp(r).test('/x/y/z/index.html')));
    });

    // step 3
    t('escapeScript neutralises </script and <script in every context', () => {
      const js = 'var a="</script>",b=/<script>/i,c=`<SCRIPT src=x>`;//</script';
      const e = escapeScript(js);
      assert.equal((e.match(/<\/script/gi) ?? []).length, 0);
      assert.equal((e.match(/<script/gi) ?? []).length, 0);
      const ctx = {};
      vm.runInNewContext(`${e}\n;this.r=[a,b.test("<script>"),c]`, ctx);
      assert.deepEqual([...ctx.r], ["</script>", true, "<SCRIPT src=x>"]); // a rewritten regex still matches (only its .source shows the escape)
    });
    t('assertNoExternal rejects fetchable external URLs and residual export paths', () => {
      assert.throws(() => assertNoExternal('x', 'e.src="https://cdn.example/x.js"'), BuildError);
      assert.throws(() => assertNoExternal('x', 'a{background:url(https://x.test/a.png)}'), BuildError);
      assert.throws(() => assertNoExternal('x', 'import("//x.test/m.js")'), BuildError);
      assert.throws(() => assertNoExternal('x', 'r("/_expo/static/js/a.js")'), BuildError);
      assert.doesNotThrow(() => assertNoExternal('x', 'const DOC="https://www.uscis.gov/forms";'));
    });

    // step 4
    const runPrelude = (pathname, { throwHistory = false } = {}) => {
      const calls = { push: 0, replace: [], go: [] };
      function History() {}
      History.prototype.pushState = function () { if (throwHistory) throw new Error('blocked'); calls.push++; };
      History.prototype.replaceState = function (_s, _t, u) { if (throwHistory) throw new Error('blocked'); calls.replace.push(u); };
      History.prototype.go = function (d) { calls.go.push(d); };
      const history = new History();
      const window = { History, history, location: { pathname } };
      const ctx = { window, document: { baseURI: `https://host.test${pathname}` }, URL };
      vm.runInNewContext(prelude(real), ctx);
      return { window, history, calls };
    };
    t('prelude captures the data base and replaces an unknown path with "/"', () => {
      const { window, calls } = runPrelude('/x/ab12/z/index.html');
      assert.equal(window.__CAA_DATA_BASE__, 'https://host.test/x/ab12/z/data/');
      assert.deepEqual(calls.replace, ['/']);
    });
    t('prelude keeps a known path', () => assert.deepEqual(runPrelude('/offices/MIA').calls.replace, []));
    t('history shim swallows throws and clamps go() to entries this page created', () => {
      const { history, calls } = runPrelude('/x/index.html', { throwHistory: true });
      assert.doesNotThrow(() => history.pushState(null, '', '/case'));
      history.back();
      assert.deepEqual(calls.go, []);
      const ok = runPrelude('/x/index.html');
      ok.history.pushState(null, '', '/case');
      ok.history.pushState(null, '', '/case/peers');
      ok.history.go(-5);
      ok.history.back();
      assert.deepEqual(ok.calls.go, [-2]);
    });

    // step 5
    const theme = themeTokens(path.join(PROJECT_ROOT, 'app'));
    t('fragment theme tokens equal WP7 theme.ts (LIGHT/DARK in sync)', () => {
      assert.match(theme.light.bg, /^#[0-9a-f]{6}$/);
      assert.notEqual(theme.light.bg, theme.dark.bg);
      assert.doesNotThrow(() => assertThemeInSync(theme));
      assert.throws(() => assertThemeInSync({ ...theme, dark: { ...theme.dark, bg: '#000000' } }), BuildError);
    });
    const html = fragment({ js: escapeScript('console.log("</script>")'), css: '.a{color:red}', rootId: 'root', routes: real });
    t('fragment matches contract (a) literally', () => {
      assert.ok(html.startsWith('<title>CAA Tracker</title>\n<style>:root{color-scheme:light;'));
      assert.match(html, /<\/style>\n<div id="root"><\/div>\n<script>\(function\(\)\{try\{/);
      assert.ok(html.endsWith('</script>\n'));
      assert.equal((html.match(/<script\b/g) ?? []).length, 1);
      assert.ok(html.includes(`@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;--caa-bg:${theme.dark.bg}`));
      assert.ok(html.includes(`:root[data-theme="dark"]{color-scheme:dark;--caa-bg:${theme.dark.bg}`));
      assert.ok(html.includes('html,body,#root{background:var(--caa-bg)'));
    });
    t('fragment refuses a document skeleton', () =>
      assert.throws(() => fragment({ js: '', css: '<html>', rootId: 'root', routes: real }), BuildError));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`build-artifact self-test: ${n} passed`);
}

// ── main ────────────────────────────────────────────────────────────────────────────────────
export async function build(a) {
  const appDir = path.resolve(a.app);
  const distAbs = path.resolve(a.dist);
  const outDir = path.resolve(a.out);

  const routes = routesFrom(appDir);
  assertThemeInSync(themeTokens(appDir));
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, '.build'), { recursive: true });
  fs.writeFileSync(path.join(outDir, '.build', 'routes.json'), `${JSON.stringify(routes, null, 2)}\n`);

  if (!a.skipExport) runExport(appDir, distAbs, { online: a.online });
  if (a.checkSingleZod) checkSingleZod(appDir, a.online);

  const parts = inline(distAbs);
  const html = fragment({ ...parts, routes });
  const bytes = Buffer.byteLength(html);
  if (bytes >= FAIL_BYTES) fail(`fragment is ${bytes} B (≥ 15 MB hard limit)`);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  const data = await copyData(path.resolve(a.data), outDir);

  const summary = { bytes, inlinedAssets: parts.inlinedAssets, inlinedAssetBytes: parts.inlinedBytes, routes: routes.length, dataFiles: data.copied, ...(data.latestOfficialMonth ? { latestOfficialMonth: data.latestOfficialMonth, artifactBuiltAt: data.artifactBuiltAt } : { sampleOnly: true }) };
  fs.writeFileSync(path.join(outDir, '.build', 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary));
  if (bytes > WARN_BYTES) console.warn(`build-artifact: WARNING fragment is ${(bytes / MB).toFixed(2)} MB (> 4 MB budget)`);
  return summary;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.selfTest) return selfTest();
  return build(a);
}

const invokedDirectly = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  main().catch((e) => {
    console.error(`build-artifact: ${e instanceof BuildError ? e.message : (e?.stack ?? e)}`);
    process.exit(1);
  });
}
