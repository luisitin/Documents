#!/usr/bin/env node
// scripts/build-artifact.mjs — WP0 PROTOTYPE of the artifact build (07-implementation-plan.md
// WP0 step 5; WP10 owns and replaces this file). It already follows the WP10 order (07 WP10
// steps 0–7; 01-architecture.md §5) so the hello-world proves contract (a)–(i) end to end:
//
//   0.  known-routes list from app/src/app → <out>/.build/routes.json (prelude-only, WEB-1)
//   0b. `npx expo export --platform web --output-dir dist` in app/ (EXPO_OFFLINE=1 unless CI/--online)
//   1.  parse dist/index.html: exactly one <script src>, stylesheets, root id
//   2.  "/assets/<path>" literals → data: URIs (fail if missing or > 200 KB; fail on fonts)
//   3.  fail on residual "/_expo/" or "/assets/" literals or external src/href/url()/import()
//   4.  prelude (data base capture, history shim, unknown-path guard) with the routes embedded
//   5.  emit <out>/index.html as the exact fragment of contract (a): title, style, root, ONE script
//   6.  copy data/manifest.json + the 7 files to <out>/data/ (artifactBuiltAt, sha256 recomputed);
//       without data/manifest.json → warning and a sample-only fragment (no data/ folder)
//   7.  print {bytes, inlinedAssets, routes}; warn above 4 MB, fail at 15 MB
//
// CLI: node scripts/build-artifact.mjs --app app --data data --out web-artifact
//        [--skip-export] [--dist app/dist] [--online] [--check-single-zod]
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KB = 1024;
const MB = 1024 * KB;
const ASSET_MAX = 200 * KB;
const WARN_BYTES = 4 * MB;
const FAIL_BYTES = 15 * MB;
const DATA_FILES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'];

function parseArgs(argv) {
  const a = { app: 'app', data: 'data', out: 'web-artifact', dist: null, skipExport: false, online: false, checkSingleZod: false };
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
    else fail(`unknown argument ${k}`);
  }
  a.dist ??= path.join(a.app, 'dist');
  return a;
}

function fail(msg) {
  console.error(`build-artifact: ${msg}`);
  process.exit(1);
}

// ── step 0: known routes ────────────────────────────────────────────────────────────────────
/** Route files → anchored path regex sources. `(group)` dropped, `[p]` → `[^/]+`, `[...p]` → `.+`, `index` → `/`. */
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

// ── step 1–3: inline ────────────────────────────────────────────────────────────────────────
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' };

