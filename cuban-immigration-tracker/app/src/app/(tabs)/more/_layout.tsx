/**
 * The tab's own Stack (07 §2, B5): detail routes stay inside the tab with a back action, and a deep
 * link to a detail screen gets the tab index underneath (`anchor`), so "back" returns to the index
 * (Prove P5). The header is drawn by each screen (`AppHeader` with the language button and the data
 * chip, 00 §5), so the native header is hidden. One localized error boundary per tab (00 §5.1).
 */
import { Stack } from 'expo-router';

export { RouteErrorBoundary as ErrorBoundary } from '@/platform/RouteErrorBoundary';

export const unstable_settings = { anchor: 'index' };

export default function TabStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
