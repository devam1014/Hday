const fs = require('fs');
const { PNG } = require('pngjs'); // Let's check if pngjs is available or write canvas
try {
  const PNG = require('pngjs').PNG;
  const data = fs.readFileSync('QNA-cover.png');
  const png = PNG.sync.read(data);
  console.log('PNG read success:', png.width, 'x', png.height);
} catch (e) {
  console.log('pngjs not installed, will check with puppeteer');
}
