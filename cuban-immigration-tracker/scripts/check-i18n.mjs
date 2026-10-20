#!/usr/bin/env node
// scripts/check-i18n.mjs — locale and copy guard (WP4; 07-implementation-plan.md §6 WP4, §8, ADR I18N-1/I18N-3).
//
// Fails (exit 1) on:
//   - key-set mismatch between es and en, per namespace (and missing / unknown namespace files);
//   - empty or whitespace-only strings, and non-string values (locale files are flat string maps);
//   - interpolation-variable mismatch: the `{name}` sets of es and en must be equal;
//   - any `Localized` ({ es, en }) in data/curated/** with an empty or missing side;
//   - Spanish register: "tú", "tu"/"tu caso", "tus", "puedes" and other tú verb forms (I18N-1: usted);
//   - banned phrases in either language: "casos como el suyo", "cases like yours", "presente ahora",
//     "file now", "será aprobado", "inconstitucional" (07 WP4), plus "debe demandar" and "garantizado"
//     (07 §8) and "unconstitutional" / "will be approved" (05 §5.4–5.5: the holds were vacated under the
//     APA; the app never says a case will be approved).
// Warns (exit 0) on: literal percentages or ISO dates typed into locale strings (07 §8 "Numbers"),
// curated `Localized` values with es === en (02 §8 allows it only for proper names), unused allowlist
// entries.
//
// Usage:
//   node scripts/check-i18n.mjs [--root DIR] [--locales DIR] [--data DIR]... [--allowlist FILE] [--json]
//   node scripts/check-i18n.mjs --list-namespaces
// Defaults: --root = this script's parent directory (the project), --locales = packages/i18n-core/locales,
// --data = data/curated, --allowlist = packages/i18n-core/src/i18n-check-allowlist.json (optional).
// Allowlist format: { "entries": [{ "rule": "register"|"banned", "term": "tú", "file": "<path relative
// to --root>", "key": "<locale key or curated JSON path, or *>", "reason": "<why>" }] }.
// Exit codes: 0 ok, 1 violations, 2 usage or allowlist error.
//
// Pure Node (no dependencies), so CI can run it before any install step.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Must equal NAMESPACES in packages/i18n-core/src/keys.ts (asserted by packages/i18n-core/test). */
export const NAMESPACES = [
  'common', 'ui', 'home', 'case', 'estimate', 'peers', 'ead', 'remedies',
  'offices', 'alerts', 'more', 'method', 'notifications', 'welcome',
];
const LANGS = ['es', 'en'];

/** Same grammar as PLACEHOLDER in packages/i18n-core/src/interpolate.ts. */
const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/** I18N-1 register guard: tú forms that must not appear in Spanish (usted only). */
const REGISTER_TERMS = ['tú', 'tu', 'tus', 'puedes', 'tienes', 'debes', 'quieres', 'necesitas', 'sabes', 'eres', 'estás'];

/** Banned phrases (07 WP4, 07 §8, 05 §5). Matched case-insensitively on whole words, in both languages. */
const BANNED = [
  { term: 'casos como el suyo', re: 'casos como el suyo' },
  { term: 'cases like yours', re: 'cases like yours' },
  { term: 'presente ahora', re: 'presente ahora' },
  { term: 'file now', re: 'file now' },
  { term: 'será aprobado', re: 'será aprobad[oa]s?' },
  { term: 'inconstitucional', re: 'inconstitucional(?:es|mente)?' },
  { term: 'unconstitutional', re: 'unconstitutional(?:ly)?' },
  { term: 'debe demandar', re: 'debe demandar' },
  { term: 'garantizado', re: 'garantizad[oa]s?' },
  { term: 'will be approved', re: 'will be approved' },
];

const L = '[\\p{L}\\p{N}_]';
const wordRe = (src) => new RegExp(`(?<!${L})(?:${src})(?!${L})`, 'iu');
const REGISTER_RES = REGISTER_TERMS.map((term) => ({ term, re: wordRe(term) }));
const BANNED_RES = BANNED.map(({ term, re }) => ({ term, re: wordRe(re) }));
const LITERAL_PCT = /\d\s?%/u;
const LITERAL_DATE = /\b\d{4}-\d{2}-\d{2}\b/u;

function parseArgs(argv) {
  const opts = { root: null, locales: null, data: [], allowlist: null, json: false, listNamespaces: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new UsageError(`${a} needs a value`);
      return v;
    };
    if (a === '--root') opts.root = next();
    else if (a === '--locales') opts.locales = next();
    else if (a === '--data') opts.data.push(next());
    else if (a === '--allowlist') opts.allowlist = next();
    else if (a === '--json') opts.json = true;
    else if (a === '--list-namespaces') opts.listNamespaces = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new UsageError(`unknown argument ${a}`);
  }
  return opts;
}

class UsageError extends Error {}

