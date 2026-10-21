/**
 * S10 Glosario / Glossary (00-product-spec.md S10; F19): key facts §10, curated into
 * `content.glossaryExtra` (WP9), searchable in both languages at once (accent- and
 * case-insensitive), so a Spanish speaker can look up the English form on a USCIS notice and the
 * other way round. The search text stays in memory only.
 */
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { otherLang, localize } from '@caa/i18n-core';
import { useData } from '@/data/useData';
import { useLang } from '@/i18n/useLang';
import { AppHeader, AppText, Card, MIN_TOUCH, Screen, useTheme } from '@/ui';
import { BackLink, Disclaimer, fold } from '../home/shared';

export function GlossaryScreen() {
  const d = useData();
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const [q, setQ] = useState('');
  const other = otherLang(lang);
  const needle = fold(q.trim());
  const entries = d.content.glossaryExtra
    .filter((g) => !needle || [g.term.es, g.term.en, g.definition.es, g.definition.en].some((s) => fold(s).includes(needle)))
    .sort((a, b) => (fold(localize(a.term, lang)) < fold(localize(b.term, lang)) ? -1 : 1));
  return (
    <Screen testID="screen-more-glossary">
      <AppHeader title={t('more:glossary.title')} />
      <BackLink label={t('more:back')} fallback="/more" />
      <View style={{ gap: theme.space(1) }}>
        <AppText weight="medium">{t('more:glossary.search')}</AppText>
        <TextInput
          testID="glossary-search"
          value={q}
          onChangeText={setQ}
          placeholder={t('more:glossary.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={t('more:glossary.search')}
          autoCorrect={false}
          autoCapitalize="none"
          style={{
            minHeight: MIN_TOUCH,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius,
            paddingHorizontal: theme.space(3),
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            fontSize: theme.font.md,
          }}
        />
        <AppText size="sm" muted testID="glossary-count">
          {t(entries.length === 1 ? 'more:glossary.count.one' : 'more:glossary.count.other', { n: fmt.int(entries.length) })}
        </AppText>
      </View>
      {entries.length === 0 ? (
        <Card testID="glossary-empty">
          <AppText>{t('more:glossary.empty', { q: q.trim() })}</AppText>
        </Card>
      ) : (
        <View testID="glossary-list" style={{ gap: theme.space(2) }}>
          {entries.map((g) => (
            <Card key={`${g.term.en}|${g.term.es}`}>
              <AppText weight="bold">{localize(g.term, lang)}</AppText>
              <AppText size="sm" muted>
                {t(`more:glossary.otherLang.${other}`, { term: localize(g.term, other) })}
              </AppText>
              <AppText>{localize(g.definition, lang)}</AppText>
            </Card>
          ))}
        </View>
      )}
      <Disclaimer />
    </Screen>
  );
}
