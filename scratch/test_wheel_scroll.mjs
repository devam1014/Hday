import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 730 });

  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  console.log('--- Initial State ---');
  let info = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const mainRoot = document.querySelector('.main-page-root');
    const msgView = document.querySelector('.minimal-message-scroll-viewport');
    return {
      docScrollH: docEl.scrollHeight,
      docClientH: docEl.clientHeight,
      docScrollTop: docEl.scrollTop,
      mainRootScrollH: mainRoot?.scrollHeight,
      mainRootClientH: mainRoot?.clientHeight,
      mainRootScrollTop: mainRoot?.scrollTop,
      msgScrollH: msgView?.scrollHeight,
      msgClientH: msgView?.clientHeight,
      msgScrollTop: msgView?.scrollTop,
    };
  });
  console.log('Initial:', info);

  // Wheel over message card
  const msgBox = await page.$('.minimal-message-card');
  const box = await msgBox.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel({ deltaY: 100 });
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('--- After Wheeling over message card ---');
  info = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const mainRoot = document.querySelector('.main-page-root');
    const msgView = document.querySelector('.minimal-message-scroll-viewport');
    return {
      docScrollH: docEl.scrollHeight,
      docClientH: docEl.clientHeight,
      docScrollTop: docEl.scrollTop,
      mainRootScrollH: mainRoot?.scrollHeight,
      mainRootClientH: mainRoot?.clientHeight,
      mainRootScrollTop: mainRoot?.scrollTop,
      msgScrollH: msgView?.scrollHeight,
      msgClientH: msgView?.clientHeight,
      msgScrollTop: msgView?.scrollTop,
    };
  });
  console.log('After wheel:', info);

  await page.screenshot({ path: 'scratch/test_wheel_scroll.png' });

  await browser.close();
})();
