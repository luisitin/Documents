/**
 * Local notifications on iOS/Android (00-product-spec.md §7; 07 WP6 rules; SDK notes §6).
 *
 * - LOCAL notifications only. This module never calls push-token, topic or server-registration
 *   APIs: remote push does not work in Expo Go, and Expo Go on Android errors on push features
 *   since SDK 53 (expo-notifications `warnOfExpoGoPushUsage`; SDK notes §6).
 * - `expo-notifications` is LAZY-imported, and only after the user opts in from Settings
 *   (`enable()`); nothing is loaded at launch, and permission is never requested at launch.
 * - Android: the channel is created before the permission prompt (SDK notes §6).
 * - Foreground handler: `shouldShowBanner` / `shouldShowList` (SDK 58; `shouldShowAlert` is
 *   deprecated).
 * - On any language change every scheduled notification is cancelled and rescheduled with the new
 *   text (`rescheduleAll(lang)`, owner requirement 1).
 * - Deep link: a tapped notification's `data.url` (an in-app path) is opened with the router.
 */
import { Platform } from 'react-native';
import { router } from 'expo-router';
import type { CaseTimeline, Lang } from '@caa/data-schemas';
import { translate } from '@caa/i18n-core';
import { getCurrentSnapshot } from '@/data/snapshot';
import { getCases } from '@/storage/cases';
import { kv } from '@/storage/kv';
import { readJson, writeJson } from '@/storage/kvCore';
import { getSettings, updateSettings } from '@/storage/settings';
import {
  foregroundCopy, isQuietHour, planCaseReminders, toLocalDate,
  type ForegroundEvent, type PlannedNotification, type ScheduledRecord,
} from './schedule';

export * from './schedule';

type ExpoNotifications = typeof import('expo-notifications');

export const SCHEDULED_KEY = 'caa:v1:notif:scheduled' as const;
export const CHANNEL_ID = 'default';

let modPromise: Promise<ExpoNotifications> | null = null;
let setUp = false;
const foregroundQueue: ForegroundEvent[] = [];

/**
 * Lazy load of expo-notifications (07 WP6: only after opt-in). An inline `require` is evaluated
 * only when first called (Metro bundles the module but runs it lazily; Jest supports it, whereas a
 * dynamic `import()` needs experimental VM modules there).
 */
function load(): Promise<ExpoNotifications> {
  modPromise ??= Promise.resolve().then(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as ExpoNotifications;
  });
  return modPromise;
}

/** True once expo-notifications has been imported in this session (tests: lazy-import check). */
export function isModuleLoaded(): boolean {
  return modPromise !== null;
}

function enabled(): boolean {
  return getSettings().notifications.enabled;
}

function readRecords(): ScheduledRecord[] {
  return readJson(kv, SCHEDULED_KEY, (v) => (Array.isArray(v) ? (v as ScheduledRecord[]).filter((r) => r && typeof r.id === 'string') : null)) ?? [];
}

function writeRecords(r: ScheduledRecord[]): void {
  if (r.length) writeJson(kv, SCHEDULED_KEY, r);
  else kv.remove(SCHEDULED_KEY);
}

async function ensureChannel(N: ExpoNotifications): Promise<void> {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: translate(getSettings().lang, 'notifications:channel.name'),
    importance: N.AndroidImportance.DEFAULT,
  });
}

function openUrlFrom(data: unknown): void {
  const url = (data as { url?: unknown } | null | undefined)?.url;
  if (typeof url === 'string' && url.startsWith('/')) {
    try {
      router.push(url as never);
    } catch {
      /* the router is not mounted yet; ignore */
    }
  }
}

async function setup(N: ExpoNotifications): Promise<void> {
  if (setUp) return;
  setUp = true;
  N.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  await ensureChannel(N);
  N.addNotificationResponseReceivedListener((r) => openUrlFrom(r.notification.request.content.data));
  const last = N.getLastNotificationResponse?.();
  if (last) {
    openUrlFrom(last.notification.request.content.data);
    N.clearLastNotificationResponse?.();
  }
}

async function schedule(N: ExpoNotifications, p: PlannedNotification): Promise<ScheduledRecord | null> {
  try {
    const id = await N.scheduleNotificationAsync({
      identifier: p.id,
      content: { title: p.title, body: p.body, data: { url: p.url } },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: toLocalDate(p.fireAt), channelId: CHANNEL_ID },
    });
    return { id, kind: p.kind, caseId: p.caseId, fireAt: p.fireAt };
  } catch {
    return null;
  }
}

async function cancelRecords(N: ExpoNotifications, records: ScheduledRecord[]): Promise<void> {
  for (const r of records) {
    try {
      await N.cancelScheduledNotificationAsync(r.id);
    } catch {
      /* already fired or unknown */
    }
  }
}

