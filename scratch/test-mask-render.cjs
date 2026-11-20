const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function test() {
  const profileDir = path.join(__dirname, 'chrome_test_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: [
        `--user-data-dir=${profileDir}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--remote-debugging-port=0',
        '--allow-file-access-from-files'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1672, height: 940 });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 0; background: #000; overflow: hidden; }
  .container { position: relative; width: 1672px; height: 940px; }
  .bg-img { width: 100%; height: 100%; object-fit: cover; object-position: center bottom; display: block; }
  .overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.22);
    -webkit-mask-image: url("file://${path.resolve('public/scenery-darkening-mask.svg').replace(/\\/g, '/')}");
    mask-image: url("file://${path.resolve('public/scenery-darkening-mask.svg').replace(/\\/g, '/')}");
    -webkit-mask-size: cover;
    mask-size: cover;
    -webkit-mask-position: center bottom;
    mask-position: center bottom;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
</style>
</head>
<body>
  <div class="container">
    <img src="file://${path.resolve('public/background.png').replace(/\\/g, '/')}" class="bg-img" />
    <div class="overlay"></div>
  </div>
</body>
</html>
    `;

    await page.setContent(htmlContent);
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(__dirname, 'test-mask-output.png') });
    console.log('Screenshot saved to scratch/test-mask-output.png');

    await browser.close();
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
}

test().catch(console.error);
