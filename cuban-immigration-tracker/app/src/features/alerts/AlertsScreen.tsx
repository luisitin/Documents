/**
 * S8 Alertas / Alerts (00-product-spec.md S8; F11): curated bilingual alerts, newest first, with
 * the "mi caso / todas" filter, "Marcar como leídas", the empty state "Sin alertas nuevas desde
 * {fecha}" and the litigation watch table from `policy.json`. Retracted and expired alerts are not
 * listed. "Mi caso" uses the active saved case only (device data, never sent anywhere).
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { useCases } from '@/storage/cases';
import { AppHeader, AppText, Button, Card, Screen, useTheme } from '@/ui';
import { DataBanners, Disclaimer, FilterChip, hrefOf, seg } from '../home/shared';
import { affectsCase, isLive, sortAlerts } from '../home/model';
import { AlertCard } from './AlertCard';
import { LitigationTable } from './LitigationTable';
import { unreadCount, useReadAlerts } from './readState';

export function AlertsScreen() {
  const d = useData();
  const { t, fmt } = useLang();
  const theme = useTheme();
  const router = useRouter();
  const { active } = useCases();
  const { read, markRead } = useReadAlerts();
  const [mine, setMine] = useState(false);
  const live = sortAlerts(d.alerts.alerts.filter((a) => isLive(a, d.today)));
  const list = mine && active ? live.filter((a) => affectsCase(a, active)) : live;
  const unread = unreadCount(live, read);
  const newest = live[0]?.date ?? d.policy.reviewedAt;
  return (
    <Screen testID="screen-alerts">
      <AppHeader title={t('alerts:title')} />
      <DataBanners />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        <FilterChip testID="alerts-filter-all" label={t('alerts:filter.all')} selected={!mine} onPress={() => setMine(false)} />
        <FilterChip testID="alerts-filter-mine" label={t('alerts:filter.mine')} selected={mine} onPress={() => setMine(true)} />
      </View>
      {mine && !active ? (
        <AppText testID="alerts-no-case" size="sm" muted>
          {t('alerts:filter.noCase')}
        </AppText>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: theme.space(2) }}>
        <AppText testID="alerts-unread" size="sm" muted>
          {unread > 0 ? t(unread === 1 ? 'alerts:unread.one' : 'alerts:unread.other', { n: fmt.int(unread) }) : t('alerts:unread.none')}
        </AppText>
        {unread > 0 ? (
          <View>
            <Button testID="alerts-mark-read" variant="secondary" label={t('alerts:markRead')} onPress={() => markRead(live.map((a) => a.id))} />
          </View>
        ) : null}
      </View>
      {list.length === 0 ? (
        <Card testID="alerts-empty">
          <AppText>{t('alerts:empty', { date: fmt.date(newest) })}</AppText>
        </Card>
      ) : (
        <View testID="alerts-list" style={{ gap: theme.space(3) }}>
          {list.map((a) => (
            <AlertCard key={a.id} alert={a} unread={!read.has(a.id)} onOpen={() => router.push(hrefOf(`/alerts/${seg(a.id)}`))} />
          ))}
        </View>
      )}
      <LitigationTable policy={d.policy} />
      <Disclaimer />
    </Screen>
  );
}
