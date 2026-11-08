const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_snap_'));
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      userDataDir: tmpDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    const outPath = path.join(__dirname, 'latest_screenshot.png');
    await page.screenshot({ path: outPath });
    console.log('Screenshot saved to:', outPath);
    await browser.close();
  } catch (err) {
    console.error('Puppeteer error:', err.message);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
