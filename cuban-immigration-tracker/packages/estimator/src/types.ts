/** Shared estimator types (07 §6.0 contract v1). */
import type { ScenarioId } from '@caa/data-schemas';

/** A pool vintage: label 'legacy>6mo' | 'legacy<6mo' | YearMonth | `f${k}` (04 §3.1, §3.3). */
export interface Vintage { label: string; age: number; n: number }

/** One projected grid path (04 §3.4, EST-4); S[0..H]. */
export interface Path { sid: ScenarioId; betaMult: number; officeMult: number; extraMult: number; prior: number; S: number[] }
