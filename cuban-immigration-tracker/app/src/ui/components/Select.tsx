/**
 * `Select<T extends string> { label; value; options; onChange(v) }` (07 §6.0). A field that opens
 * an in-app option list (a Modal: works the same on iOS, Android and the artifact; no native
 * picker module, no `prompt()`, contract (e)).
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useLang } from '../deps';
import { Icon } from '../icons';
import { CONTENT_MAX_WIDTH, MIN_TOUCH, useTheme } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange(v: T): void;
  testID?: string;
}

export function Select<T extends string>({ label, value, options, onChange, testID }: SelectProps<T>) {
  const theme = useTheme();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const shown = current ? current.label : t('ui:select.placeholder');
  const a11y = t('ui:select.a11y', { label, value: shown });
  const id = testID ?? 'select';
  return (
    <View style={{ gap: theme.space(1) }}>
      <AppText size="sm" weight="medium" muted>
        {label}
      </AppText>
      <Pressable
        testID={id}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityHint={t('ui:select.hint')}
        onPress={() => setOpen(true)}
        style={{
          minHeight: MIN_TOUCH,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space(2),
          paddingHorizontal: theme.space(3),
          borderRadius: theme.radius,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText muted={!current} numberOfLines={2}>
            {shown}
          </AppText>
        </View>
        <Icon name="chevron-right" size={18} color={theme.colors.textMuted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common:action.close')}
            onPress={() => setOpen(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
          />
          <View
            accessibilityViewIsModal
            style={{
              width: '100%',
              maxWidth: CONTENT_MAX_WIDTH,
              maxHeight: '80%',
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius * 1.5,
              borderTopRightRadius: theme.radius * 1.5,
              padding: theme.space(4),
              gap: theme.space(2),
            }}
          >
            <AppText header size="lg" weight="bold">
              {label}
            </AppText>
            <ScrollView accessibilityRole="radiogroup" style={{ flexGrow: 0 }}>
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    testID={`${id}-option-${o.value}`}
                    accessibilityRole="radio"
                    accessibilityLabel={o.label}
                    accessibilityState={{ checked: selected, selected }}
                    onPress={() => {
                      setOpen(false);
                      onChange(o.value);
                    }}
                    style={{
                      minHeight: MIN_TOUCH,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.space(2),
                      paddingHorizontal: theme.space(2),
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <View style={{ width: 22 }}>{selected ? <Icon name="check" size={20} color={theme.colors.accent} /> : null}</View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText weight={selected ? 'medium' : 'regular'}>{o.label}</AppText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button variant="secondary" label={t('common:action.close')} onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
