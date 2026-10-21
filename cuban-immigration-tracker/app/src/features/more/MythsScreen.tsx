/**
 * S10 ¿Es verdad? / Is it true? (00-product-spec.md S10; F18): myth cards rendered from
 * `content.json` (curated, WP9; WP8a acceptance "The myths render from content.json"), each with
 * its verdict, explanation and sources, plus the permanent anti-scam card (00 §8). The holds were
 * vacated under the APA, not found unconstitutional (doc 03 §12; 05 §5.5): that wording is in the
 * curated data and checked by `i18n:check`.
 */
import { View } from 'react-native';
import type { Myth } from '@caa/data-schemas';
import { localize } from '@caa/i18n-core';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppHeader, AppText, Card, Chip, Screen, useTheme, type Tone } from '@/ui';
import { EVIDENCE_KEY } from '../alerts/copy';
import { BackLink, Disclaimer, ExternalLink, sourceLabel } from '../home/shared';

const VERDICT_TONE: Record<Myth['verdict'], Tone> = { false: 'warning', misleading: 'warning', true: 'info', unknown: 'neutral' };

export function MythsScreen() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const myths = d.content.myths;
  return (
    <Screen testID="screen-more-myths">
      <AppHeader title={t('more:myths.title')} />
      <BackLink label={t('more:back')} fallback="/more" />
      <AppText>{t('more:myths.intro')}</AppText>
      <Card title={t('more:scam.title')} tone="warning" testID="myths-scam">
        <AppText>{t('common:disclaimer.antiScam')}</AppText>
      </Card>
      {myths.length === 0 ? (
        <Card testID="myths-empty">
          <AppText>{t('more:myths.empty')}</AppText>
        </Card>
      ) : (
        <View testID="myths-list" style={{ gap: theme.space(3) }}>
          {myths.map((m) => (
            <Card key={m.id} testID={`myth-${m.id}`}>
              <AppText size="sm" weight="medium" muted>
                {t('more:myths.claim')}
              </AppText>
              <AppText header size="lg" weight="bold">
                {localize(m.claim, lang)}
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(1.5), alignItems: 'center' }}>
                <Chip testID={`myth-verdict-${m.id}`} tone={VERDICT_TONE[m.verdict]} label={t(`more:verdict.${m.verdict}`)} />
                {m.since ? (
                  <AppText size="sm" muted>
                    {t('more:myths.since', { date: fmt.date(m.since) })}
                  </AppText>
                ) : null}
              </View>
              <AppText>{localize(m.explanation, lang)}</AppText>
              {m.sources.length ? (
                <View style={{ gap: theme.space(1) }}>
                  <AppText size="sm" weight="medium" muted>
                    {t('alerts:sources')}
                  </AppText>
                  {m.sources.map((s) => (
                    <ExternalLink key={s.url} label={t('alerts:sourceItem', { label: sourceLabel(s, lang, fmt), evidence: t(EVIDENCE_KEY[s.evidence]) })} url={s.url} />
                  ))}
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}
      <Disclaimer />
    </Screen>
  );
}
