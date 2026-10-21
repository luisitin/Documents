/**
 * `ConfidenceChip { level; validated }` (07 §6.0; 04 §8 item 8 "Status chips: 'No validado' and
 * confidence"; 00 S3 footer "No validado … Confianza: BAJA"). LOW is `warning` (amber), never red.
 */
import { View } from 'react-native';
import { useLang } from '../deps';
import { useTheme } from '../theme';
import { Chip } from './Chip';

export interface ConfidenceChipProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  validated: boolean;
  testID?: string;
}

const LEVEL_KEY = { LOW: 'common:confidence.low', MEDIUM: 'common:confidence.medium', HIGH: 'common:confidence.high' } as const;

export function ConfidenceChip({ level, validated, testID }: ConfidenceChipProps) {
  const { t } = useLang();
  const theme = useTheme();
  const confidence = t('common:confidence.label', { level: t(LEVEL_KEY[level]) });
  const validation = t(validated ? 'ui:chip.validated' : 'ui:chip.notValidated');
  return (
    <View testID={testID} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
      <Chip label={validation} tone={validated ? 'info' : 'warning'} />
      <Chip label={confidence} tone={level === 'LOW' ? 'warning' : level === 'MEDIUM' ? 'neutral' : 'info'} />
    </View>
  );
}
