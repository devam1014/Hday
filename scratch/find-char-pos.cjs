const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  // Hide the UI to see the characters cleanly
  await page.evaluate(() => {
    document.querySelector('.qna-screen-container').style.display = 'none';
  });

  // Take clips of regions where characters might be on 1440x900
  // Background image in 1440x900 viewport:
  // 1440x900: aspect ratio of viewport is 1440/900 = 1.6
  // Image is 1670x941: aspect ratio = 1.7747
  // With object-fit: contain, width = 1440, height = 1440 / 1.7747 = 811.4px, centered vertically at y = (900 - 811.4)/2 = 44.3px.
  // The boy and girl are on the right side beside the river.
  // Let's take screenshots of strips across x: 800 to 1400, y: 300 to 800
  for (let x of [850, 1000, 1150, 1250]) {
    for (let y of [400, 550, 700]) {
      const clip = { x, y, width: 140, height: 140 };
      await page.screenshot({ path: path.join(process.cwd(), 'scratch', `clip_${x}_${y}.png`), clip });
    }
  }

  console.log('Saved clips of background');
  await browser.close();
})();
