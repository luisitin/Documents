/**
 * Review round 1 regression: discreet mode hides the saved case's nickname, dates and entry
 * channel on the "Mi caso" screens until "Mostrar" (more:settings.discreet.help; 05 §1 item 5).
 * Runs on the frozen bundled SAMPLE snapshot (labelled sample data), today = 2026-10-20.
 */
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { CaseTimeline } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { DataProvider } from '@/data/DataProvider';
import type { FetchLike } from '@/data/fetchers';
import { setAppLang } from '@/i18n';
import { clearAllData, saveCase } from '@/storage/cases';
import { updateSettings } from '@/storage/settings';
import { CaseFormScreen, CaseHomeScreen, EadScreen, IneligibleScreen, PeersScreen, RemediesScreen, selectCaseSubject } from '@/features/case';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => false) };
jest.mock('expo-router', () => ({ ...jest.requireActual('expo-router'), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));

const T0 = Date.parse('2026-10-20T12:00:00Z');
const offline: FetchLike = async () => {
  throw new TypeError('Network request failed');
};
const FILED = 'lleva 19 meses presentado'; // clock card of referenceCase() (filed 2025-03-15)

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
function textOf(node: unknown = screen.toJSON()): string {
  const out: string[] = [];
  const walk = (n: unknown) => {
    if (n === null || n === undefined) return;
    if (typeof n === 'string') return void out.push(n);
    if (Array.isArray(n)) return void n.forEach(walk);
    const o = n as { children?: unknown };
    if (o.children) walk(o.children);
  };
  walk(node);
  return out.join(' ');
}
const saved = (): CaseTimeline => ({ ...referenceCase(), localId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', nickname: 'family' });

beforeEach(async () => {
  await act(async () => {
    await clearAllData();
    selectCaseSubject(null);
    setAppLang('es');
    updateSettings({ onboardingDone: true, discreet: false });
  });
});

describe('discreet mode on "Mi caso"', () => {
  it('hides the estimate, nickname and dates until "Mostrar"; turning it off and on hides them again', async () => {
    await act(async () => {
      saveCase(saved());
      saveCase({ ...saved(), localId: 'dddddddd-dddd-4ddd-8ddd-ddddddddddde', nickname: 'case2' });
      updateSettings({ discreet: true });
    });
    await mount(<CaseHomeScreen />);
    expect(screen.getByTestId('case-discreet')).toBeTruthy();
    expect(screen.queryByTestId('case-switcher')).toBeNull();
    expect(textOf()).not.toContain('Caso de un familiar');
    expect(textOf()).not.toContain(FILED);
    expect(textOf()).toContain('Datos de USCIS hasta'); // the as-of line stays
    await act(async () => {
      await fireEvent.press(screen.getByTestId('case-discreet-reveal'));
    });
    expect(screen.queryByTestId('case-discreet')).toBeNull();
    expect(screen.getByTestId('case-switcher')).toBeTruthy();
    expect(textOf()).toContain(FILED);
    await act(async () => {
      updateSettings({ discreet: false });
      updateSettings({ discreet: true });
    });
    expect(screen.getByTestId('case-discreet')).toBeTruthy();
    expect(textOf()).not.toContain(FILED);
  });

  it('also guards the EAD, remedies, peers, ineligible and edit screens; English copy', async () => {
    await act(async () => {
      saveCase(saved());
      updateSettings({ discreet: true });
    });
    for (const ui of [<EadScreen key="e" />, <RemediesScreen key="r" />, <PeersScreen key="p" />, <IneligibleScreen key="i" />, <CaseFormScreen key="f" />]) {
      await mount(ui);
      expect(screen.getByTestId('case-discreet')).toBeTruthy();
      expect(textOf()).not.toContain(FILED);
      await screen.unmount();
    }
    await act(async () => setAppLang('en'));
    await mount(<CaseHomeScreen />);
    expect(screen.getByText('Show')).toBeTruthy();
    expect(screen.getByText('Discreet mode')).toBeTruthy();
  });

  it('never hides the example case, nor anything with discreet mode off', async () => {
    await act(async () => {
      saveCase(saved());
      updateSettings({ discreet: true });
      selectCaseSubject('example');
    });
    await mount(<CaseHomeScreen />);
    expect(screen.queryByTestId('case-discreet')).toBeNull();
    await screen.unmount();
    await act(async () => {
      selectCaseSubject(null);
      updateSettings({ discreet: false });
    });
    await mount(<CaseHomeScreen />);
    expect(screen.queryByTestId('case-discreet')).toBeNull();
    expect(textOf()).toContain(FILED);
  });
});
