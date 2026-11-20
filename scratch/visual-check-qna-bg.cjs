const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_qna_snap_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot of Q&A section
    const snapPath = path.join(__dirname, 'qna_bright_contain.png');
    await page.screenshot({ path: snapPath, fullPage: false });
    console.log('Saved screenshot to:', snapPath);

    // Verify computed styles on image and wrapper
    const styles = await page.evaluate(() => {
      const img = document.querySelector('.qna-background-img');
      const wrapper = document.querySelector('.qna-background-wrapper');
      const overlay = document.querySelector('.qna-background-overlay');
      const computedImg = img ? window.getComputedStyle(img) : null;
      return {
        objectFit: computedImg?.objectFit,
        filter: computedImg?.filter,
        transform: computedImg?.transform,
        overlayExists: overlay !== null,
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight,
        renderedWidth: img?.clientWidth,
        renderedHeight: img?.clientHeight
      };
    });
    console.log('Computed styles:', JSON.stringify(styles, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch (_) {}
  }
})();
