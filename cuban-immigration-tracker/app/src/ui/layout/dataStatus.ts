/**
 * Pure text for the data status chip (00 §5.1 table; 00 §1.1 "What live means"; owner
 * requirement 2: every screen shows an as-of date and whether data is live or sample).
 *
 * | state     | es                                                            | en                                                       |
 * | live      | ● En vivo · USCIS hasta {mes} · revisado {hace X}             | ● Live · USCIS through {month} · checked {X ago}         |
 * | cached    | ◐ Guardado · USCIS hasta {mes} · última conexión {fecha}      | ◐ Saved · USCIS through {month} · last online {date}     |
 * | published | ◆ Publicado {fecha} · USCIS hasta {mes}                       | ◆ Published {date} · USCIS through {month}               |
 * | sample    | ○ Muestra · datos de ejemplo incluidos · USCIS hasta {mes}    | ○ Sample · example data bundled · USCIS through {month}  |
 *
 * The web artifact never says a bare "En vivo" (00 §1.1 must-fix): with `artifactBuiltAt` the
 * data layer reports `published`. The sample line carries the USCIS month so Prove P8 can check
 * "Muestra" + "ago 2026". The "revisado"/"última conexión" times use `manifest.lastCheckedAt`,
 * the last committed pipeline check (03 §6.1 heartbeat).
 */
import type { DataStatus, ISODateTime, Lang, Manifest, YearMonth } from '@caa/data-schemas';
import { createFmt, translate } from '@caa/i18n-core';

export const STATUS_SYMBOL: Readonly<Record<DataStatus, string>> = Object.freeze({ live: '●', cached: '◐', published: '◆', sample: '○' });

export interface StatusInput {
  status: DataStatus;
  manifest: Pick<Manifest, 'lastCheckedAt' | 'dataChangedAt'> & Partial<Pick<Manifest, 'artifactBuiltAt'>>;
  asOf: { latestOfficialMonth: YearMonth; dataChangedAt: ISODateTime; artifactBuiltAt?: ISODateTime };
}

/** Hours from an ISO timestamp to `nowMs` (NaN-safe: unknown → 0). */
export function hoursSince(iso: string | undefined, nowMs: number): number {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, (nowMs - t) / 3_600_000);
}

/** The status word alone ("Muestra", "Publicado 20 oct 2026", …). */
export function statusWord(input: StatusInput, lang: Lang): string {
  const fmt = createFmt(lang);
  if (input.status === 'published') {
    const built = input.asOf.artifactBuiltAt ?? input.manifest.artifactBuiltAt ?? input.asOf.dataChangedAt;
    return translate(lang, 'ui:status.published', { date: fmt.date(built) });
  }
  return translate(lang, `ui:status.${input.status}`);
}

/** The full chip line, symbol first (00 §5.1). */
export function statusLine(input: StatusInput, lang: Lang, nowMs: number): string {
  const fmt = createFmt(lang);
  const through = translate(lang, 'ui:status.uscisThrough', { month: fmt.month(input.asOf.latestOfficialMonth) });
  const parts = [`${STATUS_SYMBOL[input.status]} ${statusWord(input, lang)}`];
  switch (input.status) {
    case 'live':
      parts.push(through, translate(lang, 'ui:status.checked', { ago: fmt.relative(hoursSince(input.manifest.lastCheckedAt, nowMs)) }));
      break;
    case 'cached':
      parts.push(through, translate(lang, 'ui:status.lastOnline', { date: fmt.date(input.manifest.lastCheckedAt) }));
      break;
    case 'published':
      parts.push(through);
      break;
    default:
      parts.push(translate(lang, 'ui:status.sampleNote'), through);
  }
  return parts.join(' · ');
}
