/**
 * `Icon({ name, color, size })` (07 §6.0). Decorative by default: the meaning is always carried by
 * a text label next to it (00 §3 principle 8: tones ship with an icon AND a label, never colour
 * alone), so the SVG is hidden from screen readers.
 */
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { ICONS, type IconName } from './paths';

export type { IconName } from './paths';
export { ICONS, ICON_NAMES } from './paths';

export interface IconProps {
  name: IconName;
  color?: string;
  size?: number;
  testID?: string;
}

export function Icon({ name, color, size = 24, testID }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.colors.text;
  const shape = ICONS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      testID={testID ?? `icon-${name}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
      {shape.strokes.map((d) => (
        <Path key={d} d={d} stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
      {(shape.dots ?? []).map((p) => (
        <Circle key={`${p.cx}-${p.cy}`} cx={p.cx} cy={p.cy} r={p.r} fill={c} />
      ))}
    </Svg>
  );
}
