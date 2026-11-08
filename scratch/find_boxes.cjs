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

// 1. Password input borders:
// Let's check vertical slice at x=600 across y=580..680
console.log('Vertical slice at x=600 (y=580..680):');
for (let y = 580; y <= 680; y += 2) {
  let [r, g, b] = getRGB(600, y);
  if (r > 160 && g > 110) console.log(`Border at y=${y}: ${r},${g},${b}`);
}

// Check horizontal slice at y=625 (mid height of password box) across x=400..1050
let pLeft = 0, pRight = 0;
for (let x = 400; x <= 1040; x++) {
  let [r, g, b] = getRGB(x, 625);
  if (r > 160 && g > 110 && !pLeft) pLeft = x;
  if (r > 160 && g > 110) pRight = x;
}
console.log(`Password box horizontal at y=625: left=${pLeft} (${(pLeft/width*100).toFixed(2)}%), right=${pRight} (${(pRight/width*100).toFixed(2)}%), width=${pRight-pLeft} (${((pRight-pLeft)/width*100).toFixed(2)}%)`);

// Hint button horizontal slice at y=625 across x=1030..1300
let hLeft = 0, hRight = 0;
for (let x = 1030; x <= 1300; x++) {
  let [r, g, b] = getRGB(x, 625);
  // Hint border has pink/purple color (r > 130, b > 70)
  if (r > 140 && (b > 60 || g > 100) && !hLeft) hLeft = x;
  if (r > 140 && (b > 60 || g > 100)) hRight = x;
}
console.log(`Hint button horizontal at y=625: left=${hLeft} (${(hLeft/width*100).toFixed(2)}%), right=${hRight} (${(hRight/width*100).toFixed(2)}%), width=${hRight-hLeft} (${((hRight-hLeft)/width*100).toFixed(2)}%)`);

// Message For You button at y=750 across x=500..1200
let bLeft = 0, bRight = 0;
for (let x = 500; x <= 1200; x++) {
  let [r, g, b] = getRGB(x, 750);
  if (r > 200 && g > 170 && !bLeft) bLeft = x;
  if (r > 200 && g > 170) bRight = x;
}
console.log(`Message button horizontal at y=750: left=${bLeft} (${(bLeft/width*100).toFixed(2)}%), right=${bRight} (${(bRight/width*100).toFixed(2)}%), width=${bRight-bLeft} (${((bRight-bLeft)/width*100).toFixed(2)}%)`);
