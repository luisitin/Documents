/**
 * Optional host refresh (01-architecture.md §3 step 9) — native: always a no-op. Native builds
 * fetch the GitHub raw URLs themselves (`./baseUrl`).
 */
import type { DataSnapshot } from './snapshot';

export async function hostRefresh(): Promise<DataSnapshot | null> {
  return null;
}

export const HOST_REFRESH_ENABLED = false;
