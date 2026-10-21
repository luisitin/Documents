/**
 * `openUrl(url)` (07 §6.0) — native: opens an http(s) source link in the system browser via React
 * Native `Linking`. Only `https:`/`http:` URLs are opened (sources are public pages; 05 §1). Metro
 * picks `openUrl.web.ts` on web; this base file is the native implementation that `tsc` resolves.
 */
import { Linking } from 'react-native';

/** Whether this platform can open external links (false on web: links are selectable text). */
export const CAN_OPEN_URLS: boolean = true;

export async function openUrl(url: string): Promise<void> {
  if (!/^https?:\/\//i.test(url)) return;
  try {
    await Linking.openURL(url);
  } catch {
    /* no browser available: ignore */
  }
}
