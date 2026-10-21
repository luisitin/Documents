/**
 * `openUrl(url)` on web: a no-op. The artifact host blocks popups and `window.open` (contract (e);
 * Prove P13 records any `window.open` call), and navigating the frame away would leave the app.
 * Screens show external links as selectable text instead (01-architecture.md §5 item 9) and can
 * check `CAN_OPEN_URLS`.
 */
export const CAN_OPEN_URLS: boolean = false;

export async function openUrl(_url: string): Promise<void> {}