function plan(c: CaseTimeline, lang: Lang, now: Date): PlannedNotification[] {
  return planCaseReminders(c, getCurrentSnapshot().policy, lang, now, getSettings().discreet);
}

/** Startup: sets the handler and the deep-link listener only if the user opted in before. */
async function init(): Promise<void> {
  if (!enabled()) return;
  await setup(await load());
}

/** Schedules (replacing) the deadline reminders of one case. No-op until the user opts in. */
async function scheduleCaseReminders(c: CaseTimeline, lang: Lang): Promise<void> {
  if (!enabled()) return;
  const N = await load();
  await setup(N);
  const records = readRecords();
  const mine = records.filter((r) => r.caseId === c.localId);
  await cancelRecords(N, mine);
  const kept = records.filter((r) => r.caseId !== c.localId);
  const now = new Date(Date.now());
  for (const p of plan(c, lang, now)) {
    const rec = await schedule(N, p);
    if (rec) kept.push(rec);
  }
  writeRecords(kept);
}

/** Cancels and reschedules every case's reminders in `lang` (called on every language change). */
async function rescheduleAll(lang: Lang): Promise<void> {
  if (!enabled()) return;
  const N = await load();
  await setup(N);
  await cancelRecords(N, readRecords());
  const now = new Date(Date.now());
  const next: ScheduledRecord[] = [];
  for (const c of getCases().cases) {
    for (const p of plan(c, lang, now)) {
      const rec = await schedule(N, p);
      if (rec) next.push(rec);
    }
  }
  writeRecords(next);
}

/** Cancels everything this app scheduled ("Borrar mis datos"; turning notifications off). */
async function cancelAll(): Promise<void> {
  const records = readRecords();
  writeRecords([]);
  if (!isModuleLoaded() && records.length === 0) return; // nothing was ever scheduled: stay lazy
  const N = await load();
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    await cancelRecords(N, records);
  }
}

/** Queues an event for the next foreground (the data layer reports new months and alerts). */
function queueForeground(e: ForegroundEvent): void {
  if (!foregroundQueue.some((q) => JSON.stringify(q) === JSON.stringify(e))) foregroundQueue.push(e);
}

/** Shows queued foreground events now (opt-in only; never during quiet hours 21:00–08:00). */
function notifyOnForeground(): void {
  if (!enabled() || foregroundQueue.length === 0) return;
  const now = new Date(Date.now());
  if (isQuietHour(now.getHours())) return; // kept for a later foreground
  const s = getSettings();
  const events = foregroundQueue.splice(0, foregroundQueue.length).filter((e) => e.kind !== 'data_month' || s.notifications.dataMonths);
  void load().then(async (N) => {
    await setup(N);
    for (const e of events) {
      const copy = foregroundCopy(e, s.lang, s.discreet);
      try {
        await N.scheduleNotificationAsync({ content: { title: copy.title, body: copy.body, data: { url: copy.url } }, trigger: null });
      } catch {
        /* permission revoked: ignore */
      }
    }
  });
}

/**
 * Opt-in from Settings: creates the Android channel, asks for permission, and on success turns
 * the setting on and schedules every case's reminders. Returns whether permission was granted.
 */
async function enable(opts: { dataMonths?: boolean } = {}): Promise<boolean> {
  const N = await load();
  await ensureChannel(N);
  let granted = false;
  try {
    const cur = await N.getPermissionsAsync();
    granted = cur.granted || (await N.requestPermissionsAsync()).granted;
  } catch {
    granted = false;
  }
  if (!granted) return false;
  updateSettings({ notifications: { enabled: true, dataMonths: opts.dataMonths ?? getSettings().notifications.dataMonths } });
  await setup(N);
  await rescheduleAll(getSettings().lang);
  return true;
}

/** Turns notifications off and cancels every scheduled one. */
async function disable(): Promise<void> {
  updateSettings({ notifications: { enabled: false, dataMonths: getSettings().notifications.dataMonths } });
  await cancelAll();
}

/**
 * 07 §6.0 `notifications` (+ additive `available`, `enable`, `disable`, `queueForeground`).
 */
export const notifications = {
  /** Local notifications exist on this platform (false on web). */
  available: true as boolean,
  init,
  scheduleCaseReminders,
  rescheduleAll,
  notifyOnForeground,
  cancelAll,
  enable,
  disable,
  queueForeground,
};

/** Tests only: forget the lazy module, the setup flag and the queue. */
export function resetNotificationsForTests(): void {
  modPromise = null;
  setUp = false;
  foregroundQueue.splice(0, foregroundQueue.length);
}
