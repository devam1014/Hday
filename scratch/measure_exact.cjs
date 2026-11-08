const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('countdown-bg.png');
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

console.log('=== EXACT GEOMETRY OF CLEAN countdown-bg.png (1672 x 941) ===');

// 1. Password input outline:
// Scan x=400..1050 at y=652 to find inner and outer bounds
let pLeft = 0, pRight = 0;
for (let x = 400; x <= 450; x++) {
  let [r, g, b] = getRGB(x, 652);
  if ((r > 200 && g > 150) || (r > 180 && g > 120 && b < 120)) {
    pLeft = x;
    break;
  }
}
for (let x = 1050; x >= 1000; x--) {
  let [r, g, b] = getRGB(x, 652);
  if ((r > 200 && g > 150) || (r > 180 && g > 120 && b < 120)) {
    pRight = x;
    break;
  }
}

// Top and bottom of password input at x=700
let pTop = 0, pBottom = 0;
for (let y = 580; y <= 630; y++) {
  let [r, g, b] = getRGB(700, y);
  if (r > 200 && g > 180) { pTop = y; break; }
}
for (let y = 720; y >= 670; y--) {
  let [r, g, b] = getRGB(700, y);
  if (r > 200 && g > 180) { pBottom = y; break; }
}

console.log('Password Outline:', { pLeft, pRight, pTop, pBottom, width: pRight - pLeft, height: pBottom - pTop });
console.log('Password %:', {
  left: (pLeft / width * 100).toFixed(2) + '%',
  top: (pTop / height * 100).toFixed(2) + '%',
  width: ((pRight - pLeft) / width * 100).toFixed(2) + '%',
  height: ((pBottom - pTop) / height * 100).toFixed(2) + '%'
});

// Key icon inside password input:
// Scan x=430..520, y=620..680
let keyMinX = 9999, keyMaxX = 0;
for (let y = 620; y <= 680; y++) {
  for (let x = 430; x <= 520; x++) {
    let [r, g, b] = getRGB(x, y);
    if (r > 190 && g > 150) {
      if (x < keyMinX) keyMinX = x;
      if (x > keyMaxX) keyMaxX = x;
    }
  }
}
console.log('Key Icon in password box:', { keyMinX, keyMaxX, width: keyMaxX - keyMinX });
console.log('Key ends at x=' + keyMaxX + ' which is ' + ((keyMaxX - pLeft) / (pRight - pLeft) * 100).toFixed(1) + '% into password box');

// 2. Hint button outline:
let hLeft = 0, hRight = 0;
for (let x = 1030; x <= 1080; x++) {
  let [r, g, b] = getRGB(x, 652);
  if (r > 180 && (r - g > 40)) { hLeft = x; break; }
}
for (let x = 1250; x >= 1180; x--) {
  let [r, g, b] = getRGB(x, 652);
  if (r > 180 && (r - g > 40)) { hRight = x; break; }
}
let hTop = 0, hBottom = 0;
for (let y = 580; y <= 630; y++) {
  let [r, g, b] = getRGB(1130, y);
  if (r > 180 && (r - g > 40)) { hTop = y; break; }
}
for (let y = 720; y >= 670; y--) {
  let [r, g, b] = getRGB(1130, y);
  if (r > 180 && (r - g > 40)) { hBottom = y; break; }
}
console.log('Hint Outline:', { hLeft, hRight, hTop, hBottom, width: hRight - hLeft, height: hBottom - hTop });
console.log('Hint %:', {
  left: (hLeft / width * 100).toFixed(2) + '%',
  top: (hTop / height * 100).toFixed(2) + '%',
  width: ((hRight - hLeft) / width * 100).toFixed(2) + '%',
  height: ((hBottom - hTop) / height * 100).toFixed(2) + '%'
});

// 3. Bottom Button outline:
let bTop = 0, bBottom = 0, bLeft = 0, bRight = 0;
for (let y = 750; y <= 800; y++) {
  let [r, g, b] = getRGB(836, y);
  if (r > 220 && g > 180) { bTop = y; break; }
}
for (let y = 880; y >= 820; y--) {
  let [r, g, b] = getRGB(836, y);
  if (r > 220 && g > 180) { bBottom = y; break; }
}
for (let x = 500; x <= 650; x++) {
  let [r, g, b] = getRGB(x, 815);
  if (r > 220 && g > 180) { bLeft = x; break; }
}
for (let x = 1200; x >= 1050; x--) {
  let [r, g, b] = getRGB(x, 815);
  if (r > 220 && g > 180) { bRight = x; break; }
}
console.log('Bottom Button:', { bLeft, bRight, bTop, bBottom, width: bRight - bLeft, height: bBottom - bTop });
console.log('Bottom Button %:', {
  left: (bLeft / width * 100).toFixed(2) + '%',
  top: (bTop / height * 100).toFixed(2) + '%',
  width: ((bRight - bLeft) / width * 100).toFixed(2) + '%',
  height: ((bBottom - bTop) / height * 100).toFixed(2) + '%'
});

// 4. Upper frame inner area:
// Left border, right border, top border, bottom border of upper frame
let ufTop = 0, ufBottom = 0, ufLeft = 0, ufRight = 0;
for (let y = 150; y <= 210; y++) {
  let [r, g, b] = getRGB(836, y);
  if (r > 200 && g > 150) { ufTop = y; break; }
}
for (let y = 440; y >= 380; y--) {
  let [r, g, b] = getRGB(836, y);
  if (r > 200 && g > 150) { ufBottom = y; break; }
}
for (let x = 400; x <= 500; x++) {
  let [r, g, b] = getRGB(x, 300);
  if (r > 180 && g > 130) { ufLeft = x; break; }
}
for (let x = 1300; x >= 1150; x--) {
  let [r, g, b] = getRGB(x, 300);
  if (r > 180 && g > 130) { ufRight = x; break; }
}
console.log('Upper Frame:', { ufLeft, ufRight, ufTop, ufBottom, width: ufRight - ufLeft, height: ufBottom - ufTop });
console.log('Upper Frame %:', {
  left: (ufLeft / width * 100).toFixed(2) + '%',
  top: (ufTop / height * 100).toFixed(2) + '%',
  width: ((ufRight - ufLeft) / width * 100).toFixed(2) + '%',
  height: ((ufBottom - ufTop) / height * 100).toFixed(2) + '%'
});
