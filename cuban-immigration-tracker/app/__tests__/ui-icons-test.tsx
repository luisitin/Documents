/**
 * WP7 icons (07 §6.0 `IconName`; 00 §5 "in-repo SVG components, no icon fonts"; ARCH-3) and
 * app/assets (07 §2: icon.png, adaptive-icon.png, splash-icon.png; no fonts).
 */
import { render, screen } from '@testing-library/react-native';
import { ICONS, ICON_NAMES, Icon, type IconName } from '@/ui/icons';

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

const CONTRACT: IconName[] = [
  'home', 'case', 'offices', 'alerts', 'more', 'language', 'info', 'warning', 'check', 'close',
  'chevron-left', 'chevron-right', 'share', 'calendar', 'clock', 'external',
];

describe('Icon', () => {
  it('ships exactly the 16 contract icons', () => {
    expect([...ICON_NAMES].sort()).toEqual([...CONTRACT].sort());
    for (const n of CONTRACT) expect(ICONS[n].strokes.length + (ICONS[n].dots?.length ?? 0)).toBeGreaterThan(0);
  });

  it.each(CONTRACT)('renders %s as a hidden, decorative SVG', async (name) => {
    await render(<Icon name={name} size={20} color="#123456" />);
    const svg = screen.getByTestId(`icon-${name}`, { includeHiddenElements: true });
    expect(svg.props.accessibilityElementsHidden).toBe(true);
  });

  it('paths stay inside the 24 × 24 grid', () => {
    for (const n of CONTRACT) {
      for (const d of ICONS[n].strokes) {
        // Absolute coordinates only appear after M/L/Z commands; relative arcs stay small.
        const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
        for (const v of nums) expect(Math.abs(v)).toBeLessThanOrEqual(24);
      }
    }
  });
});

describe('app/assets', () => {
  const dir = path.join(__dirname, '../assets');
  it.each([
    ['icon.png', 1024],
    ['adaptive-icon.png', 1024],
    ['splash-icon.png', 512],
  ])('%s is a %i px PNG', (file, size) => {
    const buf = fs.readFileSync(path.join(dir, file));
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    expect(String.fromCharCode(buf[1]!, buf[2]!, buf[3]!)).toBe('PNG');
    expect(view.getUint32(16)).toBe(size);
    expect(view.getUint32(20)).toBe(size);
  });
  it('contains no font files (ARCH-3)', () => {
    expect(fs.readdirSync(dir).filter((f) => /\.(ttf|otf|woff2?)$/i.test(f))).toEqual([]);
  });
});
