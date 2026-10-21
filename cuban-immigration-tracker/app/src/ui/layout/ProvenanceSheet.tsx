/**
 * The provenance sheet opened from the DataStatusChip (00 §5 "tapping it opens the provenance
 * sheet"; 00 §1.1 "What live means"). It lists the data dates, the QA status and every source
 * with its last status from `manifest.sources` (03 §6). Text only: no links that open windows,
 * no downloads (contract (e)).
 */
import { Modal, Pressable, ScrollView, View } from 'react-native';
import type { DataStatus, Manifest } from '@caa/data-schemas';
import { localize } from '@caa/i18n-core';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { useLang } from '../deps';
import { quarterLabel } from '../format';
import { CONTENT_MAX_WIDTH, useTheme } from '../theme';

export interface ProvenanceSheetProps {
  visible: boolean;
  onClose(): void;
  status: DataStatus;
  manifest: Manifest;
  artifactBuiltAt?: string;
  refreshing: boolean;
  onRefresh?(): void;
}

export function ProvenanceSheet({ visible, onClose, status, manifest, artifactBuiltAt, refreshing, onRefresh }: ProvenanceSheetProps) {
  const theme = useTheme();
  const { t, fmt, lang } = useLang();
  const built = artifactBuiltAt ?? manifest.artifactBuiltAt;
  const rows: string[] = [
    t('ui:provenance.latestMonth', { month: fmt.monthLong(manifest.latestOfficialMonth) }),
    t('ui:provenance.latestQuarter', { quarter: quarterLabel(manifest.latestOfficialQuarter, lang) }),
    ...(manifest.latestProcessingTimesPublication ? [t('ui:provenance.processingTimes', { date: fmt.date(manifest.latestProcessingTimesPublication) })] : []),
    t('ui:provenance.dataChangedAt', { date: fmt.date(manifest.dataChangedAt) }),
    t('ui:provenance.lastCheckedAt', { date: fmt.date(manifest.lastCheckedAt) }),
    ...(built ? [t('ui:provenance.artifactBuiltAt', { date: fmt.date(built) })] : []),
  ];
  const notes = manifest.qa.notes.map((n) => localize(n, lang));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common:action.close')}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        />
        <View
          testID="provenance-sheet"
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            maxHeight: '85%',
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius * 1.5,
            borderTopRightRadius: theme.radius * 1.5,
            padding: theme.space(5),
            gap: theme.space(3),
          }}
        >
          <AppText header size="lg" weight="bold">
            {t('ui:provenance.title')}
          </AppText>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: theme.space(3) }}>
            <AppText>{t(`ui:provenance.explain.${status}`)}</AppText>
            <AppText size="sm" muted>
              {t('ui:provenance.liveMeaning')}
            </AppText>
            <View style={{ gap: theme.space(1) }}>
              {rows.map((r) => (
                <AppText key={r} size="sm">
                  {r}
                </AppText>
              ))}
            </View>
            <AppText size="sm" weight="medium" tone={manifest.qa.status === 'ok' ? 'neutral' : 'warning'}>
              {t(`ui:provenance.qa.${manifest.qa.status}`)}
            </AppText>
            {notes.map((n) => (
              <AppText key={n} size="sm" muted>
                {n}
              </AppText>
            ))}
            <View style={{ gap: theme.space(1) }}>
              <AppText weight="medium">{t('ui:provenance.sources')}</AppText>
              {manifest.sources.map((s) => {
                const pp = s.publishedPeriod;
                const shown = pp === undefined ? '' : /^\d{4}-\d{2}$/.test(pp) ? fmt.month(pp) : /^\d{4}-\d{2}-\d{2}$/.test(pp) ? fmt.date(pp) : pp;
                const period = shown ? t('ui:provenance.sourcePeriod', { period: shown }) : '';
                const line = t('ui:provenance.sourceLine', { source: t(`ui:source.${s.id}`), status: t(`ui:sourceStatus.${s.status}`) });
                const text = period ? `${line} · ${period}` : line;
                return (
                  <AppText key={`${s.id}-${s.url}`} size="sm" muted>
                    {text}
                  </AppText>
                );
              })}
            </View>
            <AppText size="sm" muted>
              {t('common:disclaimer.unofficial')}
            </AppText>
          </ScrollView>
          {onRefresh && status !== 'sample' && status !== 'published' ? (
            <Button variant="secondary" label={refreshing ? t('ui:status.refreshing') : t('common:action.refresh')} disabled={refreshing} onPress={onRefresh} />
          ) : null}
          <Button testID="provenance-close" label={t('common:action.close')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
