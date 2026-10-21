/**
 * WP11: scripts/check-no-personal-files.mjs (05 §2). Pure rules first, then one read-only run of
 * the CLI over this repository (git ls-files only; nothing is created, moved or deleted).
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  KNOWN_OWNER_FILES, classifyPaths, findReceipts, maskReceipt,
} from '../../scripts/check-no-personal-files.mjs';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const script = fileURLToPath(new URL('../../scripts/check-no-personal-files.mjs', import.meta.url));

describe('classifyPaths', () => {
  it('allows images under app/assets and source files under data/raw', () => {
    const r = classifyPaths([
      'cuban-immigration-tracker/app/assets/icon.png',
      'cuban-immigration-tracker/data/raw/uscis.x/2026-08/report.pdf',
      'cuban-immigration-tracker/README.md',
    ]);
    expect(r).toEqual({ violations: [], warnings: [] });
  });

  it('fails a PDF, a Word file or a photo anywhere else (case-insensitive extension)', () => {
    const r = classifyPaths([
      'cuban-immigration-tracker/docs/research/passport.PDF',
      'cuban-immigration-tracker/app/src/notice.docx',
      'notes/photo.HEIC',
      'cuban-immigration-tracker/app/assets-old/icon.png',
    ]);
    expect(r.violations.map((v) => v.path)).toEqual([
      'cuban-immigration-tracker/docs/research/passport.PDF',
      'cuban-immigration-tracker/app/src/notice.docx',
      'notes/photo.HEIC',
      'cuban-immigration-tracker/app/assets-old/icon.png',
    ]);
  });

  it('only warns about the four pre-existing owner PDFs (05 §2), and does not fail on them', () => {
    const r = classifyPaths([...KNOWN_OWNER_FILES]);
    expect(r.violations).toEqual([]);
    expect(r.warnings.map((w) => w.path)).toEqual([...KNOWN_OWNER_FILES]);
  });
});

describe('findReceipts', () => {
  it('flags a full receipt number with a known prefix, masked in output', () => {
    const fake = `IOE${'1234567890'}`;
    expect(findReceipts(`case ${fake} filed`)).toEqual([fake]);
    expect(maskReceipt(fake)).toBe('IOE•••••••890');
  });

  it('allows the documented synthetic receipts and ignores other identifiers', () => {
    expect(findReceipts('IOE0000000000 and EAC9999103402')).toEqual([]);
    expect(findReceipts('ABC1234567890 sha 1234567890abc IOE12345')).toEqual([]);
  });
});

describe('CLI on this repository', () => {
  it('passes (warnings only for the pre-existing owner files)', () => {
    const out = execFileSync(process.execPath, [script, '--json'], { cwd: projectRoot, encoding: 'utf8' });
    const r = JSON.parse(out) as { violations: unknown[]; warnings: { path: string }[] };
    expect(r.violations).toEqual([]);
    for (const w of r.warnings) expect(KNOWN_OWNER_FILES).toContain(w.path);
  });
});
