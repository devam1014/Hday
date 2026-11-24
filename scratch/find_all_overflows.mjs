import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // Test stages: main, sad-memories, happy-gallery, qna
  const stages = ['main', 'sad-memories', 'happy-gallery', 'qna'];
  const zooms = [1.0, 1.1, 1.25, 0.9, 0.8];
  const viewports = [
    { w: 1920, h: 1080 },
    { w: 1440, h: 900 },
    { w: 1366, h: 768 },
    { w: 1280, h: 800 },
    { w: 1024, h: 600 }
  ];

  for (const stage of stages) {
    console.log(`\n========================================`);
    console.log(`STAGE: ${stage}`);
    console.log(`========================================`);
    
    for (const vp of viewports) {
      await page.setViewport({ width: vp.w, height: vp.h });
      for (const zoom of zooms) {
        await page.goto(`http://127.0.0.1:5173/?stage=${stage}`, { waitUntil: 'load' });
        if (zoom !== 1.0) {
          await page.evaluate((z) => {
            document.body.style.zoom = z;
          }, zoom);
        }
        await new Promise(r => setTimeout(r, 200));

        // Check overflow
        const overflowDetails = await page.evaluate(() => {
          const culprits = [];
          const all = document.querySelectorAll('*');
          for (const el of all) {
            const style = window.getComputedStyle(el);
            const isScrollableY = style.overflowY === 'auto' || style.overflowY === 'scroll';
            if (isScrollableY && el.scrollHeight > el.clientHeight + 1) {
              culprits.push({
                tag: el.tagName,
                cls: el.className,
                id: el.id,
                scrollHeight: el.scrollHeight,
                clientHeight: el.clientHeight,
                diff: el.scrollHeight - el.clientHeight,
                overflowY: style.overflowY,
                rect: el.getBoundingClientRect(),
              });
            }
          }
          const docEl = document.documentElement;
          const body = document.body;
          return {
            windowInnerH: window.innerHeight,
            windowInnerW: window.innerWidth,
            docScrollH: docEl.scrollHeight,
            docClientH: docEl.clientHeight,
            docOverflowY: window.getComputedStyle(docEl).overflowY,
            bodyScrollH: body.scrollHeight,
            bodyClientH: body.clientHeight,
            bodyOverflowY: window.getComputedStyle(body).overflowY,
            docHasScroll: docEl.scrollHeight > docEl.clientHeight + 1,
            bodyHasScroll: body.scrollHeight > body.clientHeight + 1,
            culprits
          };
        });

        if (overflowDetails.docHasScroll || overflowDetails.bodyHasScroll || overflowDetails.culprits.length > 0) {
          console.log(`[!] ${vp.w}x${vp.h} @ zoom ${zoom}:`, {
            docHasScroll: overflowDetails.docHasScroll,
            bodyHasScroll: overflowDetails.bodyHasScroll,
            culprits: overflowDetails.culprits.map(c => `${c.tag}.${c.cls} (diff: ${c.diff}px, rect.right: ${c.rect.right})`)
          });
        }
      }
    }
  }

  await browser.close();
})();
