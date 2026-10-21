/**
 * 07 WP8b acceptance — S4 peers, S7 remedies, S5 EAD, S9 ineligible, S12 share, on the FROZEN
 * bundled sample (a labelled SAMPLE snapshot) with today = 2026-10-20:
 * - peer reasons are exactly the U2 sets (04 §9.2): T15 → {chnv_r1, ead_before_r3, non_fifo};
 *   no-EAD twin → {chnv_r1, ead_swept_r3, c9_erequest_available, non_fifo}; + office_diff iff office;
 * - remedies: the reference case (office unknown) has the I-485 rung `depends` with "no
 *   disponible" and no gate decision; with officeCode MIA it is `not_yet` with ETA 2028-01
 *   ("ene 2028"); the (c)(9) rung is "no aplica" for the reference case and "disponible" for the T23
 *   twin (07 WP3 pinned values);
 * - EAD: validity 5 years for an EAD issued 2025-09; the pending panel shows the NBC 147-C9 date and
 *   the national I-765 AOS row labelled "todas las nacionalidades", and no EAD estimate;
 * - share: a month-level code without receipt letters or day dates; paste-to-compare runs locally.
 */
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { CaseTimeline } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { DataProvider } from '@/data/DataProvider';
import type { FetchLike } from '@/data/fetchers';
import { setAppLang } from '@/i18n';
import { clearAllData, saveCase } from '@/storage/cases';
import { kv } from '@/storage/kv';
import { updateSettings } from '@/storage/settings';
import { EadScreen, IneligibleScreen, PeersScreen, RemediesScreen, ShareScreen, selectCaseSubject } from '@/features/case';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => false) };
jest.mock('expo-router', () => ({ ...jest.requireActual('expo-router'), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));

const NBSP = ' ';
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
function jsonOf(id: string): unknown {
  const find = (n: unknown): unknown => {
    if (!n || typeof n !== 'object') return null;
    if (Array.isArray(n)) {
      for (const c of n) {
        const r = find(c);
        if (r) return r;
      }
      return null;
    }
    const o = n as { props?: { testID?: string }; children?: unknown };
    if (o.props?.testID === id) return o;
    return find(o.children);
  };
  return find(screen.toJSON());
}
const txt = (id: string) => textOf(jsonOf(id));
const twin = (id: string, patch: Partial<CaseTimeline>): CaseTimeline => ({ ...referenceCase(), localId: id, nickname: 'mine', ...patch });
const noEad = () => referenceCase().milestones.filter((m) => m.key !== 'ead_c9');
const peerIds = () => ['chnv_r1', 'cbp_one_no_r1', 'ead_before_r3', 'ead_swept_r3', 'c9_erequest_available', 'renewal_no_autoext', 'non_fifo', 'office_diff'].filter((id) => jsonOf(`peer-${id}`) !== null);

beforeEach(async () => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  await act(async () => {
    await clearAllData();
    selectCaseSubject(null);
    setAppLang('es');
    updateSettings({ onboardingDone: true, discreet: false });
  });
});

