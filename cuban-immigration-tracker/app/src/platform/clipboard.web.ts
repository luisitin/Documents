/**
 * `copyText(text)` on web: `navigator.clipboard.writeText` inside try/catch, then the legacy
 * `document.execCommand('copy')` on a temporary off-screen textarea. Resolves false when both fail
 * (blocked in the artifact frame, no permission); the screen then says "Mantenga presionado para
 * copiar" (00 S12). Never throws.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    const nav = (globalThis as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } }).navigator;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const doc = (globalThis as { document?: Document }).document;
    if (!doc?.body) return false;
    const ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    const ok = doc.execCommand('copy');
    doc.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
