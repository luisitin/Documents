/**
 * `LangToggle {}` (07 §6.0; owner requirement 1; 00 §5 header and F12).
 *
 * A pill "ES | EN" with the active language in bold. One tap switches the whole app at runtime
 * through WP6's `useLang().setLang` (which persists the choice and reschedules notifications).
 * Hit area ≥ 48 × 48 (00 §5, WP7 acceptance). Accessibility label from 00 §5: "Cambiar el idioma
 * a inglés" / "Switch language to Spanish". `testID="lang-toggle"` is the Prove selector (07 §9 P6).
 */
import { Pressable, View } from 'react-native';
import { otherLang } from '@caa/i18n-core';
import { useLang } from '../deps';
import { AppText } from '../components/AppText';
import { Icon } from '../icons';
import { MIN_TOUCH, useTheme } from '../theme';

export interface LangToggleProps {
  testID?: string;
}

export function LangToggle({ testID = 'lang-toggle' }: LangToggleProps = {}) {
  const theme = useTheme();
  const { lang, setLang, t } = useLang();
  const es = t('ui:lang.code.es');
  const en = t('ui:lang.code.en');
  const activeStyle = { color: theme.colors.accent };
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t('ui:langToggle.a11y')}
      accessibilityHint={t('ui:langToggle.hint')}
      onPress={() => setLang(otherLang(lang))}
      hitSlop={4}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH,
        minWidth: MIN_TOUCH,
        paddingHorizontal: theme.space(3),
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space(1.5),
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name="language" size={18} color={theme.colors.textMuted} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space(1) }}>
        <AppText weight={lang === 'es' ? 'bold' : 'regular'} muted={lang !== 'es'} style={lang === 'es' ? activeStyle : undefined}>
          {es}
        </AppText>
        <AppText muted>|</AppText>
        <AppText weight={lang === 'en' ? 'bold' : 'regular'} muted={lang !== 'en'} style={lang === 'en' ? activeStyle : undefined}>
          {en}
        </AppText>
      </View>
    </Pressable>
  );
}
