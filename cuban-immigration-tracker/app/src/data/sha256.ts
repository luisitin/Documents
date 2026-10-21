/**
 * SHA-256 of a string's UTF-8 bytes, in pure TypeScript (FIPS 180-4).
 *
 * The data layer verifies every fetched data file against `manifest.files[name].sha256` (07 WP6
 * fetch policy; 03-data-pipeline.md §6 the manifest carries the sha256 of the exact bytes).
 * `crypto.subtle` is unavailable on Hermes and outside secure contexts, and no crypto package is in
 * the pinned dependency set (07 §3.1), so this small implementation is used everywhere. The files
 * are ≤ 200 KB, which hashes in a few milliseconds.
 */

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** UTF-8 encoding without `TextEncoder` (lone surrogates become U+FFFD, like TextEncoder). */
export function utf8Bytes(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      } else {
        c = 0xfffd;
      }
    } else if (c >= 0xd800 && c <= 0xdfff) {
      c = 0xfffd;
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

/** Lower-case hex SHA-256 of `bytes`. */
export function sha256Bytes(bytes: Uint8Array): string {
  const len = bytes.length;
  const blocks = Math.ceil((len + 9) / 64);
  const w = new Uint32Array(blocks * 16);
  for (let i = 0; i < len; i++) w[i >> 2] |= (bytes[i] as number) << (24 - (i % 4) * 8);
  w[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
  const bitLen = len * 8;
  w[blocks * 16 - 1] = bitLen >>> 0;
  w[blocks * 16 - 2] = Math.floor(bitLen / 0x100000000);

  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const m = new Uint32Array(64);
  for (let b = 0; b < blocks; b++) {
    for (let t = 0; t < 16; t++) m[t] = w[b * 16 + t] as number;
    for (let t = 16; t < 64; t++) {
      const x = m[t - 15] as number;
      const y = m[t - 2] as number;
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      m[t] = ((m[t - 16] as number) + s0 + (m[t - 7] as number) + s1) >>> 0;
    }
    let a = h[0] as number, bb = h[1] as number, c = h[2] as number, d = h[3] as number;
    let e = h[4] as number, f = h[5] as number, g = h[6] as number, hh = h[7] as number;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + (K[t] as number) + (m[t] as number)) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
    }
    h[0] = ((h[0] as number) + a) >>> 0; h[1] = ((h[1] as number) + bb) >>> 0; h[2] = ((h[2] as number) + c) >>> 0; h[3] = ((h[3] as number) + d) >>> 0;
    h[4] = ((h[4] as number) + e) >>> 0; h[5] = ((h[5] as number) + f) >>> 0; h[6] = ((h[6] as number) + g) >>> 0; h[7] = ((h[7] as number) + hh) >>> 0;
  }
  let hex = '';
  for (let i = 0; i < 8; i++) hex += (h[i] as number).toString(16).padStart(8, '0');
  return hex;
}

/** Lower-case hex SHA-256 of the UTF-8 bytes of `text`. */
export function sha256(text: string): string {
  return sha256Bytes(utf8Bytes(text));
}