const posix = (p) => p.split(sep).join('/');
const varsOf = (s) => [...new Set([...s.matchAll(PLACEHOLDER)].map((m) => m[1]))].sort();
const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const normalize = (s) => s.replace(/[  ]/g, ' ');

function listJsonFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith('.json')) out.push(p);
    }
  };
  walk(dir);
  return out;
}

/**
 * Runs every check. Returns { ok, violations, warnings, stats }. Exported for in-process use; the
 * tests run the CLI as a child process.
 */
export function checkI18n({ root, localesDir, dataDirs, allowlistFile }) {
  const violations = [];
  const warnings = [];
  const stats = { localeFiles: 0, strings: 0, curatedFiles: 0, localized: 0 };
  const rel = (p) => posix(relative(root, p));

  // ── allowlist ────────────────────────────────────────────────────────────────────────────────
  let allow = [];
  if (allowlistFile && existsSync(allowlistFile)) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(allowlistFile, 'utf8'));
    } catch (e) {
      throw new UsageError(`allowlist ${rel(allowlistFile)} is not valid JSON: ${e.message}`);
    }
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : null;
    if (!entries) throw new UsageError(`allowlist ${rel(allowlistFile)} must be { "entries": [...] }`);
    allow = entries.map((e, i) => {
      const ok = e && ['register', 'banned'].includes(e.rule) && typeof e.term === 'string' && typeof e.file === 'string'
        && typeof e.key === 'string' && typeof e.reason === 'string' && e.reason.trim() !== '';
      if (!ok) throw new UsageError(`allowlist entry ${i} needs rule (register|banned), term, file, key and a non-empty reason`);
      return { ...e, used: false };
    });
  }
  const allowed = (rule, term, file, key) => {
    const hit = allow.find((e) => e.rule === rule && (e.term === term || e.term === '*') && e.file === file && (e.key === key || e.key === '*'));
    if (hit) hit.used = true;
    return Boolean(hit);
  };

  const add = (rule, file, key, lang, message) => violations.push({ rule, file, key, lang, message });

  /** Wording checks shared by locale strings and curated Localized values. */
  const checkWording = (text, lang, file, key) => {
    const t = normalize(text);
    if (lang === 'es') {
      for (const { term, re } of REGISTER_RES) {
        if (re.test(t) && !allowed('register', term, file, key)) {
          add('register', file, key, lang, `Spanish uses usted (I18N-1): found "${term}"`);
        }
      }
    }
    for (const { term, re } of BANNED_RES) {
      if (re.test(t) && !allowed('banned', term, file, key)) add('banned', file, key, lang, `banned phrase "${term}" (07 §8, 05 §5)`);
    }
  };

  // ── locale files ─────────────────────────────────────────────────────────────────────────────
  const tables = {};
  for (const lang of LANGS) {
    tables[lang] = {};
    const dir = join(localesDir, lang);
    if (!existsSync(dir)) {
      add('missing-file', rel(dir), '', lang, 'locale directory is missing');
      continue;
    }
    for (const name of readdirSync(dir).sort()) {
      if (!name.endsWith('.json')) continue;
      const ns = name.slice(0, -'.json'.length);
      if (!NAMESPACES.includes(ns)) add('unknown-namespace', rel(join(dir, name)), '', lang, `"${ns}" is not one of the 14 namespaces (07 §2)`);
    }
    for (const ns of NAMESPACES) {
      const file = join(dir, `${ns}.json`);
      if (!existsSync(file)) {
        add('missing-file', rel(file), '', lang, `namespace file is missing (create it as {})`);
        continue;
      }
      stats.localeFiles++;
      let json;
      try {
        json = JSON.parse(readFileSync(file, 'utf8'));
      } catch (e) {
        add('invalid-json', rel(file), '', lang, e.message);
        continue;
      }
      if (json === null || typeof json !== 'object' || Array.isArray(json)) {
        add('not-flat', rel(file), '', lang, 'a namespace file must be one flat JSON object of strings');
        continue;
      }
      const table = {};
      const keys = new Set(); // every key, including non-string values (reported once, as not-flat)
      for (const [key, value] of Object.entries(json)) {
        keys.add(key);
        if (typeof value !== 'string') {
          add('not-flat', rel(file), key, lang, `value must be a string, got ${Array.isArray(value) ? 'array' : typeof value}`);
          continue;
        }
        stats.strings++;
        table[key] = value;
        if (value.trim() === '') add('empty', rel(file), key, lang, 'empty string');
        checkWording(value, lang, rel(file), key);
        // common:fmt.* are the formatter's own patterns ("<1 %"), not copy.
        const isFormatPattern = ns === 'common' && key.startsWith('fmt.');
        if (!isFormatPattern && (LITERAL_PCT.test(value) || LITERAL_DATE.test(value))) {
          warnings.push({ rule: 'literal-number', file: rel(file), key, lang, message: 'literal percentage or date; prefer {p} / {date} with fmt (07 §8)' });
        }
      }
      tables[lang][ns] = { file: rel(file), table, keys };
    }
  }
  for (const ns of NAMESPACES) {
    const es = tables.es?.[ns];
    const en = tables.en?.[ns];
    if (!es || !en) continue;
    for (const key of es.keys) {
      if (!en.keys.has(key)) add('key-mismatch', en.file, key, 'en', `key exists in es (${es.file}) but not in en`);
    }
    for (const key of en.keys) {
      if (!es.keys.has(key)) add('key-mismatch', es.file, key, 'es', `key exists in en (${en.file}) but not in es`);
    }
    for (const key of Object.keys(es.table)) {
      if (!(key in en.table)) continue;
      const a = varsOf(es.table[key]);
      const b = varsOf(en.table[key]);
      if (!sameSet(a, b)) add('var-mismatch', es.file, key, null, `placeholders differ: es {${a.join(', ')}} vs en {${b.join(', ')}}`);
    }
  }

  // ── curated data: every Localized ─────────────────────────────────────────────────────────────
  const isLocalizedLike = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
    && ('es' in v || 'en' in v) && Object.keys(v).every((k) => k === 'es' || k === 'en');
  for (const dir of dataDirs) {
    if (!existsSync(dir)) {
      warnings.push({ rule: 'missing-data-dir', file: rel(dir), key: '', lang: null, message: 'data directory not found; skipped' });
      continue;
    }
    for (const file of listJsonFiles(dir)) {
      stats.curatedFiles++;
      const f = rel(file);
      let json;
      try {
        json = JSON.parse(readFileSync(file, 'utf8'));
      } catch (e) {
        add('invalid-json', f, '', null, e.message);
        continue;
      }
      const visit = (v, path) => {
        if (isLocalizedLike(v)) {
          stats.localized++;
          for (const lang of LANGS) {
            const s = v[lang];
            if (typeof s !== 'string' || s.trim() === '') add('curated-empty', f, path, lang, `Localized has an empty or missing "${lang}" side (02 §8)`);
            else checkWording(s, lang, f, path);
          }
          if (typeof v.es === 'string' && typeof v.en === 'string') {
            const a = varsOf(v.es);
            const b = varsOf(v.en);
            if (!sameSet(a, b)) add('var-mismatch', f, path, null, `placeholders differ: es {${a.join(', ')}} vs en {${b.join(', ')}}`);
            if (v.es.trim() !== '' && v.es === v.en) warnings.push({ rule: 'same-text', file: f, key: path, lang: null, message: 'es === en (allowed only for proper names, 02 §8)' });
          }
          return;
        }
        if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${path}[${i}]`));
        else if (v !== null && typeof v === 'object') for (const [k, x] of Object.entries(v)) visit(x, `${path}.${k}`);
      };
      visit(json, '$');
    }
  }

  for (const e of allow) {
    if (!e.used) warnings.push({ rule: 'unused-allowlist', file: e.file, key: e.key, lang: null, message: `allowlist entry for ${e.rule} "${e.term}" matched nothing` });
  }
  return { ok: violations.length === 0, violations, warnings, stats };
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`check-i18n: ${e.message}`);
    process.exitCode = 2;
    return;
  }
  if (opts.help) {
    console.log('usage: node scripts/check-i18n.mjs [--root DIR] [--locales DIR] [--data DIR]... [--allowlist FILE] [--json] [--list-namespaces]');
    return;
  }
  if (opts.listNamespaces) {
    console.log(JSON.stringify(NAMESPACES));
    return;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(opts.root ?? join(here, '..'));
  const localesDir = resolve(root, opts.locales ?? 'packages/i18n-core/locales');
  const dataDirs = (opts.data.length ? opts.data : ['data/curated']).map((d) => resolve(root, d));
  const allowlistFile = resolve(root, opts.allowlist ?? 'packages/i18n-core/src/i18n-check-allowlist.json');

  let result;
  try {
    result = checkI18n({ root, localesDir, dataDirs, allowlistFile });
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    console.error(`check-i18n: ${e.message}`);
    process.exitCode = 2;
    return;
  }

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const where = (v) => `${v.file}${v.key ? `#${v.key}` : ''}${v.lang ? ` (${v.lang})` : ''}`;
    for (const w of result.warnings) console.warn(`warning [${w.rule}] ${where(w)}: ${w.message}`);
    for (const v of result.violations) console.error(`error [${v.rule}] ${where(v)}: ${v.message}`);
    const s = result.stats;
    console.log(
      `check-i18n: ${result.ok ? 'OK' : 'FAILED'} — ${s.localeFiles} locale files, ${s.strings} strings, `
      + `${s.curatedFiles} curated files, ${s.localized} Localized values; `
      + `${result.violations.length} error(s), ${result.warnings.length} warning(s)`,
    );
  }
  process.exitCode = result.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
