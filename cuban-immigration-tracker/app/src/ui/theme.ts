/**
 * WP7 theme tokens (07-implementation-plan.md §6.0 "UI kit"; 00-product-spec.md §3 principle 8).
 *
 * - Two selected palettes, light and dark. Dark is its own set of steps, not an automatic flip.
 * - `bg`, `surface` and `text` are the same hex values the artifact fragment's `<style>` uses
 *   (scripts/build-artifact.mjs `LIGHT` / `DARK`, contract (f)), so the page background and the
 *   React tree agree before and after the bundle boots. `CSS_TOKENS` below is the single list
 *   WP10 copies into the fragment.
 * - Red is reserved: only `deadline` is red, and only `tone="deadline"` reaches it (00 §3 principle
 *   8: "Red is used only for true deadlines (RFE/NOID response window, EAD expiry ≤ 30 days)").
 *   Routine waiting uses `neutral`/`info`, and caution uses amber `warning`.
 * - Chart colours `chart1…chart4` are the first four categorical slots of the dataviz reference
 *   palette (blue, orange, aqua, yellow; validated on 2026-10-20 with validate_palette.js against
 *   `surface` in both modes: adjacent CVD ΔE ≥ 8.4, normal-vision ΔE ≥ 19.8; light aqua/yellow sit
 *   below 3:1, so every chart ships direct labels and a TableTwin). The red slot is never used
 *   for series, so the deadline red keeps its meaning.
 * - Text tokens (`text`, `textMuted`, `info`, `warning`, `deadline`, `accent`) clear WCAG 4.5:1 on
 *   both `bg` and `surface` of their mode.
 */
import { Platform } from 'react-native';
import { useThemeName } from './useThemeName';

export type ThemeName = 'light' | 'dark';

/** 07 §6.0: the tone vocabulary. `deadline` is the only red. */
export type Tone = 'neutral' | 'info' | 'warning' | 'deadline';

export type ColorToken =
  | 'bg' | 'surface' | 'text' | 'textMuted' | 'border' | 'accent' | 'info' | 'warning' | 'deadline'
  | 'chart1' | 'chart2' | 'chart3' | 'chart4';

export type FontToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface Theme {
  name: ThemeName;
  colors: Record<ColorToken, string>;
  space(n: number): number;
  radius: number;
  font: Record<FontToken, number>;
}

/** Light palette. bg/surface/text match the fragment `<style>` (WP10). */
export const LIGHT_COLORS: Readonly<Record<ColorToken, string>> = Object.freeze({
  bg: '#f7f7f5',
  surface: '#ffffff',
  text: '#16181d',
  textMuted: '#565d6b',
  border: '#d9dce1',
  accent: '#1d4ed8',
  info: '#1d4ed8',
  warning: '#8a5300',
  deadline: '#b42318',
  chart1: '#2a78d6',
  chart2: '#eb6834',
  chart3: '#1baf7a',
  chart4: '#eda100',
});

/** Dark palette. bg/surface/text match the fragment `<style>` (WP10). */
export const DARK_COLORS: Readonly<Record<ColorToken, string>> = Object.freeze({
  bg: '#111317',
  surface: '#1b1e24',
  text: '#eceef2',
  textMuted: '#a9afbb',
  border: '#2c313a',
  accent: '#7aa7ff',
  info: '#7aa7ff',
  warning: '#f0b94a',
  deadline: '#ff8a80',
  chart1: '#3987e5',
  chart2: '#d95926',
  chart3: '#199e70',
  chart4: '#c98500',
});

/** Tinted backgrounds for banners and chips (low-alpha washes of the tone colour). */
export const TONE_WASH: Readonly<Record<ThemeName, Record<Tone, string>>> = Object.freeze({
  light: { neutral: '#f0f1f3', info: '#e8eefc', warning: '#fdf3e1', deadline: '#fdecea' },
  dark: { neutral: '#23272f', info: '#1c2740', warning: '#33291a', deadline: '#3a1f1f' },
});

/** The 4-point spacing scale: space(4) = 16 (the 16 px gutter of 00 §5). */
export const space = (n: number): number => Math.round(n * 4);

/** Base radius for cards, sheets and inputs. */
export const RADIUS = 12;

/** Type scale in px, on the system font stack (no font files, ARCH-3). */
export const FONT: Readonly<Record<FontToken, number>> = Object.freeze({ xs: 12, sm: 13, md: 15, lg: 18, xl: 22 });

/** Content column width (00 §5 "Layout: content column maxWidth: 560, centered, 16 px gutters"). */
export const CONTENT_MAX_WIDTH = 560;
export const GUTTER = 16;

/** Minimum touch target (00 §5: LangToggle hit area ≥ 48×48; used by every pressable). */
export const MIN_TOUCH = 48;

const THEMES: Record<ThemeName, Theme> = {
  light: Object.freeze({ name: 'light', colors: LIGHT_COLORS, space, radius: RADIUS, font: FONT }) as Theme,
  dark: Object.freeze({ name: 'dark', colors: DARK_COLORS, space, radius: RADIUS, font: FONT }) as Theme,
};

/** The frozen theme object for a name (pure; used by tests and by `useTheme`). */
export function themeFor(name: ThemeName): Theme {
  return THEMES[name];
}

/** 07 §6.0 `useTheme()`: tokens for the current theme name. */
export function useTheme(): Theme {
  return themeFor(useThemeName());
}

/** The foreground colour of a tone (text, icon and border accent). */
export function toneColor(theme: Theme, tone: Tone): string {
  switch (tone) {
    case 'info':
      return theme.colors.info;
    case 'warning':
      return theme.colors.warning;
    case 'deadline':
      return theme.colors.deadline;
    default:
      return theme.colors.textMuted;
  }
}

/** The background wash of a tone. */
export function toneWash(theme: Theme, tone: Tone): string {
  return TONE_WASH[theme.name][tone];
}

/**
 * CSS custom properties for the artifact fragment (contract (f)); WP10's build script keeps its
 * `LIGHT` / `DARK` strings equal to these. A test asserts the bg/surface/text values match.
 */
export const CSS_TOKENS: Readonly<Record<ThemeName, string>> = Object.freeze({
  light: `--caa-bg:${LIGHT_COLORS.bg};--caa-surface:${LIGHT_COLORS.surface};--caa-text:${LIGHT_COLORS.text};`,
  dark: `--caa-bg:${DARK_COLORS.bg};--caa-surface:${DARK_COLORS.surface};--caa-text:${DARK_COLORS.text};`,
});

/**
 * Font for SVG chart text. On web an SVG <text> does not inherit the page's sans-serif stack, so it
 * names the system stack explicitly (no font files, no CDN; contract (b)); native uses the default.
 */
export const SVG_FONT_FAMILY: string | undefined =
  Platform.OS === 'web' ? 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' : undefined;
