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

const img2 = parsePNG('C:/Users/devam/.gemini/antigravity/brain/52d7baf4-2555-4e56-bbbd-735b69f5e818/.user_uploaded/media_1794583956907_a3d9eea8.png');
console.log('Image 2 dimensions:', img2.width, 'x', img2.height);

// Find the bounding box of the outer glowing card:
// Look for bright golden border pixels (high R, medium G, low-to-medium B, e.g. R > 200, G > 160)
const borderPoints = [];
for (let y = 0; y < img2.height; y++) {
  for (let x = 0; x < img2.width; x++) {
    const idx = (y * img2.width + x) * 4;
    const r = img2.pixels[idx];
    const g = img2.pixels[idx+1];
    const b = img2.pixels[idx+2];
    if (r > 220 && g > 180 && b < 180) {
      borderPoints.push({ x, y, r, g, b });
    }
  }
}

// Bounding box of card
const xs = borderPoints.map(p => p.x);
const ys = borderPoints.map(p => p.y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);

console.log('Outer card bounding box:', { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY });
console.log('Card aspect ratio (W/H):', ((maxX - minX) / (maxY - minY)).toFixed(3));
console.log('Card width as % of screen:', ((maxX - minX) / img2.width * 100).toFixed(1) + '%');
console.log('Card height as % of screen:', ((maxY - minY) / img2.height * 100).toFixed(1) + '%');
