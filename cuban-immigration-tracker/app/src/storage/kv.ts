/**
 * `@/storage/kv` (02-data-model.md §6 `Kv`).
 *
 * Metro picks `kv.native.ts` on iOS/Android and `kv.web.ts` on web. This base file exists so that
 * `tsc --noEmit` resolves `@/storage/kv` without `moduleSuffixes` (07 §2 platform note); it carries
 * the shared types and the native implementation. Shared code imports `@/storage/kv`, never a
 * platform file.
 */
export * from './kv.native';
