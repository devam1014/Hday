import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  for (const stage of ['main', 'sad-memories', 'happy-gallery', 'qna']) {
    console.log(`\n=== INSPECTING STAGE: ${stage} ===`);
    await page.goto(`http://127.0.0.1:5173/?stage=${stage}`, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1000));

    const scrollInfo = await page.evaluate(() => {
      const results = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) {
          const style = window.getComputedStyle(el);
          if (style.overflowY !== 'hidden' && style.overflowY !== 'visible') {
            results.push({
              tag: el.tagName,
              className: el.className,
              id: el.id,
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              overflowY: style.overflowY,
              overflowX: style.overflowX,
            });
          }
        }
      }
      return {
        windowInnerHeight: window.innerHeight,
        windowInnerWidth: window.innerWidth,
        htmlScrollHeight: document.documentElement.scrollHeight,
        htmlClientHeight: document.documentElement.clientHeight,
        htmlOverflowY: window.getComputedStyle(document.documentElement).overflowY,
        bodyScrollHeight: document.body.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        bodyOverflowY: window.getComputedStyle(document.body).overflowY,
        scrollableElements: results
      };
    });

    console.log('Window & Root:', {
      winH: scrollInfo.windowInnerHeight,
      htmlH: `${scrollInfo.htmlScrollHeight}/${scrollInfo.htmlClientHeight} (overflowY: ${scrollInfo.htmlOverflowY})`,
      bodyH: `${scrollInfo.bodyScrollHeight}/${scrollInfo.bodyClientHeight} (overflowY: ${scrollInfo.bodyOverflowY})`
    });

    console.log('Scrollable elements:', scrollInfo.scrollableElements);
  }

  await browser.close();
})();
