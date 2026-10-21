/**
 * `Checklist { items: { key; label; value: boolean | null }[]; onChange(key, v) }` (07 §6.0;
 * 00 S2 step 5 "Documentos básicos": every item answers Sí / No / No sé). `null` = No sé /
 * not answered, so an unanswered item never counts as complete (case-rules `approvalCard`).
 */
import { Pressable, View } from 'react-native';
import { useLang } from '../deps';
import { MIN_TOUCH, useTheme } from '../theme';
import { AppText } from './AppText';

export interface ChecklistItem {
  key: string;
  label: string;
  value: boolean | null;
}

export interface ChecklistProps {
  items: ChecklistItem[];
  onChange(key: string, v: boolean | null): void;
  testID?: string;
}

const CHOICES = [
  { v: true, key: 'common:answer.yes', id: 'yes' },
  { v: false, key: 'common:answer.no', id: 'no' },
  { v: null, key: 'common:answer.unknown', id: 'unknown' },
] as const;

export function Checklist({ items, onChange, testID }: ChecklistProps) {
  const theme = useTheme();
  const { t } = useLang();
  return (
    <View testID={testID} style={{ gap: theme.space(3) }}>
      {items.map((item) => (
        <View key={item.key} style={{ gap: theme.space(1.5) }}>
          <AppText>{item.label}</AppText>
          <View accessibilityRole="radiogroup" accessibilityLabel={item.label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
            {CHOICES.map((c) => {
              const selected = item.value === c.v;
              const text = t(c.key);
              return (
                <Pressable
                  key={c.id}
                  testID={`checklist-${item.key}-${c.id}`}
                  accessibilityRole="radio"
                  accessibilityLabel={t('ui:checklist.a11y', { item: item.label, answer: text })}
                  accessibilityState={{ checked: selected, selected }}
                  onPress={() => onChange(item.key, c.v)}
                  style={{
                    minHeight: MIN_TOUCH,
                    minWidth: 72,
                    paddingHorizontal: theme.space(3),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: theme.radius,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? theme.colors.accent : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <AppText weight={selected ? 'bold' : 'regular'} style={selected ? { color: theme.colors.accent } : undefined}>
                    {text}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
