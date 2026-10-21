/**
 * Review round 1 regressions for S10 Settings (frozen bundled SAMPLE snapshot):
 * - preset nickname tokens ('mine', …) are shown translated in the cases list and the delete
 *   sheet ("Mi caso" / "My case"), never as the raw token;
 * - toggling discreet mode re-plans the scheduled reminders so their text hides the dates (00 F20).
 */
import { act, fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import type { CaseTimeline } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { notifications } from '@/notifications';
import { kv } from '@/storage/kv';
import { reloadCases, saveCase } from '@/storage/cases';
import { reloadSettings, updateSettings } from '@/storage/settings';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must be synchronous
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const mine = (): CaseTimeline => ({ ...referenceCase(), localId: '0b5c3f0e-1d2a-4c3b-9e8f-7a6b5c4d3e2a', nickname: 'mine' });

beforeEach(async () => {
  jest.spyOn(Date, 'now').mockReturnValue(T0);
  globalThis.fetch = offlineFetch() as unknown as typeof fetch;
  await act(async () => {
    kv.clear('caa:');
    reloadSettings();
    reloadCases();
    updateSettings({ lang: 'es', theme: 'light', onboardingDone: true, discreet: false });
  });
});
afterEach(() => jest.restoreAllMocks());

describe('Settings cases list', () => {
  it('translates the preset nickname token in the list and the delete sheet (es and en)', async () => {
    await act(async () => {
      expect(saveCase(mine()).ok).toBe(true);
    });
    await renderRouter(screenRoutes(), { initialUrl: '/more/settings' });
    const row = within(screen.getByTestId('settings-case-0'));
    expect(row.getByText('Mi caso')).toBeTruthy();
    expect(row.queryByText('mine')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('settings-case-delete-0'));
    });
    expect(screen.getByText('¿Borrar «Mi caso»?')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByText('Cancelar'));
      updateSettings({ lang: 'en' });
    });
    expect(within(screen.getByTestId('settings-case-0')).getByText('My case')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain('"mine"');
  });
});

describe('Settings discreet mode', () => {
  it('reschedules the reminders when discreet mode is turned on or off', async () => {
    const spy = jest.spyOn(notifications, 'rescheduleAll').mockResolvedValue(undefined);
    await renderRouter(screenRoutes(), { initialUrl: '/more/settings' });
    await act(async () => {
      await fireEvent(screen.getByTestId('settings-discreet-switch'), 'valueChange', true);
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith('es');
    await act(async () => {
      await fireEvent(screen.getByTestId('settings-discreet-switch'), 'valueChange', false);
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
