/**
 * 07 WP8b acceptance — "Form validation follows 00 S2" (and 02 §8):
 * - the receipt date is required; "Solo sé el mes" records day 15 with month granularity;
 * - no future dates, except the card expiry, the scheduled interview, the due date and the original
 *   I-94 end date;
 * - milestones are not before the receipt, except the parole termination notice; the decision is not
 *   before the interview; the card expiry is after the EAD date;
 * - warnings, not blocks: receipt < parole + 366 days ("un año y un día"); I-94 end date 2026-04-24
 *   (the April 2026 re-termination date, doc 16 §8.1);
 * - the five-step UI blocks Next on errors, saves through `useCases().save` and stores no name and
 *   no receipt digits (owner rule; 05 §1).
 */
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { parseCase, type CaseTimeline } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { DataProvider } from '@/data/DataProvider';
import type { FetchLike } from '@/data/fetchers';
import { setAppLang } from '@/i18n';
import { clearAllData, getCases } from '@/storage/cases';
import { kv } from '@/storage/kv';
import { updateSettings } from '@/storage/settings';
import { CaseFormScreen, caseFromDraft, draftFromCase, emptyDraft, getCaseSubjectSelection, newLocalId, selectCaseSubject, validateDraft, type CaseDraft } from '@/features/case';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({ ...jest.requireActual('expo-router'), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));

const TODAY = '2026-10-20';
const T0 = Date.parse('2026-10-20T12:00:00Z');
const offline: FetchLike = async () => {
  throw new TypeError('Network request failed');
};

function base(): CaseDraft {
  const d = emptyDraft('dddddddd-dddd-4ddd-8ddd-ddddddddddd1');
  d.entryChannel = 'CHNV';
  d.receipt = '2025-03-15';
  return d;
}
const keys = (d: CaseDraft) => Object.keys(validateDraft(d, TODAY).errors).sort();

