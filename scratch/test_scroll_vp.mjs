import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  const viewports = [
    { w: 1920, h: 1080 },
    { w: 1536, h: 864 },
    { w: 1440, h: 900 },
    { w: 1366, h: 768 },
    { w: 1280, h: 800 },
    { w: 1152, h: 720 },
    { w: 1024, h: 768 },
    { w: 1024, h: 600 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 400));

    // Try scrolling
    await page.mouse.wheel({ deltaY: 300 });
    await new Promise(r => setTimeout(r, 200));

    const res = await page.evaluate(() => {
      const mainRoot = document.querySelector('.main-page-root');
      const docEl = document.documentElement;
      const body = document.body;
      const layout = document.querySelector('.main-content-layout');
      return {
        layoutOffsetH: layout?.offsetHeight,
        mainRootScrollH: mainRoot?.scrollHeight,
        mainRootClientH: mainRoot?.clientHeight,
        mainRootScrollTop: mainRoot?.scrollTop,
        docScrollH: docEl.scrollHeight,
        docClientH: docEl.clientHeight,
        docScrollTop: docEl.scrollTop,
        bodyScrollTop: body.scrollTop,
      };
    });
    console.log(`Viewport ${vp.w}x${vp.h}:`, res);
  }

  await browser.close();
})();
