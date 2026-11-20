const fs = require('fs');
const zlib = require('zlib');

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

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let srcPos = 0;
  let destPos = 0;

  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcPos++];
    for (let x = 0; x < stride; x++) {
      const raw = decompressed[srcPos++];
      let prior = 0;
      let above = y > 0 ? pixels[destPos - stride] : 0;
      let priorAbove = y > 0 && x >= bytesPerPixel ? pixels[destPos - stride - bytesPerPixel] : 0;
      if (x >= bytesPerPixel) {
        prior = pixels[destPos - bytesPerPixel];
      }

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
        let pr;
        if (pa <= pb && pa <= pc) pr = prior;
        else if (pb <= pc) pr = above;
        else pr = priorAbove;
        val = (raw + pr) & 0xff;
      }
      pixels[destPos++] = val;
    }
  }

  return { width, height, pixels };
}

const { width, height, pixels } = parsePNG('background.png');
console.log('Background size:', width, 'x', height);

// Find bright/warm spots: R > 200, G > 160, B < 150
const brightPoints = [];
for (let y = 0; y < height; y += 4) {
  for (let x = 0; x < width; x += 4) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    // Bright warm light test
    if (r > 210 && g > 150 && (r + g) > 380) {
      brightPoints.push({ x, y, r, g, b });
    }
  }
}

console.log('Total bright light samples:', brightPoints.length);

// Group into regions:
// 1. Lower Right Lamp (x > 1100, y > 350)
const lowerRight = brightPoints.filter(p => p.x > 1000 && p.y > 350);
// 2. Lower Left Lantern (x < 450, y > 500)
const lowerLeft = brightPoints.filter(p => p.x < 450 && p.y > 500);
// 3. Left Hanging Lights (x < 500, y < 500)
const leftHanging = brightPoints.filter(p => p.x < 500 && p.y < 500);
// 4. Any other bright lights
const others = brightPoints.filter(p => !lowerRight.includes(p) && !lowerLeft.includes(p) && !leftHanging.includes(p));

function getBounds(pts) {
  if (pts.length === 0) return null;
  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    count: pts.length
  };
}

console.log('Lower Right Lamp bounds:', getBounds(lowerRight));
console.log('Lower Left Lantern bounds:', getBounds(lowerLeft));
console.log('Left Hanging Lights bounds:', getBounds(leftHanging));
console.log('Other bright points:', getBounds(others));
