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

const crop = parsePNG('scratch/ref_video_crop.png');
console.log('ref_video_crop dims:', crop.width, 'x', crop.height);

// Sample colors across the glass card margin (around the video or border)
const colors = [];
for (let y = 10; y < crop.height - 10; y += 15) {
  for (let x = 10; x < crop.width - 10; x += 15) {
    const idx = (y * crop.width + x) * 4;
    colors.push({ x, y, r: crop.pixels[idx], g: crop.pixels[idx+1], b: crop.pixels[idx+2] });
  }
}

// Find colors with R > G and R > B (warm plum / burgundy / dark purple tint)
const plumColors = colors.filter(c => c.r > c.g && c.b > c.g);
console.log('Sample plum colors in ref_video_crop:');
plumColors.slice(0, 20).forEach(c => console.log(`x=${c.x}, y=${c.y}: rgb(${c.r}, ${c.g}, ${c.b})`));

const full = parsePNG('scratch/ref_video_full.png');
console.log('ref_video_full dims:', full.width, 'x', full.height);
// Sample the glass card header area (above the video)
const headerColors = [];
const cx = Math.floor(full.width / 2);
for (let y = Math.floor(full.height * 0.15); y < Math.floor(full.height * 0.35); y += 10) {
  for (let x = cx - 100; x < cx + 100; x += 20) {
    const idx = (y * full.width + x) * 4;
    headerColors.push({ x, y, r: full.pixels[idx], g: full.pixels[idx+1], b: full.pixels[idx+2] });
  }
}
console.log('Sample header area colors in ref_video_full:');
headerColors.slice(0, 15).forEach(c => console.log(`x=${c.x}, y=${c.y}: rgb(${c.r}, ${c.g}, ${c.b})`));
