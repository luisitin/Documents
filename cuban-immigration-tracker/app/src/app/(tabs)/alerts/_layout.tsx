// WP0 hello-world placeholder: each non-home tab is a folder with its own Stack (07 §2, B5).
import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
