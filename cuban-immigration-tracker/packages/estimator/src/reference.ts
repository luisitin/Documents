/**
 * The reference case = EXACTLY the T15 fixture (04-estimation-model.md §9.2; 00-product-spec.md
 * S3): CHNV, I-485 receipt 2025-03-15 (day), biometrics 2025-07 (month granularity → day 15),
 * EAD (c)(9) 2025-09 (month → 2025-09-15), concurrent I-765, `state` and `officeCode` undefined
 * (national path), no other milestones. The app's "Ver un ejemplo" loads this fixture read-only
 * and never writes it to storage (07 WP6, WP8b). It is synthetic: no name, no receipt number
 * (05 §1; 07 §10 rule 5). The biometrics month is pinned because March 2025 CHNV filers'
 * biometrics clustered Jun–Aug 2025 (research README §2.4) and an EAD implies biometrics [I].
 */
import type { CaseTimeline } from '@caa/data-schemas';

export const REFERENCE_CASE_ID = 'T15' as const;
/** The date the golden values are computed for (04 §9.1). */
export const REFERENCE_TODAY = '2026-10-20';

/** A fresh copy of the T15 fixture (callers may mutate it). */
export function referenceCase(): CaseTimeline {
  return {
    schemaVersion: 1,
    localId: '00000000-0000-4000-8000-000000000015',
    nickname: 'Caso de ejemplo',
    role: 'principal',
    entryChannel: 'CHNV',
    i485ReceiptDate: '2025-03-15',
    i485ReceiptDateGranularity: 'day',
    concurrentI765: true,
    concurrentI131: null,
    withAttorney: null,
    basicDocs: { paroleRecord: null, nationalityProof: null, i693: null, photos: null, feeOrWaiver: null },
    milestones: [
      { key: 'biometrics', date: '2025-07-15', dateGranularity: 'month', dateSource: 'memory' },
      { key: 'ead_c9', date: '2025-09-15', dateGranularity: 'month', dateSource: 'memory' },
    ],
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
  };
}
