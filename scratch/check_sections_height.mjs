import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const profileDir = path.join(__dirname, 'chrome_sections_' + Date.now());
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
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));

  console.log('--- Checking all sections of Main Birthday ---');

  for (let s = 1; s <= 13; s++) {
    // Click dot for section s
    await page.evaluate((targetSec) => {
      const dots = document.querySelectorAll('.section-indicator-dot');
      if (dots[targetSec - 1]) {
        dots[targetSec - 1].click();
      }
    }, s);
    await new Promise(r => setTimeout(r, 700));

    const info = await page.evaluate(() => {
      const mainRoot = document.querySelector('.main-page-root');
      const content = document.querySelector('.main-content-layout');
      const docEl = document.documentElement;
      const body = document.body;
      const computedRoot = window.getComputedStyle(mainRoot);

      return {
        winH: window.innerHeight,
        rootScrollH: mainRoot ? mainRoot.scrollHeight : null,
        rootClientH: mainRoot ? mainRoot.clientHeight : null,
        contentBottom: content ? content.getBoundingClientRect().bottom : null,
        docScrollH: docEl.scrollHeight,
        docClientH: docEl.clientHeight,
        bodyScrollH: body.scrollHeight,
        bodyClientH: body.clientHeight,
        rootOverflowY: computedRoot.overflowY,
      };
    });

    const hasRootScroll = info.rootScrollH > info.rootClientH;
    const hasDocScroll = info.docScrollH > info.docClientH;
    console.log(`Section ${s}: rootScrollH=${info.rootScrollH}, rootClientH=${info.rootClientH}, contentBottom=${info.contentBottom?.toFixed(1)} -> rootHasScroll=${hasRootScroll}, docHasScroll=${hasDocScroll}`);
  }

  await browser.close();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
})();
