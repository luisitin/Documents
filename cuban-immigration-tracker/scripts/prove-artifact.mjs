#!/usr/bin/env node
// scripts/prove-artifact.mjs — WP10 Prove: the full P1–P14 suite of 07-implementation-plan.md §9,
// run against the real screens of the built fragment (web-artifact/index.html).
//
// Harness (07 §9): the fragment is wrapped in the host-like skeleton (charset, viewport with
// viewport-fit=cover, the small reset, 14px system font, zero body margin), served by a Node http
// server from /x/<random>/z/index.html under the host Content-Security-Policy, with data/ beside
// it (live variant) or without it (sample variant). Browser: @sparticuz/chromium + puppeteer-core,
// headless, --no-sandbox (ADR WEB-2); `--chrome <path>` or PROVE_CHROME overrides the executable.
//
// Variants (07 §9; ADR B10):
//   sample — no data/: the app runs on the frozen bundled sample (G1); golden literals
//            ("9 %"/"9%", bands "2 %"…"26 %", "Muestra" + "ago 2026").
//   live   — the shipped web-artifact/data/: expectations derived from data/manifest.json with
//            the same createFmt the app uses (packages/i18n-core), so a new USCIS month never
//            breaks Prove while the code is correct.
//
// Scenarios per variant (each in its own browser context, so storage never leaks between them):
//   phone           390×844, device locale es-US  (P1–P8, P11, P12, P13; settings language)
//   phone-en        390×844, device locale en-US  (P1–P8, P12, P13; the English screenshot set)
//   desktop         1280×800, device locale en-US (P1–P8, P11, P12 centred column, P13)
//   storage-throws  390×844, es-US, localStorage getter throws (P9 = P1, P5, P6, P7 still pass)
//   history-throws  390×844, en-US, History.prototype.pushState/replaceState throw (P10 = P1, P5)
// A fixed clock is injected (Date offset so that "now" starts at 2026-10-20T12:00:00Z, timezone
// UTC), because the reference case (T15) is pinned to that day (04 §9.2).
//
// "Reload" re-opens the ORIGINAL document URL: the guard already replaced the visible path with
// "/", which the host would never serve (contract c).
//
// CLI: node scripts/prove-artifact.mjs --dir web-artifact --out prove-out --variant sample|live|both
//        [--app app] [--chrome /path/to/chrome]
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');

const CSP =
  "default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://unpkg.com; " +
  "style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'";
const SKELETON_HEAD =
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
  '<style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif}</style></head><body>';
const SKELETON_TAIL = '</body></html>';
const BOOT_MS = 10_000;
const STEP_MS = 8_000;
const TAB_KEYS = ['index', 'case', 'offices', 'alerts', 'more'];
/** Content column: 00 §5 maxWidth 560 + 2 × 16 px gutters (WP7 `Screen`). */
const COLUMN_MAX = 560 + 2 * 16;
/** The injected clock: the reference case is pinned to 2026-10-20 (04 §9.2; 07 §9 P6). */
const FIXED_NOW = '2026-10-20T12:00:00Z';
const FIXED_DATE = '2026-10-20';
/**
 * Golden literals for the sample variant (07 §9 P6–P8; GOLDEN T15 = 0.09229, bands 2 %–26 %;
 * frozen sample dataThrough 2026-08). Cross-checked against createFmt below so drift is caught.
 */
const GOLDEN_SAMPLE = {
  pct: { es: '9 %', en: '9%' },
  bands: { es: ['2 %', '26 %'], en: ['2%', '26%'] },
  month: { es: 'ago 2026', en: 'Aug 2026' },
  chip: { es: 'Muestra', en: 'Sample' },
  clockDays: '306',
};

function parseArgs(argv) {
  const a = { dir: 'web-artifact', out: 'prove-out', variant: 'both', app: path.join(PROJECT_ROOT, 'app'), chrome: process.env.PROVE_CHROME || null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (v === undefined) throw new Error(`missing value for ${k}`);
    if (k === '--dir') a.dir = v;
    else if (k === '--out') a.out = v;
    else if (k === '--variant') a.variant = v;
    else if (k === '--app') a.app = v;
    else if (k === '--chrome') a.chrome = v;
    else throw new Error(`unknown argument ${k}`);
    i++;
  }
  if (!['sample', 'live', 'both'].includes(a.variant)) throw new Error(`bad --variant ${a.variant}`);
  return a;
}

