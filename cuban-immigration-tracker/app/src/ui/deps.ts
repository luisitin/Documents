/**
 * The UI kit's only coupling to the WP6 app platform (07 §6.0 "app platform").
 *
 * Every kit file that needs the language, the data status or the settings imports from here, so
 * the kit has exactly one place that names WP6 module paths (07 §2: `src/i18n/useLang.ts`,
 * `src/data/useData.ts`, `src/storage/settings.ts`). Jest replaces this module with
 * `./__mocks__/deps.tsx` (`jest.mock('@/ui/deps')`), so the kit's tests never depend on WP6
 * internals (07 §5 Wave 3: stubs live only in the consumer's test mocks).
 */
export { useLang } from '@/i18n/useLang';
export { useData } from '@/data/useData';
export { useSettings } from '@/storage/settings';
