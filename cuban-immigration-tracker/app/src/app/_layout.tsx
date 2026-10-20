// WP0 hello-world root layout (WP6 replaces it; 07 §2): a Stack with exactly `(tabs)`,
// `welcome` (modal) and `+not-found`.
import { Stack } from 'expo-router';
import { HelloProvider } from '@/hello';

export default function RootLayout() {
  return (
    <HelloProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </HelloProvider>
  );
}
