const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('countdown-last.png');
let offset = 8, width = 1672, height = 941, idat = [];
while (offset < buf.length) {
  let len = buf.readUInt32BE(offset);
  let type = buf.toString('ascii', offset+4, offset+8);
  if (type === 'IDAT') idat.push(buf.subarray(offset+8, offset+8+len));
  offset += 12 + len;
}
const decomp = zlib.inflateSync(Buffer.concat(idat));
const bpp = 3, stride = width * bpp;
const pixels = Buffer.alloc(width * height * 3);
let src = 0, dst = 0;
for (let y = 0; y < height; y++) {
  let filter = decomp[src++];
  for (let x = 0; x < stride; x++) {
    let raw = decomp[src++];
    let prior = x >= bpp ? pixels[dst - bpp] : 0;
    let above = y > 0 ? pixels[dst - stride] : 0;
    let priorAbove = y > 0 && x >= bpp ? pixels[dst - stride - bpp] : 0;
    let val = 0;
    if (filter === 0) val = raw;
    else if (filter === 1) val = (raw + prior) & 0xff;
    else if (filter === 2) val = (raw + above) & 0xff;
    else if (filter === 3) val = (raw + Math.floor((prior + above)/2)) & 0xff;
    else if (filter === 4) {
      let p = prior + above - priorAbove;
      let pa = Math.abs(p - prior);
      let pb = Math.abs(p - above);
      let pc = Math.abs(p - priorAbove);
      let pr = (pa <= pb && pa <= pc) ? prior : (pb <= pc) ? above : priorAbove;
      val = (raw + pr) & 0xff;
    }
    pixels[dst++] = val;
  }
}

function getRGB(x, y) {
  let idx = (y * width + x) * 3;
  return [pixels[idx], pixels[idx+1], pixels[idx+2]];
}

// Map from y=500 to 860
console.log('--- MAP OF LOWER HALF (x: 400..1300, step 15; y: 500..860, step 8) ---');
for (let y = 500; y <= 860; y += 8) {
  let row = '';
  for (let x = 400; x <= 1300; x += 15) {
    let [r, g, b] = getRGB(x, y);
    let br = (r + g + b) / 3;
    if (br > 200) row += '#';
    else if (br > 150) row += '+';
    else if (br > 100) row += '.';
    else row += ' ';
  }
  console.log(`${String(y).padStart(3)} (${(y/height*100).toFixed(1)}%) | ${row}`);
}
