/**
 * @/ui — the WP7 UI kit (07-implementation-plan.md §6.0 "UI kit", WP7).
 *
 * Every text prop takes an already-translated string; only LangToggle and DataStatusChip read the
 * language and the data themselves (charts, chips and the ladder read `useLang()` only for labels
 * and `fmt`). Charts and icons use react-native-svg only (ARCH-3); fonts are the system stack.
 */
export { useTheme, themeFor, toneColor, toneWash, LIGHT_COLORS, DARK_COLORS, CSS_TOKENS, CONTENT_MAX_WIDTH, GUTTER, MIN_TOUCH, FONT, RADIUS, space } from './theme';
export type { Theme, ThemeName, Tone, ColorToken, FontToken } from './theme';
export { useThemeName } from './useThemeName';
export { resolveNativeThemeName, resolveWebThemeName } from './themeName';
export type { ThemeSetting } from './themeName';
export { quarterLabel, quarterMonths, periodLabel, addMonths, monthIndex } from './format';

export { Screen } from './layout/Screen';
export type { ScreenProps } from './layout/Screen';
export { AppHeader } from './layout/AppHeader';
export type { AppHeaderProps } from './layout/AppHeader';
export { LangToggle } from './layout/LangToggle';
export { DataStatusChip } from './layout/DataStatusChip';
export { statusLine, statusWord, STATUS_SYMBOL } from './layout/dataStatus';

export { AppText } from './components/AppText';
export type { AppTextProps } from './components/AppText';
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';
export { Card } from './components/Card';
export type { CardProps } from './components/Card';
export { Tile } from './components/Tile';
export type { TileProps } from './components/Tile';
export { StatTile } from './components/StatTile';
export type { StatTileProps, FieldKey } from './components/StatTile';
export { Banner } from './components/Banner';
export type { BannerProps } from './components/Banner';
export { Chip } from './components/Chip';
export type { ChipProps } from './components/Chip';
export { ConfidenceChip } from './components/ConfidenceChip';
export type { ConfidenceChipProps } from './components/ConfidenceChip';
export { ProbabilityLadder } from './components/ProbabilityLadder';
export type { ProbabilityLadderProps } from './components/ProbabilityLadder';
export { Sheet } from './components/Sheet';
export type { SheetProps } from './components/Sheet';
export { FormField } from './components/FormField';
export type { FormFieldProps } from './components/FormField';
export { DateField, MONTH_ONLY_DAY, composeIso, daysInMonth, rangeError, splitIso } from './components/DateField';
export type { DateFieldProps } from './components/DateField';
export { Select } from './components/Select';
export type { SelectOption, SelectProps } from './components/Select';
export { Checklist } from './components/Checklist';
export type { ChecklistItem, ChecklistProps } from './components/Checklist';
export { TableTwin, STACK_BELOW } from './components/TableTwin';
export type { TableTwinProps } from './components/TableTwin';

export { MonthlyChart } from './charts/MonthlyChart';
export type { MonthlyChartProps } from './charts/MonthlyChart';
export { FanChart } from './charts/FanChart';
export type { FanChartProps } from './charts/FanChart';
export { RegimeStrip, stripSegments } from './charts/RegimeStrip';
export type { RegimeStripProps } from './charts/RegimeStrip';
export { ScenarioBars } from './charts/ScenarioBars';
export type { ScenarioBarsProps } from './charts/ScenarioBars';
export { DriverBar, driverSegments } from './charts/DriverBar';
export type { DriverBarProps } from './charts/DriverBar';
export { monthlyLayout, fanLayout, niceTicks, xLabels, labelExtent, textWidth } from './charts/scales';
export type { MonthlyMetric } from './charts/scales';

export { Icon, ICONS, ICON_NAMES } from './icons';
export type { IconName, IconProps } from './icons';
