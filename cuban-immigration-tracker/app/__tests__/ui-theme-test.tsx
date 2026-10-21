/**
 * WP7 theme acceptance (07 WP7; contract (f); 00 §3 principle 8 "red only for true deadlines").
 * - native precedence: setting → system scheme; web precedence: host data-theme → prefers-color-scheme
 * - the web hook reads document.documentElement.dataset.theme and observes it (MutationObserver)
 * - bg/surface/text tokens equal the artifact fragment's <style> tokens (scripts/build-artifact.mjs)
 * - every text token clears WCAG 4.5:1 on its backgrounds, in both themes
 * - the red token is reachable only through tone="deadline" (static scan of src/ui)
 */
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { CSS_TOKENS, DARK_COLORS, LIGHT_COLORS, TONE_WASH, themeFor, toneColor, useTheme, type Tone } from '@/ui/theme';
import { resolveNativeThemeName, resolveWebThemeName } from '@/ui/themeName';
import { readWebThemeName, subscribeWebTheme } from '@/ui/useThemeName.web';
import * as deps from '@/ui/deps';

jest.mock('@/ui/deps', () => require('../src/ui/__mocks__/deps'));

// app/ has no @types/node (07 §3.1); the few Node APIs these tests use are typed locally.
declare const __dirname: string;
const fs = require('fs') as {
  readFileSync(p: string, enc: 'utf8'): string;
  readFileSync(p: string): Uint8Array;
  readdirSync(p: string): string[];
  readdirSync(p: string, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[];
};
const path = require('path') as { join(...p: string[]): string };
const fake = (deps as unknown as { __fake: typeof import('../src/ui/__mocks__/deps').__fake }).__fake;

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

describe('theme name resolution', () => {
  it('native: the explicit setting wins, system follows the scheme', () => {
    expect(resolveNativeThemeName('dark', 'light')).toBe('dark');
    expect(resolveNativeThemeName('light', 'dark')).toBe('light');
    expect(resolveNativeThemeName('system', 'dark')).toBe('dark');
    expect(resolveNativeThemeName('system', null)).toBe('light');
  });
  it('web: host data-theme wins over prefers-color-scheme (contract (f))', () => {
    expect(resolveWebThemeName('dark', false)).toBe('dark');
    expect(resolveWebThemeName('light', true)).toBe('light');
    expect(resolveWebThemeName(undefined, true)).toBe('dark');
    expect(resolveWebThemeName('sepia', false)).toBe('light');
  });

  it('useTheme on native honours the settings override', async () => {
    function Probe() {
      const theme = useTheme();
      return <Text testID="probe">{theme.name + ' ' + theme.colors.bg}</Text>;
    }
    fake.reset();
    fake.set({ theme: 'dark' });
    await render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent(`dark ${DARK_COLORS.bg}`);
    await act(async () => fake.set({ theme: 'light' }));
    expect(screen.getByTestId('probe')).toHaveTextContent(`light ${LIGHT_COLORS.bg}`);
    await act(async () => fake.reset());
  });
});

describe('web theme hook (useThemeName.web.ts)', () => {
  const g = globalThis as unknown as Record<string, unknown>;
  const saved = { document: g.document, MutationObserver: g.MutationObserver, matchMedia: (g.window as Record<string, unknown> | undefined)?.matchMedia };
  let observed: { cb: () => void; opts: unknown } | null = null;
  let mqlListener: (() => void) | null = null;
  let prefersDark = false;
  const root = { dataset: {} as Record<string, string> };

  beforeEach(() => {
    observed = null;
    mqlListener = null;
    prefersDark = false;
    root.dataset = {};
    g.document = { documentElement: root };
    g.MutationObserver = class {
      cb: () => void;
      constructor(cb: () => void) {
        this.cb = cb;
      }
      observe(_t: unknown, opts: unknown) {
        observed = { cb: this.cb, opts };
      }
      disconnect() {
        observed = null;
      }
    };
    (g.window as Record<string, unknown>).matchMedia = () => ({
      get matches() {
        return prefersDark;
      },
      addEventListener: (_e: string, l: () => void) => {
        mqlListener = l;
      },
      removeEventListener: () => {
        mqlListener = null;
      },
    });
  });
  afterAll(() => {
    g.document = saved.document;
    g.MutationObserver = saved.MutationObserver;
    (g.window as Record<string, unknown>).matchMedia = saved.matchMedia;
  });

  it('reads data-theme first, then prefers-color-scheme', () => {
    expect(readWebThemeName()).toBe('light');
    prefersDark = true;
    expect(readWebThemeName()).toBe('dark');
    root.dataset.theme = 'light';
    expect(readWebThemeName()).toBe('light');
    root.dataset.theme = 'dark';
    prefersDark = false;
    expect(readWebThemeName()).toBe('dark');
  });

  it('observes the data-theme attribute and the media query, and cleans up', () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeWebTheme(onChange);
    expect(observed).not.toBeNull();
    expect(observed!.opts).toEqual({ attributes: true, attributeFilter: ['data-theme'] });
    observed!.cb();
    mqlListener?.();
    expect(onChange).toHaveBeenCalledTimes(2);
    unsubscribe();
    expect(observed).toBeNull();
    expect(mqlListener).toBeNull();
  });

  it('never throws without a DOM', () => {
    g.document = undefined;
    g.MutationObserver = undefined;
    (g.window as Record<string, unknown>).matchMedia = () => {
      throw new Error('blocked');
    };
    expect(readWebThemeName()).toBe('light');
    expect(() => subscribeWebTheme(() => {})()).not.toThrow();
  });
});

