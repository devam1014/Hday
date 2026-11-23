const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_verify_loaded');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'load' });

  // Wait specifically for background image to complete
  await page.waitForFunction(() => {
    const img = document.querySelector('.qna-background-img');
    return img && img.complete && img.naturalHeight > 0;
  }, { timeout: 10000 });

  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'verify_fully_loaded_100.png') });
  console.log('Saved scratch/verify_fully_loaded_100.png');
  await browser.close();
})();
