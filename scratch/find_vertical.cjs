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

// 1. Password Box vertical boundaries at x=600
let pTop = 0, pBottom = 0;
for (let y = 580; y <= 660; y++) {
  let [r, g, b] = getRGB(600, y);
  if (r > 160 && g > 110) { pTop = y; break; }
}
for (let y = 700; y >= 640; y--) {
  let [r, g, b] = getRGB(600, y);
  if (r > 160 && g > 110) { pBottom = y; break; }
}
console.log(`Password Box Y: top=${pTop} (${(pTop/height*100).toFixed(2)}%), bottom=${pBottom} (${(pBottom/height*100).toFixed(2)}%), height=${pBottom-pTop} (${((pBottom-pTop)/height*100).toFixed(2)}%)`);

// 2. Hint Button vertical boundaries at x=1150
let hTop = 0, hBottom = 0;
for (let y = 580; y <= 660; y++) {
  let [r, g, b] = getRGB(1150, y);
  if (r > 150 && (b > 60 || g > 100)) { hTop = y; break; }
}
for (let y = 700; y >= 640; y--) {
  let [r, g, b] = getRGB(1150, y);
  if (r > 150 && (b > 60 || g > 100)) { hBottom = y; break; }
}
console.log(`Hint Button Y: top=${hTop} (${(hTop/height*100).toFixed(2)}%), bottom=${hBottom} (${(hBottom/height*100).toFixed(2)}%), height=${hBottom-hTop} (${((hBottom-hTop)/height*100).toFixed(2)}%)`);

// 3. Message For You Button vertical boundaries at x=836
let mTop = 0, mBottom = 0;
for (let y = 690; y <= 770; y++) {
  let [r, g, b] = getRGB(836, y);
  if (r > 200 && g > 160) { mTop = y; break; }
}
for (let y = 850; y >= 750; y--) {
  let [r, g, b] = getRGB(836, y);
  if (r > 200 && g > 160) { mBottom = y; break; }
}
console.log(`Message Button Y: top=${mTop} (${(mTop/height*100).toFixed(2)}%), bottom=${mBottom} (${(mBottom/height*100).toFixed(2)}%), height=${mBottom-mTop} (${((mBottom-mTop)/height*100).toFixed(2)}%)`);
