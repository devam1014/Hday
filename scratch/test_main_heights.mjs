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

  const info = await page.evaluate(() => {
    const layout = document.querySelector('.main-content-layout');
    const msgCard = document.querySelector('.main-message-glass-card');
    const scrollView = document.querySelector('.minimal-message-scroll-viewport');
    const rightCol = document.querySelector('.main-right-column');
    const root = document.querySelector('.main-page-root');
    return {
      rootHeight: root?.offsetHeight,
      layoutHeight: layout?.offsetHeight,
      layoutScrollHeight: layout?.scrollHeight,
      msgCardHeight: msgCard?.offsetHeight,
      scrollViewHeight: scrollView?.offsetHeight,
      scrollViewScrollHeight: scrollView?.scrollHeight,
      rightColHeight: rightCol?.offsetHeight,
    };
  });
  console.log('Main page element heights:', info);

  await browser.close();
})();
