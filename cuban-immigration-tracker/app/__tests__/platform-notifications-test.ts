/**
 * Notifications (00-product-spec.md §7; 07 WP6 rules): local only, lazy-imported after opt-in,
 * texts in the current language, rescheduled on a language change, cancelled by "Borrar mis
 * datos". The planner is pure; the native module runs against a mocked expo-notifications.
 */
import { Platform } from 'react-native';
import type { CaseTimeline } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { sampleSnapshot } from '@/data/snapshot';
import { isModuleLoaded, notifications, planCaseReminders, resetNotificationsForTests } from '@/notifications';
import { clearAllData, getCases, saveCase } from '@/storage/cases';
import { kv } from '@/storage/kv';
import { updateSettings } from '@/storage/settings';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

interface MockNotifications {
  scheduled: Map<string, { title: string; body: string; date: Date }>;
  [k: string]: unknown;
}
const mockN = {
  scheduled: new Map<string, { title: string; body: string; date: Date }>(),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: false })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getExpoPushTokenAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async (): Promise<void> => (mockN as MockNotifications).scheduled.clear()),
  cancelScheduledNotificationAsync: jest.fn(async (id: string): Promise<void> => void (mockN as MockNotifications).scheduled.delete(id)),
  scheduleNotificationAsync: jest.fn(async (req: { identifier?: string; content: { title: string; body: string }; trigger: { date: Date } | null }): Promise<string> => {
    const m = mockN as MockNotifications;
    const id = req.identifier ?? `now-${m.scheduled.size}`;
    m.scheduled.set(id, { title: req.content.title, body: req.content.body, date: req.trigger?.date as Date });
    return id;
  }),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
};
jest.mock('expo-notifications', () => mockN);

const policy = sampleSnapshot().policy;
// 2026-10-20 09:30 local (the planner works in device-local wall time).
const NOW = new Date(2026, 9, 20, 9, 30, 0);

function caseWith(over: Partial<CaseTimeline>): CaseTimeline {
  return { ...referenceCase(), localId: '11111111-1111-4111-8111-111111111111', nickname: 'Mi caso', ...over };
}

const withCard = caseWith({
  milestones: [
    { key: 'biometrics', date: '2025-07-15', dateGranularity: 'month', dateSource: 'memory' },
    { key: 'ead_c9', date: '2025-09-15', dateGranularity: 'day', dateSource: 'notice', meta: { cardExpiry: '2027-06-30' } },
  ],
});

