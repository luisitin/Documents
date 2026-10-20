#!/usr/bin/env node
// scripts/prove-artifact.mjs — WP0 PROTOTYPE of Prove (07-implementation-plan.md §9; WP10 owns
// and replaces this file with the full P1–P14 suite against the real screens).
//
// The WP0 version proves acceptance (b) on the hello-world fragment: it wraps
// web-artifact/index.html in the host-like skeleton, serves it from /x/<random>/z/index.html with
// the host CSP, and checks boot, path guard, request list, CSP, console, tabs, language switch
// and persistence, localStorage throwing, history throwing, theme, layout, forbidden dialogs and
// the fragment shape. Browser: @sparticuz/chromium + puppeteer-core (WEB-2).
//
// CLI: node scripts/prove-artifact.mjs --dir web-artifact --out prove-out --variant sample|live|both
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const CSP =
  "default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://unpkg.com; " +
  "style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'";
const SKELETON_HEAD =
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
  '<style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif}</style></head><body>';
const SKELETON_TAIL = '</body></html>';
const BOOT_MS = 10_000;
const TAB_KEYS = ['index', 'case', 'offices', 'alerts', 'more'];
// Hello-world tab labels (src/hello). WP10 replaces these with the i18n resources.
const LABELS = { es: ['Inicio', 'Mi caso', 'Oficinas', 'Alertas', 'Más'], en: ['Home', 'My case', 'Offices', 'Alerts', 'More'] };
const THEME = { light: 'rgb(247, 247, 245)', dark: 'rgb(17, 19, 23)' };

function parseArgs(argv) {
  const a = { dir: 'web-artifact', out: 'prove-out', variant: 'both' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--dir') a.dir = v;
    else if (k === '--out') a.out = v;
    else if (k === '--variant') a.variant = v;
    else throw new Error(`unknown argument ${k}`);
    i++;
  }
  if (!['sample', 'live', 'both'].includes(a.variant)) throw new Error(`bad --variant ${a.variant}`);
  return a;
}

