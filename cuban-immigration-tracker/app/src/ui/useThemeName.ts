/**
 * Native `useThemeName()` (07 §6.0; WP7 "Native uses useColorScheme plus the setting").
 * The web build resolves `useThemeName.web.ts` instead (Metro platform extension).
 */
import { useColorScheme } from 'react-native';
import { useSettings } from './deps';
import type { ThemeName } from './theme';
import { resolveNativeThemeName } from './themeName';

export function useThemeName(): ThemeName {
  const scheme = useColorScheme();
  const { settings } = useSettings();
  return resolveNativeThemeName(settings.theme, scheme);
}
