/**
 * S10 Acerca de / About (00-product-spec.md S10; 00 §8; 05 §5.1, §6): independent and unofficial,
 * not affiliated with USCIS/DHS; the full disclaimer; the evidence tags used across the app
 * (00 "Evidence tags"); the attribution of the data (05 §6: USCIS files are U.S. Government works;
 * community mirrors are used only as checked fallbacks); and the repository link.
 */
import { View } from 'react-native';
import { SCHEMA_VERSION } from '@caa/data-schemas';
import { appVersion } from '@/data/DataProvider';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppHeader, AppText, Card, Screen, useTheme } from '@/ui';
import { EVIDENCE_KEY } from '../alerts/copy';
import { BackLink, Bullets, ExternalLink } from '../home/shared';

/** The public repository (ARCH-5: `luisitin/Documents`, project folder `cuban-immigration-tracker/`). */
export const REPOSITORY_URL = 'https://github.com/luisitin/Documents/tree/main/cuban-immigration-tracker';

const TAGS = ['F', 'S', 'S-sec', 'T', 'I', 'U', 'V'] as const;

export function AboutScreen() {
  const d = useData();
  const { t, fmt } = useLang();
  const theme = useTheme();
  return (
    <Screen testID="screen-more-about">
      <AppHeader title={t('more:about.title')} />
      <BackLink label={t('more:back')} fallback="/more" />
      <Card title={t('more:about.what.title')}>
        <AppText>{t('more:about.what.body')}</AppText>
      </Card>
      <Card title={t('more:about.disclaimer.title')} tone="info">
        <AppText testID="disclaimer">{t('common:disclaimer.full')}</AppText>
      </Card>
      <Card title={t('more:about.tags.title')} testID="about-tags">
        <View style={{ gap: theme.space(1) }}>
          {TAGS.map((tag) => (
            <AppText key={tag} size="sm">
              {t('more:about.tags.item', { tag, text: t(EVIDENCE_KEY[tag]) })}
            </AppText>
          ))}
        </View>
      </Card>
      <Card title={t('more:about.data.title')}>
        <Bullets size="sm" items={[t('more:about.data.uscis'), t('more:about.data.mirrors'), t('more:about.data.curated')]} />
      </Card>
      <Card title={t('more:about.code.title')}>
        <ExternalLink testID="about-repo" label={t('more:about.code.link')} url={REPOSITORY_URL} />
        <AppText size="sm" muted>
          {t('more:settings.data.versions', { app: appVersion(), schema: fmt.int(SCHEMA_VERSION), model: d.params.modelVersion })}
        </AppText>
      </Card>
    </Screen>
  );
}
