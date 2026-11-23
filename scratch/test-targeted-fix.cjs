const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== TESTING TARGETED FIX: MESSAGE FOR YOU LAYOUT, SIZING & SPACING ===');
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_targeted_fix');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const testCases = [
    { label: '80% Zoom (1440x900)', width: 1800, height: 1125, file: 'targeted_fix_80_zoom.png' },
    { label: '90% Zoom (1440x900)', width: 1600, height: 1000, file: 'targeted_fix_90_zoom.png' },
    { label: '100% Zoom (1440x900)', width: 1440, height: 900, file: 'targeted_fix_100_zoom.png' },
    { label: '100% Zoom (1366x768 Laptop)', width: 1366, height: 768, file: 'targeted_fix_1366_100.png' },
    { label: '110% Zoom (1440x900)', width: 1309, height: 818, file: 'targeted_fix_110_zoom.png' },
  ];

  for (const tc of testCases) {
    await page.setViewport({ width: tc.width, height: tc.height });
    await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const metrics = await page.evaluate(() => {
      const leftCol = document.querySelector('.qna-final-left-column');
      const rightCol = document.querySelector('.qna-final-right-column');
      const card1 = document.querySelector('.qna-final-image-card');
      const card2 = document.querySelector('.qna-final-video-card');
      const msgCard = document.querySelector('.qna-final-message-card');
      const heading = document.querySelector('.qna-final-page-title');
      const para = document.querySelector('.qna-final-paragraph');

      const lRect = leftCol.getBoundingClientRect();
      const rRect = rightCol.getBoundingClientRect();
      const c1Rect = card1 ? card1.getBoundingClientRect() : null;
      const c2Rect = card2 ? card2.getBoundingClientRect() : null;
      const hStyle = heading ? window.getComputedStyle(heading) : null;
      const pStyle = para ? window.getComputedStyle(para) : null;

      const gap = Math.round(rRect.left - lRect.right);
      const isSideBySide = rRect.left >= (lRect.right - 5) && rRect.top < (lRect.bottom - 40);
      const isCardsStackedVertically = c1Rect && c2Rect && c2Rect.top >= (c1Rect.bottom - 5);

      // Boy & girl character position in background image (approx 88.6% of image width):
      // The image is object-fit: contain
      // In 16:9 or similar viewports:
      const imgWidth = window.innerWidth;
      const charEstimatedX = Math.round(imgWidth * 0.886);
      const distanceToCharacters = Math.round(charEstimatedX - rRect.right);
      const areCharactersVisible = rRect.right < charEstimatedX;

      return {
        gap,
        isSideBySide,
        isCardsStackedVertically,
        areCharactersVisible,
        distanceToCharacters,
        charEstimatedX,
        leftCol: { left: Math.round(lRect.left), right: Math.round(lRect.right), width: Math.round(lRect.width) },
        rightCol: { left: Math.round(rRect.left), right: Math.round(rRect.right), width: Math.round(rRect.width) },
        headingFontSize: hStyle ? hStyle.fontSize : '',
        paraFontSize: pStyle ? pStyle.fontSize : ''
      };
    });

    const screenshotPath = path.join(process.cwd(), 'scratch', tc.file);
    await page.screenshot({ path: screenshotPath });

    console.log(`\n--- ${tc.label} ---`);
    console.log(`  Side-by-side: ${metrics.isSideBySide}`);
    console.log(`  Right cards stacked vertically: ${metrics.isCardsStackedVertically}`);
    console.log(`  Gap between columns: ${metrics.gap}px (Target: ~38px)`);
    console.log(`  Left column: width=${metrics.leftCol.width}px, from x=${metrics.leftCol.left} to ${metrics.leftCol.right}`);
    console.log(`  Right column: width=${metrics.rightCol.width}px, from x=${metrics.rightCol.left} to ${metrics.rightCol.right}`);
    console.log(`  Characters X: ~${metrics.charEstimatedX}px | Distance from right card to characters: ${metrics.distanceToCharacters}px`);
    console.log(`  Characters Visible (Uncovered): ${metrics.areCharactersVisible}`);
    console.log(`  Typography Sizing: Heading = ${metrics.headingFontSize}, Paragraph = ${metrics.paraFontSize}`);
    console.log(`  Screenshot: scratch/${tc.file}`);
  }

  await browser.close();
  console.log('\n=== TESTING COMPLETED ===');
})();
