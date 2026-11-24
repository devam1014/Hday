import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  const viewports = [
    { name: '1920x1080', w: 1920, h: 950 },
    { name: '1536x864', w: 1536, h: 780 },
    { name: '1366x768', w: 1366, h: 695 },
    { name: '1280x800', w: 1280, h: 720 },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING Q&A: ${vp.name} (${vp.w}x${vp.h})`);
    console.log(`========================================`);
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 400));

    // 1. Question Step
    let res = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const qnaRoot = document.querySelector('.qna-root');
      return {
        step: 'question',
        docHasScroll: docEl.scrollHeight > docEl.clientHeight,
        bodyHasScroll: body.scrollHeight > body.clientHeight,
        qnaRootHasScroll: qnaRoot ? qnaRoot.scrollHeight > qnaRoot.clientHeight : false,
        qnaRootDiff: qnaRoot ? qnaRoot.scrollHeight - qnaRoot.clientHeight : 0,
      };
    });
    console.log('Q&A Question Step:', res);

    // 2. Final Message Step
    while (true) {
      const qNext = await page.$('.qna-nav-btn.qna-nav-next');
      if (!qNext) break;
      await qNext.click();
      await new Promise(r => setTimeout(r, 40));
    }
    const surpriseBtn = await page.$('.qna-final-surprise-btn');
    if (surpriseBtn) {
      await surpriseBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    res = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const qnaRoot = document.querySelector('.qna-root');
      const msgScroll = document.querySelector('.qna-final-message-scroll');
      return {
        step: 'final-message',
        docHasScroll: docEl.scrollHeight > docEl.clientHeight,
        bodyHasScroll: body.scrollHeight > body.clientHeight,
        qnaRootHasScroll: qnaRoot ? qnaRoot.scrollHeight > qnaRoot.clientHeight : false,
        qnaRootDiff: qnaRoot ? qnaRoot.scrollHeight - qnaRoot.clientHeight : 0,
        msgScrollHasScroll: msgScroll ? msgScroll.scrollHeight > msgScroll.clientHeight : false,
        msgScrollDiff: msgScroll ? msgScroll.scrollHeight - msgScroll.clientHeight : 0,
      };
    });
    console.log('Q&A Final Message Step:', res);
  }

  await browser.close();
})();
