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

console.log('--- SCANNING 1827 x 861 IMAGE ---');

// 1. Check countdown heading and labels:
// Subtitle: around y=160..200
let subBrights = 0;
for (let y = 160; y <= 200; y++) {
  for (let x = Math.round(width * 0.35); x <= Math.round(width * 0.65); x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 160) subBrights++;
  }
}
console.log('Countdown Subtitle area (y=160..200):', subBrights);

// Labels area: around y=260..320
let lblBrights = 0;
for (let y = 260; y <= 320; y++) {
  for (let x = Math.round(width * 0.35); x <= Math.round(width * 0.65); x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 160) lblBrights++;
  }
}
console.log('Countdown Labels area (y=260..320):', lblBrights);

// 2. Check "Can't Wait?" area: y=420..520
let cwBrights = 0;
for (let y = 420; y <= 520; y++) {
  for (let x = Math.round(width * 0.35); x <= Math.round(width * 0.65); x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 160) cwBrights++;
  }
}
console.log('Can\'t Wait area (y=420..520):', cwBrights);

// 3. Find Password field rectangle (golden outline): scan y=520..660
// Look for golden outline:
let pMinX = 9999, pMaxX = 0, pMinY = 9999, pMaxY = 0;
for (let y = 520; y <= 660; y++) {
  for (let x = 400; x <= 1200; x++) {
    let [r, g, b] = getRGB(x, y);
    if (r > 200 && g > 150 && b < 130) {
      if (x < pMinX) pMinX = x;
      if (x > pMaxX) pMaxX = x;
      if (y < pMinY) pMinY = y;
      if (y > pMaxY) pMaxY = y;
    }
  }
}
console.log('Password Outline bounds:', { pMinX, pMaxX, pMinY, pMaxY });
console.log('Password %:', {
  left: (pMinX / width * 100).toFixed(2) + '%',
  top: (pMinY / height * 100).toFixed(2) + '%',
  width: ((pMaxX - pMinX) / width * 100).toFixed(2) + '%',
  height: ((pMaxY - pMinY) / height * 100).toFixed(2) + '%'
});

// 4. Find Hint button rectangle (pink outline): scan y=520..660, x=1100..1450
let hMinX = 9999, hMaxX = 0, hMinY = 9999, hMaxY = 0;
for (let y = 520; y <= 660; y++) {
  for (let x = 1100; x <= 1450; x++) {
    let [r, g, b] = getRGB(x, y);
    if (r > 180 && (r - g > 40) && b > 80) {
      if (x < hMinX) hMinX = x;
      if (x > hMaxX) hMaxX = x;
      if (y < hMinY) hMinY = y;
      if (y > hMaxY) hMaxY = y;
    }
  }
}
console.log('Hint Outline bounds:', { hMinX, hMaxX, hMinY, hMaxY });
console.log('Hint %:', {
  left: (hMinX / width * 100).toFixed(2) + '%',
  top: (hMinY / height * 100).toFixed(2) + '%',
  width: ((hMaxX - hMinX) / width * 100).toFixed(2) + '%',
  height: ((hMaxY - hMinY) / height * 100).toFixed(2) + '%'
});

// 5. Check what is inside the Hint button: does it have a lightbulb icon or text?
let hBrights = 0;
for (let y = hMinY + 10; y <= hMaxY - 10; y++) {
  for (let x = hMinX + 10; x <= hMaxX - 10; x++) {
    let [r, g, b] = getRGB(x, y);
    if ((r+g+b)/3 > 160) hBrights++;
  }
}
console.log('Hint button interior bright pixels:', hBrights);

// 6. Check countdown numbers area: where is the exact center of the upper frame?
// Upper frame border: scan y=140..380
let uMinX = 9999, uMaxX = 0, uMinY = 9999, uMaxY = 0;
for (let y = 140; y <= 380; y++) {
  for (let x = 400; x <= 1450; x++) {
    let [r, g, b] = getRGB(x, y);
    if (r > 200 && g > 160) {
      if (x < uMinX) uMinX = x;
      if (x > uMaxX) uMaxX = x;
      if (y < uMinY) uMinY = y;
      if (y > uMaxY) uMaxY = y;
    }
  }
}
console.log('Upper Frame bounds:', { uMinX, uMaxX, uMinY, uMaxY });
console.log('Upper Frame %:', {
  left: (uMinX / width * 100).toFixed(2) + '%',
  top: (uMinY / height * 100).toFixed(2) + '%',
  width: ((uMaxX - uMinX) / width * 100).toFixed(2) + '%',
  height: ((uMaxY - uMinY) / height * 100).toFixed(2) + '%'
});