describe('S4 peers: exactly the U2 sets', () => {
  it('T15 → chnv_r1, ead_before_r3, non_fifo; ends with the screenshot caveat; never says which applies', async () => {
    selectCaseSubject('example');
    await mount(<PeersScreen />);
    expect(peerIds()).toEqual(['chnv_r1', 'ead_before_r3', 'non_fifo']);
    expect(txt('peer-chnv_r1')).toContain('Confianza: media');
    expect(txt('peer-ead_before_r3')).toContain('media-alta');
    expect(txt('peers-closing')).toContain('captura de pantalla');
    expect(textOf()).not.toMatch(/casos como el suyo/i);
    await fireEvent.press(screen.getByTestId('case-back'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/case'); // deep link: no history → tab index
  });

  it('no-EAD twin → chnv_r1, ead_swept_r3, c9_erequest_available, non_fifo; office known adds office_diff; CBP One twin', async () => {
    const t23 = twin('88888888-8888-4888-8888-888888888881', { milestones: noEad() });
    saveCase(t23);
    selectCaseSubject(t23.localId);
    await mount(<PeersScreen />);
    expect(peerIds()).toEqual(['chnv_r1', 'ead_swept_r3', 'c9_erequest_available', 'non_fifo']);
    await screen.unmount();

    const mia = twin('88888888-8888-4888-8888-888888888882', { state: 'FL', officeCode: 'MIA' });
    saveCase(mia);
    selectCaseSubject(mia.localId);
    await mount(<PeersScreen />);
    expect(peerIds()).toEqual(['chnv_r1', 'ead_before_r3', 'non_fifo', 'office_diff']);
    await screen.unmount();

    const cbp = twin('88888888-8888-4888-8888-888888888883', { entryChannel: 'CBP_ONE' });
    saveCase(cbp);
    selectCaseSubject(cbp.localId);
    await mount(<PeersScreen />);
    expect(peerIds()).toEqual(['cbp_one_no_r1', 'ead_before_r3', 'non_fifo']);
  });

  it('without a case: the set-up prompt', async () => {
    await mount(<PeersScreen />);
    expect(screen.getByTestId('case-intro')).toBeTruthy();
  });
});

describe('S7 remedies', () => {
  it('reference case: I-485 rung depends with "no disponible" and no gate decision; (c)(9) no aplica', async () => {
    selectCaseSubject('example');
    await mount(<RemediesScreen />);
    expect(txt('remedy-a_i485-state')).toBe('⚠ depende');
    expect(txt('remedy-a_i485')).toContain('no disponible');
    expect(txt('remedy-a_i485')).toContain('Fecha de consulta: no disponible.');
    expect(txt('remedy-a_c9-state')).toBe('— no aplica');
    expect(txt('remedies-pinned')).toContain('Esto no es asesoría legal.');
    // Expedite and mandamus end with the lawyer line (00 §3 principle 7); the fee comes from policy.fees.
    expect(txt('remedy-b')).toContain('Consulte a un abogado o representante acreditado.');
    expect(txt('remedy-e')).toContain('$405');
    expect(txt('remedy-e')).toContain('Consulte a un abogado o representante acreditado.');
    expect(screen.getByTestId('remedies-red-eagle')).toBeTruthy();
    const order = ['a_i485', 'a_c9', 'b', 'd', 'c', 'e', 'f'].map((r) => jsonOf(`remedy-${r}`) !== null);
    expect(order.every(Boolean)).toBe(true);
    expect(textOf()).not.toMatch(/presente ahora|será aprobado|debe demandar/i);
  });

  it('officeCode MIA → not_yet with ETA ene 2028; T23 twin → (c)(9) disponible; en switches at runtime', async () => {
    const mia = twin('99999999-9999-4999-8999-999999999991', { state: 'FL', officeCode: 'MIA' });
    saveCase(mia);
    selectCaseSubject(mia.localId);
    await mount(<RemediesScreen />);
    expect(txt('remedy-a_i485-state')).toBe('✕ aún no (≈ ene 2028)');
    expect(txt('remedy-a_i485-body')).toContain('ene 2028');
    expect(txt('remedy-a_i485-body')).toContain('17 jun 2023'); // MIA 131A-FAM inquiry date (doc 15 §2.2)
    expect(txt('remedy-d')).toContain('FL-26');
    await act(async () => setAppLang('en'));
    expect(txt('remedy-a_i485-state')).toBe('✕ not yet (≈ Jan 2028)');
    await act(async () => setAppLang('es'));
    await screen.unmount();

    const t23 = twin('99999999-9999-4999-8999-999999999992', { milestones: noEad() });
    saveCase(t23);
    selectCaseSubject(t23.localId);
    await mount(<RemediesScreen />);
    expect(txt('remedy-a_c9-state')).toBe('✓ disponible');
    expect(txt('remedy-a_c9-body')).toContain('13 jun 2025');
    await fireEvent.press(screen.getByTestId('remedy-a_c9-toggle'));
    expect(txt('remedy-a_c9-steps')).toContain('e-Request');
  });

  it('denied case → the single denial step with the I-290B deadline', async () => {
    const denied = twin('99999999-9999-4999-8999-999999999993', {
      milestones: [...referenceCase().milestones, { key: 'decision', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice', meta: { outcome: 'denied' } }],
    });
    saveCase(denied);
    selectCaseSubject(denied.localId);
    await mount(<RemediesScreen />);
    expect(txt('remedy-denial')).toContain('I-290B');
    expect(txt('remedy-denial')).toContain('31 oct 2026');
    expect(jsonOf('remedy-a_i485')).toBeNull();
  });
});

describe('S5 EAD', () => {
  it('EAD issued 2025-09 → up to 5 years, estimated expiry, renewal rule; the example is read-only', async () => {
    selectCaseSubject('example');
    await mount(<EadScreen />);
    const v = txt('ead-validity');
    expect(v).toContain('hasta 5 años');
    expect(v).toContain('31 ago 2030'); // month-only issue date → earliest possible expiry (2025-09-01 + 5 y − 1 d)
    expect(txt('ead-renewal')).toContain('30 oct 2025');
    expect(screen.queryByTestId('ead-mark-renewal')).toBeNull();
    expect(screen.queryByTestId('ead-pending')).toBeNull();
    expect(screen.getByTestId('case-disclaimer')).toBeTruthy();
  });

  it('pending EAD (T23 twin): NBC 147-C9 date, e-Request disponible, national row for all nationalities, no estimate', async () => {
    const t23 = twin('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', { milestones: noEad() });
    saveCase(t23);
    selectCaseSubject(t23.localId);
    await mount(<EadScreen />);
    const p = txt('ead-pending');
    expect(p).toContain('13 jun 2025');
    expect(p).toContain('disponible');
    expect(p).toContain('671,362');
    expect(p).toContain('todas las nacionalidades');
    expect(txt('ead-earlier')).toContain('461,884');
    expect(p).not.toMatch(/%/);
  });

  it('marking the renewal saves a milestone on a saved case', async () => {
    const c = twin('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', {});
    saveCase(c);
    selectCaseSubject(c.localId);
    await mount(<EadScreen />);
    await fireEvent.press(screen.getByTestId('ead-mark-renewal'));
    expect(String(kv.get('caa:v1:cases'))).toContain('ead_renewal_filed');
    expect(txt('ead-renewal')).toContain('No tiene extensión automática');
  });
});

describe('S9 and S12', () => {
  it('/case/ineligible shows the I-220A copy and no numbers', async () => {
    const i220a = twin('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', { entryChannel: 'I220A' });
    saveCase(i220a);
    selectCaseSubject(i220a.localId);
    await mount(<IneligibleScreen />);
    expect(screen.getByTestId('ineligible-i220a')).toBeTruthy();
    expect(textOf()).not.toMatch(/%/);
    await fireEvent.press(screen.getByTestId('ineligible-alerts'));
    expect(mockRouter.push).toHaveBeenCalledWith('/alerts');
  });

  it('share code: month level, no receipt letters, share language independent of the UI; compare locally', async () => {
    const c = twin('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', { receiptPrefix: 'IOE', state: 'FL', officeCode: 'MIA' });
    saveCase(c);
    selectCaseSubject(c.localId);
    await mount(<ShareScreen />);
    const code = txt('share-code');
    expect(code).toContain('#AjusteCubano · CHNV · FL');
    expect(code).toContain('Presentado: 2025-03');
    expect(code).toContain(`9${NBSP}%`);
    expect(code).not.toMatch(/IOE|MIA|2025-03-15|\d{10}/);
    await fireEvent.press(screen.getByTestId('share-lang'));
    await fireEvent.press(screen.getByTestId('share-lang-option-en'));
    expect(txt('share-code')).toContain('Filed: 2025-03');
    expect(txt('app-header')).toContain('Compartir'); // UI language unchanged
    await fireEvent.press(screen.getByTestId('share-copy'));
    expect(screen.getByTestId('share-status')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('share-compare-input'), '#AjusteCubano · CBP One\nPresentado: 2025-03 · Huellas: — · EAD: — · Entrevista: — · Decisión: —');
    await fireEvent.press(screen.getByTestId('share-compare-button'));
    expect(screen.getByTestId('share-compare-result')).toBeTruthy();
    expect(jsonOf('compare-theirs-cbp_one_no_r1')).not.toBeNull();
    expect(jsonOf('compare-yours-chnv_r1')).not.toBeNull();
    await fireEvent.changeText(screen.getByTestId('share-compare-input'), 'hola');
    await fireEvent.press(screen.getByTestId('share-compare-button'));
    expect(screen.getByTestId('share-compare-invalid')).toBeTruthy();
  });

  it('discreet mode asks (in-app sheet) before revealing the code', async () => {
    updateSettings({ discreet: true });
    const c = twin('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', {});
    saveCase(c);
    selectCaseSubject(c.localId);
    await mount(<ShareScreen />);
    expect(screen.queryByTestId('share-code')).toBeNull();
    await fireEvent.press(screen.getByTestId('share-reveal'));
    await fireEvent.press(screen.getByText('Mostrar'));
    expect(txt('share-code')).toContain('#AjusteCubano');
  });
});