describe('tokens', () => {
  it('match the artifact fragment <style> tokens (contract (f); WP10 build script)', () => {
    const script = fs.readFileSync(path.join(__dirname, '../../scripts/build-artifact.mjs'), 'utf8');
    const light = /const LIGHT = '([^']+)'/.exec(script)?.[1];
    const dark = /const DARK = '([^']+)'/.exec(script)?.[1];
    expect(light).toBe(CSS_TOKENS.light);
    expect(dark).toBe(CSS_TOKENS.dark);
  });

  it.each(['light', 'dark'] as const)('%s: text tokens clear WCAG 4.5:1 on bg, surface and their washes', (name) => {
    const c = themeFor(name).colors;
    for (const fg of [c.text, c.textMuted, c.accent, c.info, c.warning, c.deadline]) {
      expect(contrast(fg, c.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(fg, c.surface)).toBeGreaterThanOrEqual(4.5);
    }
    for (const tone of ['info', 'warning', 'deadline', 'neutral'] as Tone[]) {
      const fg = tone === 'neutral' ? c.text : toneColor(themeFor(name), tone);
      expect(contrast(fg, TONE_WASH[name][tone])).toBeGreaterThanOrEqual(4.5);
    }
    // Chart marks are graphics: ≥ 2:1 against the surface (light aqua/yellow carry table twins).
    for (const s of [c.chart1, c.chart2, c.chart3, c.chart4]) expect(contrast(s, c.surface)).toBeGreaterThanOrEqual(2);
  });

  it('only tone="deadline" is red', () => {
    for (const name of ['light', 'dark'] as const) {
      const t = themeFor(name);
      expect(toneColor(t, 'deadline')).toBe(t.colors.deadline);
      for (const tone of ['neutral', 'info', 'warning'] as Tone[]) expect(toneColor(t, tone)).not.toBe(t.colors.deadline);
    }
    // Static scan: the deadline colour token is read only inside theme.ts (toneColor).
    const dir = path.join(__dirname, '../src/ui');
    const files: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name)) files.push(p);
      }
    };
    walk(dir);
    const offenders = files.filter((f) => !f.endsWith('theme.ts') && /colors\.deadline|#b42318|#ff8a80/i.test(fs.readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
