/**
 * The `/welcome` modal (00 S0; root Stack `presentation: 'modal'`, WP6). WP6's tab layout opens it
 * on native first launch; "Entendido" closes it (back to Home), "Configurar mi caso" goes to the
 * case form. Every screen has the header with the language button and the data chip (00 §5).
 */
import { useRouter } from 'expo-router';
import { useLang } from '@/i18n/useLang';
import { AppHeader, Screen } from '@/ui';
import { goBackOr, hrefOf } from '../home/shared';
import { WelcomeContent } from './WelcomeContent';

export function WelcomeScreen() {
  const router = useRouter();
  const { t } = useLang();
  return (
    <Screen testID="screen-welcome">
      <AppHeader title={t('common:app.name')} />
      <WelcomeContent onDone={() => goBackOr(router, '/')} onSetup={() => router.replace(hrefOf('/case/edit'))} />
    </Screen>
  );
}
