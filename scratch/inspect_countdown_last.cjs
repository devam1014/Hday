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

console.log('--- SCANNING countdown-last.png (1672 x 941) ---');

// 1. Top Heading (y: 40..140)
let topBrights = 0;
for (let y = 40; y <= 140; y++) {
  for (let x = Math.round(width * 0.3); x <= Math.round(width * 0.7); x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 170) topBrights++;
  }
}
console.log('Top heading area bright pixels (y=40..140):', topBrights);

// 2. Countdown area (y: 160..360):
// Find upper subtitle "THE SURPRISE UNLOCKS IN"
let subMinY = 9999, subMaxY = 0;
for (let y = 160; y <= 250; y++) {
  for (let x = Math.round(width * 0.35); x <= Math.round(width * 0.65); x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 170) {
      if (y < subMinY) subMinY = y;
      if (y > subMaxY) subMaxY = y;
    }
  }
}
console.log('Upper subtitle Y:', subMinY, 'to', subMaxY);

// Find countdown labels ("DAYS", "HOURS", etc.)
let lblMinY = 9999, lblMaxY = 0;
for (let y = 250; y <= 380; y++) {
  for (let x = Math.round(width * 0.35); x <= Math.round(width * 0.65); x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 160) {
      if (y < lblMinY) lblMinY = y;
      if (y > lblMaxY) lblMaxY = y;
    }
  }
}
console.log('Countdown labels Y:', lblMinY, 'to', lblMaxY);

// Check if countdown numbers area (between subMaxY and lblMinY) is empty or has numbers
let numBrights = 0;
for (let y = subMaxY + 5; y < lblMinY - 5; y++) {
  for (let x = Math.round(width * 0.35); x <= Math.round(width * 0.65); x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 170) numBrights++;
  }
}
console.log('Countdown numbers area (y=' + (subMaxY+5) + '..' + (lblMinY-5) + ') bright pixels:', numBrights);

// 3. Find Password field (golden outline, y: 550..720)
let pTop = 0, pBottom = 0;
for (let y = 560; y <= 660; y++) {
  let [r, g, b] = getRGB(700, y);
  if (r > 200 && g > 160) { pTop = y; break; }
}
for (let y = 720; y >= 640; y--) {
  let [r, g, b] = getRGB(700, y);
  if (r > 200 && g > 160) { pBottom = y; break; }
}
let pMidY = Math.round((pTop + pBottom) / 2);
let pLeft = 0, pRight = 0;
for (let x = 380; x <= 500; x++) {
  let [r, g, b] = getRGB(x, pMidY);
  if (r > 200 && g > 150) { pLeft = x; break; }
}
for (let x = 1100; x >= 950; x--) {
  let [r, g, b] = getRGB(x, pMidY);
  if (r > 200 && g > 150) { pRight = x; break; }
}
console.log('Password Box:', { pLeft, pRight, pTop, pBottom, width: pRight - pLeft, height: pBottom - pTop });
console.log('Password %:', {
  left: (pLeft / width * 100).toFixed(2) + '%',
  top: (pTop / height * 100).toFixed(2) + '%',
  width: ((pRight - pLeft) / width * 100).toFixed(2) + '%',
  height: ((pBottom - pTop) / height * 100).toFixed(2) + '%'
});

// Check key icon inside password box
console.log('Password interior x=' + pLeft + '..' + (pLeft+120) + ' at y=' + pMidY);
for (let x = pLeft; x <= pLeft + 120; x += 10) {
  let [r, g, b] = getRGB(x, pMidY);
  console.log('x=' + x + ' RGB: ' + r + ',' + g + ',' + b);
}

// 4. Find Hint button (pink outline, y: 560..720, x: 1000..1300)
let hTop = 0, hBottom = 0;
for (let y = 560; y <= 660; y++) {
  let [r, g, b] = getRGB(1140, y);
  if (r > 180 && (r - g > 40)) { hTop = y; break; }
}
for (let y = 720; y >= 640; y--) {
  let [r, g, b] = getRGB(1140, y);
  if (r > 180 && (r - g > 40)) { hBottom = y; break; }
}
let hMidY = Math.round((hTop + hBottom) / 2);
let hLeft = 0, hRight = 0;
for (let x = 1000; x <= 1120; x++) {
  let [r, g, b] = getRGB(x, hMidY);
  if (r > 180 && (r - g > 40)) { hLeft = x; break; }
}
for (let x = 1300; x >= 1180; x--) {
  let [r, g, b] = getRGB(x, hMidY);
  if (r > 180 && (r - g > 40)) { hRight = x; break; }
}
console.log('Hint Button:', { hLeft, hRight, hTop, hBottom, width: hRight - hLeft, height: hBottom - hTop });
console.log('Hint %:', {
  left: (hLeft / width * 100).toFixed(2) + '%',
  top: (hTop / height * 100).toFixed(2) + '%',
  width: ((hRight - hLeft) / width * 100).toFixed(2) + '%',
  height: ((hBottom - hTop) / height * 100).toFixed(2) + '%'
});

// Check what is inside Hint button
for (let x = hLeft + 15; x <= hRight - 15; x += 15) {
  let [r, g, b] = getRGB(x, hMidY);
  console.log('Hint interior x=' + x + ' RGB: ' + r + ',' + g + ',' + b);
}

// 5. Check bottom button (Message For You): y: 750..880
let bTop = 0, bBottom = 0;
for (let y = 750; y <= 830; y++) {
  let [r, g, b] = getRGB(836, y);
  if (r > 210 && g > 180) { bTop = y; break; }
}
for (let y = 890; y >= 820; y--) {
  let [r, g, b] = getRGB(836, y);
  if (r > 210 && g > 180) { bBottom = y; break; }
}
let bMidY = Math.round((bTop + bBottom) / 2);
let bLeft = 0, bRight = 0;
for (let x = 500; x <= 650; x++) {
  let [r, g, b] = getRGB(x, bMidY);
  if (r > 210 && g > 180) { bLeft = x; break; }
}
for (let x = 1200; x >= 1050; x--) {
  let [r, g, b] = getRGB(x, bMidY);
  if (r > 210 && g > 180) { bRight = x; break; }
}
console.log('Bottom Button:', { bLeft, bRight, bTop, bBottom, width: bRight - bLeft, height: bBottom - bTop });
console.log('Bottom Button %:', {
  left: (bLeft / width * 100).toFixed(2) + '%',
  top: (bTop / height * 100).toFixed(2) + '%',
  width: ((bRight - bLeft) / width * 100).toFixed(2) + '%',
  height: ((bBottom - bTop) / height * 100).toFixed(2) + '%'
});

// Check if Message For You has text printed in the image:
let msgBrights = 0;
for (let y = bTop + 5; y <= bBottom - 5; y++) {
  for (let x = bLeft + 50; x <= bRight - 50; x++) {
    let [r, g, b] = getRGB(x, y);
    // Dark brown text pixels on cream background (R < 100, G < 60)
    if (r < 120 && g < 80) msgBrights++;
  }
}
console.log('Message button interior dark text pixels:', msgBrights);
