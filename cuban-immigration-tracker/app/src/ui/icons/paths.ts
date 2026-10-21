/**
 * The 16 in-repo icons of `IconName` (07 §6.0; 00 §5 "Icons: in-repo SVG components
 * (react-native-svg). No icon fonts, no expo-symbols, no @expo/vector-icons"; ARCH-3).
 *
 * Original line drawings on a 24 × 24 grid, stroke 2, round caps and joins. `strokes` are drawn
 * with the icon colour and no fill; `dots` are small filled circles (the "i" dot, the "!" dot,
 * the "more" dots). No external CDN, no font files: they inline into the single web bundle.
 */
export type IconName =
  | 'home' | 'case' | 'offices' | 'alerts' | 'more' | 'language' | 'info' | 'warning' | 'check' | 'close'
  | 'chevron-left' | 'chevron-right' | 'share' | 'calendar' | 'clock' | 'external';

export interface IconShape {
  strokes: readonly string[];
  dots?: readonly { cx: number; cy: number; r: number }[];
}

export const ICONS: Readonly<Record<IconName, IconShape>> = Object.freeze({
  home: { strokes: ['M3 11.5 12 4l9 7.5', 'M5.5 10v10h13V10', 'M10 20v-5.5h4V20'] },
  case: { strokes: ['M4 7.5h16V19H4z', 'M9 7.5V5h6v2.5', 'M4 12.5h16'] },
  offices: { strokes: ['M4 21V5.5L12 3v18', 'M12 21V9l8 2v10', 'M2.5 21h19', 'M7 8h2', 'M7 12h2', 'M7 16h2', 'M15 14.5h2', 'M15 17.5h2'] },
  alerts: { strokes: ['M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z', 'M10 20.5a2 2 0 0 0 4 0'] },
  more: { strokes: [], dots: [{ cx: 5, cy: 12, r: 1.75 }, { cx: 12, cy: 12, r: 1.75 }, { cx: 19, cy: 12, r: 1.75 }] },
  language: { strokes: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M3 12h18', 'M12 3c3 3.2 3 14.8 0 18', 'M12 3c-3 3.2-3 14.8 0 18'] },
  info: { strokes: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 11v6'], dots: [{ cx: 12, cy: 7.75, r: 1.25 }] },
  warning: { strokes: ['M12 3.5 2.5 20h19z', 'M12 10v4.5'], dots: [{ cx: 12, cy: 17.25, r: 1.25 }] },
  check: { strokes: ['M5 12.5l4.5 4.5L19 7'] },
  close: { strokes: ['M6 6l12 12', 'M18 6 6 18'] },
  'chevron-left': { strokes: ['M15 5l-7 7 7 7'] },
  'chevron-right': { strokes: ['M9 5l7 7-7 7'] },
  share: { strokes: ['M12 3.5V15', 'M7.5 8 12 3.5 16.5 8', 'M5 12.5V20h14v-7.5'] },
  calendar: { strokes: ['M4 6h16v14H4z', 'M4 10.5h16', 'M8 3.5V7', 'M16 3.5V7'] },
  clock: { strokes: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 7.5V12l3 3'] },
  external: { strokes: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'] },
});

export const ICON_NAMES = Object.freeze(Object.keys(ICONS)) as readonly IconName[];
