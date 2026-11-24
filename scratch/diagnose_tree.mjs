import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const stage of ['main', 'qna', 'sad-memories', 'happy-gallery']) {
    console.log(`\n========================================`);
    console.log(`DIAGNOSTICS FOR STAGE: ${stage}`);
    console.log(`========================================`);
    await page.goto(`http://127.0.0.1:5173/?stage=${stage}`, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));

    const diag = await page.evaluate(() => {
      const results = [];
      function check(el, depth = 0) {
        if (!el || el.nodeType !== 1) return;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Check if element extends beyond viewport or has scroll
        const overflowsViewportY = rect.bottom > window.innerHeight;
        const hasOwnScroll = (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
        const hasScrollStyling = style.overflowY === 'auto' || style.overflowY === 'scroll';
        
        if (overflowsViewportY || hasOwnScroll || hasScrollStyling) {
          results.push({
            indent: '  '.repeat(depth),
            tag: el.tagName,
            cls: el.className,
            id: el.id,
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            overflowY: style.overflowY,
            overflowX: style.overflowX,
            position: style.position,
            maxHeight: style.maxHeight,
            minHeight: style.minHeight,
            hasOwnScroll,
            overflowsViewportY
          });
        }
        for (const child of el.children) {
          check(child, depth + 1);
        }
      }
      check(document.documentElement);
      return results;
    });

    for (const d of diag) {
      console.log(`${d.indent}<${d.tag} class="${d.cls}"> [top: ${d.top.toFixed(1)}, bottom: ${d.bottom.toFixed(1)}, h: ${d.height.toFixed(1)}, scrollH: ${d.scrollHeight}, clientH: ${d.clientHeight}, overflowY: ${d.overflowY}, pos: ${d.position}, minH: ${d.minHeight}, maxH: ${d.maxHeight}] (ownScroll: ${d.hasOwnScroll}, overflowsVP: ${d.overflowsViewportY})`);
    }
  }

  await browser.close();
})();
