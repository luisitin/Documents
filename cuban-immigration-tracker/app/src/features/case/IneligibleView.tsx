/**
 * S9 — Su entrada (I-220A u otra no elegible) / Your entry (00-product-spec.md S9).
 *
 * Facts (research 00-key-facts-for-the-app.md §1 `excluded_entry_channels`, §9 litigation row
 * "Bello-Rubio v. Noem (I-220A), S.D. Fla. 1:25-cv-23665: MTD denied 09-10"):
 * - I-220A is not parole under Matter of Cabrera-Fernández, 28 I&N Dec. 747 (BIA 2023), so no CAA
 *   estimate; Bello-Rubio survived the motion to dismiss on 2026-09-10 with no holding yet; a BIA
 *   decision after the Labrada-Hechavarria remand is pending. No court has held that an I-220A is
 *   parole.
 * - EWI and INA 236 conditional parole are also excluded (key facts §1); copy ends with "consulte a
 *   un abogado o representante acreditado".
 *
 * No numbers are rendered here: no probability, no ladder, no time frame (07 WP8b "I-220A → S9 with
 * no numbers anywhere"; T26).
 */
import { View } from 'react-native';
import type { DerivedFlags } from '@caa/data-schemas';
import { useLang } from '@/i18n/useLang';
import { AppText, Banner, Button, Card, useTheme } from '@/ui';
import { useCaseNav } from './parts';

/** Bello-Rubio (S.D. Fla. 1:25-cv-23665): motion to dismiss denied (key facts §9). */
export const BELLO_RUBIO_MTD_DENIED = '2026-09-10';

type Reason = Exclude<DerivedFlags['noEstimateReason'], null>;

export function IneligibleContent({ reason }: { reason: Reason }) {
  const { t, fmt } = useLang();
  const theme = useTheme();
  const nav = useCaseNav();
  const body =
    reason === 'i220a' ? t('case:ineligible.i220a.body', { belloDate: fmt.date(BELLO_RUBIO_MTD_DENIED) })
      : reason === 'ewi' ? t('case:ineligible.ewi.body')
        : reason === 'conditional_parole_236' ? t('case:ineligible.conditional_parole_236.body')
          : t('case:ineligible.decided.body');
  const consult = reason === 'decided' ? null : reason === 'i220a' ? t('common:legal.consult') : t('case:ineligible.consult');
  return (
    <View testID={`ineligible-${reason}`} style={{ gap: theme.space(3) }}>
      <Card title={t('case:ineligible.title')}>
        <AppText testID="ineligible-body">{body}</AppText>
        {consult ? <AppText weight="medium">{consult}</AppText> : null}
        <AppText size="sm" muted>
          {t('case:ineligible.noNumbers')}
        </AppText>
      </Card>
      {reason === 'decided' ? null : <Banner testID="ineligible-scam" tone="warning" text={t('common:disclaimer.antiScam')} />}
      <View style={{ gap: theme.space(2) }}>
        {reason === 'i220a' ? (
          <Button testID="ineligible-alerts" variant="secondary" label={t('case:ineligible.followAlerts')} onPress={() => nav.push('/alerts')} />
        ) : null}
        <Button testID="ineligible-edit" variant="link" label={t('case:ineligible.changeEntry')} onPress={() => nav.push('/case/edit')} />
      </View>
    </View>
  );
}
