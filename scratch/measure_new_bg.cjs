const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('countdown-bg.png');
let offset = 8, width = 1827, height = 861, idat = [];
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

// 1. Password input box:
// Slice vertically at x=800 (middle of password box)
let pTop = 0, pBottom = 0;
for (let y = 520; y <= 600; y++) {
  let [r, g, b] = getRGB(800, y);
  if (r > 210 && g > 160 && b < 140) { pTop = y; break; }
}
for (let y = 660; y >= 580; y--) {
  let [r, g, b] = getRGB(800, y);
  if (r > 210 && g > 160 && b < 140) { pBottom = y; break; }
}

// Slice horizontally at y=Math.round((pTop+pBottom)/2)
let pMidY = Math.round((pTop + pBottom) / 2);
let pLeft = 0, pRight = 0;
for (let x = 450; x <= 650; x++) {
  let [r, g, b] = getRGB(x, pMidY);
  if (r > 200 && g > 150 && b < 140) { pLeft = x; break; }
}
for (let x = 1250; x >= 1050; x--) {
  let [r, g, b] = getRGB(x, pMidY);
  if (r > 200 && g > 150 && b < 140) { pRight = x; break; }
}
console.log('Password Box:', { pLeft, pRight, pTop, pBottom, width: pRight - pLeft, height: pBottom - pTop });
console.log('Password %:', {
  left: (pLeft / width * 100).toFixed(2) + '%',
  top: (pTop / height * 100).toFixed(2) + '%',
  width: ((pRight - pLeft) / width * 100).toFixed(2) + '%',
  height: ((pBottom - pTop) / height * 100).toFixed(2) + '%'
});

// Check key icon inside password box:
// Scan x=pLeft..pLeft+120 at y=pMidY
for (let x = pLeft; x <= pLeft + 120; x += 10) {
  let [r, g, b] = getRGB(x, pMidY);
  console.log('x=' + x + ' RGB: ' + r + ',' + g + ',' + b);
}

// 2. Hint button:
// Slice vertically at x=1270 (middle of hint button)
let hTop = 0, hBottom = 0;
for (let y = 520; y <= 600; y++) {
  let [r, g, b] = getRGB(1270, y);
  if (r > 190 && (r - g > 40)) { hTop = y; break; }
}
for (let y = 660; y >= 580; y--) {
  let [r, g, b] = getRGB(1270, y);
  if (r > 190 && (r - g > 40)) { hBottom = y; break; }
}
let hMidY = Math.round((hTop + hBottom) / 2);
let hLeft = 0, hRight = 0;
for (let x = 1150; x <= 1260; x++) {
  let [r, g, b] = getRGB(x, hMidY);
  if (r > 190 && (r - g > 40)) { hLeft = x; break; }
}
for (let x = 1420; x >= 1300; x--) {
  let [r, g, b] = getRGB(x, hMidY);
  if (r > 190 && (r - g > 40)) { hRight = x; break; }
}
console.log('Hint Button:', { hLeft, hRight, hTop, hBottom, width: hRight - hLeft, height: hBottom - hTop });
console.log('Hint %:', {
  left: (hLeft / width * 100).toFixed(2) + '%',
  top: (hTop / height * 100).toFixed(2) + '%',
  width: ((hRight - hLeft) / width * 100).toFixed(2) + '%',
  height: ((hBottom - hTop) / height * 100).toFixed(2) + '%'
});

// 3. Countdown numbers area:
// Subtitle y-range (find where "THE SURPRISE UNLOCKS IN" ends)
let subMaxY = 0;
for (let y = 140; y <= 210; y++) {
  for (let x = 800; x <= 1050; x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 170) {
      if (y > subMaxY) subMaxY = y;
    }
  }
}
// Labels y-range (find where "DAYS HOURS MINUTES SECONDS" starts)
let lblMinY = 9999;
for (let y = 240; y <= 330; y++) {
  for (let x = 600; x <= 1200; x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 160) {
      if (y < lblMinY) lblMinY = y;
    }
  }
}
console.log('Countdown area vertical: subMaxY=' + subMaxY + ', lblMinY=' + lblMinY);
console.log('Countdown area height: ' + (lblMinY - subMaxY) + ' px');
console.log('Countdown % top: ' + (subMaxY / height * 100).toFixed(2) + '%, height: ' + ((lblMinY - subMaxY) / height * 100).toFixed(2) + '%');

// Check horizontal alignment of the 4 label words "DAYS", "HOURS", "MINUTES", "SECONDS" in the image!
let labelProfile = [];
for (let x = 550; x <= 1300; x++) {
  let maxB = 0;
  for (let y = lblMinY; y <= lblMinY + 30; y++) {
    let [r, g, b] = getRGB(x, y);
    let br = (r + g + b) / 3;
    if (br > maxB) maxB = br;
  }
  labelProfile.push({ x, b: Math.round(maxB) });
}
let inLabel = false, lStart = 0, labelRanges = [];
for (let i = 0; i < labelProfile.length; i++) {
  if (labelProfile[i].b > 140 && !inLabel) { inLabel = true; lStart = labelProfile[i].x; }
  else if (labelProfile[i].b <= 140 && inLabel) { inLabel = false; labelRanges.push({ start: lStart, end: labelProfile[i-1].x, center: Math.round((lStart + labelProfile[i-1].x)/2) }); }
}
if (inLabel) labelRanges.push({ start: lStart, end: labelProfile[labelProfile.length-1].x, center: Math.round((lStart + labelProfile[labelProfile.length-1].x)/2) });
console.log('Labels ranges in image:', labelRanges);
