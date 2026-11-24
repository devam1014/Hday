import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Test 1: Q&A Final Message
  console.log('--- Checking Q&A Final Message screen ---');
  await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  // Advance to final message
  await page.evaluate(() => {
    // We can simulate navigation or advance
  });
  while (true) {
    const qNext = await page.$('.qna-nav-btn.qna-nav-next');
    if (!qNext) break;
    await qNext.click();
    await new Promise(r => setTimeout(r, 100));
  }
  const surpriseBtn = await page.$('.qna-final-surprise-btn');
  if (surpriseBtn) {
    await surpriseBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  let scrollInfo = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const qnaRoot = document.querySelector('.qna-root');
    const qnaFinalStage = document.querySelector('.qna-final-surprise-stage');
    const qnaFinalMessageCard = document.querySelector('.qna-final-message-card');
    const qnaMessageScroll = document.querySelector('.qna-final-message-card-body');
    
    return {
      windowInnerHeight: window.innerHeight,
      docScrollH: docEl.scrollHeight,
      docClientH: docEl.clientHeight,
      docOverflowY: window.getComputedStyle(docEl).overflowY,
      bodyScrollH: body.scrollHeight,
      bodyClientH: body.clientHeight,
      bodyOverflowY: window.getComputedStyle(body).overflowY,
      qnaRootScrollH: qnaRoot?.scrollHeight,
      qnaRootClientH: qnaRoot?.clientHeight,
      qnaRootOverflowY: qnaRoot ? window.getComputedStyle(qnaRoot).overflowY : null,
      qnaFinalStageScrollH: qnaFinalStage?.scrollHeight,
      qnaFinalStageClientH: qnaFinalStage?.clientHeight,
      qnaFinalMessageCardScrollH: qnaFinalMessageCard?.scrollHeight,
      qnaFinalMessageCardClientH: qnaFinalMessageCard?.clientHeight,
      qnaMessageScrollScrollH: qnaMessageScroll?.scrollHeight,
      qnaMessageScrollClientH: qnaMessageScroll?.clientHeight,
      qnaMessageScrollOverflowY: qnaMessageScroll ? window.getComputedStyle(qnaMessageScroll).overflowY : null,
    };
  });
  console.log('Q&A Final Message Scroll Info:', scrollInfo);

  // Wheel scroll down on page
  await page.mouse.wheel({ deltaY: 500 });
  await new Promise(r => setTimeout(r, 500));

  scrollInfo = await page.evaluate(() => ({
    docScrollTop: document.documentElement.scrollTop,
    bodyScrollTop: document.body.scrollTop,
    qnaRootScrollTop: document.querySelector('.qna-root')?.scrollTop,
    qnaMessageScrollTop: document.querySelector('.qna-final-message-card-body')?.scrollTop,
  }));
  console.log('After wheel scroll down in Q&A Final Message:', scrollInfo);

  await browser.close();
})();
