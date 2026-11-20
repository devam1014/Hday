const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://127.0.0.1:5173/?stage=happy-gallery');
  await new Promise(r => setTimeout(r, 600));
  await page.click('.happy-cover-bottom-nav .btn-next');
  await new Promise(r => setTimeout(r, 600));
  for (let i = 0; i < 15; i++) {
    const btn = await page.$('.happy-photo-bottom-nav .btn-next:not(.is-disabled)');
    if (!btn) break;
    await btn.click();
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 500));
  const info = await page.evaluate(() => {
    const el = document.querySelector('.corner-nav-next');
    if (!el) return 'NOT FOUND';
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      rect: rect.toJSON(),
      position: cs.position,
      bottom: cs.bottom,
      right: cs.right,
      left: cs.left,
      top: cs.top,
      transform: cs.transform,
      parent: el.parentElement.className,
      grandParent: el.parentElement.parentElement ? el.parentElement.parentElement.className : null
    };
  });
  console.log('Next button info:', JSON.stringify(info, null, 2));
  await browser.close();
})();
