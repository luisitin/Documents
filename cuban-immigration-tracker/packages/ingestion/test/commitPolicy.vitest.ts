/**
 * ARCH-6 / 03 §6.1 commit policy: content change → commit + dataChangedAt bumped; no change and a
 * heartbeat younger than 7 days → no commit; no change and a heartbeat of 7 days or more → commit with
 * only lastCheckedAt changed.
 */
import { DATA_FILE_NAMES, type DataFileName } from '@caa/data-schemas';
import { describe, expect, it } from 'vitest';
import { decideCommit } from '../src/commitPolicy';

const shas = (over: Partial<Record<DataFileName, string>> = {}) => Object.fromEntries(DATA_FILE_NAMES.map((n) => [n, over[n] ?? `${n}-sha`])) as Record<DataFileName, string>;
const prev = (lastCheckedAt: string) => ({
  files: Object.fromEntries(DATA_FILE_NAMES.map((n) => [n, { path: `${n}.json`, sha256: `${n}-sha`, bytes: 1 }])) as never,
  dataChangedAt: '2026-10-01T06:17:00Z', lastCheckedAt,
});

describe('decideCommit', () => {
  it('first run → commit, both stamps = now', () => {
    expect(decideCommit({ previous: null, shas: shas(), now: '2026-10-20T06:17:00Z' })).toMatchObject({ shouldCommit: true, reason: 'first_run', dataChangedAt: '2026-10-20T06:17:00Z', lastCheckedAt: '2026-10-20T06:17:00Z' });
  });
  it('content change → commit and dataChangedAt bumped', () => {
    const d = decideCommit({ previous: prev('2026-10-19T18:17:00Z'), shas: shas({ national: 'new' }), now: '2026-10-20T06:17:00Z' });
    expect(d).toEqual({ shouldCommit: true, reason: 'content_changed', changedFiles: ['national'], dataChangedAt: '2026-10-20T06:17:00Z', lastCheckedAt: '2026-10-20T06:17:00Z' });
  });
  it('no change, heartbeat younger than 7 days → no commit, stamps unchanged', () => {
    const d = decideCommit({ previous: prev('2026-10-14T06:18:00Z'), shas: shas(), now: '2026-10-21T06:17:00Z' });
    expect(d).toEqual({ shouldCommit: false, reason: 'no_change', changedFiles: [], dataChangedAt: '2026-10-01T06:17:00Z', lastCheckedAt: '2026-10-14T06:18:00Z' });
  });
  it('no change, heartbeat exactly 7 days or older → commit with ONLY lastCheckedAt changed', () => {
    for (const last of ['2026-10-14T06:17:00Z', '2026-10-01T06:17:00Z']) {
      const d = decideCommit({ previous: prev(last), shas: shas(), now: '2026-10-21T06:17:00Z' });
      expect(d).toEqual({ shouldCommit: true, reason: 'heartbeat', changedFiles: [], dataChangedAt: '2026-10-01T06:17:00Z', lastCheckedAt: '2026-10-21T06:17:00Z' });
    }
  });
  it('side files (raw archive, candidates, quarantine) commit without bumping dataChangedAt', () => {
    expect(decideCommit({ previous: prev('2026-10-19T18:17:00Z'), shas: shas(), now: '2026-10-20T06:17:00Z', sideFilesChanged: true }))
      .toMatchObject({ shouldCommit: true, reason: 'side_files_changed', dataChangedAt: '2026-10-01T06:17:00Z', lastCheckedAt: '2026-10-20T06:17:00Z' });
  });
});
