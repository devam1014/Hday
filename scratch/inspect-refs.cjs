const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

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

const dir = 'C:\\Users\\devam\\.gemini\\antigravity\\brain\\52d7baf4-2555-4e56-bbbd-735b69f5e818\\.user_uploaded';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

for (const f of files) {
  try {
    const filePath = path.join(dir, f);
    const { width, height, pixels } = parsePNG(filePath);
    // Sample center area: x: width/2, y: height/2
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    // Sample glass card border or margin: e.g. cx - 120, cy
    const idx1 = (cy * width + (cx - 150)) * 4;
    const idx2 = ((cy - 200) * width + cx) * 4;
    console.log(f, width, 'x', height, {
      sample1: [pixels[idx1], pixels[idx1+1], pixels[idx1+2], pixels[idx1+3]],
      sample2: [pixels[idx2], pixels[idx2+1], pixels[idx2+2], pixels[idx2+3]]
    });
  } catch(e) {
    console.log(f, 'error', e.message);
  }
}
