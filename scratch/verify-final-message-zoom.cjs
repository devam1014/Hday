const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== VERIFYING FINAL MESSAGE LAYOUT AT 90%, 100%, 110%, 125% ZOOM ===');
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_verify_zoom');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test specifically at 90%, 100%, 110%, and 125% zoom on a standard 1440x900 and 1366x768 desktop:
  const zoomCases = [
    { label: '90% zoom', width: Math.round(1440 / 0.9), height: Math.round(900 / 0.9), file: 'final_message_zoom_90.png' },
    { label: '100% zoom', width: 1440, height: 900, file: 'final_message_zoom_100.png' },
    { label: '110% zoom', width: Math.round(1440 / 1.1), height: Math.round(900 / 1.1), file: 'final_message_zoom_110.png' },
    { label: '125% zoom', width: Math.round(1440 / 1.25), height: Math.round(900 / 1.25), file: 'final_message_zoom_125.png' },
    // Also test 1366 at 100% and 125%
    { label: '1366x768 @ 100% zoom', width: 1366, height: 768, file: 'final_message_1366_100.png' },
    { label: '1366x768 @ 125% zoom', width: Math.round(1366 / 1.25), height: Math.round(768 / 1.25), file: 'final_message_1366_125.png' },
    // Genuine mobile
    { label: 'Mobile (390x844)', width: 390, height: 844, file: 'final_message_mobile_390.png', expectStacked: true }
  ];

  const results = [];

  for (const zc of zoomCases) {
    await page.setViewport({ width: zc.width, height: zc.height });
    await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const check = await page.evaluate(() => {
      const leftCol = document.querySelector('.qna-final-left-column');
      const rightCol = document.querySelector('.qna-final-right-column');
      const container = document.querySelector('.qna-final-content-layout');
      const title = document.querySelector('.qna-final-page-title');
      const card1 = document.querySelector('.qna-final-image-card');
      const card2 = document.querySelector('.qna-final-video-card');

      if (!leftCol || !rightCol || !container) {
        return { error: 'Missing elements' };
      }

      const lRect = leftCol.getBoundingClientRect();
      const rRect = rightCol.getBoundingClientRect();
      const c1Rect = card1 ? card1.getBoundingClientRect() : null;
      const c2Rect = card2 ? card2.getBoundingClientRect() : null;

      // In side-by-side: rightCol is to the right of leftCol
      const isSideBySide = rRect.left >= (lRect.right - 10) && rRect.top < (lRect.bottom - 40);
      const isStacked = rRect.top >= (lRect.bottom - 20);

      // In right column: card1 is above card2
      const isCardsStackedVertically = c1Rect && c2Rect && c2Rect.top >= (c1Rect.bottom - 5);

      return {
        isSideBySide,
        isStacked,
        isCardsStackedVertically,
        leftColWidth: Math.round(lRect.width),
        rightColWidth: Math.round(rRect.width),
        leftColLeft: Math.round(lRect.left),
        rightColLeft: Math.round(rRect.left),
        titleText: title ? title.textContent.trim() : ''
      };
    });

    const screenshotPath = path.join(process.cwd(), 'scratch', zc.file);
    await page.screenshot({ path: screenshotPath });

    const status = zc.expectStacked
      ? (check.isStacked ? 'PASS (stacked on mobile as expected)' : 'FAIL')
      : (check.isSideBySide && !check.isStacked ? 'PASS (side-by-side)' : 'FAIL (stacked unexpectedly)');

    console.log(`[${zc.label} (${zc.width}x${zc.height})] -> ${status}`);
    console.log(`   Left col: ${check.leftColWidth}px at x=${check.leftColLeft}, Right col: ${check.rightColWidth}px at x=${check.rightColLeft}`);
    console.log(`   Right cards stacked vertically: ${check.isCardsStackedVertically}`);
    console.log(`   Screenshot saved: scratch/${zc.file}`);

    results.push({ label: zc.label, status, check });
  }

  await browser.close();

  const allPassed = results.every(r => r.status.startsWith('PASS'));
  console.log('\n=== ALL ZOOM TESTS PASSED:', allPassed, '===');
  if (!allPassed) process.exit(1);
})();
