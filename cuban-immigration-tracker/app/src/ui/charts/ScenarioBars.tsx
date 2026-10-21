/**
 * `ScenarioBars { perScenario }` (07 §6.0; 00 S3 item 7 "Scenario cards: Estancamiento 30 %
 * (P12 2 %) · Recuperación parcial 40 % (10 %) · Ritmo de fines de 2024 (oct–dic 2024) 15 %
 * (26 %) · Nueva pausa 15 % (4 %)"; 04 §6.1 scenario definitions, §8 item 5 "Scenario cards show
 * the weight, the posterior weight, P12 and q50").
 *
 * One row per scenario: the bar is the scenario weight in use (`weight`, after data and alert
 * updates); the text gives the prior→updated weight, P(decision ≤ 12 months) and the median
 * (or "más de 6 años" when q50 is null, 04 §8 item 4). Scenario names come from `labels`
 * (additive prop: the screen passes `localize(policy.scenarios[i].label)`), falling back to the
 * `ui:scenario.*` names.
 */
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { EstimateOk, ScenarioId } from '@caa/data-schemas';
import { pluralKey } from '@caa/i18n-core';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { TableTwin } from '../components/TableTwin';
import { useLang } from '../deps';
import { useTheme } from '../theme';

export interface ScenarioBarsProps {
  perScenario: EstimateOk['perScenario'];
  labels?: Partial<Record<ScenarioId, string>>;
  testID?: string;
}

export function ScenarioBars({ perScenario, labels, testID = 'scenario-bars' }: ScenarioBarsProps) {
  const theme = useTheme();
  const { t, fmt } = useLang();
  const [width, setWidth] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width));
  const name = (id: ScenarioId) => labels?.[id] ?? t(`ui:scenario.${id}`);
  const median = (q: number | null) => (q === null ? t('common:unit.moreThanSixYears') : t(pluralKey('common:unit.month', q), { n: fmt.int(q) }));
  const rows = perScenario.map((s) => [name(s.id), fmt.pct(s.weight), fmt.pct(s.posteriorWeight), fmt.pct(s.p12), median(s.q50)]);
  return (
    <View testID={testID} style={{ gap: theme.space(3), width: '100%' }} onLayout={onLayout}>
      {perScenario.map((s) => {
        const detail = t('ui:scenario.detail', { weight: fmt.pct(s.weight), posterior: fmt.pct(s.posteriorWeight), p12: fmt.pct(s.p12), median: median(s.q50) });
        const w = Math.max(0, width);
        const filled = Math.max(0, Math.min(1, s.weight)) * w;
        return (
          <View key={s.id} testID={`${testID}-${s.id}`} accessible accessibilityLabel={`${name(s.id)}: ${detail}`} style={{ gap: theme.space(1) }}>
            <AppText weight="medium">{name(s.id)}</AppText>
            {w > 0 ? (
              <Svg width={w} height={10}>
                <Rect x={0} y={0} width={w} height={10} rx={4} fill={theme.colors.border} />
                {filled > 0 ? <Rect x={0} y={0} width={Math.max(4, filled)} height={10} rx={4} fill={theme.colors.chart1} /> : null}
              </Svg>
            ) : null}
            <AppText size="sm" muted>
              {detail}
            </AppText>
          </View>
        );
      })}
      <Button
        testID={`${testID}-table-toggle`}
        variant="link"
        label={showTable ? t('ui:table.hide') : t('ui:table.show')}
        onPress={() => setShowTable((v) => !v)}
      />
      {showTable ? (
        <TableTwin
          testID={`${testID}-table`}
          caption={t('ui:scenario.caption')}
          columns={[t('ui:scenario.col.name'), t('ui:scenario.col.prior'), t('ui:scenario.col.posterior'), t('ui:scenario.col.p12'), t('ui:scenario.col.median')]}
          rows={rows}
        />
      ) : null}
    </View>
  );
}
