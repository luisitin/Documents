// Generates the app icon PNGs (WP7 owns app/assets; 07 §2 "icon.png adaptive-icon*.png
// splash-icon.png (no fonts)"). Original artwork, drawn procedurally: a white clock (a ring and two hands; waiting time,
// not an outcome) on the theme accent blue (#1d4ed8, app/src/ui/theme.ts). No fonts, no external
// assets, no dependencies (Node zlib only). Run: node app/assets/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const ACCENT = [0x1d, 0x4e, 0xd8];
const WHITE = [0xff, 0xff, 0xff];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5, size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
const cover = (d, half) => Math.max(0, Math.min(1, half - d + 0.5)); // 1 px anti-aliasing
const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));

/** Mark coverage (0..1) at unit coordinates u, v in [0, 1] of the mark box (×1000 ≈ px scale for AA). */
function mark(u, v) {
  const r = Math.hypot(u - 0.5, v - 0.5);
  const ring = cover(Math.abs(r - 0.4) * 1000, 0.045 * 1000);
  const hands = Math.max(
    cover(segDist(u, v, 0.5, 0.5, 0.5, 0.25) * 1000, 0.045 * 1000),
    cover(segDist(u, v, 0.5, 0.5, 0.67, 0.6) * 1000, 0.045 * 1000),
  );
  return Math.max(ring, hands);
}

function icon({ background, markScale, color = ACCENT }) {
  return (x, y, size) => {
    const box = size * markScale;
    const off = (size - box) / 2;
    const m = mark((x - off) / box, (y - off) / box);
    if (background) return [...mix(ACCENT, WHITE, m), 255];
    return [...color, Math.round(m * 255)];
  };
}

const out = [
  ['icon.png', 1024, icon({ background: true, markScale: 0.72 })],
  // Android adaptive icon foreground: the mark inside the 66 % safe zone, transparent background
  // (app.json android.adaptiveIcon.backgroundColor = #1d4ed8).
  ['adaptive-icon.png', 1024, icon({ background: false, markScale: 0.5, color: WHITE })],
  // Splash: the accent mark on transparent (app.json splash backgroundColor sets the page colour).
  ['splash-icon.png', 512, icon({ background: false, markScale: 0.9 })],
];
for (const [name, size, fn] of out) {
  writeFileSync(join(here, name), png(size, fn));
  console.log(`wrote ${name} (${size}×${size})`);
}