describe('validateDraft (00 S2, 02 §8)', () => {
  it('requires the entry channel and the receipt date; a complete minimal draft is valid and parses', () => {
    const d = emptyDraft();
    expect(keys(d)).toEqual(['entryChannel', 'receipt']);
    expect(validateDraft(d, TODAY).stepErrors).toMatchObject({ 1: true, 2: true, 3: false });
    expect(keys(base())).toEqual([]);
    const c = caseFromDraft(base(), '2026-10-20T12:00:00Z') as CaseTimeline;
    expect(parseCase(c, { today: TODAY }).ok).toBe(true);
    expect(c.nickname).toBe('mine');
    expect(c).not.toHaveProperty('receiptFullLocal');
  });

  it('no future dates (receipt, parole, milestones) but the exempt meta dates and the I-94 end date may be future', () => {
    const d = base();
    d.receipt = '2026-11-02';
    expect(keys(d)).toEqual(['receipt']);
    d.receipt = '2026-10-15';
    d.receiptGranularity = 'month'; // same month as today → not future at month level
    expect(keys(d)).toEqual([]);
    const e = base();
    e.paroleDate = '2026-12-01';
    expect(keys(e)).toEqual(['paroleDate']);
    const f = base();
    f.paroleEndDateOriginal = '2027-05-01';
    f.milestones.ead_c9 = { happened: true, date: '2025-09-15', granularity: 'month', source: 'notice', metaDate: '2030-08-31', outcome: null };
    f.milestones.interview_notice = { happened: true, date: '2026-10-01', granularity: 'day', source: 'notice', metaDate: '2026-12-15', outcome: null };
    f.milestones.rfe = { happened: true, date: '2026-10-01', granularity: 'day', source: 'notice', metaDate: '2026-12-24', outcome: null };
    expect(keys(f)).toEqual([]);
    const c = caseFromDraft(f, '2026-10-20T12:00:00Z') as CaseTimeline;
    expect(parseCase(c, { today: TODAY }).ok).toBe(true);
    f.milestones.biometrics = { happened: true, date: '2026-11-01', granularity: 'day', source: 'memory', metaDate: null, outcome: null };
    expect(keys(f)).toEqual(['m.biometrics.date']);
  });

  it('milestones not before the receipt, except the parole termination notice; decision not before the interview; expiry after the EAD', () => {
    const d = base();
    d.milestones.biometrics = { happened: true, date: '2025-02-01', granularity: 'day', source: 'notice', metaDate: null, outcome: null };
    expect(keys(d)).toEqual(['m.biometrics.date']);
    const p = base();
    p.receipt = '2025-08-01';
    p.milestones.parole_termination_notice = { happened: true, date: '2025-06-12', granularity: 'day', source: 'notice', metaDate: null, outcome: null };
    expect(keys(p)).toEqual([]);
    expect(parseCase(caseFromDraft(p, '2026-10-20T12:00:00Z'), { today: TODAY }).ok).toBe(true);
    const q = base();
    q.milestones.interview = { happened: true, date: '2026-09-20', granularity: 'day', source: 'notice', metaDate: null, outcome: null };
    q.milestones.decision = { happened: true, date: '2026-09-01', granularity: 'day', source: 'notice', metaDate: null, outcome: 'approved' };
    expect(keys(q)).toEqual(['m.decision.date']);
    const r = base();
    r.milestones.ead_c9 = { happened: true, date: '2025-09-15', granularity: 'day', source: 'notice', metaDate: '2025-09-01', outcome: null };
    expect(keys(r)).toEqual(['m.ead_c9.meta']);
    // "happened, date unknown" is allowed (02 §3 date: null).
    const u = base();
    u.milestones.biometrics = { happened: true, date: null, granularity: 'day', source: 'memory', metaDate: null, outcome: null };
    expect(keys(u)).toEqual([]);
  });

  it('warnings never block: one year and a day; the 2026-04-24 re-termination date', () => {
    const d = base();
    d.paroleDate = '2024-06-01'; // receipt 2025-03-15 < 2025-06-02
    d.paroleEndDateOriginal = '2026-04-24';
    const v = validateDraft(d, TODAY);
    expect(Object.keys(v.errors)).toEqual([]);
    expect(v.warnings.map((w) => w.key)).toEqual(['case:warn.oneYear', 'case:warn.reTermination']);
    d.paroleDate = '2024-03-14';
    expect(validateDraft(d, TODAY).warnings.map((w) => w.key)).toEqual(['case:warn.reTermination']);
  });

  it('draftFromCase ∘ caseFromDraft round-trips the reference case', () => {
    const c = { ...referenceCase(), localId: newLocalId() };
    const back = caseFromDraft(draftFromCase(c), c.updatedAt) as CaseTimeline;
    expect(back.milestones).toEqual(c.milestones);
    expect(back.i485ReceiptDate).toBe(c.i485ReceiptDate);
    expect(back.entryChannel).toBe(c.entryChannel);
    expect(parseCase(back, { today: TODAY }).ok).toBe(true);
    expect(newLocalId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

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

describe('S2 form UI', () => {
  beforeEach(async () => {
    mockRouter.back.mockClear();
    await act(async () => {
      await clearAllData();
      selectCaseSubject(null);
      setAppLang('es');
      updateSettings({ onboardingDone: true });
    });
  });

  it('blocks Next without a channel, then saves a month-only receipt with an office; no name, no receipt digits', async () => {
    await mount(<CaseFormScreen />);
    expect(screen.getByTestId('form-step-1')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('form-next'));
    expect(screen.getByTestId('form-channel-error')).toBeTruthy();
    expect(screen.getByTestId('form-step-1')).toBeTruthy();
    await pick('form-channel', 'CHNV');
    await fireEvent.press(screen.getByTestId('form-next'));

    expect(screen.getByTestId('form-step-2')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('form-next'));
    expect(screen.getByTestId('form-receipt-error')).toBeTruthy(); // receipt required
    await fireEvent.press(screen.getByTestId('form-receipt-only-month'));
    await pick('form-receipt-month', '03');
    await pick('form-receipt-year', '2025');
    await fireEvent.press(screen.getByTestId('form-next'));

    expect(screen.getByTestId('form-step-3')).toBeTruthy();
    await pick('form-state', 'FL');
    await fireEvent.press(screen.getByTestId('checklist-miamiDade-yes'));
    await fireEvent.press(screen.getByTestId('form-office'));
    expect(screen.queryByTestId('form-office-option-TAM')).toBeNull(); // Miami-Dade → HIA / KND / MIA only
    await fireEvent.press(screen.getByTestId('form-office-option-HIA'));
    await pick('form-prefix', 'IOE');
    await fireEvent.press(screen.getByTestId('form-next'));

    expect(screen.getByTestId('form-step-4')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('checklist-concurrentI765-yes'));
    await fireEvent.press(screen.getByTestId('checklist-ead_c9-yes'));
    await fireEvent.press(screen.getByTestId('milestone-ead_c9-date-only-month'));
    await pick('milestone-ead_c9-date-month', '09');
    await pick('milestone-ead_c9-date-year', '2025');
    await fireEvent.press(screen.getByTestId('form-next'));

    expect(screen.getByTestId('form-step-5')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('checklist-photos-yes'));
    await fireEvent.press(screen.getByTestId('form-save'));
    expect(mockRouter.back).toHaveBeenCalled();

    const saved = getCases().cases;
    expect(saved).toHaveLength(1);
    const c = saved[0]!;
    expect(c.entryChannel).toBe('CHNV');
    expect(c.i485ReceiptDate).toBe('2025-03-15');
    expect(c.i485ReceiptDateGranularity).toBe('month');
    expect(c.state).toBe('FL');
    expect(c.officeCode).toBe('HIA');
    expect(c.receiptPrefix).toBe('IOE');
    expect(c.concurrentI765).toBe(true);
    expect(c.milestones).toEqual([{ key: 'ead_c9', date: '2025-09-15', dateGranularity: 'month', dateSource: 'notice' }]);
    expect(c.basicDocs.photos).toBe(true);
    expect(getCaseSubjectSelection()).toBe(c.localId);
    const stored = String(kv.get('caa:v1:cases'));
    expect(stored).not.toMatch(/IOE\d|receiptFullLocal|"name"|fullName/i);
  });

  it('"Ver un ejemplo" from the form selects the example and never writes to the KV', async () => {
    await mount(<CaseFormScreen />);
    await fireEvent.press(screen.getByTestId('form-example'));
    expect(getCaseSubjectSelection()).toBe('example');
    expect(kv.get('caa:v1:cases')).toBeNull();
  });
});
