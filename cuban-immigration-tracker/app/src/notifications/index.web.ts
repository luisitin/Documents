/**
 * Web build: no notifications at all (00-product-spec.md §7 "native only; web = in-app badges
 * only"; artifact contract (e): the Notification API and device APIs are never offered). Every
 * method is a no-op, and `expo-notifications` is never imported, so it stays out of the single web
 * bundle (ARCH-3 lean bundle).
 */
import type { CaseTimeline, Lang } from '@caa/data-schemas';
import type { ForegroundEvent } from './schedule';

export * from './schedule';

export const SCHEDULED_KEY = 'caa:v1:notif:scheduled' as const;
export const CHANNEL_ID = 'default';

export function isModuleLoaded(): boolean {
  return false;
}

export const notifications = {
  available: false as boolean,
  async init(): Promise<void> {},
  async scheduleCaseReminders(_c: CaseTimeline, _lang: Lang): Promise<void> {},
  async rescheduleAll(_lang: Lang): Promise<void> {},
  notifyOnForeground(): void {},
  async cancelAll(): Promise<void> {},
  async enable(_opts: { dataMonths?: boolean } = {}): Promise<boolean> {
    return false;
  },
  async disable(): Promise<void> {},
  queueForeground(_e: ForegroundEvent): void {},
};

export function resetNotificationsForTests(): void {}
