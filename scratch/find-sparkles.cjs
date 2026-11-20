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

// Find all very bright points (sparkles/flares) in the card area x: 310..650, y: 10..525
// where R > 230, G > 210, B > 180 (golden-white sparkle cores)
const brightPoints = [];
for (let y = 10; y < 525; y++) {
  for (let x = 310; x < 650; x++) {
    const idx = (y * img2.width + x) * 4;
    const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
    if (r > 240 && g > 230 && b > 200) {
      brightPoints.push({ x, y, r, g, b });
    }
  }
}

// Cluster bright points
const clusters = [];
for (const p of brightPoints) {
  let matched = false;
  for (const c of clusters) {
    if (Math.abs(c.cx - p.x) < 15 && Math.abs(c.cy - p.y) < 15) {
      c.points.push(p);
      c.cx = Math.round(c.points.reduce((a, b) => a + b.x, 0) / c.points.length);
      c.cy = Math.round(c.points.reduce((a, b) => a + b.y, 0) / c.points.length);
      matched = true;
      break;
    }
  }
  if (!matched) {
    clusters.push({ cx: p.x, cy: p.y, points: [p] });
  }
}

console.log('Detected bright light flares/sparkles:');
// Card is from left: 314 to right: 645 (width 331), top: 9 to bottom: 522 (height 513)
clusters.forEach((c, i) => {
  const relX = ((c.cx - 314) / 331 * 100).toFixed(1);
  const relY = ((c.cy - 9) / 513 * 100).toFixed(1);
  console.log(`Sparkle/Flare ${i+1}: absolute (${c.cx}, ${c.cy}), relative in card (${relX}%, ${relY}%), size: ${c.points.length}px`);
});
