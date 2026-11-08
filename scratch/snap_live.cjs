const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_p_' + Date.now());
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
        '--remote-debugging-port=0'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 810 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const hasEntrance = await page.$('.entrance-open-button');
    if (hasEntrance) {
      await page.click('.entrance-open-button');
      await new Promise(r => setTimeout(r, 1000));
    }

    const outPath = path.join(__dirname, 'live_countdown_snap.png');
    await page.screenshot({ path: outPath });
    console.log('Successfully captured screenshot:', outPath);

    const metrics = await page.evaluate(() => {
      const getB = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      };
      return {
        stage: getB('.birthday-image-stage'),
        countdown: getB('.overlay-countdown-track'),
        password: getB('.overlay-password-form'),
        hint: getB('.overlay-hint-button'),
        message: getB('.overlay-message-button')
      };
    });
    console.log('Metrics:', JSON.stringify(metrics, null, 2));

    await browser.close();
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
