#!/usr/bin/env node
/**
 * check-no-personal-files (WP11; 05-privacy-security-legal.md §2 and §1; 07 §10 rule 5).
 *
 * Fails when the repository would carry personal documents or personal identifiers:
 *
 *  1. FILE TYPES. Any `*.pdf`, Word/office document or image outside the two allowed folders
 *     `cuban-immigration-tracker/app/assets/` (app icons, WP7) and `cuban-immigration-tracker/data/raw/`
 *     (the archived official source files, 03 §5).
 *  2. RECEIPT NUMBERS. A full USCIS receipt number (three letters + ten digits, e.g. `IOE` + 10 digits)
 *     in any text file under `cuban-immigration-tracker/`. The app never stores one (02 §2.8); only
 *     the documented synthetic values in RECEIPT_ALLOWLIST may appear in tests and docs.
 *
 * The four personal PDFs that were already public at the git root before this project
 * (05 §2: `CITI Certification.pdf`, `Licensee Lookup Summary.pdf`, `SIE.pdf`,
 * `.github/workflows/MembershipVerificationLetter.pdf`) are reported as WARNINGS, not failures:
 * moving or purging them is the owner's decision (recorded in docs/planning/adr-log.md), and this
 * script never deletes or moves anything.
 *
 * Usage (run from anywhere inside the git repo; it only reads git's file lists):
 *   node scripts/check-no-personal-files.mjs                 # tracked + untracked (not ignored) files
 *   node scripts/check-no-personal-files.mjs --base <ref>    # only files added/copied/renamed since <ref>
 *   node scripts/check-no-personal-files.mjs --json          # machine-readable result
 * Exit code: 0 = clean (warnings allowed), 1 = violations, 2 = usage or git error.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT = 'cuban-immigration-tracker/';

/** Folders where binary documents and images are expected (05 §2). */
export const ALLOWED_DIRS = Object.freeze([`${PROJECT}app/assets/`, `${PROJECT}data/raw/`]);

/** Document and image extensions that must not be committed elsewhere. */
export const BLOCKED_EXTENSIONS = Object.freeze([
  'pdf', 'doc', 'docx', 'odt', 'rtf', 'pages',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tif', 'tiff', 'svg',
]);

/** Pre-existing owner files (05 §2). Warned about, never failed on, never touched. */
export const KNOWN_OWNER_FILES = Object.freeze([
  'CITI Certification.pdf',
  'Licensee Lookup Summary.pdf',
  'SIE.pdf',
  '.github/workflows/MembershipVerificationLetter.pdf',
]);

/** Full receipt number: a three-letter service-centre prefix and ten digits (02 §2.8). */
export const RECEIPT_RE = /\b[A-Z]{3}\d{10}\b/g;

/**
 * Documented synthetic receipts: the all-zeros test receipt (07 §10 rule 5) and the USCIS
 * developer-sandbox test receipt quoted in docs/research/13-live-data-endpoints-and-probe-plan.md.
 */
export const RECEIPT_ALLOWLIST = Object.freeze(['IOE0000000000', 'EAC9999103402']);

/** Only well-known service-centre prefixes count, so ordinary identifiers do not false-positive. */
export const RECEIPT_PREFIXES = Object.freeze(['IOE', 'MSC', 'EAC', 'WAC', 'LIN', 'SRC', 'NBC', 'YSC', 'TSC', 'VSC', 'NSC', 'CSC']);

const TEXT_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'mjs', 'cjs', 'mts', 'json', 'md', 'yml', 'yaml', 'py', 'txt', 'csv', 'html', 'css', 'sql', 'xml', 'snap',
]);

const extOf = (p) => {
  const base = p.slice(p.lastIndexOf('/') + 1);
  const i = base.lastIndexOf('.');
  return i <= 0 ? '' : base.slice(i + 1).toLowerCase();
};

/**
 * Classifies repo-relative paths (pure; used by the CLI and the unit test).
 * @param {readonly string[]} paths
 * @returns {{ violations: {path: string, reason: string}[], warnings: {path: string, reason: string}[] }}
 */
