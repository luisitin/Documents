/**
 * `copyText(text)` (07 §6.0) — native: no clipboard module is in the pinned dependency set
 * (07 §3.1; React Native core no longer ships `Clipboard`), so this resolves false and the screen
 * shows the text as selectable with "Mantenga presionado para copiar" (00 S12). Metro picks
 * `clipboard.web.ts` on web.
 */
export async function copyText(_text: string): Promise<boolean> {
  return false;
}
