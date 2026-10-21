/**
 * S10 Más / More (00-product-spec.md S10): Ajustes (first), ¿Es verdad?, Glosario, Cómo
 * calculamos y datos (S11), Acerca de, Privacidad. Each row opens a screen inside this tab's Stack.
 */
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLang } from '@/i18n/useLang';
import { AppHeader, AppText, Card, Screen, Tile, useTheme } from '@/ui';
import { Disclaimer, hrefOf } from '../home/shared';

const ROWS = [
  { id: 'settings', path: '/more/settings' },
  { id: 'myths', path: '/more/myths' },
  { id: 'glossary', path: '/more/glossary' },
  { id: 'method', path: '/more/method' },
  { id: 'about', path: '/more/about' },
  { id: 'privacy', path: '/more/privacy' },
] as const;

export function MoreScreen() {
  const { t } = useLang();
  const theme = useTheme();
  const router = useRouter();
  return (
    <Screen testID="screen-more">
      <AppHeader title={t('more:title')} />
      <View style={{ gap: theme.space(2) }}>
        {ROWS.map((r) => (
          <Tile key={r.id} testID={`more-row-${r.id}`} title={t(`more:row.${r.id}`)} onPress={() => router.push(hrefOf(r.path))}>
            <AppText size="sm">{t(`more:row.${r.id}.desc`)}</AppText>
          </Tile>
        ))}
      </View>
      <Card title={t('more:scam.title')} tone="warning" testID="more-scam">
        <AppText>{t('common:disclaimer.antiScam')}</AppText>
      </Card>
      <Disclaimer />
    </Screen>
  );
}
