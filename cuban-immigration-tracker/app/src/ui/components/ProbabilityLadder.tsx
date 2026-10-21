/**
 * `ProbabilityLadder { rows: { months; p }[] }` (07 §6.0; 04 §8 item 3 "Ladder at 3/6/12/24/36
 * months"; item 2 word labels with fixed thresholds, via `probWord`; 00 S3 §3).
 * Each row shows the horizon, a bar, the percentage (`fmt.pct`) and the word label. The bars are
 * drawn with plain Views (no chart library) and the row is one accessible sentence.
 */
import { View } from 'react-native';
import { pluralKey, probWord } from '@caa/i18n-core';
import { useLang } from '../deps';
import { useTheme } from '../theme';
import { AppText } from './AppText';

export interface ProbabilityLadderProps {
  rows: { months: number; p: number }[];
  testID?: string;
}

export function ProbabilityLadder({ rows, testID }: ProbabilityLadderProps) {
  const theme = useTheme();
  const { t, fmt, lang } = useLang();
  return (
    <View testID={testID ?? 'ladder'} style={{ gap: theme.space(2) }}>
      {rows.map((r) => {
        const horizon = t(pluralKey('common:unit.month', r.months), { n: fmt.int(r.months) });
        const pct = fmt.pct(r.p);
        const word = probWord(r.p, lang);
        const share = Number.isFinite(r.p) ? Math.min(1, Math.max(0, r.p)) : 0;
        return (
          <View
            key={r.months}
            testID={`ladder-row-${r.months}`}
            accessible
            accessibilityLabel={t('ui:ladder.a11y', { horizon, p: pct, word })}
            style={{ gap: theme.space(1) }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: theme.space(2) }}>
              <AppText weight="medium" style={{ minWidth: 76 }}>
                {horizon}
              </AppText>
              <AppText weight="bold">{pct}</AppText>
              <AppText size="sm" muted>
                {word}
              </AppText>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.border, overflow: 'hidden' }}>
              <View style={{ width: `${share * 100}%`, height: 8, borderRadius: 4, backgroundColor: theme.colors.chart1 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
