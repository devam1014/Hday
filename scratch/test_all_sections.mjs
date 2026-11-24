import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  for (let s = 0; s < 13; s++) {
    // Click dot s
    const dots = await page.$$('.section-indicator-dot');
    await dots[s].click();
    await new Promise(r => setTimeout(r, 600));

    const secInfo = await page.evaluate((secNum) => {
      const scrollView = document.querySelector('.minimal-message-scroll-viewport');
      const root = document.querySelector('.main-page-root');
      const docEl = document.documentElement;
      const body = document.body;
      return {
        section: secNum + 1,
        canScroll: scrollView ? scrollView.scrollHeight > scrollView.clientHeight : false,
        viewH: scrollView?.clientHeight,
        scrollH: scrollView?.scrollHeight,
        rootScrollH: root?.scrollHeight,
        rootClientH: root?.clientHeight,
        docScrollH: docEl.scrollHeight,
        docClientH: docEl.clientHeight,
        bodyScrollH: body.scrollHeight,
        bodyClientH: body.clientHeight,
      };
    }, s);
    console.log(`Section ${s + 1}:`, secInfo);
  }

  await browser.close();
})();
