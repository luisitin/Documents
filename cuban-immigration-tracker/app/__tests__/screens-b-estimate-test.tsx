/**
 * 07 WP8b acceptance — S3 "Su estimado" on the reference case (= the T15 fixture, "Ver un ejemplo")
 * rendered from the FROZEN bundled sample (app/src/data/sample, a labelled SAMPLE snapshot; 02 §2),
 * today = 2026-10-20. Expected literals come from 04-estimation-model.md §9.2 / the golden file:
 * headline "9 %" (es, NBSP) / "9%" (en); bands 2–26 % and 4–20 %; ladder 1/4/9/22/35 %; calendar
 * <1 % / ~11 % / ~24 %; clock 306 adjudicable and 278 hold days; median "más de 4 años"; no
 * "casos como el suyo"; approval range only with every basic document; T23 twin = T15 headline;
 * T23b twin = 7 %; I-220A → S9 with no numbers; "Ver un ejemplo" never writes to the KV.
 * A *live-like* variant serves a SYNTHETIC test snapshot (the sample plus one invented month,
 * clearly not real data) and asserts against `fmt.pct(manifest.canary.pWithin12)` and
 * `fmt.month(manifest.latestOfficialMonth)` instead of literals (07 WP8a/WP8b, Prove §9).
 */
// Node built-ins through require: the app tsconfig has no @types/node (tests run in Node anyway).
/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require('fs') as { readFileSync(p: string, enc?: string): string };
const { join } = require('path') as { join(...p: string[]): string };
/* eslint-enable @typescript-eslint/no-require-imports */
declare const __dirname: string;
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { CaseTimeline, Manifest } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { GOLDEN } from '@caa/estimator/golden';
import { createFmt } from '@caa/i18n-core';
import { DataProvider } from '@/data/DataProvider';
import type { FetchLike } from '@/data/fetchers';
import { sha256 } from '@/data/sha256';
import { computeEstimate } from '@/data/useEstimate';
import { parseSnapshot } from '@/data/snapshot';
import { setAppLang } from '@/i18n';
import { clearAllData, saveCase } from '@/storage/cases';
import { kv } from '@/storage/kv';
import { updateSettings } from '@/storage/settings';
import { CaseHomeScreen, selectCaseSubject } from '@/features/case';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({ ...jest.requireActual('expo-router'), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));

const NBSP = ' ';
const T0 = Date.parse('2026-10-20T12:00:00Z');
const BASE = 'https://data.example.test/data/';
const offline: FetchLike = async () => {
  throw new TypeError('Network request failed');
};
const T15 = GOLDEN.cases.T15 as unknown as { pWithin: { m12: number } };

