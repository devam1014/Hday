import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // Typical laptop viewports
  const viewports = [
    { name: '1366x768 (standard laptop)', w: 1366, h: 695 }, // 768 minus browser chrome
    { name: '1920x1080 @ 125% zoom', w: 1536, h: 730 },
    { name: '1536x864 (common laptop)', w: 1536, h: 780 },
    { name: '1280x800 @ 100%', w: 1280, h: 720 },
    { name: '1440x900 @ 100%', w: 1440, h: 810 },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING: ${vp.name} (${vp.w}x${vp.h})`);
    console.log(`========================================`);
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));

    const result = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const mainRoot = document.querySelector('.main-page-root');
      const layout = document.querySelector('.main-content-layout');
      const leftCol = document.querySelector('.main-left-column');
      const rightCol = document.querySelector('.main-right-column');
      const msgCard = document.querySelector('.minimal-message-card');
      const scrollView = document.querySelector('.minimal-message-scroll-viewport');

      // Find any element whose scrollHeight > clientHeight
      const overflowingElements = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.scrollHeight > el.clientHeight + 1) {
          const s = window.getComputedStyle(el);
          overflowingElements.push({
            tag: el.tagName,
            cls: el.className,
            scrollH: el.scrollHeight,
            clientH: el.clientHeight,
            diff: el.scrollHeight - el.clientHeight,
            overflowY: s.overflowY,
            overflowX: s.overflowX,
          });
        }
      });

      return {
        viewportH: window.innerHeight,
        docScrollH: docEl.scrollHeight,
        docClientH: docEl.clientHeight,
        docHasScroll: docEl.scrollHeight > docEl.clientHeight,
        bodyScrollH: body.scrollHeight,
        bodyClientH: body.clientHeight,
        bodyHasScroll: body.scrollHeight > body.clientHeight,
        mainRootScrollH: mainRoot?.scrollHeight,
        mainRootClientH: mainRoot?.clientHeight,
        mainRootHasScroll: mainRoot ? mainRoot.scrollHeight > mainRoot.clientHeight : false,
        layoutOffsetH: layout?.offsetHeight,
        leftColH: leftCol?.offsetHeight,
        rightColH: rightCol?.offsetHeight,
        msgCardH: msgCard?.offsetHeight,
        scrollViewScrollH: scrollView?.scrollHeight,
        scrollViewClientH: scrollView?.clientHeight,
        overflowingElements
      };
    });

    console.log('Result:', {
      viewportH: result.viewportH,
      docHasScroll: result.docHasScroll,
      bodyHasScroll: result.bodyHasScroll,
      mainRootHasScroll: result.mainRootHasScroll,
      mainRootDiff: result.mainRootScrollH - result.mainRootClientH,
      overflowingElements: result.overflowingElements
    });
  }

  await browser.close();
})();
