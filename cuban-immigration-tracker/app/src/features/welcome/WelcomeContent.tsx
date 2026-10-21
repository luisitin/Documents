/**
 * S0 Bienvenida / Welcome (00-product-spec.md S0).
 *
 * - Step 1, language before anything else: two large buttons, "Español" / "English". The device
 *   locale is preselected (it is the default of `settings.lang`, es* → es, else en; WP6). A tap
 *   applies the language at once and persists it (owner requirement 1).
 * - Step 2, three cards: unofficial tool; your data stays on the device; statistical estimates,
 *   not legal advice (00 S0; disclaimer 00 §8).
 * - Actions: "Entendido" → Home; "Configurar mi caso" → the case form (WP8b, `/case/edit`).
 * - If storage is unavailable (web private mode) this still works; it simply appears again on the
 *   next visit (00 S0), because `onboardingDone` lives in memory only then.
 *
 * Used twice: by the `/welcome` modal route on native, and inline on the web Home tab (the
 * artifact never changes the visible URL and boots on `/`, Prove P2).
 */
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import type { Lang } from '@caa/data-schemas';
import { LANGS } from '@caa/i18n-core';
import { useLang } from '@/i18n/useLang';
import { DISCLAIMER_VERSION, useSettings } from '@/storage/settings';
import { AppText, Button, Card, Icon, MIN_TOUCH, toneWash, useTheme } from '@/ui';
import { Disclaimer } from '../home/shared';

export interface WelcomeContentProps {
  /** Called after onboarding is marked done, for "Entendido". */
  onDone(): void;
  /** Called after onboarding is marked done, for "Configurar mi caso". */
  onSetup(): void;
  /** Inline on the web Home tab: the screen already carries the disclaimer at its foot. */
  inline?: boolean;
  testID?: string;
}

const LANG_NAME = { es: 'common:lang.es', en: 'common:lang.en' } as const;

function LangChoice({ lang, selected, onPress }: { lang: Lang; selected: boolean; onPress(): void }) {
  const theme = useTheme();
  const { t } = useLang();
  const name = t(LANG_NAME[lang]);
  return (
    <Pressable
      testID={`welcome-lang-${lang}`}
      accessibilityRole="radio"
      accessibilityLabel={name}
      accessibilityState={{ checked: selected, selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: 140,
        minHeight: MIN_TOUCH * 1.5,
        borderRadius: theme.radius,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        backgroundColor: selected ? toneWash(theme, 'info') : theme.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space(2),
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {selected ? <Icon name="check" size={20} color={theme.colors.accent} /> : null}
      <AppText size="lg" weight={selected ? 'bold' : 'medium'}>
        {name}
      </AppText>
    </Pressable>
  );
}

export function WelcomeContent({ onDone, onSetup, inline = false, testID = 'welcome' }: WelcomeContentProps) {
  const theme = useTheme();
  const { t, lang, setLang } = useLang();
  const { update } = useSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const finish = (next: () => void) => {
    update({ onboardingDone: true, disclaimerVersion: DISCLAIMER_VERSION });
    next();
  };
  const deviceCard = Platform.OS === 'web' ? t('welcome:card.device.web') : t('welcome:card.device');
  return (
    <View testID={testID} style={{ gap: theme.space(3) }}>
      <Card title={t('welcome:title')} tone="info">
        <AppText>{t('welcome:intro')}</AppText>
      </Card>
      <View testID="welcome-step-1" style={{ gap: theme.space(2) }}>
        <AppText header size="lg" weight="bold">
          {t('welcome:step1.title')}
        </AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
          {LANGS.map((l) => (
            <LangChoice key={l} lang={l} selected={lang === l} onPress={() => setLang(l)} />
          ))}
        </View>
        <AppText size="sm" muted>
          {t('welcome:step1.hint')}
        </AppText>
        {step === 1 ? <Button testID="welcome-continue" label={t('common:action.continue')} onPress={() => setStep(2)} /> : null}
      </View>
      {step === 2 ? (
        <View testID="welcome-step-2" style={{ gap: theme.space(2) }}>
          <AppText header size="lg" weight="bold">
            {t('welcome:step2.title')}
          </AppText>
          <Card>
            <AppText>{t('common:disclaimer.unofficial')}</AppText>
          </Card>
          <Card>
            <AppText>{deviceCard}</AppText>
          </Card>
          <Card>
            <AppText>{t('common:disclaimer.estimates')}</AppText>
          </Card>
          <Button testID="welcome-ok" label={t('welcome:action.ok')} onPress={() => finish(onDone)} />
          <Button testID="welcome-setup" variant="secondary" label={t('welcome:action.setup')} onPress={() => finish(onSetup)} />
          <AppText size="xs" muted>
            {t('welcome:storageNote')}
          </AppText>
        </View>
      ) : null}
      {inline ? null : <Disclaimer />}
    </View>
  );
}