async function mount(ui: ReactNode, fetchImpl: FetchLike = offline) {
  await render(
    <DataProvider fetchImpl={fetchImpl} now={() => T0} bases={[BASE]} enforceInterval>
      {ui}
    </DataProvider>,
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

/** Every string rendered under a node (or the whole screen). */
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

beforeEach(async () => {
  await act(async () => {
    await clearAllData();
    selectCaseSubject(null);
    setAppLang('es');
    updateSettings({ onboardingDone: true, theme: 'system' });
  });
});

describe('S3 on the frozen sample: the reference case (T15, "Ver un ejemplo")', () => {
  it('the tab offers set-up and the example; "Ver un ejemplo" shows T15 and never writes to the KV', async () => {
    await mount(<CaseHomeScreen />);
    expect(screen.getByTestId('case-intro')).toBeTruthy();
    expect(screen.queryByTestId('estimate-headline')).toBeNull();
    await fireEvent.press(screen.getByTestId('case-example-button'));
    expect(screen.getByTestId('case-example-banner')).toBeTruthy();
    expect(txt('estimate-headline-pct')).toBe(`9${NBSP}%`);
    expect(kv.get('caa:v1:cases')).toBeNull();
  });

  it('es: headline 9 %, both bands, ladder, calendar row, clock 306/278, median "más de 4 años"', async () => {
    selectCaseSubject('example');
    await mount(<CaseHomeScreen />);
    const fmt = createFmt('es');
    expect(txt('estimate-headline-pct')).toBe(fmt.pct(T15.pWithin.m12));
    expect(txt('estimate-headline-pct')).toBe(`9${NBSP}%`);
    expect(txt('estimate-headline-word')).toContain('poco probable');
    expect(txt('estimate-band-policy')).toContain(`entre 2${NBSP}% y 26${NBSP}%`);
    expect(txt('estimate-band-structural')).toContain(`entre 4${NBSP}% y 20${NBSP}%`);
    const ladder = [3, 6, 12, 24, 36].map((m) => txt(`ladder-row-${m}`));
    ['1', '4', '9', '22', '35'].forEach((p, i) => expect(ladder[i]).toContain(`${p}${NBSP}%`));
    expect(txt('estimate-calendar-2026-12-31')).toContain(`<1${NBSP}%`);
    expect(txt('estimate-calendar-2027-12-31')).toContain(`~11${NBSP}%`);
    expect(txt('estimate-calendar-2028-12-31')).toContain(`~24${NBSP}%`);
    const clock = txt('estimate-clock-text');
    expect(clock).toContain('306 días');
    expect(clock).toContain('278 días');
    expect(clock).toContain('19 meses');
    expect(clock).toContain('256 días'); // altOps, rendered from clock
    expect(txt('estimate-median')).toContain('más de 4 años');
    expect(txt('estimate-median')).toContain('22 meses'); // S2 q50 (T15b)
    // The headline holds no calendar date (04 §8 rule 1).
    expect(textOf(jsonOf('estimate-headline'))).not.toMatch(/\b(19|20)\d{2}\b|\b(ene|feb|mar|abr|may|jun|jul|ago|sept|oct|nov|dic)\b/);
    const all = textOf();
    expect(all).not.toMatch(/casos como el suyo/i);
    expect(all).toContain('el promedio del grupo nacional de I-485 cubanos');
    expect(all).not.toMatch(/inconstitucional/i);
    expect(screen.getByTestId('case-disclaimer')).toBeTruthy();
    expect(txt('case-as-of')).toContain('ago 2026');
    expect(txt('case-as-of')).toContain('20 oct 2026');
  });

  it('en: the same numbers switch format at runtime (9%, bands, ladder) and no "cases like yours"', async () => {
    selectCaseSubject('example');
    await mount(<CaseHomeScreen />);
    await act(async () => setAppLang('en'));
    expect(txt('estimate-headline-pct')).toBe('9%');
    expect(txt('estimate-headline-word')).toContain('unlikely');
    expect(txt('estimate-band-policy')).toContain('between 2% and 26%');
    expect(txt('estimate-band-structural')).toContain('between 4% and 20%');
    expect(txt('estimate-calendar-2026-12-31')).toContain('<1%');
    expect(txt('estimate-calendar-2026-12-31')).toContain('Dec 31, 2026');
    expect(txt('estimate-clock-text')).toContain('306 days');
    expect(txt('estimate-median')).toContain('more than 4 years');
    expect(textOf()).not.toMatch(/cases like yours/i);
    expect(txt('case-as-of')).toContain('Oct 20, 2026');
  });

  it('approval card: population shares and baselines always; the range only when every basic document is checked', async () => {
    selectCaseSubject('example');
    await mount(<CaseHomeScreen />);
    expect(txt('approval-shares')).toContain(`49${NBSP}% (308 de 626)`);
    expect(txt('approval-shares')).toContain(`47${NBSP}% (386 de 820)`);
    const base = txt('approval-baselines');
    expect(base).toContain(`91.7${NBSP}%`);
    expect(base).toContain(`52.6${NBSP}%`);
    expect(base).toContain(`23.7${NBSP}%`);
    expect(base).toContain(`83.2${NBSP}%`);
    expect(screen.queryByTestId('approval-range')).toBeNull();
    expect(screen.getByTestId('approval-no-range')).toBeTruthy();
    await screen.unmount();

    const docs = { paroleRecord: true, nationalityProof: true, i693: true, photos: true, feeOrWaiver: true };
    const partial = twin('44444444-4444-4444-8444-444444444441', { basicDocs: { ...docs, photos: null } });
    expect(saveCase(partial).ok).toBe(true);
    selectCaseSubject(partial.localId);
    await mount(<CaseHomeScreen />);
    expect(screen.queryByTestId('approval-range')).toBeNull();
    await screen.unmount();

    const clean = twin('44444444-4444-4444-8444-444444444442', { basicDocs: docs });
    expect(saveCase(clean).ok).toBe(true);
    selectCaseSubject(clean.localId);
    await mount(<CaseHomeScreen />);
    expect(txt('approval-range')).toContain(`70${NBSP}%–90${NBSP}%`);
    // Never in the headline (U8).
    expect(textOf(jsonOf('estimate-headline'))).not.toContain('70');
  });

  it('T23 twin (no EAD, biometrics kept) has the T15 headline; T23b (no EAD, no biometrics) shows 7 %', async () => {
    const t23 = twin('55555555-5555-4555-8555-555555555523', { milestones: referenceCase().milestones.filter((m) => m.key !== 'ead_c9') });
    expect(saveCase(t23).ok).toBe(true);
    selectCaseSubject(t23.localId);
    await mount(<CaseHomeScreen />);
    expect(txt('estimate-headline-pct')).toBe(`9${NBSP}%`);
    expect(txt('estimate-band-structural')).toContain('estructura del grupo)');
    await screen.unmount();

    const t23b = twin('55555555-5555-4555-8555-55555555523b', { milestones: [] });
    expect(saveCase(t23b).ok).toBe(true);
    selectCaseSubject(t23b.localId);
    await mount(<CaseHomeScreen />);
    expect(txt('estimate-headline-pct')).toBe(`7${NBSP}%`);
  });

  it('I-220A → S9 content with no numbers anywhere in the case body', async () => {
    const i220a = twin('66666666-6666-4666-8666-666666666666', { entryChannel: 'I220A' });
    expect(saveCase(i220a).ok).toBe(true);
    selectCaseSubject(i220a.localId);
    await mount(<CaseHomeScreen />);
    expect(screen.getByTestId('ineligible-i220a')).toBeTruthy();
    expect(screen.queryByTestId('estimate-headline')).toBeNull();
    expect(screen.queryByTestId('ladder')).toBeNull();
    expect(screen.queryByTestId('fan-chart')).toBeNull();
    expect(textOf()).not.toMatch(/%/);
    expect(txt('ineligible-body')).toContain('Cabrera-Fernández');
    expect(screen.getByTestId('ineligible-scam')).toBeTruthy();
  });

  it('special states: RFE pending → red deadline card; decided (denied) → outcome and denial link', async () => {
    const rfe = twin('77777777-7777-4777-8777-777777777771', {
      milestones: [...referenceCase().milestones, { key: 'rfe', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice', meta: { dueDate: '2026-12-24' } }],
    });
    expect(saveCase(rfe).ok).toBe(true);
    selectCaseSubject(rfe.localId);
    await mount(<CaseHomeScreen />);
    expect(txt('estimate-note-deadline')).toContain('24 dic 2026');
    expect(screen.getByTestId('estimate-headline')).toBeTruthy();
    await screen.unmount();

    const denied = twin('77777777-7777-4777-8777-777777777772', {
      milestones: [...referenceCase().milestones, { key: 'decision', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice', meta: { outcome: 'denied' } }],
    });
    expect(saveCase(denied).ok).toBe(true);
    selectCaseSubject(denied.localId);
    await mount(<CaseHomeScreen />);
    expect(txt('estimate-decided')).toContain('negado');
    await fireEvent.press(screen.getByTestId('estimate-denial'));
    expect(mockRouter.push).toHaveBeenCalledWith('/case/remedies');
  });

  it('renders in the dark theme too', async () => {
    updateSettings({ theme: 'dark' });
    selectCaseSubject('example');
    await mount(<CaseHomeScreen />);
    expect(txt('estimate-headline-pct')).toBe(`9${NBSP}%`);
  });
});

describe('S3 live-like variant (SYNTHETIC snapshot: assertions derive from its manifest)', () => {
  const SAMPLE_DIR = join(__dirname, '..', 'src', 'data', 'sample');
  const NAMES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'] as const;
  const read = (n: string) => JSON.parse(readFileSync(join(SAMPLE_DIR, `${n}.json`), 'utf8'));

  /** The sample plus an invented 2026-09 row (test-only; NOT real USCIS data), canary recomputed. */
  function liveLike(): { files: Record<string, string>; manifest: Manifest } {
    const j: Record<string, Record<string, unknown>> = Object.fromEntries(NAMES.map((n) => [n, read(n)]));
    const national = j.national as { rows: Record<string, unknown>[] };
    const last = national.rows[national.rows.length - 1]!;
    national.rows.push({ ...last, ym: '2026-09', received: 1100, approved: 900, denied: 500, pending: 354220, pendingOver6: 344000, source: { ...(last.source as object), period: '2026-09' } });
    (j.params as { dataThrough: string }).dataThrough = '2026-09';
    const files = Object.fromEntries(NAMES.map((n) => [n, JSON.stringify(j[n])]));
    const m = read('manifest') as Manifest & { origin?: string };
    delete m.origin;
    m.latestOfficialMonth = '2026-09';
    m.dataChangedAt = '2026-10-20T06:00:00Z';
    m.lastCheckedAt = '2026-10-20T06:00:00Z';
    m.qa = { ...m.qa, notes: [] };
    for (const n of NAMES) m.files[n] = { ...m.files[n], sha256: sha256(files[n]!), bytes: files[n]!.length };
    const snap = parseSnapshot({ manifest: m, ...Object.fromEntries(NAMES.map((n) => [n, j[n]])) } as Parameters<typeof parseSnapshot>[0]);
    if (!snap.ok) throw new Error(`live-like fixture invalid: ${JSON.stringify(snap.issues)}`);
    const r = computeEstimate(referenceCase(), { status: 'live', snapshot: snap.value }, '2026-10-20').result;
    if (!r || r.kind !== 'estimate') throw new Error('live-like fixture: no estimate');
    m.canary = { ...m.canary, pWithin12: r.pWithin.m12, q50: r.quantiles.q50 };
    return { files, manifest: m };
  }

  it('headline = fmt.pct(manifest.canary.pWithin12) and the data month = fmt.month(manifest.latestOfficialMonth)', async () => {
    const { files, manifest } = liveLike();
    expect(Math.abs(manifest.canary.pWithin12 - T15.pWithin.m12)).toBeGreaterThan(1e-4); // a different canary than the golden one
    const fetchImpl: FetchLike = async (url: string) => {
      const name = url.slice(BASE.length).replace(/\.json$/, '');
      const body = name === 'manifest' ? JSON.stringify(manifest) : files[name];
      const hdr = { get: () => null };
      return body === undefined ? { ok: false, status: 404, headers: hdr, text: async () => '' } : { ok: true, status: 200, headers: hdr, text: async () => body };
    };
    selectCaseSubject('example');
    await mount(<CaseHomeScreen />, fetchImpl);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    for (const lang of ['es', 'en'] as const) {
      await act(async () => setAppLang(lang));
      const fmt = createFmt(lang);
      expect(txt('estimate-headline-pct')).toBe(fmt.pct(manifest.canary.pWithin12));
      expect(txt('case-as-of')).toContain(fmt.month(manifest.latestOfficialMonth));
    }
    expect(txt('estimate-clock-text')).toContain('306'); // data-independent
  });
});
