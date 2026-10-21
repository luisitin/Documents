/**
 * `@/notifications` (07 §6.0 `notifications`). Metro picks `index.native.ts` on iOS/Android and
 * `index.web.ts` (no-ops) on web. This base file lets `tsc --noEmit` resolve the module without
 * `moduleSuffixes` (07 §2 platform note) and carries the native implementation's types.
 */
export * from './index.native';
