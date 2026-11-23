import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));
  const nextArrow = await page.$('.arrow-right');
  if (nextArrow) await nextArrow.click();
  await new Promise(r => setTimeout(r, 600));
  for (let i = 0; i < 5; i++) {
    const nextBtn = await page.$('.arrow-right');
    if (nextBtn) await nextBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }
  await new Promise(r => setTimeout(r, 1000));
  const info = await page.evaluate(() => {
    const bar = document.querySelector('.gallery-video-controls-bar');
    const viewport = document.querySelector('.gallery-video-viewport');
    const wrapper = document.querySelector('.gallery-video-wrapper');
    const toObj = r => r ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } : null;
    return {
      bar: bar ? {
        rect: toObj(bar.getBoundingClientRect()),
        display: window.getComputedStyle(bar).display,
        visibility: window.getComputedStyle(bar).visibility,
        opacity: window.getComputedStyle(bar).opacity
      } : null,
      viewportRect: toObj(viewport?.getBoundingClientRect()),
      wrapperRect: toObj(wrapper?.getBoundingClientRect())
    };
  });
  console.log('INFO:', JSON.stringify(info, null, 2));
  await browser.close();
})();
