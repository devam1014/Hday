const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_inspect_characters');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test at 1440x900 viewport:
  // 80% zoom: width = 1440 / 0.8 = 1800, height = 900 / 0.8 = 1125
  // 100% zoom: width = 1440, height = 900
  await page.setViewport({ width: 1800, height: 1125 });
  await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'inspect_layout_80zoom.png') });

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'inspect_layout_100zoom.png') });

  // Also take a screenshot of background ONLY (clean view)
  await page.evaluate(() => {
    document.querySelector('.qna-screen-container').style.display = 'none';
  });
  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'inspect_bg_only_1440.png') });

  await browser.close();
  console.log('Saved screenshots for inspection');
})();
