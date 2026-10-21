/**
 * `Sheet { visible; title; body; confirmLabel; cancelLabel; destructive?; onConfirm(); onCancel() }`
 * (07 §6.0). The in-app confirmation used instead of `window.confirm`/`alert`, which do not work
 * in the artifact (contract (e); 00 F16 "two-step in-app sheet, never confirm()").
 * `destructive` adds a warning icon and puts Cancel first; it is not red (red = deadlines only).
 */
import { Modal, Pressable, View } from 'react-native';
import { Icon } from '../icons';
import { CONTENT_MAX_WIDTH, useTheme } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface SheetProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm(): void;
  onCancel(): void;
  testID?: string;
}

export function Sheet({ visible, title, body, confirmLabel, cancelLabel, destructive = false, onConfirm, onCancel, testID }: SheetProps) {
  const theme = useTheme();
  const confirm = <Button testID={testID ? `${testID}-confirm` : 'sheet-confirm'} label={confirmLabel} onPress={onConfirm} variant={destructive ? 'secondary' : 'primary'} />;
  const cancel = <Button testID={testID ? `${testID}-cancel` : 'sheet-cancel'} label={cancelLabel} onPress={onCancel} variant={destructive ? 'primary' : 'secondary'} />;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        />
        <View
          testID={testID}
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius * 1.5,
            borderTopRightRadius: theme.radius * 1.5,
            borderColor: theme.colors.border,
            borderWidth: 1,
            padding: theme.space(5),
            gap: theme.space(3),
          }}
        >
          <View style={{ flexDirection: 'row', gap: theme.space(2), alignItems: 'center' }}>
            {destructive ? <Icon name="warning" color={theme.colors.warning} size={22} /> : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText header size="lg" weight="bold">
                {title}
              </AppText>
            </View>
          </View>
          <AppText>{body}</AppText>
          <View style={{ gap: theme.space(2) }}>
            {destructive ? cancel : confirm}
            {destructive ? confirm : cancel}
          </View>
        </View>
      </View>
    </Modal>
  );
}
