/**
 * `share(text)` on web: always false. The Web Share API is a device API the artifact host does not
 * offer (contract (e)), so the S12 screen shows a selectable text box plus "Copiar" instead
 * (00 S12).
 */
export const CAN_SHARE: boolean = false;

export async function share(_text: string): Promise<boolean> {
  return false;
}