const results = [];
function check(id, name, ok, detail = '') {
  const r = { id, name, ok: Boolean(ok), detail: typeof detail === 'string' ? detail : JSON.stringify(detail) };
  results.push(r);
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${id} ${name}${r.detail ? ` — ${r.detail.slice(0, 400)}` : ''}`);
  return r;
}

const norm = (s) => String(s ?? '').replace(/[   ]/g, ' ').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── expectations (createFmt / translate from packages/i18n-core, the app's own formatter) ────
function loadI18n() {
  const { require: tsxRequire } = createRequire(import.meta.url)('tsx/cjs/api');
  return tsxRequire(path.join(PROJECT_ROOT, 'packages/i18n-core/src/index.ts'), import.meta.url);
}

/** WP7 theme tokens (LIGHT_COLORS / DARK_COLORS in app/src/ui/theme.ts) as computed rgb() strings. */
function themeRgb(appDir) {
  const src = fs.readFileSync(path.join(appDir, 'src', 'ui', 'theme.ts'), 'utf8');
  const bg = (name) => {
    const block = src.match(new RegExp(`export const ${name}\\b[^=]*=\\s*Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\)`))?.[1] ?? '';
    const hex = block.match(/\bbg:\s*'#([0-9a-fA-F]{6})'/)?.[1];
    if (!hex) throw new Error(`${name}.bg not found in theme.ts`);
    const n = parseInt(hex, 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  };
  return { light: bg('LIGHT_COLORS'), dark: bg('DARK_COLORS') };
}

function expectations(i18n, variant, manifest) {
  const out = {};
  for (const lang of ['es', 'en']) {
    const fmt = i18n.createFmt(lang);
    const tr = (k, v) => norm(i18n.translate(lang, k, v));
    const live = variant === 'live';
    out[lang] = {
      tabs: TAB_KEYS.map((k) => tr(`notifications:shell.tab.${k}`)),
      disclaimer: tr('common:disclaimer.full'),
      date: norm(fmt.date(FIXED_DATE)),
      pct: live ? norm(fmt.pct(manifest.canary.pWithin12)) : GOLDEN_SAMPLE.pct[lang],
      bands: live ? null : GOLDEN_SAMPLE.bands[lang],
      month: live ? norm(fmt.month(manifest.latestOfficialMonth)) : GOLDEN_SAMPLE.month[lang],
      chip: live ? tr('ui:status.published', { date: fmt.date(manifest.artifactBuiltAt) }) : GOLDEN_SAMPLE.chip[lang],
      fmtCheck: { pct: norm(fmt.pct(0.09228810252452968)), lo: norm(fmt.pct(0.02)), hi: norm(fmt.pct(0.26)), month: norm(fmt.month('2026-08')), chip: tr('ui:status.sample') },
    };
  }
  return out;
}

// ── P14: fragment shape (static) ────────────────────────────────────────────────────────────
function checkFragment(html) {
  check('P14', 'starts with <title>CAA Tracker</title> then a <style> block', html.startsWith('<title>CAA Tracker</title>\n<style>'));
  const shell = html.slice(0, html.indexOf('<script>'));
  check('P14', 'no doctype/html/head/body', !/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(shell));
  check('P14', 'exactly one inline <script> and no <script src>', (html.match(/<script\b/gi) ?? []).length === 1 && !/<script[^>]*\bsrc=/i.test(html));
  check('P14', 'the prelude is the first statement of the script (WEB-1)', /<script>\(function\(\)\{try\{\s*try\{window\.__CAA_DATA_BASE__=/.test(html));
  check('P14', 'root element present', /<div id="root"><\/div>\n<script>/.test(html));
  check('P14', 'size < 15 MB', Buffer.byteLength(html) < 15 * 1024 * 1024, `${Buffer.byteLength(html)} B`);
}

// ── server ──────────────────────────────────────────────────────────────────────────────────
function startServer(fragmentHtml, dataDir) {
  const base = `/x/${randomBytes(4).toString('hex')}/z/`;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
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
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, base, port: server.address().port })));
}

// ── page instrumentation (runs before the fragment, in every document) ─────────────────────
function instrument({ throwStorage, throwHistory, locale, fixedNow }) {
  // Fixed clock: time still flows, but "now" starts at fixedNow (07 §9 P6).
  const RealDate = Date;
  const offset = RealDate.parse(fixedNow) - RealDate.now();
  function FakeDate(...args) {
    if (!new.target) return new RealDate(RealDate.now() + offset).toString();
    return args.length ? new RealDate(...args) : new RealDate(RealDate.now() + offset);
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = () => RealDate.now() + offset;
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  window.Date = FakeDate;

  // Device locale (expo-localization reads navigator.languages on web).
  const langs = [locale, locale.split('-')[0]];
  Object.defineProperty(Navigator.prototype, 'language', { configurable: true, get: () => langs[0] });
  Object.defineProperty(Navigator.prototype, 'languages', { configurable: true, get: () => langs });

  window.__prove = { csp: [], dialogs: [], pathAtParse: null };
  // The inline script has run (prelude + bundle) but React has not rendered yet: this proves the
  // prelude guard replaced the path, not the +not-found redirect (07 §9 P2; WEB-1).
  document.addEventListener('DOMContentLoaded', () => {
    try {
      window.__prove.pathAtParse = window.location.pathname;
    } catch {
      window.__prove.pathAtParse = null;
    }
  });
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

  // "Live" = rendered in the focused screen: inactive tab/stack screens stay mounted under an
  // aria-hidden="true" ancestor (react-navigation on web), so they never count.
  const isLive = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (e.getAttribute('aria-hidden') === 'true') return false;
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
    }
    return true;
  };
  window.__norm = (s) => String(s ?? '').replace(/[   ]/g, ' ').replace(/\s+/g, ' ').trim();
  window.__live = (sel) => Array.from(document.querySelectorAll(sel)).find(isLive) ?? null;
  window.__text = (sel) => {
    const e = window.__live(sel);
    return e ? window.__norm(e.textContent) : null;
  };
}

const tid = (id) => `[data-testid="${id}"]`;

async function waitLive(page, sel, timeout = STEP_MS) {
  try {
    await page.waitForFunction((s) => !!window.__live(s), { timeout, polling: 100 }, sel);
    return true;
  } catch {
    return false;
  }
}

async function waitGone(page, sel, timeout = STEP_MS) {
  try {
    await page.waitForFunction((s) => !window.__live(s), { timeout, polling: 100 }, sel);
    return true;
  } catch {
    return false;
  }
}

async function clickLive(page, sel, timeout = STEP_MS) {
  if (!(await waitLive(page, sel, timeout))) return false;
  const h = await page.evaluateHandle((s) => window.__live(s), sel);
  const el = h.asElement();
  if (!el) return false;
  await el.click();
  await h.dispose();
  return true;
}

const textOf = (page, sel) => page.evaluate((s) => window.__text(s), sel);
const liveTestIdStartingWith = (page, prefix) =>
  page.evaluate((p) => window.__live(`[data-testid^="${p}"]`)?.getAttribute('data-testid') ?? null, prefix);
const tabLabels = (page) => page.evaluate((keys) => keys.map((k) => window.__norm(document.querySelector(`[data-testid="tab-${k}"]`)?.textContent ?? '')), TAB_KEYS);
const tabSelected = (page, key) => page.evaluate((k) => document.querySelector(`[data-testid="tab-${k}"]`)?.getAttribute('aria-selected') === 'true', key);
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

async function waitTabLabels(page, want, timeout = STEP_MS) {
  try {
    await page.waitForFunction((w, keys) => keys.every((k, i) => window.__norm(document.querySelector(`[data-testid="tab-${k}"]`)?.textContent ?? '') === w[i]), { timeout, polling: 100 }, want, TAB_KEYS);
    return true;
  } catch {
    return false;
  }
}

// ── one scenario ────────────────────────────────────────────────────────────────────────────
async function scenario(browser, env, spec) {
  const { variant, srv, exp, theme, outDir } = env;
  const tag = `${variant}/${spec.name}`;
  const mine = [];
  const c = (id, name, ok, detail) => {
    const r = check(id, `${tag}: ${name}`, ok, detail);
    mine.push(r);
    return r.ok;
  };
  const shot = (label) => page.screenshot({ path: path.join(outDir, `${variant}-${spec.name}-${label}.png`) }).catch(() => {});
  const L0 = spec.locale.startsWith('es') ? 'es' : 'en';
  const L1 = L0 === 'es' ? 'en' : 'es';

  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const log = { console: [], requests: [], pageErrors: [], prove: { csp: [], dialogs: [] } };
  page.on('console', (m) => {
    if (m.type() === 'error') log.console.push({ text: m.text(), url: m.location()?.url ?? '' });
  });
  page.on('pageerror', (e) => log.pageErrors.push(String(e)));
  page.on('request', (r) => log.requests.push(r.url()));
  await page.setViewport(spec.viewport);
  await page.emulateTimezone('UTC');
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.evaluateOnNewDocument(instrument, { throwStorage: !!spec.throwStorage, throwHistory: !!spec.throwHistory, locale: spec.locale, fixedNow: FIXED_NOW });
  const url = `http://127.0.0.1:${srv.port}${srv.base}index.html`;
  const collect = async () => {
    const p = await page.evaluate(() => window.__prove).catch(() => null);
    if (p) {
      log.prove.csp.push(...p.csp);
      log.prove.dialogs.push(...p.dialogs);
    }
  };
  const boot = async () => {
    const t0 = Date.now();
    const ok = (await waitLive(page, tid('app-header'), BOOT_MS)) && (await waitLive(page, tid('lang-toggle'), BOOT_MS)) && (await waitLive(page, tid('data-status'), BOOT_MS));
    return { ok, ms: Date.now() - t0 };
  };

  try {
    await page.goto(url, { waitUntil: 'load' });
    // ── P1 boot ──
    const b = await boot();
    if (!c('P1', `boots: header, LangToggle and status chip visible within 10 s (${spec.viewport.width}px)`, b.ok, `${b.ms} ms`)) {
      await shot('boot-fail');
      return mine;
    }

    // ── P2 guard + captured data base ──
    const pathname = await page.evaluate(() => window.location.pathname);
    if (!spec.throwHistory) {
      c('P2', 'pathname guard → "/"', pathname === '/', pathname);
      const atParse = await page.evaluate(() => window.__prove.pathAtParse);
      c('P2', 'the prelude guard replaced the unknown path before the app rendered', atParse === '/', String(atParse));
    }
    const base = await page.evaluate(() => window.__CAA_DATA_BASE__);
    const wantBase = `http://127.0.0.1:${srv.port}${srv.base}data/`;
    c('P2', 'captured data base = <page dir>/data/', base === wantBase, base);
    for (let i = 0; i < 50 && !log.requests.some((u) => u.endsWith('/data/manifest.json')); i++) await sleep(100);
    const manifestReq = log.requests.find((u) => u.endsWith('/data/manifest.json'));
    c('P2', 'manifest requested from /x/<random>/z/data/manifest.json', manifestReq === `${wantBase}manifest.json`, manifestReq ?? 'none');

    // ── P6 default language from the device locale ──
    const labels0 = await tabLabels(page);
    c('P6', `default language follows the device locale (${spec.locale} → ${L0})`, sameList(labels0, exp[L0].tabs), labels0.join(', '));

    // ── P8 data status on Home ──
    const chipOk = async (where, lang) => {
      const chip = norm(await textOf(page, tid('data-status')));
      const ok = chip.includes(exp[lang].chip) && chip.includes(exp[lang].month);
      return c('P8', `${where}: status chip shows "${exp[lang].chip}" and the as-of month "${exp[lang].month}"`, ok, chip);
    };
    await chipOk('home', L0);

    // ── P5 tabs, deep screens, back actions (P7 inside the case tab) ──
    const layoutCheck = async (where) => {
      const m = await page.evaluate(() => {
        const header = window.__live('[data-testid="app-header"]');
        const col = header?.parentElement;
        const r = col?.getBoundingClientRect();
        const pr = col?.parentElement?.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        // Content clipped by overflow-x:hidden never shows up in scrollWidth, so also look for
        // rendered elements of the focused screen that stick out of the viewport (elements inside
        // a horizontal scroller or clipping box below the column are allowed to).
        const out = [];
        if (col) {
          const walk = (el) => {
            for (const ch of el.children) {
              const cr = ch.getBoundingClientRect();
              if (cr.width > 0 && cr.height > 0 && (cr.right > vw + 0.5 || cr.left < -0.5)) out.push(`${ch.tagName}${ch.getAttribute('data-testid') ? `#${ch.getAttribute('data-testid')}` : ''} ${Math.round(cr.left)}..${Math.round(cr.right)}`);
              const ox = getComputedStyle(ch).overflowX;
              if (ox === 'visible') walk(ch);
            }
          };
          walk(col);
        }
        return { scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, vw, left: r?.left ?? -1, right: r?.right ?? -1, width: r?.width ?? -1, pLeft: pr?.left ?? -1, pRight: pr?.right ?? -1, outside: out.slice(0, 5) };
      });
      const fits = m.scrollWidth <= spec.viewport.width && m.bodyScrollWidth <= spec.viewport.width && m.outside.length === 0;
      if (spec.viewport.width <= 390) return c('P12', `${where}: no horizontal scroll or clipped content at ${spec.viewport.width}px`, fits && m.right <= spec.viewport.width + 0.5, m);
      const centred = Math.abs(m.left - m.pLeft - (m.pRight - m.right)) <= 2 && Math.abs(m.left - (m.vw - m.right)) <= 24;
      return c('P12', `${where}: content column centred and ≤ ${COLUMN_MAX}px at ${spec.viewport.width}px`, m.width > 0 && m.width <= COLUMN_MAX && centred && fits, m);
    };
    const noBoundary = async () => !(await page.evaluate(() => !!window.__live('[data-testid="route-error-boundary"]')));
    const openTab = async (key, screenSel) => {
      await clickLive(page, tid(`tab-${key}`));
      const ok = (await waitLive(page, screenSel)) && (await tabSelected(page, key)) && (await noBoundary());
      c('P5', `tab "${key}" renders (${screenSel}) with its tab focused and no error boundary`, ok);
      if (ok) {
        await chipOk(`tab ${key}`, L0);
        await layoutCheck(`tab ${key}`);
        if (!spec.throwStorage && !spec.throwHistory) await shot(`tab-${key}`);
      }
      return ok;
    };
    const deep = async (tabKey, openSel, screenSel, backSel, indexSel, label) => {
      const opened = (await clickLive(page, openSel)) && (await waitLive(page, screenSel));
      const focused = opened && (await tabSelected(page, tabKey));
      const clean = opened && (await noBoundary());
      c('P5', `deep screen ${label} renders inside the "${tabKey}" tab (tab focused, no error boundary)`, opened && focused && clean, { opened, focused, clean });
      if (opened) {
        await chipOk(`deep ${label}`, L0);
        if (spec.viewport.width <= 390) await layoutCheck(`deep ${label}`);
      }
      const back = opened && (await clickLive(page, backSel)) && (await waitLive(page, indexSel)) && (await waitGone(page, screenSel, 3000));
      c('P5', `deep screen ${label}: the back action returns to the tab index`, back);
    };

    // case: P7 estimator with "Ver un ejemplo" (T15), then the peers deep screen
    if (await openTab('case', tid('screen-case'))) {
      const asOf = norm(await textOf(page, tid('case-as-of')));
      c('P8', 'case: the as-of line shows the data month and the computation date', asOf.includes(exp[L0].month) && asOf.includes(exp[L0].date), asOf);
      const shown = (await clickLive(page, tid('case-example-button'))) && (await waitLive(page, tid('estimate-headline-pct')));
      if (c('P7', '"Ver un ejemplo" shows the T15 estimate', shown)) {
        const pct = norm(await textOf(page, tid('estimate-headline-pct')));
        c('P7', `headline = ${exp[L0].pct} (${variant === 'live' ? 'fmt.pct(manifest.canary.pWithin12)' : 'golden T15'})`, pct === exp[L0].pct, pct);
        if (exp[L0].bands) {
          const band = norm(await textOf(page, tid('estimate-band-policy')));
          c('P7', `policy band "${exp[L0].bands[0]}"–"${exp[L0].bands[1]}"`, band.includes(exp[L0].bands[0]) && band.includes(exp[L0].bands[1]), band);
        }
        const clock = norm(await textOf(page, tid('estimate-clock-text')));
        c('P7', `clock card shows ${GOLDEN_SAMPLE.clockDays} adjudicable days`, new RegExp(`\\b${GOLDEN_SAMPLE.clockDays}\\b`).test(clock), clock);
        if (!spec.throwStorage) {
          const leaked = await page.evaluate(() => {
            try {
              const out = [];
              for (let i = 0; i < localStorage.length; i++) out.push(localStorage.getItem(localStorage.key(i)) ?? '');
              return out.some((v) => v.includes('2025-03-15'));
            } catch {
              return null;
            }
          });
          c('P7', 'the example is never written to storage', leaked === false, String(leaked));
        }
        if (!spec.throwStorage && !spec.throwHistory) {
          // Bring the estimate (headline and bands) into view for the screenshot, then restore.
          await page.evaluate(() => window.__live('[data-testid="estimate-headline-pct"]')?.scrollIntoView({ block: 'center' }));
          await sleep(150);
          await shot('estimate');
          await page.evaluate(() => window.__live('[data-testid="screen-case"]')?.scrollIntoView({ block: 'start' }));
        }
        await deep('case', tid('case-nav-peers'), tid('screen-case-peers'), tid('case-back'), tid('screen-case'), 'case/peers');
      }
    }
    if (await openTab('offices', tid('screen-offices'))) {
      await deep('offices', tid('office-row-MIA'), tid('screen-office-MIA'), tid('back-link'), tid('screen-offices'), 'offices/[code]=MIA');
    }
    if (await openTab('alerts', tid('screen-alerts'))) {
      const openId = await liveTestIdStartingWith(page, 'alert-open-');
      const id = openId ? openId.slice('alert-open-'.length) : 'none';
      await deep('alerts', tid(`alert-open-${id}`), tid(`screen-alert-${id}`), tid('back-link'), tid('screen-alerts'), `alerts/[id]=${id}`);
    }
    if (await openTab('more', tid('screen-more'))) {
      await deep('more', tid('more-row-method'), tid('screen-more-method'), tid('back-link'), tid('screen-more'), 'more/method');
    }
    await openTab('index', tid('screen-home'));

    // ── P6 language toggle (es ↔ en): tab labels, a date, a percent, a chart label, the disclaimer ──
    const observe = async (lang) => {
      const o = { lang };
      o.tabs = await tabLabels(page);
      o.disclaimer = norm(await textOf(page, tid('disclaimer')));
      o.chart = await page.evaluate(() => {
        const svg = window.__live('[data-testid="monthly-chart-svg"]');
        return svg ? Array.from(svg.querySelectorAll('text')).map((t) => window.__norm(t.textContent)) : null;
      });
      o.chip = norm(await textOf(page, tid('data-status')));
      await clickLive(page, tid('tab-case'));
      await waitLive(page, tid('estimate-headline-pct'));
      o.pct = norm(await textOf(page, tid('estimate-headline-pct')));
      o.asOf = norm(await textOf(page, tid('case-as-of')));
      await clickLive(page, tid('tab-index'));
      await waitLive(page, tid('screen-home'));
      const e = exp[lang];
      c('P6', `[${lang}] tab labels ${e.tabs.join('/')}`, sameList(o.tabs, e.tabs), o.tabs.join(', '));
      c('P6', `[${lang}] date "${e.date}" (fixed clock ${FIXED_DATE})`, o.asOf.includes(e.date), o.asOf);
      c('P6', `[${lang}] percent "${e.pct}"`, o.pct === e.pct, o.pct);
      c('P6', `[${lang}] chart axis label "${e.month}"`, Array.isArray(o.chart) && o.chart.includes(e.month), (o.chart ?? []).join(' | '));
      c('P6', `[${lang}] disclaimer in ${lang}`, o.disclaimer === e.disclaimer, o.disclaimer.slice(0, 120));
      c('P6', `[${lang}] status chip in ${lang}`, o.chip.includes(e.chip) && o.chip.includes(e.month), o.chip);
      return o;
    };
    await observe(L0);
    if (!spec.throwStorage && !spec.throwHistory) await shot(`lang-${L0}`);
    await clickLive(page, tid('lang-toggle'));
    const switched = await waitTabLabels(page, exp[L1].tabs);
    c('P6', `header LangToggle switches the whole app ${L0} → ${L1} at runtime`, switched);
    await observe(L1);
    if (!spec.throwStorage && !spec.throwHistory) await shot(`lang-${L1}`);
    let current = L1;

    if (spec.settingsLang) {
      // Owner requirement 1: the language control is also in Settings.
      const opened = (await clickLive(page, tid('tab-more'))) && (await clickLive(page, tid('more-row-settings'))) && (await waitLive(page, tid('screen-more-settings')));
      const toL0 = opened && (await clickLive(page, tid(`settings-lang-${L0}`))) && (await waitTabLabels(page, exp[L0].tabs));
      const toL1 = toL0 && (await clickLive(page, tid(`settings-lang-${L1}`))) && (await waitTabLabels(page, exp[L1].tabs));
      c('P6', `Settings language control switches ${L1} → ${L0} → ${L1}`, toL1, { opened, toL0, toL1 });
      await clickLive(page, tid('back-link'));
      await clickLive(page, tid('tab-index'));
      await waitLive(page, tid('screen-home'));
      current = L1;
    }

    // ── P6 reload: persists, or falls back to the default when localStorage throws ──
    await collect();
    await page.goto(url, { waitUntil: 'load' });
    const rb = await boot();
    const labelsR = await tabLabels(page);
    if (spec.throwStorage) c('P6', `reload with localStorage throwing → default language ${L0}`, rb.ok && sameList(labelsR, exp[L0].tabs), labelsR.join(', '));
    else c('P6', `reload → the chosen language ${current} persists`, rb.ok && sameList(labelsR, exp[current].tabs), labelsR.join(', '));
    if (!spec.throwHistory) c('P2', 'after reload the guard again lands on "/"', (await page.evaluate(() => window.location.pathname)) === '/');

    // ── P11 theme ──
    if (spec.theme) {
      const read = () =>
        page.evaluate(() => [
          getComputedStyle(document.body).backgroundColor,
          getComputedStyle(document.getElementById('root')).backgroundColor,
          getComputedStyle(window.__live('[data-testid="screen-home"]') ?? document.body).backgroundColor,
        ]);
      const settle = async (want) => {
        await page.waitForFunction((w) => {
          const s = window.__live('[data-testid="screen-home"]');
          return !!s && getComputedStyle(s).backgroundColor === w && getComputedStyle(document.body).backgroundColor === w;
        }, { timeout: 3000, polling: 50 }, want).catch(() => {});
        return read();
      };
      const setAttr = (v) => page.evaluate((x) => {
        if (x === null) delete document.documentElement.dataset.theme;
        else document.documentElement.dataset.theme = x;
      }, v);
      const cases = [];
      await setAttr('dark');
      cases.push(['data-theme="dark" (system light)', theme.dark, await settle(theme.dark)]);
      await shot('dark');
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
      await setAttr('light');
      cases.push(['data-theme="light" over system dark', theme.light, await settle(theme.light)]);
      await setAttr(null);
      cases.push(['no attribute, prefers-color-scheme: dark', theme.dark, await settle(theme.dark)]);
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
      cases.push(['no attribute, prefers-color-scheme: light', theme.light, await settle(theme.light)]);
      for (const [label, want, got] of cases) c('P11', `${label}: body, #root and the app screen use ${want}`, got.every((x) => x === want), got);
    }

    // ── P3 / P4 / P13 over the whole scenario (both documents) ──
    await collect();
    const pageOrigin = `http://127.0.0.1:${srv.port}`;
    // Full (non-shell) Chrome probes /favicon.ico on its own; the page never asks for it (P14: the
    // fragment has no icon link), so that one browser request is not counted against the page.
    const favicon = `${pageOrigin}/favicon.ico`;
    const foreign = log.requests.filter((u) => !(u === url || u === favicon || (u.startsWith(`${pageOrigin}${srv.base}data/`) && u.endsWith('.json')) || u.startsWith('data:')));
    c('P3', 'the only requests are the page and ./data/*.json', foreign.length === 0, foreign.join(', '));
    c('P3', 'zero CSP violations', log.prove.csp.length === 0, log.prove.csp.join('; '));
    const errors = log.console.filter((m) => m.url !== favicon && !(variant === 'sample' && /\b404\b/.test(m.text) && /\/data\/manifest\.json$/.test(m.url)));
    c('P4', `zero console errors and page errors${variant === 'sample' ? ' (only the expected manifest.json 404 allowed)' : ''}`, errors.length === 0 && log.pageErrors.length === 0, [...errors, ...log.pageErrors]);
    c('P13', 'no alert/confirm/prompt/print/window.open calls', log.prove.dialogs.length === 0, log.prove.dialogs.join(','));
    await shot('final');
  } catch (e) {
    c('P1', 'scenario ran to completion', false, String(e?.stack ?? e));
    await shot('error');
  } finally {
    env.requests[spec.name] = [...new Set(log.requests.filter((u) => !u.startsWith('data:')))];
    await ctx.close().catch(() => {});
  }
  return mine;
}