describe('planCaseReminders (pure)', () => {
  it('EAD expiry −180/−90/−30 days at 10:00 local, in the requested language', () => {
    const es = planCaseReminders(withCard, policy, 'es', NOW);
    expect(es.map((p) => p.fireAt)).toEqual(['2027-01-01T10:00:00', '2027-04-01T10:00:00', '2027-05-31T10:00:00']);
    expect(es[0]?.body).toBe('Su permiso de trabajo vence el 30 jun 2027. Las renovaciones ya no se extienden automáticamente; puede presentar la renovación desde ahora.');
    expect(es[0]?.url).toBe('/case/ead');
    const en = planCaseReminders(withCard, policy, 'en', NOW);
    expect(en[0]?.body).toBe('Your work permit expires Jun 30, 2027. Renewals no longer auto-extend; you can file your renewal now.');
  });

  it('the reference case (EAD 2025-09, no card date) gets the 3 reminders of the estimated 5-year expiry', () => {
    const p = planCaseReminders(referenceCase(), policy, 'es', NOW);
    expect(p).toHaveLength(3);
    expect(p.every((x) => x.kind === 'ead_expiry' && x.fireAt > '2029-')).toBe(true);
  });

  it('RFE due −21/−7 days, derived from PA-2026-05 (84 days) when the notice has no due date', () => {
    const c = caseWith({ milestones: [{ key: 'rfe', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice' }] });
    const p = planCaseReminders(c, policy, 'es', NOW);
    expect(p.map((x) => `${x.kind} ${x.fireAt}`)).toEqual(['rfe_due 2026-12-03T10:00:00', 'rfe_due 2026-12-17T10:00:00']);
    expect(p[0]?.body).toBe('Su respuesta a USCIS vence el 24 dic 2026.');
    const answered = caseWith({ milestones: [
      { key: 'rfe', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice' },
      { key: 'rfe_response', date: '2026-10-10', dateGranularity: 'day', dateSource: 'notice' },
    ] });
    expect(planCaseReminders(answered, policy, 'es', NOW)).toEqual([]);
  });

  it('discreet mode hides dates; texts never carry the nickname or a receipt prefix', () => {
    const c = { ...withCard, nickname: 'Juana', receiptPrefix: 'IOE' };
    for (const p of planCaseReminders(c, policy, 'es', NOW, true)) {
      expect(p.title).toBe('Recordatorio de CAA Tracker');
      expect(p.body).toBe('Tiene un recordatorio. Abra la app para verlo.');
    }
    for (const p of planCaseReminders(c, policy, 'en', NOW)) expect(`${p.title} ${p.body}`).not.toMatch(/Juana|IOE/);
  });

  it('decided cases and past dates get nothing', () => {
    const decided = caseWith({ milestones: [...withCard.milestones, { key: 'decision', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice', meta: { outcome: 'approved' } }] });
    expect(planCaseReminders(decided, policy, 'es', NOW)).toEqual([]);
    expect(planCaseReminders(withCard, policy, 'es', new Date(2027, 6, 1))).toEqual([]);
  });
});

describe('native module (mocked expo-notifications)', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('stays lazy and silent until the user opts in', async () => {
    resetNotificationsForTests();
    expect(saveCase(withCard).ok).toBe(true);
    await notifications.init();
    await notifications.scheduleCaseReminders(withCard, 'es');
    await notifications.rescheduleAll('en');
    notifications.notifyOnForeground();
    expect(isModuleLoaded()).toBe(false);
    expect(mockN.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockN.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('opt-in: Android channel before the prompt, local DATE triggers only, never push tokens', async () => {
    const os = jest.replaceProperty(Platform, 'OS', 'android');
    expect(await notifications.enable()).toBe(true);
    os.restore();
    expect(isModuleLoaded()).toBe(true);
    expect(mockN.setNotificationChannelAsync).toHaveBeenCalledWith('default', { name: 'Recordatorios', importance: 3 });
    expect(mockN.setNotificationChannelAsync.mock.invocationCallOrder[0] as number).toBeLessThan(mockN.requestPermissionsAsync.mock.invocationCallOrder[0] as number);
    expect(mockN.setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(mockN.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockN.getDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(mockN.scheduled.size).toBe(3);
    expect([...mockN.scheduled.values()][0]?.body).toMatch(/^Su permiso de trabajo vence el 30 jun 2027/);
    expect(JSON.parse(kv.get('caa:v1:notif:scheduled') as string)).toHaveLength(3);
  });

  it('a language change cancels and reschedules every notification with the new text', async () => {
    await notifications.rescheduleAll('en');
    expect(mockN.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(3);
    expect(mockN.scheduled.size).toBe(3);
    for (const v of mockN.scheduled.values()) expect(v.body).toMatch(/^Your work permit expires Jun 30, 2027/);
  });

  it('foreground events respect quiet hours and the data-month opt-in', async () => {
    updateSettings({ notifications: { enabled: true, dataMonths: true } });
    notifications.queueForeground({ kind: 'data_month', month: '2026-09' });
    const before = mockN.scheduleNotificationAsync.mock.calls.length;
    notifications.notifyOnForeground();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockN.scheduleNotificationAsync.mock.calls.length).toBe(before + 1);
    const last = mockN.scheduleNotificationAsync.mock.calls.at(-1)?.[0] as { content: { body: string }; trigger: unknown };
    expect(last.trigger).toBeNull();
    expect(last.content.body).toBe('USCIS publicó datos de septiembre de 2026. Su estimado se actualizó.');

    (Date.now as jest.Mock).mockReturnValue(new Date(2026, 9, 20, 22, 0).getTime());
    notifications.queueForeground({ kind: 'data_month', month: '2026-10' });
    notifications.notifyOnForeground();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockN.scheduleNotificationAsync.mock.calls.length).toBe(before + 1); // 22:00 is quiet
    (Date.now as jest.Mock).mockReturnValue(NOW.getTime());
  });

  it('"Borrar mis datos" clears every caa: key and cancels all scheduled notifications', async () => {
    await clearAllData();
    expect(mockN.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(mockN.scheduled.size).toBe(0);
    expect(kv.get('caa:v1:cases')).toBeNull();
    expect(kv.get('caa:v1:notif:scheduled')).toBeNull();
    expect(getCases().cases).toEqual([]);
  });
});
