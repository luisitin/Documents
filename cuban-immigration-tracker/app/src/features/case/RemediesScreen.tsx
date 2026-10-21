/**
 * S7 — ¿Qué puedo hacer? / What can I do? (`/case/remedies`; 00-product-spec.md S7; research
 * 15-delay-remedies.md §9.1 decision tree, §9.4 copy; key facts §5).
 *
 * The ladder is computed by case-rules `remedyLadder()` (through `useEstimate()`), in the S7 order
 * a (I-485), a ((c)(9)), b, d, c, e, f — or the single denial step. Each rung shows its state
 * (✓ disponible / ✕ aún no (ETA) / ⚠ depende / — no aplica), its body with the step's params
 * formatted through `fmt`, and expands into steps. The gate's inquiry date is shown, or "no
 * disponible" with no gate decision. Expedite and mandamus end with "consulte a un abogado o
 * representante acreditado"; the mandamus fee comes from `policy.fees` (`mandamusFiling`).
 * External links: native opens the browser; on web (artifact contract e) the URL is plain text.
 * The disclaimer "Esto no es asesoría legal." is pinned at the top; the anti-scam note follows.
 */
import { useState } from 'react';
import { View } from 'react-native';
import type { RemedyStep } from '@caa/data-schemas';
import { useData } from '@/data/useData';
import { useEstimate } from '@/data/useEstimate';
import { useLang } from '@/i18n/useLang';
import { CAN_OPEN_URLS, openUrl } from '@/platform/openUrl';
import { AppText, Banner, Button, Card, Chip, useTheme, type Tone } from '@/ui';
import { LEGAL_RUNGS, REMEDY_URLS, remedyVars, rungStateLabel } from './format';
import { CaseFrame, ExampleBanner, NoCasePrompt } from './parts';
import { useCaseSubject } from './subject';

const STATE_TONE: Record<RemedyStep['state'], Tone> = { available: 'info', not_yet: 'neutral', depends: 'warning', not_applicable: 'neutral' };

function Rung({ step }: { step: RemedyStep }) {
  const { t, fmt, lang } = useLang();
  const theme = useTheme();
  const { policy } = useData();
  const [open, setOpen] = useState(false);
  const vars = remedyVars(step, t, fmt);
  const paragraphs = [t(step.bodyKey as `remedies:${string}`, vars)];
  if (step.rung === 'e' && step.state !== 'not_applicable') {
    const fee = policy.fees.find((f) => f.id === 'mandamusFiling');
    if (fee) paragraphs.push(t('remedies:e.fee', { fee: t('common:money.usd', { amount: fmt.int(fee.usd) }), asOf: fmt.date(fee.asOf ?? policy.reviewedAt) }));
  }
  if (step.rung === 'denial' && step.params.deadlineDate !== undefined) paragraphs.push(t('remedies:denial.deadline', vars));
  if ((step.rung === 'a_i485' || step.rung === 'a_c9') && step.state !== 'not_applicable') {
    const inquiry = step.gate?.inquiryDate;
    paragraphs.push(inquiry ? t('remedies:gate.inquiry', { date: fmt.date(inquiry) }) : t('remedies:gate.notAvailable'));
  }
  if (LEGAL_RUNGS.includes(step.rung) && step.state !== 'not_applicable') paragraphs.push(t('remedies:legal.consult'));
  const url = REMEDY_URLS[step.rung]?.[lang];
  const stateLabel = rungStateLabel(step, t, fmt);
  const steps = t(`remedies:${step.rung}.steps`);
  return (
    <Card title={t(step.titleKey as `remedies:${string}`)} testID={`remedy-${step.rung}`}>
      <View style={{ alignSelf: 'flex-start' }}>
        <Chip testID={`remedy-${step.rung}-state`} label={stateLabel} tone={STATE_TONE[step.state]} />
      </View>
      {paragraphs.map((p, i) => (
        <AppText key={i} testID={i === 0 ? `remedy-${step.rung}-body` : undefined}>
          {p}
        </AppText>
      ))}
      {step.state !== 'not_applicable' ? (
        <View style={{ gap: theme.space(2) }}>
          <View style={{ alignSelf: 'flex-start' }}>
            <Button testID={`remedy-${step.rung}-toggle`} variant="link" label={open ? t('remedies:collapse') : t('remedies:expand')} onPress={() => setOpen((v) => !v)} />
          </View>
          {open ? <AppText testID={`remedy-${step.rung}-steps`}>{steps}</AppText> : null}
          {open && url ? (
            CAN_OPEN_URLS ? (
              <View style={{ alignSelf: 'flex-start' }}>
                <Button variant="secondary" label={t('remedies:link.open')} accessibilityHint={url} onPress={() => void openUrl(url)} />
              </View>
            ) : (
              <AppText size="sm" selectable testID={`remedy-${step.rung}-url`}>
                {t('remedies:link.label', { url })}
              </AppText>
            )
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export function RemediesScreen() {
  const { t, fmt } = useLang();
  const theme = useTheme();
  const { policy } = useData();
  const subject = useCaseSubject();
  const est = useEstimate(subject.estimateId);
  const k = policy.classes.redEagle;
  return (
    <CaseFrame title={t('remedies:title')} testID="screen-case-remedies" back discreet>
      <Banner testID="remedies-pinned" tone="neutral" text={t('remedies:pinned')} />
      {subject.timeline ? (
        <>
          <ExampleBanner />
          <AppText>{t('remedies:intro')}</AppText>
          {est.flags?.redEagleAppearsInClass ? (
            <Banner testID="remedies-red-eagle" tone="info" text={t('remedies:redEagle', { docket: k.docket, date: fmt.date(k.notFinallyAdjudicatedOn) })} />
          ) : null}
          <View testID="remedies-ladder" style={{ gap: theme.space(3) }}>
            {est.remedies.map((s) => (
              <Rung key={s.rung} step={s} />
            ))}
          </View>
        </>
      ) : (
        <NoCasePrompt body={t('case:noCase.body')} />
      )}
      <Banner testID="remedies-scam" tone="warning" text={t('common:disclaimer.antiScam')} />
      <AppText size="sm" muted testID="case-disclaimer">
        {t('common:disclaimer.full')}
      </AppText>
    </CaseFrame>
  );
}
