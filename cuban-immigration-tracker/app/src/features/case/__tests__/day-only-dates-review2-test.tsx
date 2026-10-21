/**
 * Review round 2 regression: the case-form dates stored only at day precision (I-94 parole date,
 * original I-94 end date, and the milestone meta dates: EAD card expiry, interview date, RFE/NOID
 * due date) must not offer "Solo sé el mes". Tapping it used to turn the real day into 15 while the
 * granularity stayed "day", which moved the 2026-04-24 re-termination warning and EAD reminders.
 */
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DataProvider } from '@/data/DataProvider';
import type { FetchLike } from '@/data/fetchers';
import { setAppLang } from '@/i18n';
import { clearAllData } from '@/storage/cases';
import { updateSettings } from '@/storage/settings';
import { CaseFormScreen, selectCaseSubject } from '@/features/case';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({ ...jest.requireActual('expo-router'), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));

const T0 = Date.parse('2026-10-20T12:00:00Z');
const offline: FetchLike = async () => {
  throw new TypeError('Network request failed');
};

async function mount(ui: ReactNode) {
  await render(
    <DataProvider fetchImpl={offline} now={() => T0} bases={['https://x.test/']} enforceInterval>
      {ui}
    </DataProvider>,
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}
const pick = async (id: string, value: string) => {
  await fireEvent.press(screen.getByTestId(id));
  await fireEvent.press(screen.getByTestId(`${id}-option-${value}`));
};

beforeEach(async () => {
  await act(async () => {
    await clearAllData();
    selectCaseSubject(null);
    setAppLang('es');
    updateSettings({ onboardingDone: true });
  });
});

it('day-only dates have no "Solo sé el mes" toggle; the receipt and milestone dates keep it', async () => {
  await mount(<CaseFormScreen />);
  await pick('form-channel', 'CHNV');
  await fireEvent.press(screen.getByTestId('form-next'));

  expect(screen.getByTestId('form-step-2')).toBeTruthy();
  expect(screen.getByTestId('form-receipt-only-month')).toBeTruthy();
  expect(screen.queryByTestId('form-parole-date-only-month')).toBeNull();
  expect(screen.queryByTestId('form-parole-end-only-month')).toBeNull();
  await fireEvent.press(screen.getByTestId('form-receipt-only-month'));
  await pick('form-receipt-month', '03');
  await pick('form-receipt-year', '2025');
  await fireEvent.press(screen.getByTestId('form-next'));

  expect(screen.getByTestId('form-step-3')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('form-next'));

  expect(screen.getByTestId('form-step-4')).toBeTruthy();
  for (const k of ['ead_c9', 'interview_notice', 'rfe'] as const) {
    await fireEvent.press(screen.getByTestId(`checklist-${k}-yes`));
    expect(screen.getByTestId(`milestone-${k}-date-only-month`)).toBeTruthy();
    expect(screen.getByTestId(`milestone-${k}-meta`)).toBeTruthy();
    expect(screen.queryByTestId(`milestone-${k}-meta-only-month`)).toBeNull();
  }
});
