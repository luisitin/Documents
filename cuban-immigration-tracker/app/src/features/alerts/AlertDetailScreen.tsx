/**
 * S8 alert detail `/alerts/[id]` (00-product-spec.md S8): the full card with sources, evidence
 * tags and docket, plus the related court case from the litigation table when the docket matches.
 * Opening it marks the alert as read. It stays inside the alerts tab with a back action (07 WP6).
 */
import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { localize } from '@caa/i18n-core';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppHeader, AppText, Card, Screen } from '@/ui';
import { BackLink, DataBanners, Disclaimer } from '../home/shared';
import { AlertCard } from './AlertCard';
import { useReadAlerts } from './readState';

/** Normalizes a docket for matching ("1:26-cv-14527" inside "D. Mass. 1:26-cv-14527"). */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9:-]/g, '');

export function AlertDetailScreen() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const { markRead } = useReadAlerts();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const alert = d.alerts.alerts.find((a) => a.id === id && a.status === 'published');
  useEffect(() => {
    if (alert) markRead([alert.id]);
  }, [alert, markRead]);
  if (!alert) {
    return (
      <Screen testID="screen-alert-missing">
        <AppHeader title={t('alerts:title')} />
        <BackLink label={t('alerts:detail.back')} fallback="/alerts" />
        <Card testID="alert-not-found">
          <AppText>{t('alerts:detail.notFound')}</AppText>
        </Card>
        <Disclaimer />
      </Screen>
    );
  }
  const docket = alert.docket ? norm(alert.docket.number) : null;
  const related = docket ? d.policy.litigation.find((c) => norm(c.docket).includes(docket) || docket.includes(norm(c.docket))) : undefined;
  return (
    <Screen testID={`screen-alert-${alert.id}`}>
      <AppHeader title={t('alerts:detail.title')} />
      <BackLink label={t('alerts:detail.back')} fallback="/alerts" />
      <DataBanners />
      <AlertCard alert={alert} full />
      {related ? (
        <Card title={t('alerts:detail.related')} testID="alert-related">
          <AppText weight="medium">{related.caption}</AppText>
          <AppText size="sm">{t('alerts:lit.courtDocket', { court: related.court, docket: related.docket })}</AppText>
          <AppText>{t('alerts:lit.status', { date: fmt.date(related.statusAsOf), status: localize(related.status, lang) })}</AppText>
          <AppText size="sm" muted>
            {localize(related.whatWouldChange, lang)}
          </AppText>
        </Card>
      ) : null}
      <Disclaimer />
    </Screen>
  );
}
