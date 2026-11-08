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
const bpp = 3;
const stride = width * bpp;
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

// Upper frame bounding box: scan for bright gold borders in upper half (y: 150 to 450, x: 400 to 1300)
// Lower panel bounding box: scan for bright gold borders in lower half (y: 450 to 750, x: 300 to 1400)
console.log('--- SCANNING FRAMES & OUTLINES ---');

// Scan horizontal cross-sections
// In the lower panel (y: 550 to 720), let's find the golden input outline and pink hint outline
// Password input: long golden outline (yellowish/golden: R > 150, G > 100, B < 100)
// Hint button: pink outline (pinkish/reddish: R > 180, G < 120, B > 120 or similar)

let goldOutline = { minX: 9999, maxX: 0, minY: 9999, maxY: 0 };
let pinkOutline = { minX: 9999, maxX: 0, minY: 9999, maxY: 0 };

for (let y = 560; y < 730; y++) {
  for (let x = 350; x < 1350; x++) {
    let [r, g, b] = getRGB(x, y);
    // Golden outline: strong yellow-gold glow
    if (r > 180 && g > 120 && b < 120) {
      // Golden outline of password input
      if (x < 1050) {
        if (x < goldOutline.minX) goldOutline.minX = x;
        if (x > goldOutline.maxX) goldOutline.maxX = x;
        if (y < goldOutline.minY) goldOutline.minY = y;
        if (y > goldOutline.maxY) goldOutline.maxY = y;
      }
    }
    // Pink outline: hint button outline (usually around x: 1000 to 1250)
    // In RGB, pink has high R, low/medium G, and noticeable B (or high R, medium G, medium/high B with R > G and B > G)
    if (x > 950 && x < 1280) {
      if (r > 160 && b > 80 && (r - g > 40)) {
        if (x < pinkOutline.minX) pinkOutline.minX = x;
        if (x > pinkOutline.maxX) pinkOutline.maxX = x;
        if (y < pinkOutline.minY) pinkOutline.minY = y;
        if (y > pinkOutline.maxY) pinkOutline.maxY = y;
      }
    }
  }
}

console.log('Password Golden Outline:', goldOutline);
console.log('In %: left:', (goldOutline.minX/width*100).toFixed(2), 'top:', (goldOutline.minY/height*100).toFixed(2),
  'width:', ((goldOutline.maxX-goldOutline.minX)/width*100).toFixed(2), 'height:', ((goldOutline.maxY-goldOutline.minY)/height*100).toFixed(2));

console.log('Pink Hint Outline:', pinkOutline);
console.log('In %: left:', (pinkOutline.minX/width*100).toFixed(2), 'top:', (pinkOutline.minY/height*100).toFixed(2),
  'width:', ((pinkOutline.maxX-pinkOutline.minX)/width*100).toFixed(2), 'height:', ((pinkOutline.maxY-pinkOutline.minY)/height*100).toFixed(2));

// Upper frame: scan for borders of upper card (y: 150 to 450)
let upCard = { minX: 9999, maxX: 0, minY: 9999, maxY: 0 };
for (let y = 160; y < 450; y++) {
  for (let x = 400; x < 1300; x++) {
    let [r, g, b] = getRGB(x, y);
    if (r > 180 && g > 130) {
      if (x < upCard.minX) upCard.minX = x;
      if (x > upCard.maxX) upCard.maxX = x;
      if (y < upCard.minY) upCard.minY = y;
      if (y > upCard.maxY) upCard.maxY = y;
    }
  }
}
console.log('Upper Card Borders:', upCard);
console.log('In %: left:', (upCard.minX/width*100).toFixed(2), 'top:', (upCard.minY/height*100).toFixed(2),
  'width:', ((upCard.maxX-upCard.minX)/width*100).toFixed(2), 'height:', ((upCard.maxY-upCard.minY)/height*100).toFixed(2));

// Lower card: scan for borders of lower card (y: 460 to 760)
let lowCard = { minX: 9999, maxX: 0, minY: 9999, maxY: 0 };
for (let y = 460; y < 760; y++) {
  for (let x = 350; x < 1350; x++) {
    let [r, g, b] = getRGB(x, y);
    if (r > 180 && g > 130) {
      if (x < lowCard.minX) lowCard.minX = x;
      if (x > lowCard.maxX) lowCard.maxX = x;
      if (y < lowCard.minY) lowCard.minY = y;
      if (y > lowCard.maxY) lowCard.maxY = y;
    }
  }
}
console.log('Lower Card Borders:', lowCard);
console.log('In %: left:', (lowCard.minX/width*100).toFixed(2), 'top:', (lowCard.minY/height*100).toFixed(2),
  'width:', ((lowCard.maxX-lowCard.minX)/width*100).toFixed(2), 'height:', ((lowCard.maxY-lowCard.minY)/height*100).toFixed(2));
