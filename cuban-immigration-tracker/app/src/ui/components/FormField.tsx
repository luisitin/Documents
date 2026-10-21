/**
 * `FormField { label; help?; error?; children }` (07 §6.0). The error is text with a warning
 * icon (amber, not red: a form error is not a deadline, 00 §3 principle 8).
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Icon } from '../icons';
import { useTheme } from '../theme';
import { AppText } from './AppText';

export interface FormFieldProps {
  label: string;
  help?: string;
  error?: string;
  children?: ReactNode;
  testID?: string;
}

export function FormField({ label, help, error, children, testID }: FormFieldProps) {
  const theme = useTheme();
  return (
    <View testID={testID} style={{ gap: theme.space(1.5) }}>
      <AppText weight="medium">{label}</AppText>
      {help ? (
        <AppText size="sm" muted>
          {help}
        </AppText>
      ) : null}
      {children}
      {error ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: theme.space(1.5), alignItems: 'flex-start' }}>
          <Icon name="warning" size={18} color={theme.colors.warning} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText size="sm" tone="warning">
              {error}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}
