/**
 * The data banners of 00 §5.1, driven by WP6's `useData()` (guards computed by the estimator's
 * `computeGuards`, 02 §4) and its `notice`:
 *
 * | guard / notice   | rule (00 §5.1)                                                       | tone    |
 * | T20a             | today − end of the latest official month > 75 days                   | warning |
 * | T20b             | monthly rows more than one quarter past the latest quarterly file    | info    |
 * | pipeline_late    | now − manifest.lastCheckedAt > 10 days                               | info    |
 * | artifact_old     | web: now − artifactBuiltAt > 35 days                                 | info    |
 * | qa_degraded      | manifest.qa.status != "ok"                                           | warning |
 * | app_too_old      | unknown schemaVersion / minAppVersion above the app (old data kept)  | warning |
 * | update_failed    | a refresh failed; cached (or sample) data stays on screen, dismissible | neutral |
 * | sample_data      | nothing fetched or cached: the bundled sample is labelled (owner rule) | info  |
 *
 * Plus the loading note: on first launch, while the first check runs over the bundled sample
 * (00 §5.1 "Loading: skeleton blocks on first launch only"). Nothing here is red: red is only for
 * deadlines (00 §3 principle 8).
 */
import { useState } from 'react';
import { View } from 'react-native';
import { daysBetween } from '@caa/case-rules';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppText, Banner, useTheme } from '@/ui';

export interface DataBannersProps {
  /** Show the "you are looking at the bundled sample" banner (Home only; the chip says it everywhere). */
  showSample?: boolean;
}

export function DataBanners({ showSample = false }: DataBannersProps) {
  const d = useData();
  const { t, fmt } = useLang();
  const theme = useTheme();
  const [dismissed, setDismissed] = useState(false);
  const out: { key: string; tone: 'neutral' | 'info' | 'warning'; text: string; dismiss?: boolean }[] = [];

  for (const g of d.guards) {
    switch (g.id) {
      case 'T20a': {
        const m = g.months?.[0] ?? d.asOf.latestOfficialMonth;
        out.push({ key: 'T20a', tone: 'warning', text: t('home:banner.T20a', { month: fmt.month(m) }) });
        break;
      }
      case 'T20b': {
        const months = (g.months ?? []).map((m) => fmt.month(m)).join(', ');
        if (months) out.push({ key: 'T20b', tone: 'info', text: t('home:banner.T20b', { months }) });
        break;
      }
      case 'pipeline_late':
        out.push({ key: 'pipeline_late', tone: 'info', text: t('home:banner.pipelineLate', { n: fmt.int(Math.max(0, daysBetween(d.asOf.lastCheckedAt.slice(0, 10), d.today))) }) });
        break;
      case 'artifact_old':
        if (d.asOf.artifactBuiltAt) {
          out.push({ key: 'artifact_old', tone: 'info', text: t('home:banner.artifactOld', { n: fmt.int(Math.max(0, daysBetween(d.asOf.artifactBuiltAt.slice(0, 10), d.today))) }) });
        }
        break;
      case 'qa_degraded':
        out.push({ key: 'qa_degraded', tone: 'warning', text: t('home:banner.qa') });
        break;
      case 'sample_data':
        if (showSample) out.push({ key: 'sample_data', tone: 'info', text: t('home:banner.sample', { month: fmt.month(d.asOf.latestOfficialMonth) }) });
        break;
    }
  }
  if (d.notice?.kind === 'app_too_old') out.unshift({ key: 'app_too_old', tone: 'warning', text: t('home:banner.appTooOld') });
  if (d.notice?.kind === 'update_failed' && !dismissed) {
    const text = d.notice.at ? t('common:state.updateFailed', { date: fmt.date(d.notice.at.slice(0, 10)) }) : t('home:banner.updateFailedSample');
    out.unshift({ key: 'update_failed', tone: 'neutral', text, dismiss: true });
  }

  const loading = d.refreshing && d.status === 'sample' && d.asOf.fetchedAt === null;
  if (out.length === 0 && !loading) return null;
  return (
    <View testID="data-banners" style={{ gap: theme.space(2) }}>
      {loading ? (
        <AppText testID="data-loading" size="sm" muted>
          {t('home:loading')}
        </AppText>
      ) : null}
      {out.map((b) => (
        <Banner
          key={b.key}
          testID={`banner-${b.key}`}
          tone={b.tone}
          text={b.text}
          action={b.dismiss ? { label: t('common:action.close'), onPress: () => setDismissed(true) } : undefined}
        />
      ))}
    </View>
  );
}
