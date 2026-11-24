import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Monitor all scroll events across the entire document
  await page.evaluateOnNewDocument(() => {
    window.__scrollEvents = [];
    window.addEventListener('scroll', (e) => {
      const target = e.target;
      const tag = target === document ? 'DOCUMENT' : target?.tagName;
      const cls = target?.className || '';
      const id = target?.id || '';
      window.__scrollEvents.push({
        type: 'scroll',
        target: `${tag}.${cls}#${id}`,
        scrollTop: target === document ? document.documentElement.scrollTop : target.scrollTop,
        scrollHeight: target === document ? document.documentElement.scrollHeight : target.scrollHeight,
        clientHeight: target === document ? document.documentElement.clientHeight : target.clientHeight,
      });
    }, true);
  });

  console.log('--- TEST 1: Main Birthday Page (Section 1) ---');
  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  // Scroll down with mouse wheel over message card
  console.log('Wheeling over message card...');
  const msgBox = await page.$('.minimal-message-card');
  const box = await msgBox.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel({ deltaY: 400 });
  await new Promise(r => setTimeout(r, 300));
  await page.mouse.wheel({ deltaY: 400 });
  await new Promise(r => setTimeout(r, 500));

  // Scroll down outside message card (e.g. over background / right column)
  console.log('Wheeling over right column / background...');
  await page.mouse.move(box.x + box.width + 100, box.y + 100);
  await page.mouse.wheel({ deltaY: 400 });
  await new Promise(r => setTimeout(r, 300));
  await page.mouse.wheel({ deltaY: 400 });
  await new Promise(r => setTimeout(r, 500));

  let events = await page.evaluate(() => window.__scrollEvents);
  console.log('Scroll events recorded on MainPage:', events);

  // Check scroll positions of document, body, main-page-root
  let positions = await page.evaluate(() => ({
    docScrollTop: document.documentElement.scrollTop,
    bodyScrollTop: document.body.scrollTop,
    mainRootScrollTop: document.querySelector('.main-page-root')?.scrollTop,
    msgScrollTop: document.querySelector('.minimal-message-scroll-viewport')?.scrollTop,
  }));
  console.log('Scroll positions on MainPage:', positions);

  console.log('\n--- TEST 2: Q&A Section ---');
  await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  // Advance to final message
  while (true) {
    const qNext = await page.$('.qna-nav-btn.qna-nav-next');
    if (!qNext) break;
    await qNext.click();
    await new Promise(r => setTimeout(r, 50));
  }
  const surpriseBtn = await page.$('.qna-final-surprise-btn');
  if (surpriseBtn) {
    await surpriseBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // Clear events
  await page.evaluate(() => { window.__scrollEvents = []; });

  // Scroll over final message card
  console.log('Wheeling over Q&A final message card...');
  const qnaCard = await page.$('.qna-final-message-card');
  const qnaBox = await qnaCard.boundingBox();
  await page.mouse.move(qnaBox.x + qnaBox.width / 2, qnaBox.y + qnaBox.height / 2);
  await page.mouse.wheel({ deltaY: 400 });
  await new Promise(r => setTimeout(r, 300));
  await page.mouse.wheel({ deltaY: 400 });
  await new Promise(r => setTimeout(r, 500));

  // Scroll outside card
  console.log('Wheeling outside Q&A final message card...');
  await page.mouse.move(qnaBox.x + qnaBox.width + 100, qnaBox.y + 100);
  await page.mouse.wheel({ deltaY: 400 });
  await new Promise(r => setTimeout(r, 300));
  await page.mouse.wheel({ deltaY: 400 });
  await new Promise(r => setTimeout(r, 500));

  events = await page.evaluate(() => window.__scrollEvents);
  console.log('Scroll events recorded on Q&A Final Message:', events);

  positions = await page.evaluate(() => ({
    docScrollTop: document.documentElement.scrollTop,
    bodyScrollTop: document.body.scrollTop,
    qnaRootScrollTop: document.querySelector('.qna-root')?.scrollTop,
    qnaMsgScrollTop: document.querySelector('.qna-final-message-scroll')?.scrollTop,
  }));
  console.log('Scroll positions on Q&A Final Message:', positions);

  await browser.close();
})();
