import puppeteer from 'puppeteer-core';

async function testWallPositions() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // In overlay coordinates:
  // overlay width = 1421.46, overlay left = -70.73
  // Screen X = 840 => Overlay X = 840 - (-70.73) = 910.73 => 910.73 / 1421.46 = 64.07%
  // Screen Y = 660 => 660 / 800 = 82.5%
  // Screen Y = 665 => 665 / 800 = 83.1%
  // Screen Y = 670 => 670 / 800 = 83.75%
  // Screen Y = 675 => 675 / 800 = 84.375%

  const tests = [
    { name: 'screenY_655', top: `${(655/800*100).toFixed(2)}%`, left: `${(910.73/1421.46*100).toFixed(2)}%` },
    { name: 'screenY_665', top: `${(665/800*100).toFixed(2)}%`, left: `${(910.73/1421.46*100).toFixed(2)}%` },
    { name: 'screenY_672', top: `${(672/800*100).toFixed(2)}%`, left: `${(910.73/1421.46*100).toFixed(2)}%` }
  ];

  for (const t of tests) {
    await page.evaluate((t) => {
      const el = document.querySelector('.wall-countdown-positioner');
      if (el) {
        el.style.top = t.top;
        el.style.left = t.left;
      }
    }, t);
    await page.screenshot({ path: `scratch/test_${t.name}.png` });
  }

  await browser.close();
  console.log('Screenshots saved.');
}

testWallPositions().catch(console.error);