const results = [];
function check(id, name, ok, detail = '') {
  results.push({ id, name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ` — ${detail}` : ''}`);
}

// ── P14: fragment shape (static) ────────────────────────────────────────────────────────────
function checkFragment(html) {
  check('P14', 'starts with <title>CAA Tracker</title>', html.startsWith('<title>CAA Tracker</title>'));
  const shell = html.slice(0, html.indexOf('<script>'));
  check('P14', 'no doctype/html/head/body', !/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(shell));
  check('P14', 'exactly one <script> and no <script src>', (html.match(/<script\b/gi) ?? []).length === 1 && !/<script[^>]*\bsrc=/i.test(html));
  check('P14', 'size < 15 MB', Buffer.byteLength(html) < 15 * 1024 * 1024, `${Buffer.byteLength(html)} B`);
}

// ── server ──────────────────────────────────────────────────────────────────────────────────
function startServer(fragmentHtml, dataDir) {
  const base = `/x/${randomBytes(4).toString('hex')}/z/`;
  const served = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    served.push(url.pathname);
    const headers = { 'Content-Security-Policy': CSP, 'Cache-Control': 'no-store' };
    if (url.pathname === `${base}index.html`) {
      res.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
      res.end(SKELETON_HEAD + fragmentHtml + SKELETON_TAIL);
      return;
    }
    if (dataDir && url.pathname.startsWith(`${base}data/`)) {
      const rel = path.normalize(decodeURIComponent(url.pathname.slice(`${base}data/`.length)));
      const file = path.join(dataDir, rel);
      if (!rel.startsWith('..') && file.startsWith(dataDir) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { ...headers, 'Content-Type': 'application/json; charset=utf-8' });
        res.end(fs.readFileSync(file));
        return;
      }
    }
    res.writeHead(404, headers);
    res.end('not found');
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, base, served, port: server.address().port })));
}

// ── page instrumentation (runs before the fragment) ─────────────────────────────────────────
function instrument({ throwStorage, throwHistory }) {
  window.__prove = { csp: [], dialogs: [] };
  document.addEventListener('securitypolicyviolation', (e) => window.__prove.csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  for (const k of ['alert', 'confirm', 'prompt', 'print', 'open']) {
    window[k] = () => {
      window.__prove.dialogs.push(k);
      return k === 'confirm' ? false : null;
    };
  }
  if (throwStorage) {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('localStorage blocked (Prove P9)'); } });
  }
  if (throwHistory) {
    History.prototype.pushState = function () { throw new Error('pushState blocked (Prove P10)'); };
    History.prototype.replaceState = function () { throw new Error('replaceState blocked (Prove P10)'); };
  }
}

async function openPage(browser, srv, opts) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const log = { console: [], requests: [], pageErrors: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') log.console.push({ text: m.text(), url: m.location()?.url ?? '' });
  });
  page.on('pageerror', (e) => log.pageErrors.push(String(e)));
  page.on('request', (r) => log.requests.push(r.url()));
  await page.setViewport(opts.viewport);
  await page.evaluateOnNewDocument(instrument, { throwStorage: !!opts.throwStorage, throwHistory: !!opts.throwHistory });
  const url = `http://127.0.0.1:${srv.port}${srv.base}index.html`;
  await page.goto(url, { waitUntil: 'load' });
  return { ctx, page, log, url };
}

async function waitBoot(page) {
  await page.waitForSelector('[data-testid="lang-toggle"]', { visible: true, timeout: BOOT_MS });
  await page.waitForSelector('[data-testid="data-status"]', { visible: true, timeout: BOOT_MS });
}

// Tab text minus any icon glyphs, so the comparison sees the label only.
const tabLabels = (page) =>
  page.$$eval('[role="tab"]', (els) => els.map((e) => (e.textContent ?? '').replace(/[^\p{L}\s]/gu, '').trim()));

async function clickTab(page, index) {
  const tabs = await page.$$('[role="tab"]');
  await tabs[index].click();
}

const langOf = (labels) => (labels[0] === LABELS.es[0] ? 'es' : labels[0] === LABELS.en[0] ? 'en' : null);

// ── scenarios ───────────────────────────────────────────────────────────────────────────────
async function scenario(browser, srv, variant, name, opts, outDir) {
  const tag = `${variant}/${name}`;
  const { ctx, page, log, url } = await openPage(browser, srv, opts);
  try {
    await waitBoot(page);
    check('P1', `${tag}: boots with toggle and status chip visible (${opts.viewport.width}px)`, true);
  } catch (e) {
    check('P1', `${tag}: boots with toggle and status chip visible (${opts.viewport.width}px)`, false, String(e));
    await page.screenshot({ path: path.join(outDir, `${variant}-${name}-boot-fail.png`) }).catch(() => {});
    await ctx.close();
    return;
  }
  const pathname = await page.evaluate(() => window.location.pathname);
  if (!opts.throwHistory) check('P2', `${tag}: pathname guard → "/"`, pathname === '/', pathname);
  const base = await page.evaluate(() => window.__CAA_DATA_BASE__);
  check('P2', `${tag}: captured data base`, base === `http://127.0.0.1:${srv.port}${srv.base}data/`, base);
  const manifestReq = log.requests.find((u) => u.endsWith('/data/manifest.json'));
  check('P2', `${tag}: manifest requested from the captured base`, manifestReq === `${base}manifest.json`, manifestReq ?? 'none');

  // P5: tabs
  let tabsOk = true;
  for (let i = TAB_KEYS.length - 1; i >= 0; i--) {
    await clickTab(page, i);
    const ok = await page
      .waitForSelector(`[data-testid="hello-${TAB_KEYS[i]}"]`, { visible: true, timeout: 5000 })
      .then(() => true, () => false);
    if (!ok) tabsOk = false;
  }
  check('P5', `${tag}: all 5 tabs render`, tabsOk);

  // P6: language switch + persistence
  const before = await tabLabels(page);
  const l0 = langOf(before);
  await page.click('[data-testid="lang-toggle"]');
  await page
    .waitForFunction((want) => (document.querySelector('[role="tab"]')?.textContent ?? '').includes(want), { timeout: 5000 }, l0 === 'es' ? LABELS.en[0] : LABELS.es[0])
    .catch(() => {});
  const after = await tabLabels(page);
  const l1 = langOf(after);
  check('P6', `${tag}: language toggle switches the tab labels (${l0} → ${l1})`, l0 !== null && l1 !== null && l0 !== l1, after.join(', '));
  const disclaimer = await page.$eval('[data-testid="disclaimer"]', (e) => e.textContent ?? '');
  check('P6', `${tag}: disclaimer follows the language`, l1 === 'en' ? /legal advice/.test(disclaimer) : /asesoría legal/.test(disclaimer));
  // "Reload" = open the original document URL again: the guard already replaced the visible
  // path with "/", which the host would never serve (contract c).
  await page.goto(url, { waitUntil: 'load' });
  await waitBoot(page).catch(() => {});
  const l2 = langOf(await tabLabels(page));
  if (opts.throwStorage) check('P6', `${tag}: with storage blocked the language falls back to the default`, l2 === l0, `${l2}`);
  else check('P6', `${tag}: language persists across reload`, l2 === l1, `${l2}`);

  // P8 (hello-world subset): status chip reflects data presence
  const status = await page.$eval('[data-testid="data-status"]', (e) => e.textContent ?? '');
  if (variant === 'sample') check('P8', `${tag}: status shows the sample label`, /Muestra|Sample/.test(status), status);
  else check('P8', `${tag}: status shows published data`, /Publicado|Published/.test(status), status);

  if (name === 'phone' || name === 'desktop') {
    // P11 theme
    const bg = () => page.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.getElementById('root')).backgroundColor]);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    const dark = await bg();
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
    const light = await bg();
    await page.evaluate(() => { delete document.documentElement.dataset.theme; });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    const media = await bg();
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    check('P11', `${tag}: data-theme dark/light and prefers-color-scheme drive body and #root`,
      dark.every((c) => c === THEME.dark) && light.every((c) => c === THEME.light) && media.every((c) => c === THEME.dark),
      JSON.stringify({ dark, light, media }));
    // P12 layout
    const w = opts.viewport.width;
    const layout = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="hello-index"]') ?? document.querySelector('[data-testid^="hello-"]');
      const r = el?.getBoundingClientRect();
      return { scrollWidth: document.documentElement.scrollWidth, left: r?.left ?? -1, right: r?.right ?? -1, width: r?.width ?? -1 };
    });
    if (w <= 390) check('P12', `${tag}: no horizontal scroll at ${w}px`, layout.scrollWidth <= w, JSON.stringify(layout));
    else check('P12', `${tag}: centred column ≤ 560 px at ${w}px`, layout.width <= 560 && Math.abs(layout.left - (w - layout.right)) <= 2, JSON.stringify(layout));
  }

  await page.screenshot({ path: path.join(outDir, `${variant}-${name}.png`) });

  // P3 / P4 / P13
  const pageOrigin = `http://127.0.0.1:${srv.port}`;
  const foreign = log.requests.filter((u) => !(u === `${pageOrigin}${srv.base}index.html` || (u.startsWith(`${pageOrigin}${srv.base}data/`) && u.endsWith('.json')) || u.startsWith('data:')));
  check('P3', `${tag}: only the page and data/*.json are requested`, foreign.length === 0, foreign.join(', '));
  const prove = await page.evaluate(() => window.__prove);
  check('P3', `${tag}: zero CSP violations`, prove.csp.length === 0, prove.csp.join('; '));
  const errors = log.console.filter((c) => !(variant === 'sample' && /404/.test(c.text) && /data\/manifest\.json$/.test(c.url)));
  check('P4', `${tag}: zero console errors and page errors`, errors.length === 0 && log.pageErrors.length === 0, JSON.stringify([...errors, ...log.pageErrors]).slice(0, 500));
  check('P13', `${tag}: no alert/confirm/prompt/print/open calls`, prove.dialogs.length === 0, prove.dialogs.join(','));
  await ctx.close();
}

