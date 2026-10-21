/**
 * S12 — Compartir / Share (`/case/share`; 00-product-spec.md S12, F21; 05 §4–§5).
 *
 * - The month-level "código de caso" comes from case-rules `shareCode()`: no receipt digits, no day
 *   dates, no nickname, no approval range; the office code only if the user opts in. The share
 *   language is chosen independently of the UI language.
 * - Native: the system share sheet. Web (artifact): a selectable text box plus "Copiar" through the
 *   guarded clipboard; on failure, "Mantenga presionado para copiar" (contract (e): no downloads,
 *   no dialogs).
 * - "Pegar un código para comparar": parsed locally with `parseShareCode()`, completed into a
 *   month-level case and run through `deriveFlags()` + `peerReasons()` next to the user's own case.
 *   Nothing is stored or uploaded (the pasted text lives only in this screen's state).
 * - With discreet mode on, the screen asks before revealing the code (in-app Sheet, never confirm()).
 */
import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import type { CaseTimeline, Lang, PeerReasonId } from '@caa/data-schemas';
import { deriveFlags, parseShareCode, peerReasons, shareCode } from '@caa/case-rules';
import { useData } from '@/data/useData';
import { useEstimate } from '@/data/useEstimate';
import { useLang } from '@/i18n/useLang';
import { copyText } from '@/platform/clipboard';
import { CAN_SHARE, share } from '@/platform/share';
import { useSettings } from '@/storage/settings';
import { AppText, Banner, Button, Card, Checklist, MIN_TOUCH, Select, Sheet, useTheme } from '@/ui';
import { channelLabel } from './format';
import { PeerReasonList } from './PeersScreen';
import { CaseFrame, ExampleBanner, NoCasePrompt } from './parts';
import { useCaseSubject } from './subject';

