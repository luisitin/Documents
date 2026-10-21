/**
 * `share(text)` (07 §6.0) — native: the system share sheet (React Native `Share`). Resolves true
 * when the user picked a target, false when dismissed or on error. The share text is the
 * month-level case code (00 S12; no receipt digits, no day dates), built by the caller.
 */
import { Share } from 'react-native';

export const CAN_SHARE: boolean = true;

export async function share(text: string): Promise<boolean> {
  try {
    const r = await Share.share({ message: text });
    return r.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}
