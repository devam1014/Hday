const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('--- TESTING CURRENT BEHAVIOR ACROSS VIEWPORT WIDTHS / ZOOMS ---');
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_lock_test');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const testCases = [
    { name: '1440x900 @ 90% zoom', width: 1600, height: 1000 },
    { name: '1440x900 @ 100% zoom', width: 1440, height: 900 },
    { name: '1366x768 @ 90% zoom', width: 1518, height: 853 },
    { name: '1366x768 @ 100% zoom (maximized)', width: 1366, height: 768 },
    { name: '1280x800 @ 100% zoom or 1366 with window margin', width: 1280, height: 800 },
    { name: '1536x864 @ 125% zoom', width: 1228, height: 691 },
    { name: '1366x768 @ 110% zoom', width: 1241, height: 698 },
    { name: '1366x768 @ 125% zoom', width: 1092, height: 614 },
    { name: '1440x900 @ 125% zoom', width: 1152, height: 720 },
    { name: '1024x768 (small desktop / iPad landscape)', width: 1024, height: 768 },
  ];

  for (const tc of testCases) {
    await page.setViewport({ width: tc.width, height: tc.height });
    await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 400));

    const layout = await page.evaluate(() => {
      const leftCol = document.querySelector('.qna-final-left-column');
      const rightCol = document.querySelector('.qna-final-right-column');
      const container = document.querySelector('.qna-final-content-layout');
      if (!leftCol || !rightCol || !container) return null;

      const leftRect = leftCol.getBoundingClientRect();
      const rightRect = rightCol.getBoundingClientRect();

      const isSideBySide = rightRect.left >= (leftRect.right - 10) && rightRect.top < (leftRect.bottom - 50);
      const isStacked = rightRect.top >= (leftRect.bottom - 20);

      return {
        isSideBySide,
        isStacked,
        left: { x: Math.round(leftRect.left), y: Math.round(leftRect.top), w: Math.round(leftRect.width), h: Math.round(leftRect.height) },
        right: { x: Math.round(rightRect.left), y: Math.round(rightRect.top), w: Math.round(rightRect.width), h: Math.round(rightRect.height) }
      };
    });

    console.log(`[${tc.name} (${tc.width}x${tc.height})] -> Side-by-Side: ${layout.isSideBySide}, Stacked: ${layout.isStacked}`);
    if (layout.isStacked) {
      console.log(`   WARNING: Video cards stacked below message card! Left col bottom: ${layout.left.y + layout.left.h}, Right col top: ${layout.right.y}`);
    }
  }

  await browser.close();
})();
