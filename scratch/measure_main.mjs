import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const profileDir = path.join(__dirname, 'chrome_measure_' + Date.now());
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
  const stages = ['main', 'qna', 'sad-memories', 'happy-gallery'];

  for (const stage of stages) {
    console.log(`\n=================== STAGE: ${stage} ===================`);
    for (const dims of [{ w: 1920, h: 1080 }, { w: 1440, h: 900 }, { w: 1366, h: 768 }, { w: 1280, h: 800 }, { w: 1024, h: 600 }]) {
      await page.setViewport({ width: dims.w, height: dims.h });
      await page.goto(`http://127.0.0.1:5173/?stage=${stage}`, { waitUntil: 'load' });
      await new Promise(r => setTimeout(r, 600));

      const data = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const all = document.querySelectorAll('*');
        const scrollables = [];

        for (const el of all) {
          const style = window.getComputedStyle(el);
          const hasScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1;
          if (hasScrollY) {
            scrollables.push({
              tag: el.tagName,
              cls: el.className ? (typeof el.className === 'string' ? el.className.slice(0, 40) : '') : '',
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
              diff: el.scrollHeight - el.clientHeight,
              overflowY: style.overflowY
            });
          }
        }

        return {
          winH: window.innerHeight,
          winW: window.innerWidth,
          docScrollH: docEl.scrollHeight,
          docClientH: docEl.clientHeight,
          docOverflowY: window.getComputedStyle(docEl).overflowY,
          bodyScrollH: body.scrollHeight,
          bodyClientH: body.clientHeight,
          bodyOverflowY: window.getComputedStyle(body).overflowY,
          docHasScrollbar: docEl.scrollHeight > docEl.clientHeight + 1,
          bodyHasScrollbar: body.scrollHeight > body.clientHeight + 1,
          scrollables
        };
      });

      console.log(`Viewport ${dims.w}x${dims.h}: docScrollbar=${data.docHasScrollbar}, bodyScrollbar=${data.bodyHasScrollbar}`);
      if (data.scrollables.length > 0) {
        console.log('  Scrollable elements:', data.scrollables);
      }
    }
  }

  await browser.close();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
})();
