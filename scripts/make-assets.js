/**
 * Generates the app's image assets (icon, adaptive icon set, splash, favicon)
 * as raw PNGs — a gold poker chip on the app's near-black plane. No image
 * dependencies needed; run `node scripts/make-assets.js` to regenerate.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ——— palette (mirrors src/theme.ts) ———
const BG = [10, 10, 13];
const GOLD = [217, 180, 91];
const GOLD_DEEP = [138, 109, 47];
const IVORY = [244, 243, 239];
const CENTER = [18, 16, 22];
const WHITE = [255, 255, 255];

// ——— minimal PNG encoder (RGBA, 8-bit) ———
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(file, size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log(`  ${path.basename(file)}  ${size}×${size}  ${(png.length / 1024).toFixed(0)} kB`);
}

// ——— chip sampler ———
// Returns [r, g, b, a] for a point in unit space (centre 0,0; edge ±1).
function chipSample(nx, ny, opts) {
  const { chipR, mono, transparentBg } = opts;
  const r = Math.hypot(nx, ny);
  const angle = Math.atan2(ny, nx);

  const outer = chipR;
  const ringInner = chipR * 0.74;
  const innerRing = chipR * 0.7;
  const dotR = chipR * 0.2;

  const bg = transparentBg ? [0, 0, 0, 0] : [...BG, 255];
  if (r > outer) return bg;

  const ring = mono ? WHITE : GOLD;
  const stripe = mono ? WHITE : IVORY;
  const centre = mono ? [0, 0, 0, 0] : [...CENTER, 255];

  if (r >= ringInner) {
    // Edge stripes: 8 of them, centred every 45°.
    const seg = ((angle / Math.PI) * 4 + 8) % 1; // 0..1 within each 45° slice
    const inStripe = seg < 0.16 || seg > 0.84;
    if (mono && !inStripe) return [...WHITE, 255];
    if (mono && inStripe) return [...WHITE, 255];
    return inStripe ? [...stripe, 255] : [...ring, 255];
  }
  if (r >= innerRing) return mono ? [...WHITE, 255] : [...GOLD_DEEP, 255];
  if (r <= dotR) return mono ? [0, 0, 0, 0] : [...GOLD, 255];
  if (mono) return [0, 0, 0, 0];
  return centre;
}

function render(file, size, opts) {
  const px = Buffer.alloc(size * size * 4);
  const ss = 2; // 2×2 supersampling
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const nx = ((x + (sx + 0.5) / ss) / size) * 2 - 1;
          const ny = ((y + (sy + 0.5) / ss) / size) * 2 - 1;
          const c = chipSample(nx, ny, opts);
          const ca = c[3] / 255;
          r += c[0] * ca;
          g += c[1] * ca;
          b += c[2] * ca;
          a += c[3];
        }
      }
      const n = ss * ss;
      const alpha = a / n;
      const i = (y * size + x) * 4;
      px[i] = alpha > 0 ? Math.round(r / n / (alpha / 255)) : 0;
      px[i + 1] = alpha > 0 ? Math.round(g / n / (alpha / 255)) : 0;
      px[i + 2] = alpha > 0 ? Math.round(b / n / (alpha / 255)) : 0;
      px[i + 3] = Math.round(alpha);
    }
  }
  writePng(file, size, px);
}

const assets = path.join(__dirname, '..', 'assets');
console.log('Rendering Poker Night assets…');
render(path.join(assets, 'icon.png'), 1024, { chipR: 0.72, mono: false, transparentBg: false });
render(path.join(assets, 'android-icon-foreground.png'), 1024, { chipR: 0.5, mono: false, transparentBg: true });
render(path.join(assets, 'android-icon-background.png'), 1024, { chipR: 0, mono: false, transparentBg: false });
render(path.join(assets, 'android-icon-monochrome.png'), 1024, { chipR: 0.5, mono: true, transparentBg: true });
render(path.join(assets, 'splash-icon.png'), 1024, { chipR: 0.55, mono: false, transparentBg: true });
render(path.join(assets, 'favicon.png'), 64, { chipR: 0.9, mono: false, transparentBg: true });
console.log('Done.');