async function runVariant(browser, dir, variant, outDir, fragmentHtml) {
  const dataDir = variant === 'live' ? path.resolve(dir, 'data') : null;
  if (variant === 'live' && !fs.existsSync(path.join(dataDir, 'manifest.json'))) {
    console.warn(`prove: WARNING live variant skipped — ${dataDir}/manifest.json does not exist (sample-only fragment)`);
    results.push({ id: 'live', name: 'live variant skipped (no data/)', ok: true, skipped: true });
    return;
  }
  const srv = await startServer(fragmentHtml, dataDir);
  try {
    await scenario(browser, srv, variant, 'phone', { viewport: { width: 390, height: 844 } }, outDir);
    await scenario(browser, srv, variant, 'desktop', { viewport: { width: 1280, height: 800 } }, outDir);
    await scenario(browser, srv, variant, 'storage-throws', { viewport: { width: 390, height: 844 }, throwStorage: true }, outDir);
    await scenario(browser, srv, variant, 'history-throws', { viewport: { width: 390, height: 844 }, throwHistory: true }, outDir);
  } finally {
    srv.server.close();
  }
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const dir = path.resolve(a.dir);
  const outDir = path.resolve(a.out);
  fs.mkdirSync(outDir, { recursive: true });
  const fragmentHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  checkFragment(fragmentHtml);

  const executablePath = await chromium.executablePath();
  // Drop the Lambda-oriented flags that would weaken the test or crash multi-context runs:
  // --single-process (Target closed on a second browser context), --disable-web-security and
  // --allow-running-insecure-content (the host page runs with normal web security).
  const drop = new Set(['--single-process', '--disable-web-security', '--allow-running-insecure-content']);
  const args = [...chromium.args.filter((x) => !drop.has(x)), '--no-sandbox'];
  const browser = await puppeteer.launch({ executablePath, headless: true, args });
  try {
    const variants = a.variant === 'both' ? ['sample', 'live'] : [a.variant];
    for (const v of variants) await runVariant(browser, dir, v, outDir, fragmentHtml);
  } finally {
    await browser.close();
  }
  const failed = results.filter((r) => !r.ok);
  const report = { at: new Date().toISOString(), browser: 'HeadlessChrome via @sparticuz/chromium', variant: a.variant, passed: results.length - failed.length, failed: failed.length, results };
  fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`prove: ${report.passed} passed, ${report.failed} failed → ${path.join(outDir, 'report.json')}`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
