const fs = require('fs');
const zlib = require('zlib');

function parsePNG(filename) {
  const buf = fs.readFileSync(filename);
  let offset = 8;
  let width, height;
  const idatChunks = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let srcPos = 0, destPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcPos++];
    for (let x = 0; x < stride; x++) {
      const raw = decompressed[srcPos++];
      let prior = 0;
      let above = y > 0 ? pixels[destPos - stride] : 0;
      let priorAbove = y > 0 && x >= bytesPerPixel ? pixels[destPos - stride - bytesPerPixel] : 0;
      if (x >= bytesPerPixel) prior = pixels[destPos - bytesPerPixel];
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
        let pr = (pa <= pb && pa <= pc) ? prior : (pb <= pc ? above : priorAbove);
        val = (raw + pr) & 0xff;
      }
      pixels[destPos++] = val;
    }
  }
  return { width, height, pixels };
}

const img2 = parsePNG('C:/Users/devam/.gemini/antigravity/brain/52d7baf4-2555-4e56-bbbd-735b69f5e818/.user_uploaded/media_1794583956907_a3d9eea8.png');

// Find the outer card top border near x=480 (horizontal center)
let cardTopY = 0;
for (let y = 0; y < 100; y++) {
  const idx = (y * img2.width + 480) * 4;
  const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
  if (r > 230 && g > 200) {
    cardTopY = y;
    break;
  }
}

// Find card bottom border near x=480
let cardBottomY = 0;
for (let y = img2.height - 1; y > img2.height - 100; y--) {
  const idx = (y * img2.width + 480) * 4;
  const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
  if (r > 230 && g > 200) {
    cardBottomY = y;
    break;
  }
}

// Find card left border near y=270 (vertical center)
let cardLeftX = 0;
for (let x = 200; x < 400; x++) {
  const idx = (270 * img2.width + x) * 4;
  const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
  if (r > 230 && g > 180) {
    cardLeftX = x;
    break;
  }
}

// Find card right border near y=270
let cardRightX = 0;
for (let x = img2.width - 200; x > 500; x--) {
  const idx = (270 * img2.width + x) * 4;
  const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
  if (r > 230 && g > 180) {
    cardRightX = x;
    break;
  }
}

console.log('Center card exact bounds in 960x540 screen:', {
  cardLeftX, cardRightX, cardTopY, cardBottomY,
  cardWidth: cardRightX - cardLeftX,
  cardHeight: cardBottomY - cardTopY,
  widthPercent: ((cardRightX - cardLeftX) / img2.width * 100).toFixed(1) + '%',
  heightPercent: ((cardBottomY - cardTopY) / img2.height * 100).toFixed(1) + '%',
  aspectRatio: ((cardRightX - cardLeftX) / (cardBottomY - cardTopY)).toFixed(3)
});

// Now find inner video bounds: look for the reddish/orange video gradient
// at y=270, find video left and right
let videoLeftX = 0, videoRightX = 0;
for (let x = cardLeftX + 5; x < 480; x++) {
  const idx = (270 * img2.width + x) * 4;
  const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
  // video gradient has strong orange/red (R ~ 180..230, G ~ 60..100, B ~ 10..30)
  if (r > 160 && g > 50 && b < 60) {
    videoLeftX = x;
    break;
  }
}

for (let x = cardRightX - 5; x > 480; x--) {
  const idx = (270 * img2.width + x) * 4;
  const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
  if (r > 160 && g > 50 && b < 60) {
    videoRightX = x;
    break;
  }
}

// Find video top and bottom near x=480
let videoTopY = 0, videoBottomY = 0;
for (let y = cardTopY + 5; y < 270; y++) {
  const idx = (y * img2.width + 480) * 4;
  const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
  // video top is dark plum/red (R ~ 90..140, G ~ 30..50, B ~ 40..60)
  if (r > 90 && g > 25 && g < 70) {
    videoTopY = y;
    break;
  }
}
for (let y = cardBottomY - 5; y > 270; y--) {
  const idx = (y * img2.width + 480) * 4;
  const r = img2.pixels[idx], g = img2.pixels[idx+1], b = img2.pixels[idx+2];
  // video bottom is bright orange (R ~ 200..255, G ~ 80..130)
  if (r > 180 && g > 60) {
    videoBottomY = y;
    break;
  }
}

console.log('Inner video bounds:', {
  videoLeftX, videoRightX, videoTopY, videoBottomY,
  videoWidth: videoRightX - videoLeftX,
  videoHeight: videoBottomY - videoTopY,
  videoAspectRatio: ((videoRightX - videoLeftX) / (videoBottomY - videoTopY)).toFixed(3),
  horizontalMargin: videoLeftX - cardLeftX,
  topMargin: videoTopY - cardTopY,
  bottomMargin: cardBottomY - videoBottomY
});
