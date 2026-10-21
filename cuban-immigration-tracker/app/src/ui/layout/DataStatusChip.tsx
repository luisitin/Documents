/**
 * `DataStatusChip {}` (07 §6.0; 00 §5.1; F13; owner requirement 2: every screen shows an "as of"
 * date and whether the data is live or sample). Reads WP6's `useData()` itself. Tapping it opens
 * the provenance sheet. `testID="data-status"` is the Prove selector (07 §9 P1, P8).
 */
import { useState } from 'react';
import { Pressable } from 'react-native';
import { AppText } from '../components/AppText';
import { useData, useLang } from '../deps';
import { MIN_TOUCH, toneWash, useTheme } from '../theme';
import { statusLine } from './dataStatus';
import { ProvenanceSheet } from './ProvenanceSheet';

export interface DataStatusChipProps {
  testID?: string;
}

function nowMs(): number {
  try {
    return Date.now();
  } catch {
    return NaN;
  }
}

export function DataStatusChip({ testID = 'data-status' }: DataStatusChipProps = {}) {
  const theme = useTheme();
  const { t, lang } = useLang();
  const data = useData();
  const [open, setOpen] = useState(false);
  const line = statusLine({ status: data.status, manifest: data.manifest, asOf: data.asOf }, lang, nowMs());
  const text = data.refreshing ? `${line} · ${t('ui:status.refreshing')}` : line;
  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={t('ui:status.a11y', { status: text })}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          minHeight: MIN_TOUCH,
          justifyContent: 'center',
          alignSelf: 'flex-start',
          maxWidth: '100%',
          paddingHorizontal: theme.space(3),
          paddingVertical: theme.space(1),
          borderRadius: theme.radius,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: toneWash(theme, data.status === 'sample' ? 'warning' : 'neutral'),
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <AppText size="sm" muted>
          {text}
        </AppText>
      </Pressable>
      <ProvenanceSheet
        visible={open}
        onClose={() => setOpen(false)}
        status={data.status}
        manifest={data.manifest}
        artifactBuiltAt={data.asOf.artifactBuiltAt}
        refreshing={data.refreshing}
        onRefresh={() => {
          void data.refresh();
        }}
      />
    </>
  );
}
