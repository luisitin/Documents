/**
 * S10 Privacidad / Privacy (05-privacy-security-legal.md §1, §1.1): nothing personal leaves the
 * device; what is stored and what is never stored; the only network traffic (public JSON from
 * GitHub on native, files shipped next to the page on web; GitHub sees the IP address of any
 * download, 05 §1.1); no analytics, ads or crash reporting; discreet mode is not a security
 * boundary; and the way to delete everything (Ajustes → Borrar todos mis datos).
 */
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useLang } from '@/i18n/useLang';
import { AppHeader, AppText, Button, Card, Screen } from '@/ui';
import { BackLink, Bullets, Disclaimer, hrefOf } from '../home/shared';

export function PrivacyScreen() {
  const { t } = useLang();
  const router = useRouter();
  const web = Platform.OS === 'web';
  return (
    <Screen testID="screen-more-privacy">
      <AppHeader title={t('more:privacy.title')} />
      <BackLink label={t('more:back')} fallback="/more" />
      <Card title={t('more:privacy.vault.title')} tone="info">
        <AppText>{t(web ? 'more:privacy.vault.web' : 'more:privacy.vault.native')}</AppText>
      </Card>
      <Card title={t('more:privacy.stored.title')}>
        <Bullets size="sm" items={[t('more:privacy.stored.case'), t('more:privacy.stored.nickname'), t('more:privacy.stored.receipt'), t('more:privacy.stored.settings'), t('more:privacy.stored.cache')]} />
      </Card>
      <Card title={t('more:privacy.never.title')}>
        <Bullets size="sm" items={[t('more:privacy.never.identity'), t('more:privacy.never.credentials'), t('more:privacy.never.tracking')]} />
      </Card>
      <Card title={t('more:privacy.network.title')}>
        <AppText>{t(web ? 'more:privacy.network.web' : 'more:privacy.network.native')}</AppText>
      </Card>
      <Card title={t('more:privacy.tips.title')}>
        <Bullets size="sm" items={[t('more:privacy.tips.prefix'), t('more:privacy.tips.month'), t('more:privacy.tips.discreet')]} />
      </Card>
      <Card title={t('more:privacy.delete.title')}>
        <AppText>{t('more:privacy.delete.body')}</AppText>
        <Button testID="privacy-settings" variant="secondary" label={t('more:privacy.delete.button')} onPress={() => router.push(hrefOf('/more/settings'))} />
      </Card>
      <Disclaimer />
    </Screen>
  );
}
