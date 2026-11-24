import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const profileDir = path.join(__dirname, 'chrome_qna_verify_' + Date.now());
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
  const heights = [600, 700, 768, 800, 900, 1080];

  for (const h of heights) {
    await page.setViewport({ width: 1440, height: h });
    await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 400));

    // Jump to final-message
    while (true) {
      const qNext = await page.$('.qna-nav-btn.qna-nav-next');
      if (!qNext) break;
      await qNext.click();
      await new Promise(r => setTimeout(r, 60));
    }
    const surpriseBtn = await page.$('.qna-final-surprise-btn');
    if (surpriseBtn) {
      await surpriseBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    const info = await page.evaluate(() => {
      const qnaRoot = document.querySelector('.qna-root');
      const stage = document.querySelector('.qna-final-surprise-stage');
      const msgScroll = document.querySelector('.qna-final-message-scroll');
      const msgCard = document.querySelector('.qna-final-message-card');
      const docEl = document.documentElement;

      return {
        viewportH: window.innerHeight,
        qnaRootScrollH: qnaRoot?.scrollHeight,
        qnaRootClientH: qnaRoot?.clientHeight,
        stageScrollH: stage?.scrollHeight,
        stageClientH: stage?.clientHeight,
        stageBottom: stage?.getBoundingClientRect().bottom,
        msgCardH: msgCard?.getBoundingClientRect().height,
        msgScrollH: msgScroll?.scrollHeight,
        msgClientH: msgScroll?.clientHeight,
        hasMsgScrollbar: msgScroll ? msgScroll.scrollHeight > msgScroll.clientHeight : false,
      };
    });
    console.log(`Height ${h}px:`, info);
  }

  await browser.close();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
})();