export function classifyPaths(paths) {
  const violations = [];
  const warnings = [];
  for (const p of paths) {
    const ext = extOf(p);
    if (!BLOCKED_EXTENSIONS.includes(ext)) continue;
    if (ALLOWED_DIRS.some((d) => p.startsWith(d))) continue;
    if (KNOWN_OWNER_FILES.includes(p)) {
      warnings.push({ path: p, reason: 'pre-existing personal file (05 §2): owner decision pending, see docs/planning/adr-log.md' });
      continue;
    }
    violations.push({ path: p, reason: `.${ext} outside ${ALLOWED_DIRS.join(' and ')}` });
  }
  return { violations, warnings };
}

/**
 * Finds full receipt numbers in a text (pure).
 * @param {string} text
 * @returns {string[]} the offending values (deduplicated)
 */
export function findReceipts(text) {
  const out = new Set();
  for (const m of text.matchAll(RECEIPT_RE)) {
    const v = m[0];
    if (!RECEIPT_PREFIXES.includes(v.slice(0, 3))) continue;
    if (RECEIPT_ALLOWLIST.includes(v)) continue;
    out.add(v);
  }
  return [...out];
}

/** Masks a receipt so the log never repeats it in full (05 §1). */
export const maskReceipt = (v) => `${v.slice(0, 3)}${'•'.repeat(7)}${v.slice(-3)}`;

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function listFiles(root, base) {
  const split = (s) => s.split('\0').filter(Boolean);
  if (base) return split(git(['diff', '--name-only', '--diff-filter=ACR', '-z', `${base}...HEAD`], root));
  const tracked = split(git(['ls-files', '-z'], root));
  const untracked = split(git(['ls-files', '-z', '--others', '--exclude-standard'], root));
  return [...new Set([...tracked, ...untracked])];
}

function main(argv) {
  let base = null;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') base = argv[++i] ?? null;
    else if (a === '--json') json = true;
    else if (a === '--help' || a === '-h') {
      console.log('usage: node scripts/check-no-personal-files.mjs [--base <ref>] [--json]');
      return 0;
    } else {
      console.error(`check-no-personal-files: unknown argument ${a}`);
      return 2;
    }
  }
  if (argv.includes('--base') && !base) {
    console.error('check-no-personal-files: --base needs a git ref');
    return 2;
  }

  let root;
  let files;
  try {
    const here = fileURLToPath(new URL('.', import.meta.url));
    root = git(['rev-parse', '--show-toplevel'], here).trim();
    files = listFiles(root, base);
  } catch (e) {
    console.error(`check-no-personal-files: git failed: ${e instanceof Error ? e.message : String(e)}`);
    return 2;
  }

  const { violations, warnings } = classifyPaths(files);

  for (const p of files) {
    if (!p.startsWith(PROJECT) || !TEXT_EXTENSIONS.has(extOf(p))) continue;
    if (p.includes('/node_modules/')) continue;
    const abs = join(root, p);
    let text;
    try {
      if (statSync(abs).size > 8 * 1024 * 1024) continue;
      text = readFileSync(abs, 'utf8');
    } catch {
      continue; // deleted in the working tree, or unreadable: nothing to scan
    }
    for (const r of findReceipts(text)) violations.push({ path: p, reason: `full receipt number ${maskReceipt(r)} (use IOE0000000000)` });
  }

  const result = { mode: base ? `added since ${base}` : 'all files', scanned: files.length, violations, warnings };
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const w of warnings) console.warn(`warn  ${w.path}: ${w.reason}`);
    for (const v of violations) console.error(`error ${v.path}: ${v.reason}`);
    console.log(
      `check-no-personal-files: ${violations.length === 0 ? 'OK' : 'FAILED'} — ${result.mode}, ${files.length} file(s) scanned; ` +
        `${violations.length} violation(s), ${warnings.length} warning(s)`,
    );
  }
  return violations.length === 0 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
