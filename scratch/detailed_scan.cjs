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
      let prior = x >= bytesPerPixel ? pixels[destPos - bytesPerPixel] : 0;
      let above = y > 0 ? pixels[destPos - stride] : 0;
      let priorAbove = y > 0 && x >= bytesPerPixel ? pixels[destPos - stride - bytesPerPixel] : 0;
      let val = 0;
      if (filter === 0) val = raw;
      else if (filter === 1) val = (raw + prior) & 0xff;
      else if (filter === 2) val = (raw + above) & 0xff;
      else if (filter === 3) val = (raw + Math.floor((prior + above) / 2)) & 0xff;
      else if (filter === 4) {
        const p = prior + above - priorAbove;
        const pa = Math.abs(p - prior), pb = Math.abs(p - above), pc = Math.abs(p - priorAbove);
        let pr = prior;
        if (pb < pa && pb < pc) pr = above;
        else if (pc < pa) pr = priorAbove;
        val = (raw + pr) & 0xff;
      }
      pixels[destPos++] = val;
    }
  }
  return { width, height, pixels };
}

const { width, height, pixels } = parsePNG('countdown-bg.png');

function getLum(x, y) {
  const idx = (y * width + x) * 4;
  return pixels[idx] * 0.299 + pixels[idx+1] * 0.587 + pixels[idx+2] * 0.114;
}

// Find horizontal luminescence profile between y=170 and y=205, x=340 to 700
console.log('--- Horizontal Column Scan ---');
const cols = [];
for (let x = 350; x < 695; x++) {
  let maxL = 0;
  for (let y = 170; y < 205; y++) {
    const l = getLum(x, y);
    if (l > maxL) maxL = l;
  }
  cols.push({ x, l: Math.round(maxL) });
}

// Group into blocks of high lum (> 180)
const blocks = [];
let inBlock = false;
let startX = 0;
for (const c of cols) {
  if (c.l > 175) {
    if (!inBlock) {
      inBlock = true;
      startX = c.x;
    }
  } else {
    if (inBlock) {
      inBlock = false;
      blocks.push({ startX, endX: c.x - 1, w: c.x - startX });
    }
  }
}
console.log('Digit blocks:', blocks);

// Also let's check the password input inner area (where typing happens):
// The key icon is on the left: let's scan where key icon ends and where typing starts
console.log('--- Input inner scan ---');
let keyEndX = 285;
for (let x = 285; x < 360; x++) {
  let maxL = 0;
  for (let y = 385; y < 405; y++) {
    const l = getLum(x, y);
    if (l > maxL) maxL = l;
  }
  if (maxL > 180) keyEndX = x;
}
console.log('Key icon ends around x:', keyEndX);
