import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const profileDir = path.join(__dirname, 'chrome_h_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      `--user-data-dir=${profileDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  for (const h of [768, 700, 650, 600]) {
    await page.setViewport({ width: 1366, height: h });
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));

    const info = await page.evaluate(() => {
      const mainRoot = document.querySelector('.main-page-root');
      const content = document.querySelector('.main-content-layout');
      const docEl = document.documentElement;

      return {
        winH: window.innerHeight,
        rootScrollH: mainRoot?.scrollHeight,
        rootClientH: mainRoot?.clientHeight,
        contentBottom: content?.getBoundingClientRect().bottom,
        docScrollH: docEl.scrollHeight,
        docClientH: docEl.clientHeight,
      };
    });

    console.log(`Height ${h}: rootScrollH=${info.rootScrollH}, rootClientH=${info.rootClientH}, contentBottom=${info.contentBottom?.toFixed(1)}, docScrollH=${info.docScrollH}, docClientH=${info.docClientH}`);
  }

  await browser.close();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
})();
