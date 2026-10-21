/**
 * Without the AsyncStorage native module (no Jest mock, a broken dev build), importing the KV must
 * not crash: the app runs from memory only (01-architecture.md §4 "KV throws → memory only").
 * Screen tests of other WPs rely on this (they need no AsyncStorage mock).
 */
import { kv } from '@/storage/kv';
import { getSettings, updateSettings } from '@/storage/settings';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }] }));

it('imports and works from memory', async () => {
  await kv.ready;
  kv.set('caa:v1:refresh', 'x');
  expect(kv.get('caa:v1:refresh')).toBe('x');
  expect(getSettings().lang).toBe('en');
  updateSettings({ discreet: true });
  expect(getSettings().discreet).toBe(true);
});
