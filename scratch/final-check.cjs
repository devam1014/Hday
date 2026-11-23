const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== VERIFYING FINAL TARGETED FIX WITH FULLY LOADED BACKGROUND ===');
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_final_check');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const testCases = [
    { label: '80% Zoom (1800x1125)', width: 1800, height: 1125, file: 'final_check_80_zoom.png' },
    { label: '90% Zoom (1600x1000)', width: 1600, height: 1000, file: 'final_check_90_zoom.png' },
    { label: '100% Zoom (1440x900)', width: 1440, height: 900, file: 'final_check_100_zoom.png' },
    { label: '100% Zoom (1366x768 Laptop)', width: 1366, height: 768, file: 'final_check_1366_100.png' },
    { label: '110% Zoom (1309x818)', width: 1309, height: 818, file: 'final_check_110_zoom.png' }
  ];

  for (const tc of testCases) {
    await page.setViewport({ width: tc.width, height: tc.height });
    await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'load' });

    await page.waitForFunction(() => {
      const img = document.querySelector('.qna-background-img');
      return img && img.complete && img.naturalHeight > 0;
    }, { timeout: 10000 });

    await new Promise(r => setTimeout(r, 600));

    const check = await page.evaluate(() => {
      const leftCol = document.querySelector('.qna-final-left-column');
      const rightCol = document.querySelector('.qna-final-right-column');
      const card1 = document.querySelector('.qna-final-image-card');
      const card2 = document.querySelector('.qna-final-video-card');
      const heading = document.querySelector('.qna-final-page-title');
      const para = document.querySelector('.qna-final-paragraph');

      const lRect = leftCol.getBoundingClientRect();
      const rRect = rightCol.getBoundingClientRect();
      const c1Rect = card1.getBoundingClientRect();
      const c2Rect = card2.getBoundingClientRect();
      const hStyle = window.getComputedStyle(heading);
      const pStyle = window.getComputedStyle(para);

      const gap = Math.round(rRect.left - lRect.right);
      const isSideBySide = rRect.left >= (lRect.right - 5) && rRect.top < (lRect.bottom - 40);
      const isCardsStackedVertically = c2Rect.top >= (c1Rect.bottom - 5);

      const charX = Math.round(window.innerWidth * 0.886);
      const distanceToChars = Math.round(charX - rRect.right);
      const charactersVisible = rRect.right < charX;

      return {
        gap,
        isSideBySide,
        isCardsStackedVertically,
        charactersVisible,
        distanceToChars,
        leftColWidth: Math.round(lRect.width),
        rightColWidth: Math.round(rRect.width),
        headingSize: hStyle.fontSize,
        paraSize: pStyle.fontSize
      };
    });

    const screenshotPath = path.join(process.cwd(), 'scratch', tc.file);
    await page.screenshot({ path: screenshotPath });

    console.log(`[${tc.label}]`);
    console.log(`  Side-by-side: ${check.isSideBySide} | Right cards stacked vertically: ${check.isCardsStackedVertically}`);
    console.log(`  Gap: ${check.gap}px | Distance to characters: ${check.distanceToChars}px (Visible: ${check.charactersVisible})`);
    console.log(`  Left col: ${check.leftColWidth}px | Right col: ${check.rightColWidth}px`);
    console.log(`  Typography: Heading=${check.headingSize}, Paragraph=${check.paraSize}`);
    console.log(`  Saved: scratch/${tc.file}\n`);
  }

  await browser.close();
  console.log('=== ALL CHECKS COMPLETED SUCCESSFULLY ===');
})();
