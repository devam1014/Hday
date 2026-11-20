const fs = require('fs');
const zlib = require('zlib');

// reuse parsePNG
function parsePNG(filename) {
  const buf = fs.readFileSync(filename);
  let offset = 8;
  let width, height;
  const idatChunks = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let srcPos = 0, destPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcPos++];
    for (let x = 0; x < stride; x++) {
      const raw = decompressed[srcPos++];
      let prior = 0;
      let above = y > 0 ? pixels[destPos - stride] : 0;
      let priorAbove = y > 0 && x >= bytesPerPixel ? pixels[destPos - stride - bytesPerPixel] : 0;
      if (x >= bytesPerPixel) prior = pixels[destPos - bytesPerPixel];
      let val = 0;
      if (filter === 0) val = raw;
      else if (filter === 1) val = (raw + prior) & 0xff;
      else if (filter === 2) val = (raw + above) & 0xff;
      else if (filter === 3) val = (raw + Math.floor((prior + above) / 2)) & 0xff;
      else if (filter === 4) {
        const p = prior + above - priorAbove;
        const pa = Math.abs(p - prior);
        const pb = Math.abs(p - above);
        const pc = Math.abs(p - priorAbove);
        let pr = (pa <= pb && pa <= pc) ? prior : (pb <= pc ? above : priorAbove);
        val = (raw + pr) & 0xff;
      }
      pixels[destPos++] = val;
    }
  }
  return { width, height, pixels };
}

const { width, height, pixels } = parsePNG('background.png');

// Check lower right area x: 1000..1672, y: 350..940
const lampPixels = [];
for (let y = 350; y < 940; y += 10) {
  for (let x = 1000; x < 1672; x += 10) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 140) {
      lampPixels.push({ x, y, r, g, b, lum });
    }
  }
}
const xs = lampPixels.map(p => p.x);
const ys = lampPixels.map(p => p.y);
console.log('Lamp lum > 140 bounds:', {
  minX: Math.min(...xs), maxX: Math.max(...xs),
  minY: Math.min(...ys), maxY: Math.max(...ys),
  count: lampPixels.length
});

// Check lower left lantern x: 0..450, y: 500..900
const lanternPixels = [];
for (let y = 500; y < 900; y += 10) {
  for (let x = 0; x < 450; x += 10) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 140) {
      lanternPixels.push({ x, y, r, g, b, lum });
    }
  }
}
const lxs = lanternPixels.map(p => p.x);
const lys = lanternPixels.map(p => p.y);
console.log('Lantern lum > 140 bounds:', {
  minX: Math.min(...lxs), maxX: Math.max(...lxs),
  minY: Math.min(...lys), maxY: Math.max(...lys),
  count: lanternPixels.length
});

// Check hanging lights x: 0..500, y: 0..500
const hangingPixels = [];
for (let y = 0; y < 500; y += 10) {
  for (let x = 0; x < 500; x += 10) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 140 && (r > 160 || g > 150)) {
      hangingPixels.push({ x, y, r, g, b, lum });
    }
  }
}
const hxs = hangingPixels.map(p => p.x);
const hys = hangingPixels.map(p => p.y);
console.log('Hanging lights lum > 140 bounds:', {
  minX: Math.min(...hxs), maxX: Math.max(...hxs),
  minY: Math.min(...hys), maxY: Math.max(...hys),
  count: hangingPixels.length
});