function inline(distDir) {
  const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g)].map((m) => m[1]);
  if (scripts.length !== 1) fail(`expected exactly 1 <script src> in dist/index.html, got ${scripts.length}`);
  const sheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  const inlineStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  const rootId = html.match(/<div id="([^"]+)"><\/div>/)?.[1];
  if (!rootId) fail('root <div id> not found in dist/index.html');

  const fontRe = /\.(ttf|otf|woff2?)\b/i;
  const assetFiles = fs.existsSync(path.join(distDir, 'assets')) ? listFiles(path.join(distDir, 'assets')) : [];
  const fonts = assetFiles.filter((f) => fontRe.test(f));
  if (fonts.length) fail(`font files are not allowed (no icon fonts; contract b): ${fonts.join(', ')}`);

  let js = fs.readFileSync(path.join(distDir, scripts[0].replace(/^\//, '')), 'utf8');
  let inlinedAssets = 0;
  js = js.replace(/"\/assets\/([^"]+)"/g, (_m, rel) => {
    const ext = rel.split('.').pop().toLowerCase();
    if (fontRe.test(rel)) fail(`font asset referenced by the bundle: ${rel}`);
    const mime = MIME[ext];
    if (!mime) fail(`unsupported asset type: ${rel}`);
    const file = path.join(distDir, 'assets', rel);
    if (!fs.existsSync(file)) fail(`asset missing: ${file}`);
    const buf = fs.readFileSync(file);
    if (buf.length > ASSET_MAX) fail(`asset larger than 200 KB: ${rel} (${buf.length} B)`);
    inlinedAssets++;
    return JSON.stringify(`data:${mime};base64,${buf.toString('base64')}`);
  });
  const css = [...inlineStyles, ...sheets.map((h) => fs.readFileSync(path.join(distDir, h.replace(/^\//, '')), 'utf8'))].join('\n');

  for (const bad of ['"/_expo/', '"/assets/']) if (js.includes(bad) || css.includes(bad)) fail(`residual absolute URL ${bad}`);
  const external = /(?:\bsrc\s*=|\bhref\s*=|\burl\(|\bimport\()\s*["'`]?https?:\/\//i;
  if (external.test(js)) fail('external src=/href=/url()/import() URL in the JS bundle (contract b)');
  if (external.test(css)) fail('external URL in CSS (contract b)');
  // "<!--" (e.g. react-native-svg's XML-comment regex) is harmless once every "<script" and
  // "</script" is escaped below: the HTML tokenizer can then never leave the script element early.
  js = js.replace(/<\/script/gi, '<\\/script');
  // An opening "<script" inside a string would not break parsing, but the fragment must hold
  // exactly one <script> tag even to a naive scan (P14). "\u0073" is a valid escape in strings,
  // regexes, templates and identifiers alike, so the rewrite is safe in every JS context.
  js = js.replace(/<(s)(cript)/gi, (_m, c, rest) => `<\\u00${c.charCodeAt(0).toString(16)}${rest}`);
  return { js, css: css.replace(/<\/style/gi, '<\\/style'), rootId, inlinedAssets };
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(path.join(dir, e.name)).map((f) => path.join(e.name, f)) : [e.name],
  );
}

// ── step 4: prelude (WEB-1) ─────────────────────────────────────────────────────────────────
/**
 * Runs first, in its own try/catch IIFE: (a) capture the data base, (b) history shim, (c) guard.
 * The shim also keeps a virtual cursor over the entries this document created, so `go(n)` /
 * `back()` can never leave the page: when pushState throws (P10) or the stack is shorter than
 * the router thinks, the call is clamped (expo-router's adapter then resolves after its 100 ms
 * fallback). Without the clamp, returning to a tab after a swallowed pushState navigated the
 * frame away from the artifact (seen in the WP0 Prove run).
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
/** Theme tokens (contract f). Light on :root; dark under the guarded media query and data-theme. */
const LIGHT = '--caa-bg:#f7f7f5;--caa-surface:#ffffff;--caa-text:#16181d;';
const DARK = '--caa-bg:#111317;--caa-surface:#1b1e24;--caa-text:#eceef2;';

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
  if (/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(out.slice(0, out.indexOf('<script>')))) fail('fragment must not contain doctype/html/head/body');
  if ((out.match(/<script\b/g) ?? []).length !== 1) fail('fragment must contain exactly one <script>');
  return out;
}

// ── step 6: data ────────────────────────────────────────────────────────────────────────────
function copyData(dataDir, outDir) {
  const manifestPath = path.join(dataDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.warn(`build-artifact: WARNING ${manifestPath} not found → sample-only fragment (no data/ folder)`);
    return { copied: 0 };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const dest = path.join(outDir, 'data');
  fs.mkdirSync(dest, { recursive: true });
  for (const name of DATA_FILES) {
    const entry = manifest.files?.[name];
    if (!entry?.path) fail(`manifest.files.${name} missing`);
    const buf = fs.readFileSync(path.join(dataDir, entry.path));
    fs.mkdirSync(path.dirname(path.join(dest, entry.path)), { recursive: true });
    fs.writeFileSync(path.join(dest, entry.path), buf);
    entry.sha256 = createHash('sha256').update(buf).digest('hex');
    entry.bytes = buf.length;
  }
  manifest.artifactBuiltAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  fs.writeFileSync(path.join(dest, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { copied: DATA_FILES.length + 1 };
}

// ── optional: one zod copy (WP0 acceptance (e); 03 §6.3 web job) ──────────────────────────
function checkSingleZod(appDir, online) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'caa-zodmap-'));
  runExport(appDir, tmp, { online, sourceMaps: true });
  const dir = path.join(tmp, '_expo', 'static', 'js', 'web');
  const maps = fs.readdirSync(dir).filter((f) => f.endsWith('.map'));
  if (maps.length !== 1) fail(`expected one source map, got ${maps.length}`);
  const j = JSON.parse(fs.readFileSync(path.join(dir, maps[0]), 'utf8'));
  const sources = j.sources ?? (j.sections ?? []).flatMap((s) => s.map?.sources ?? []);
  const zod = sources.filter((s) => /[\\/]node_modules[\\/]zod[\\/]/.test(s));
  const roots = [...new Set(zod.map((s) => s.replace(/\\/g, '/').replace(/zod\/.*$/, 'zod/')))];
  fs.rmSync(tmp, { recursive: true, force: true });
  if (zod.length === 0) fail('no zod sources in the bundle (expected one copy via @caa/data-schemas)');
  if (roots.length !== 1 || roots[0] !== '/node_modules/zod/') fail(`zod must come only from app/node_modules/zod; roots: ${roots.join(', ')}`);
  console.log(`build-artifact: one zod copy OK (${zod.length} source files from app/node_modules/zod/)`);
}

// ── main ────────────────────────────────────────────────────────────────────────────────────
function main() {
  const a = parseArgs(process.argv.slice(2));
  const appDir = path.resolve(a.app);
  const distAbs = path.resolve(a.dist);
  const outDir = path.resolve(a.out);

  const routes = routesFrom(appDir);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, '.build'), { recursive: true });
  fs.writeFileSync(path.join(outDir, '.build', 'routes.json'), `${JSON.stringify(routes, null, 2)}\n`);

  if (!a.skipExport) runExport(appDir, distAbs, { online: a.online });
  if (a.checkSingleZod) checkSingleZod(appDir, a.online);

  const parts = inline(distAbs);
  const html = fragment({ ...parts, routes });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  const data = copyData(path.resolve(a.data), outDir);

  const bytes = Buffer.byteLength(html);
  console.log(JSON.stringify({ bytes, inlinedAssets: parts.inlinedAssets, routes: routes.length, dataFiles: data.copied }));
  if (bytes >= FAIL_BYTES) fail(`fragment is ${bytes} B (≥ 15 MB hard limit)`);
  if (bytes > WARN_BYTES) console.warn(`build-artifact: WARNING fragment is ${(bytes / MB).toFixed(2)} MB (> 4 MB budget)`);
}

main();
