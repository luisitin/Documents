/**
 * S6 Oficinas / Offices list (00-product-spec.md S6; F10). Cuban-focus offices first (flagged in
 * the data from key facts §6), then "Ver todas"; state filter chips built from the data. Each row
 * opens `/offices/[code]`, which stays inside this tab (07 WP6 rules).
 */
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppHeader, AppText, Button, Card, Screen, Tile, useTheme } from '@/ui';
import { DataBanners, Disclaimer, FilterChip, hrefOf, seg } from '../home/shared';
import { OfficeFacts } from './OfficeFacts';
import { orderedSummaries, statesOf } from './model';

export function OfficesScreen() {
  const d = useData();
  const { t, fmt } = useLang();
  const theme = useTheme();
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [state, setState] = useState<string | null>(null);
  const all = useMemo(() => orderedSummaries(d.offices, d.params), [d.offices, d.params]);
  const pool = showAll ? all : all.filter((s) => s.office.cubanFocus);
  const states = statesOf(pool);
  const shown = state && states.includes(state) ? pool.filter((s) => s.office.state === state) : pool;
  return (
    <Screen testID="screen-offices">
      <AppHeader title={t('offices:title')} />
      <DataBanners />
      <AppText>{t('offices:intro')}</AppText>
      <View testID="offices-states" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
        <FilterChip testID="offices-state-all" label={t('offices:filter.all')} selected={!state || !states.includes(state)} onPress={() => setState(null)} />
        {states.map((st) => (
          <FilterChip key={st} testID={`offices-state-${st}`} label={st} selected={state === st} onPress={() => setState(st)} accessibilityLabel={t('offices:filter.state.a11y', { state: st })} />
        ))}
      </View>
      <AppText header size="lg" weight="bold">
        {showAll ? t('offices:list.all', { n: fmt.int(all.length) }) : t('offices:list.focus')}
      </AppText>
      {shown.length === 0 ? (
        <Card testID="offices-empty">
          <AppText>{t('offices:empty')}</AppText>
        </Card>
      ) : (
        <View testID="offices-list" style={{ gap: theme.space(2) }}>
          {shown.map((s) => (
            <Tile
              key={s.office.code}
              testID={`office-row-${s.office.code}`}
              title={t('offices:row.title', { name: s.office.name, code: s.office.code, state: s.office.state })}
              onPress={() => router.push(hrefOf(`/offices/${seg(s.office.code)}`))}
            >
              <OfficeFacts s={s} compact />
            </Tile>
          ))}
        </View>
      )}
      <Button
        testID="offices-toggle-all"
        variant="secondary"
        label={showAll ? t('offices:list.showFocus') : t('offices:list.showAll', { n: fmt.int(all.length) })}
        onPress={() => {
          setShowAll((v) => !v);
          setState(null);
        }}
      />
      <Disclaimer />
    </Screen>
  );
}
