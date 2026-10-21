/**
 * `useData()` (07 §6.0) — the current snapshot, its status and "as of" dates, the data guards
 * (02 §4: T20a, T20b, pipeline_late, artifact_old, qa_degraded, sample_data) and the manual
 * "Actualizar". Every screen shows `asOf` and `status` (owner rule: every screen shows an "as of"
 * date and whether data is live or sample).
 *
 * Additive fields (07 §10 rule 3): `asOf.lastCheckedAt`, `asOf.fetchedAt`, `notice`, `today`,
 * `snapshot`.
 */
import { useContext } from 'react';
import type {
  AlertsFile, ContentFile, EstimateOk, EstimatorParams, ISODate, ISODateTime, Manifest, NationalFile, OfficesFile, PolicyFile,
  QuarterlyFile, YearMonth,
} from '@caa/data-schemas';
import { DataContext } from './DataProvider';
import type { DataSnapshot } from './snapshot';

export { useEstimate } from './useEstimate';
export { dataBaseUrl, dataBaseUrls } from './baseUrl';

/** 07 §6.0 `DataStatus`. */
export type DataStatus = 'live' | 'cached' | 'published' | 'sample';

/** Why the data on screen was not replaced (00 §5.1 banners). */
export type DataNotice =
  | { kind: 'update_failed'; at: ISODateTime | null; reason?: string }
  | { kind: 'app_too_old' };

export interface DataContextValue {
  status: DataStatus;
  guards: EstimateOk['guards'];
  manifest: Manifest;
  national: NationalFile;
  quarterly: QuarterlyFile;
  offices: OfficesFile;
  policy: PolicyFile;
  alerts: AlertsFile;
  content: ContentFile;
  params: EstimatorParams;
  asOf: {
    latestOfficialMonth: YearMonth;
    dataChangedAt: ISODateTime;
    artifactBuiltAt?: ISODateTime;
    lastCheckedAt: ISODateTime;
    /** When this device last fetched or confirmed the snapshot (null = bundled sample). */
    fetchedAt: ISODateTime | null;
  };
  refreshing: boolean;
  refresh(): Promise<void>;
  notice: DataNotice | null;
  /** The device's local date used for guards and estimates. */
  today: ISODate;
  snapshot: DataSnapshot;
}

/** 07 §6.0 `useData()`; must be used under `<DataProvider>` (the root layout provides it). */
export function useData(): DataContextValue {
  const v = useContext(DataContext);
  if (!v) throw new Error('useData() must be used inside <DataProvider> (app/src/app/_layout.tsx)');
  return v;
}
