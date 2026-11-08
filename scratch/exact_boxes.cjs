const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('final-countdown.png');
let offset = 8, width = 1670, height = 942, idat = [];
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

console.log('--- FINDING EXACT BOX BOUNDARIES IN final-countdown.png (1670 x 942) ---');

// 1. Password Golden Box
// Let's find left, right, top, bottom of the golden outline of password box
// Look at horizontal slice around y=640 across x=350..1100
let pLeft = 0, pRight = 0, pTop = 0, pBottom = 0;
// Search x=380..450 for the left gold border
for (let x = 380; x <= 460; x++) {
  let [r, g, b] = getRGB(x, 640);
  if (r > 200 && g > 150) { pLeft = x; break; }
}
// Search x=980..1060 for the right gold border of password box
for (let x = 1050; x >= 980; x--) {
  let [r, g, b] = getRGB(x, 640);
  if (r > 200 && g > 150) { pRight = x; break; }
}
// Search y=580..630 at x=600 for top gold border
for (let y = 580; y <= 640; y++) {
  let [r, g, b] = getRGB(600, y);
  if (r > 190 && g > 130) { pTop = y; break; }
}
// Search y=680..640 at x=600 for bottom gold border
for (let y = 690; y >= 640; y--) {
  let [r, g, b] = getRGB(600, y);
  if (r > 190 && g > 130) { pBottom = y; break; }
}
console.log('Password Box:', { pLeft, pRight, pTop, pBottom, w: pRight - pLeft, h: pBottom - pTop });
console.log('Password %:', {
  left: (pLeft / width * 100).toFixed(2) + '%',
  top: (pTop / height * 100).toFixed(2) + '%',
  width: ((pRight - pLeft) / width * 100).toFixed(2) + '%',
  height: ((pBottom - pTop) / height * 100).toFixed(2) + '%'
});

// 2. Hint Pink Box
let hLeft = 0, hRight = 0, hTop = 0, hBottom = 0;
// Search x=1030..1080 for the left border of hint box
for (let x = 1020; x <= 1090; x++) {
  let [r, g, b] = getRGB(x, 640);
  if (r > 160 && (b > 60 || g > 100)) { hLeft = x; break; }
}
// Search x=1220..1280 for right border of hint box
for (let x = 1280; x >= 1200; x--) {
  let [r, g, b] = getRGB(x, 640);
  if (r > 160 && (b > 60 || g > 100)) { hRight = x; break; }
}
// Search y=580..640 at x=1150 for top border
for (let y = 580; y <= 640; y++) {
  let [r, g, b] = getRGB(1150, y);
  if (r > 150 && (b > 50 || g > 100)) { hTop = y; break; }
}
// Search y=690..640 at x=1150 for bottom border
for (let y = 690; y >= 640; y--) {
  let [r, g, b] = getRGB(1150, y);
  if (r > 150 && (b > 50 || g > 100)) { hBottom = y; break; }
}
console.log('Hint Box:', { hLeft, hRight, hTop, hBottom, w: hRight - hLeft, h: hBottom - hTop });
console.log('Hint %:', {
  left: (hLeft / width * 100).toFixed(2) + '%',
  top: (hTop / height * 100).toFixed(2) + '%',
  width: ((hRight - hLeft) / width * 100).toFixed(2) + '%',
  height: ((hBottom - hTop) / height * 100).toFixed(2) + '%'
});

// 3. Message For You glowing pill button at bottom
let mLeft = 0, mRight = 0, mTop = 0, mBottom = 0;
// Search x=480..600 for left edge of pill at y=760
for (let x = 480; x <= 620; x++) {
  let [r, g, b] = getRGB(x, 760);
  if (r > 200 && g > 160) { mLeft = x; break; }
}
// Search x=1200..1050 for right edge of pill at y=760
for (let x = 1200; x >= 1050; x--) {
  let [r, g, b] = getRGB(x, 760);
  if (r > 200 && g > 160) { mRight = x; break; }
}
// Search y=700..770 at x=835 (center) for top edge
for (let y = 700; y <= 770; y++) {
  let [r, g, b] = getRGB(835, y);
  if (r > 210 && g > 170) { mTop = y; break; }
}
// Search y=860..780 at x=835 for bottom edge
for (let y = 860; y >= 770; y--) {
  let [r, g, b] = getRGB(835, y);
  if (r > 210 && g > 170) { mBottom = y; break; }
}
console.log('Message Button:', { mLeft, mRight, mTop, mBottom, w: mRight - mLeft, h: mBottom - mTop });
console.log('Message %:', {
  left: (mLeft / width * 100).toFixed(2) + '%',
  top: (mTop / height * 100).toFixed(2) + '%',
  width: ((mRight - mLeft) / width * 100).toFixed(2) + '%',
  height: ((mBottom - mTop) / height * 100).toFixed(2) + '%'
});
