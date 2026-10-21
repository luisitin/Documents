/**
 * S4 — ¿Por qué a otros sí y a mí no? / Why did others get it and not me? (`/case/peers`;
 * 00-product-spec.md S4; 04 §9.2 U2).
 *
 * "Posibles razones / Possible reasons": the ids come from case-rules `peerReasons()` (exact U2
 * sets) via `useEstimate()`, the copy and the confidence of each reason from `content.json`
 * `peerReasons` (curated, bilingual). The screen never says which reason applies, and it ends with
 * the neighbour/screenshot caveat. The national-pool note explains why the probability does not
 * differ by channel or EAD (00 §3 principle 5; U7).
 */
import { View } from 'react-native';
import type { ContentFile, Lang, PeerReasonCopy, PeerReasonId } from '@caa/data-schemas';
import { localize } from '@caa/i18n-core';
import { useData } from '@/data/useData';
import { useEstimate } from '@/data/useEstimate';
import { useLang } from '@/i18n/useLang';
import { AppText, Banner, Button, Card, Chip, useTheme } from '@/ui';
import type { T } from './format';
import { CaseFrame, ExampleBanner, NoCasePrompt, useCaseNav } from './parts';
import { useCaseSubject } from './subject';

const CONF_TONE: Record<PeerReasonCopy['confidence'], 'neutral' | 'info' | 'warning'> = { low: 'warning', medium: 'neutral', medium_high: 'info', high: 'info' };

/** One reason card list (also used by the S12 comparison). */
export function PeerReasonList({ ids, content, testPrefix = 'peer' }: { ids: PeerReasonId[]; content: ContentFile; testPrefix?: string }) {
  const { t, lang } = useLang();
  const theme = useTheme();
  if (ids.length === 0) return <AppText muted>{t('peers:empty')}</AppText>;
  return (
    <View testID={`${testPrefix}-list`} style={{ gap: theme.space(3) }}>
      {ids.map((id) => (
        <PeerReason key={id} id={id} copy={content.peerReasons.find((p) => p.id === id)} t={t} lang={lang} testID={`${testPrefix}-${id}`} />
      ))}
    </View>
  );
}

function PeerReason({ id, copy, t, lang, testID }: { id: PeerReasonId; copy: PeerReasonCopy | undefined; t: T; lang: Lang; testID: string }) {
  const theme = useTheme();
  const text = copy ? localize(copy.text, lang) : id;
  const level = copy?.confidence ?? 'low';
  const chip = t('peers:confidence.chip', { level: t(`peers:confidence.${level}`) });
  return (
    <View testID={testID} style={{ gap: theme.space(1.5), borderLeftWidth: 3, borderLeftColor: theme.colors.border, paddingLeft: theme.space(3) }}>
      <AppText>{text}</AppText>
      <View style={{ alignSelf: 'flex-start' }}>
        <Chip label={chip} tone={CONF_TONE[level]} />
      </View>
    </View>
  );
}

export function PeersScreen() {
  const { t } = useLang();
  const theme = useTheme();
  const nav = useCaseNav();
  const { content } = useData();
  const subject = useCaseSubject();
  const est = useEstimate(subject.estimateId);
  const ineligible = est.flags !== null && est.flags.noEstimateReason !== null && est.flags.noEstimateReason !== 'decided';
  return (
    <CaseFrame title={t('peers:title')} testID="screen-case-peers" back discreet>
      {subject.timeline ? (
        <>
          <ExampleBanner />
          <Card title={t('peers:subtitle')} testID="peers-card">
            <AppText>{t('peers:intro')}</AppText>
            {ineligible ? <Banner tone="info" text={t('peers:ineligible')} /> : <PeerReasonList ids={est.peers} content={content} />}
          </Card>
          <AppText size="sm" muted>
            {t('peers:national')}
          </AppText>
          <Banner testID="peers-closing" tone="neutral" text={t('peers:closing')} />
          <View style={{ alignSelf: 'flex-start', gap: theme.space(2) }}>
            <Button testID="peers-compare" variant="secondary" label={t('peers:compare')} onPress={() => nav.push('/case/share')} />
          </View>
        </>
      ) : (
        <NoCasePrompt body={t('case:noCase.body')} />
      )}
    </CaseFrame>
  );
}
