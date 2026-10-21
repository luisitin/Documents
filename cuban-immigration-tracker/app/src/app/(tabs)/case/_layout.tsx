/**
 * The "Mi caso" tab Stack (07 §2: `(tabs)/case/_layout.tsx` = Stack, WP8b). Detail routes
 * (edit, peers, ead, remedies, ineligible, share) stay inside the tab with a back action to the
 * index; `anchor: 'index'` puts the index under a deep link (Prove P5). One localized error boundary
 * per tab (00 §5.1).
 */
import { Stack } from 'expo-router';

export { RouteErrorBoundary as ErrorBoundary } from '@/platform/RouteErrorBoundary';

export const unstable_settings = { anchor: 'index' };

export default function CaseLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
