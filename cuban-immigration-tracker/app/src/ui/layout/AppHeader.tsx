/**
 * `AppHeader { title }` (07 §6.0; 00 §5 "Header on every screen: title, LangToggle,
 * DataStatusChip"). Title and the language button share the first row (the button is always
 * reachable, owner requirement 1); the status chip takes the full second row so it never
 * truncates at 390 px.
 */
import { View } from 'react-native';
import { AppText } from '../components/AppText';
import { useTheme } from '../theme';
import { DataStatusChip } from './DataStatusChip';
import { LangToggle } from './LangToggle';

export interface AppHeaderProps {
  title: string;
  testID?: string;
}

export function AppHeader({ title, testID = 'app-header' }: AppHeaderProps) {
  const theme = useTheme();
  return (
    <View testID={testID} style={{ gap: theme.space(2), paddingBottom: theme.space(1) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space(2) }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText header size="xl" weight="bold">
            {title}
          </AppText>
        </View>
        <LangToggle />
      </View>
      <DataStatusChip />
    </View>
  );
}