/** A pasted partial case → a complete month-level case for the local comparison (never stored). */
export function caseFromShare(p: Partial<CaseTimeline>): CaseTimeline | null {
  if (!p.entryChannel || !p.i485ReceiptDate) return null;
  const c: CaseTimeline = {
    schemaVersion: 1,
    localId: '00000000-0000-4000-8000-0000000000c0',
    nickname: 'compare',
    role: 'principal',
    entryChannel: p.entryChannel,
    i485ReceiptDate: p.i485ReceiptDate,
    i485ReceiptDateGranularity: 'month',
    concurrentI765: true,
    concurrentI131: null,
    withAttorney: null,
    basicDocs: { paroleRecord: null, nationalityProof: null, i693: null, photos: null, feeOrWaiver: null },
    milestones: p.milestones ?? [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  if (p.state) c.state = p.state;
  if (p.officeCode) c.officeCode = p.officeCode;
  return c;
}

function Compare({ mine }: { mine: PeerReasonId[] }) {
  const { t, fmt } = useLang();
  const theme = useTheme();
  const { policy, offices, content, today } = useData();
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ c: CaseTimeline; ids: PeerReasonId[] } | 'invalid' | null>(null);
  const run = () => {
    const parsed = parseShareCode(text);
    const c = parsed ? caseFromShare(parsed) : null;
    if (!c) {
      setResult('invalid');
      return;
    }
    const flags = deriveFlags(c, policy, today);
    setResult({ c, ids: peerReasons(c, flags, offices, today) });
  };
  return (
    <Card title={t('case:compare.title')} testID="share-compare">
      <AppText size="sm" muted>
        {t('case:compare.help')}
      </AppText>
      <TextInput
        testID="share-compare-input"
        accessibilityLabel={t('case:compare.title')}
        value={text}
        onChangeText={setText}
        placeholder={t('case:compare.placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        multiline
        autoCorrect={false}
        autoCapitalize="none"
        style={{
          minHeight: MIN_TOUCH * 2,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius,
          padding: theme.space(3),
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          fontSize: theme.font.md,
          textAlignVertical: 'top',
        }}
      />
      <View style={{ alignSelf: 'flex-start' }}>
        <Button testID="share-compare-button" variant="secondary" label={t('case:compare.button')} onPress={run} disabled={text.trim() === ''} />
      </View>
      {result === 'invalid' ? <Banner testID="share-compare-invalid" tone="warning" text={t('case:compare.invalid')} /> : null}
      {result && result !== 'invalid' ? (
        <View testID="share-compare-result" style={{ gap: theme.space(3) }}>
          <AppText weight="medium">{t('case:compare.summary', { channel: channelLabel(result.c.entryChannel, t), month: fmt.month(result.c.i485ReceiptDate.slice(0, 7)) })}</AppText>
          <AppText weight="medium">{t('case:compare.theirs')}</AppText>
          <PeerReasonList ids={result.ids} content={content} testPrefix="compare-theirs" />
          <AppText weight="medium">{t('case:compare.yours')}</AppText>
          <PeerReasonList ids={mine} content={content} testPrefix="compare-yours" />
          <AppText size="sm" muted>
            {t('case:compare.note')}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

export function ShareScreen() {
  const { t, lang } = useLang();
  const theme = useTheme();
  const { settings } = useSettings();
  const subject = useCaseSubject();
  const est = useEstimate(subject.estimateId);
  const [shareLang, setShareLang] = useState<Lang>(lang);
  const [includeOffice, setIncludeOffice] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [asking, setAsking] = useState(false);
  const [status, setStatus] = useState<'copied' | 'copyFailed' | 'shareFailed' | null>(null);
  const c = subject.timeline;
  const code = useMemo(() => {
    if (!c) return '';
    const r = est.result && est.result.kind === 'estimate' ? est.result : null;
    return shareCode(c, r, shareLang, { includeOffice });
  }, [c, est.result, shareLang, includeOffice]);
  const hidden = settings.discreet && !subject.isExample && !revealed;

  const onCopy = async () => setStatus((await copyText(code)) ? 'copied' : 'copyFailed');
  const onShare = async () => {
    if (!(await share(code))) setStatus('shareFailed');
  };
  const langOptions = [
    { value: 'es' as Lang, label: t('common:lang.es') },
    { value: 'en' as Lang, label: t('common:lang.en') },
  ];
  return (
    <CaseFrame title={t('case:share.title')} testID="screen-case-share" back>
      {c ? (
        <>
          <ExampleBanner />
          <AppText>{t('case:share.intro')}</AppText>
          <Card testID="share-card">
            <Select<Lang> testID="share-lang" label={t('case:share.lang')} value={shareLang} options={langOptions} onChange={setShareLang} />
            {c.officeCode ? (
              <Checklist
                testID="share-office"
                items={[{ key: 'office', label: t('case:share.includeOffice'), value: includeOffice }]}
                onChange={(_k, v) => setIncludeOffice(v === true)}
              />
            ) : null}
            {hidden ? (
              <View style={{ gap: theme.space(2) }}>
                <AppText muted testID="share-hidden">
                  {t('case:share.hidden')}
                </AppText>
                <View style={{ alignSelf: 'flex-start' }}>
                  <Button testID="share-reveal" variant="secondary" label={t('case:share.reveal.button')} onPress={() => setAsking(true)} />
                </View>
              </View>
            ) : (
              <View style={{ gap: theme.space(2) }}>
                <AppText size="sm" weight="medium">
                  {t('case:share.textLabel')}
                </AppText>
                <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius, padding: theme.space(3), backgroundColor: theme.colors.bg }}>
                  <AppText selectable testID="share-code">
                    {code}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
                  <Button testID="share-copy" label={t('case:share.copy')} onPress={() => void onCopy()} />
                  {CAN_SHARE ? <Button testID="share-share" variant="secondary" label={t('case:share.share')} onPress={() => void onShare()} /> : null}
                </View>
                {status ? <Banner testID="share-status" tone={status === 'copied' ? 'info' : 'warning'} text={t(`case:share.${status}`)} /> : null}
              </View>
            )}
          </Card>
          <Compare mine={est.peers} />
        </>
      ) : (
        <NoCasePrompt body={t('case:noCase.body')} />
      )}
      <Sheet
        testID="share-reveal-sheet"
        visible={asking}
        title={t('case:share.reveal.title')}
        body={t('case:share.reveal.body')}
        confirmLabel={t('case:share.reveal.confirm')}
        cancelLabel={t('common:action.cancel')}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false);
          setRevealed(true);
        }}
      />
    </CaseFrame>
  );
}
