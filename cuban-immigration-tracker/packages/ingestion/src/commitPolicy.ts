/**
 * ARCH-6 commit policy (07-implementation-plan.md §1; 03-data-pipeline.md §6.1 notes):
 *
 * - commit when a data file's CONTENT sha changed → `dataChangedAt = now` (drives "datos nuevos");
 * - otherwise commit only as a 7-day HEARTBEAT → only `lastCheckedAt` changes;
 * - otherwise do not commit (and do not touch the manifest).
 *
 * `lastCheckedAt` is written only in commits, so the app's "pipeline late" banner triggers at 10 days
 * (02 §4 guards). About 52 heartbeats plus 30–60 real changes a year keep the 60-day scheduled-workflow
 * rule satisfied (doc 09 §5.1), instead of 730 commits.
 */
import type { DataFileName, ISODateTime, Manifest } from '@caa/data-schemas';
import { DATA_FILE_NAMES } from '@caa/data-schemas';
import { HEARTBEAT_DAYS } from './constants';

export type CommitReason = 'first_run' | 'content_changed' | 'side_files_changed' | 'heartbeat' | 'no_change';

export interface CommitDecision {
  shouldCommit: boolean;
  reason: CommitReason;
  changedFiles: DataFileName[];
  dataChangedAt: ISODateTime;
  lastCheckedAt: ISODateTime;
}

export interface CommitInput {
  previous: Pick<Manifest, 'files' | 'dataChangedAt' | 'lastCheckedAt'> | null;
  /** sha256 of each v1 data file as it would be written now. */
  shas: Record<DataFileName, string>;
  now: ISODateTime;
  /** Raw archive / candidates / quarantine changed (committed, but `dataChangedAt` stays). */
  sideFilesChanged?: boolean;
  heartbeatDays?: number;
}

/** 07 WP5 `decideCommit`. Pure. */
export function decideCommit(i: CommitInput): CommitDecision {
  const hb = i.heartbeatDays ?? HEARTBEAT_DAYS;
  if (!i.previous) {
    return { shouldCommit: true, reason: 'first_run', changedFiles: [...DATA_FILE_NAMES], dataChangedAt: i.now, lastCheckedAt: i.now };
  }
  const changedFiles = DATA_FILE_NAMES.filter((n) => i.previous!.files[n]?.sha256 !== i.shas[n]);
  if (changedFiles.length) {
    return { shouldCommit: true, reason: 'content_changed', changedFiles, dataChangedAt: i.now, lastCheckedAt: i.now };
  }
  if (i.sideFilesChanged) {
    return { shouldCommit: true, reason: 'side_files_changed', changedFiles, dataChangedAt: i.previous.dataChangedAt, lastCheckedAt: i.now };
  }
  const ageMs = Date.parse(i.now) - Date.parse(i.previous.lastCheckedAt);
  if (!(ageMs < hb * 86_400_000)) {
    return { shouldCommit: true, reason: 'heartbeat', changedFiles, dataChangedAt: i.previous.dataChangedAt, lastCheckedAt: i.now };
  }
  return { shouldCommit: false, reason: 'no_change', changedFiles, dataChangedAt: i.previous.dataChangedAt, lastCheckedAt: i.previous.lastCheckedAt };
}