const SCENARIOS = [
  { name: 'phone', viewport: { width: 390, height: 844 }, locale: 'es-US', theme: true, settingsLang: true },
  // Same 390×844 flow from an English device locale: the docs/screenshots en set (every tab, the
  // estimate, the toggle en → es) comes from here; it repeats P1–P8, P12 and P13 in en.
  { name: 'phone-en', viewport: { width: 390, height: 844 }, locale: 'en-US' },
  { name: 'desktop', viewport: { width: 1280, height: 800 }, locale: 'en-US', theme: true },
  { name: 'storage-throws', viewport: { width: 390, height: 844 }, locale: 'es-US', throwStorage: true },
  { name: 'history-throws', viewport: { width: 390, height: 844 }, locale: 'en-US', throwHistory: true },
];

async function runVariant(browser, a, variant, fragmentHtml, i18n, theme) {
  const dir = path.resolve(a.dir);
  const dataDir = variant === 'live' ? path.join(dir, 'data') : null;
  let manifest = null;
  if (variant === 'live') {
    if (!fs.existsSync(path.join(dataDir, 'manifest.json'))) {
      console.warn(`prove: WARNING live variant skipped — ${dataDir}/manifest.json does not exist (sample-only fragment)`);
      results.push({ id: 'live', name: 'live variant skipped (no data/)', ok: true, skipped: true });
      return null;
    }
    manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'manifest.json'), 'utf8'));
    check('P8', 'live: the shipped manifest carries artifactBuiltAt, latestOfficialMonth and the T15 canary',
      typeof manifest.artifactBuiltAt === 'string' && /^\d{4}-\d{2}$/.test(manifest.latestOfficialMonth ?? '') && manifest.canary?.caseId === 'T15' && typeof manifest.canary?.pWithin12 === 'number',
      { artifactBuiltAt: manifest.artifactBuiltAt, latestOfficialMonth: manifest.latestOfficialMonth, canary: manifest.canary });
  }
  const exp = expectations(i18n, variant, manifest);
  if (variant === 'sample') {
    for (const lang of ['es', 'en']) {
      const f = exp[lang].fmtCheck;
      check('P7', `sample: golden literals equal createFmt('${lang}') output`,
        f.pct === GOLDEN_SAMPLE.pct[lang] && f.lo === GOLDEN_SAMPLE.bands[lang][0] && f.hi === GOLDEN_SAMPLE.bands[lang][1] && f.month === GOLDEN_SAMPLE.month[lang] && f.chip.includes(GOLDEN_SAMPLE.chip[lang]), f);
    }
  }
  const srv = await startServer(fragmentHtml, dataDir);
  const env = { variant, srv, exp, theme, outDir: path.resolve(a.out), requests: {} };
  try {
    for (const spec of SCENARIOS) {
      const t0 = Date.now();
      const mine = await scenario(browser, env, spec);
      const need = (ids) => mine.filter((r) => ids.includes(r.id));
      if (spec.throwStorage) {
        const sub = need(['P1', 'P5', 'P6', 'P7']);
        check('P9', `${variant}: with the localStorage getter throwing, P1, P5, P6 and P7 still pass`, sub.length > 0 && sub.every((r) => r.ok), `${sub.filter((r) => r.ok).length}/${sub.length}`);
      }
      if (spec.throwHistory) {
        const sub = need(['P1', 'P5']);
        check('P10', `${variant}: with pushState/replaceState throwing, P1 and P5 still pass`, sub.length > 0 && sub.every((r) => r.ok), `${sub.filter((r) => r.ok).length}/${sub.length}`);
      }
      console.log(`prove: ${variant}/${spec.name} done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    }
  } finally {
    srv.server.close();
  }
  return { expectations: exp, requests: env.requests };
}

/** System browsers tried only if @sparticuz/chromium cannot start on this machine. */
function systemChromes() {
  const out = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const d of fs.readdirSync(pw)) if (d.startsWith('chromium')) out.push(path.join(pw, d, 'chrome-linux', 'chrome'));
  } catch {
    /* none */
  }
  return out.filter((p) => fs.existsSync(p));
}

async function launch(a) {
  const plain = (executablePath) => puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  if (a.chrome) return { browser: await plain(a.chrome), via: `--chrome ${a.chrome}` };
  try {
    const executablePath = await chromium.executablePath();
    // Drop the Lambda-oriented flags that would weaken the test or crash multi-context runs:
    // --single-process (Target closed on a second browser context), --disable-web-security and
    // --allow-running-insecure-content (the host page runs with normal web security).
    const drop = new Set(['--single-process', '--disable-web-security', '--allow-running-insecure-content']);
    const args = [...chromium.args.filter((x) => !drop.has(x)), '--no-sandbox'];
    return { browser: await puppeteer.launch({ executablePath, headless: true, args }), via: '@sparticuz/chromium (ADR WEB-2)' };
  } catch (e) {
    const fallback = systemChromes()[0];
    if (!fallback) throw e;
    console.warn(`prove: WARNING @sparticuz/chromium did not start (${String(e).slice(0, 200)}); using ${fallback}`);
    return { browser: await plain(fallback), via: `fallback ${fallback}` };
  }
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const dir = path.resolve(a.dir);
  const outDir = path.resolve(a.out);
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) if (/\.(png|json)$/.test(f)) fs.rmSync(path.join(outDir, f));
  const fragmentHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  checkFragment(fragmentHtml);
  const i18n = loadI18n();
  const theme = themeRgb(path.resolve(a.app));

  const { browser, via } = await launch(a);
  const version = `${await browser.version()} via ${via}`;
  console.log(`prove: browser ${version}`);
  const meta = {};
  try {
    const variants = a.variant === 'both' ? ['sample', 'live'] : [a.variant];
    for (const v of variants) meta[v] = await runVariant(browser, a, v, fragmentHtml, i18n, theme);
  } finally {
    await browser.close();
  }

  // Coverage: every assertion id must have run (a silently skipped check is a failure).
  const ran = new Set(results.map((r) => r.id));
  const missing = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14'].filter((id) => !ran.has(id));
  check('ALL', 'every assertion P1–P14 ran', missing.length === 0, missing.join(','));

  const failed = results.filter((r) => !r.ok);
  const byId = {};
  for (const r of results) {
    byId[r.id] ??= { passed: 0, failed: 0 };
    byId[r.id][r.ok ? 'passed' : 'failed']++;
  }
  const report = {
    at: new Date().toISOString(),
    browser: version,
    variant: a.variant,
    fixedNow: FIXED_NOW,
    fragmentBytes: Buffer.byteLength(fragmentHtml),
    passed: results.length - failed.length,
    failed: failed.length,
    byId,
    meta,
    results,
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`prove: ${report.passed} passed, ${report.failed} failed → ${path.join(outDir, 'report.json')}`);
  if (failed.length) {
    console.log('prove: failures:');
    for (const f of failed) console.log(`  ${f.id} ${f.name}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
