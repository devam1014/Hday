const fs = require('fs');
const zlib = require('zlib');

// Read PNG file and decode RGBA using standard Node zlib
function parsePNG(filename) {
  const buf = fs.readFileSync(filename);
  let offset = 8;
  let width, height, bitDepth, colorType;
  const idatChunks = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
      bitDepth = buf.readUInt8(offset + 16);
      colorType = buf.readUInt8(offset + 17);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);

  // Unfilter scanlines (RGBA 8-bit)
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let srcPos = 0;
  let destPos = 0;

  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcPos++];
    for (let x = 0; x < stride; x++) {
      const raw = decompressed[srcPos++];
      let prior = 0;
      let above = y > 0 ? pixels[destPos - stride] : 0;
      let priorAbove = y > 0 && x >= bytesPerPixel ? pixels[destPos - stride - bytesPerPixel] : 0;
      if (x >= bytesPerPixel) {
        prior = pixels[destPos - bytesPerPixel];
      }

      let val = 0;
      if (filter === 0) val = raw;
      else if (filter === 1) val = (raw + prior) & 0xff;
      else if (filter === 2) val = (raw + above) & 0xff;
      else if (filter === 3) val = (raw + Math.floor((prior + above) / 2)) & 0xff;
      else if (filter === 4) {
        const p = prior + above - priorAbove;
        const pa = Math.abs(p - prior);
        const pb = Math.abs(p - above);
        const pc = Math.abs(p - priorAbove);
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
console.log('Parsed PNG:', width, 'x', height);

function getPixel(x, y) {
  const idx = (y * width + x) * 4;
  return {
    r: pixels[idx],
    g: pixels[idx+1],
    b: pixels[idx+2],
    a: pixels[idx+3],
    lum: pixels[idx] * 0.299 + pixels[idx+1] * 0.587 + pixels[idx+2] * 0.114
  };
}

// 1. Scan for countdown digits (02 : 14 : 37 : 09)
let countX1 = 1000, countX2 = 0, countY1 = 1000, countY2 = 0;
for (let y = 145; y < 225; y++) {
  for (let x = 320; x < 710; x++) {
    if (getPixel(x, y).lum > 210) {
      if (x < countX1) countX1 = x;
      if (x > countX2) countX2 = x;
      if (y < countY1) countY1 = y;
      if (y > countY2) countY2 = y;
    }
  }
}

// 2. Scan for input box glowing border
let inX1 = 1000, inX2 = 0, inY1 = 1000, inY2 = 0;
for (let y = 360; y < 440; y++) {
  for (let x = 270; x < 640; x++) {
    const p = getPixel(x, y);
    // Golden border
    if (p.r > 200 && p.g > 140 && p.b < 130) {
      if (x < inX1) inX1 = x;
      if (x > inX2) inX2 = x;
      if (y < inY1) inY1 = y;
      if (y > inY2) inY2 = y;
    }
  }
}

// 3. Scan for Hint button glowing border
let hintX1 = 1000, hintX2 = 0, hintY1 = 1000, hintY2 = 0;
for (let y = 360; y < 440; y++) {
  for (let x = 630; x < 760; x++) {
    const p = getPixel(x, y);
    // Reddish glowing border
    if (p.r > 200 && p.g > 100 && p.b > 80 && (p.g < 170 || p.b < 140)) {
      if (x < hintX1) hintX1 = x;
      if (x > hintX2) hintX2 = x;
      if (y < hintY1) hintY1 = y;
      if (y > hintY2) hintY2 = y;
    }
  }
}

// 4. Scan for Message For You button
let msgX1 = 1000, msgX2 = 0, msgY1 = 1000, msgY2 = 0;
for (let y = 460; y < 540; y++) {
  for (let x = 340; x < 680; x++) {
    const p = getPixel(x, y);
    // Cream/ivory button surface
    if (p.r > 230 && p.g > 200 && p.b > 160) {
      if (x < msgX1) msgX1 = x;
      if (x > msgX2) msgX2 = x;
      if (y < msgY1) msgY1 = y;
      if (y > msgY2) msgY2 = y;
    }
  }
}

function stats(name, x1, x2, y1, y2) {
  console.log(name, {
    px: { x1, x2, y1, y2, w: x2 - x1, h: y2 - y1 },
    pct: {
      left: ((x1 / width) * 100).toFixed(2) + '%',
      top: ((y1 / height) * 100).toFixed(2) + '%',
      width: (((x2 - x1) / width) * 100).toFixed(2) + '%',
      height: (((y2 - y1) / height) * 100).toFixed(2) + '%'
    }
  });
}

stats('Countdown Numbers', countX1, countX2, countY1, countY2);
stats('Password Input Box', inX1, inX2, inY1, inY2);
stats('Hint Button', hintX1, hintX2, hintY1, hintY2);
stats('Message For You Button', msgX1, msgX2, msgY1, msgY2);
