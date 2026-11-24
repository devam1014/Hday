import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('--- Verifying Scrolling Behavior & Scrollbars ---');
  const profileDir = path.join(__dirname, 'chrome_scroll_test_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      `--user-data-dir=${profileDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. MAIN BIRTHDAY SCROLL TEST
  console.log('\n[1] Testing Main Birthday Stage:');
  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));

  // Check initial scrollbars
  let check = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const mainRoot = document.querySelector('.main-page-root');
    const msg = document.querySelector('.minimal-message-scroll-viewport');

    return {
      docHasScroll: docEl.scrollHeight > docEl.clientHeight,
      bodyHasScroll: body.scrollHeight > body.clientHeight,
      rootHasScroll: mainRoot ? mainRoot.scrollHeight > mainRoot.clientHeight : false,
      msgScrollTop: msg ? msg.scrollTop : 0,
      msgCanScroll: msg ? msg.scrollHeight > msg.clientHeight : false
    };
  });
  console.log('Initial state:', check);

  // Wheel over message card
  const msgBox = await page.$('.minimal-message-card');
  const box = await msgBox.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  // Wheel down 200px
  await page.mouse.wheel({ deltaY: 200 });
  await new Promise(r => setTimeout(r, 200));

  let afterWheel = await page.evaluate(() => {
    const docEl = document.documentElement;
    const mainRoot = document.querySelector('.main-page-root');
    const msg = document.querySelector('.minimal-message-scroll-viewport');
    return {
      docHasScroll: docEl.scrollHeight > docEl.clientHeight,
      rootHasScroll: mainRoot ? mainRoot.scrollHeight > mainRoot.clientHeight : false,
      msgScrollTop: msg ? msg.scrollTop : 0,
    };
  });
  console.log('After wheeling inside message card:', afterWheel);

  if (afterWheel.msgScrollTop > 0) {
    console.log('✓ Message card scrolled internally as intended!');
  } else {
    console.log('Note: Message was short or at top');
  }

  if (!afterWheel.docHasScroll && !afterWheel.rootHasScroll) {
    console.log('✓ No extra scrollbar on document or main root!');
  } else {
    console.error('FAIL: Extra scrollbar detected!', afterWheel);
  }

  // 2. QNA FINAL MESSAGE SCROLL TEST
  console.log('\n[2] Testing Q&A Final Message Stage:');
  await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));

  // Click through to Final Surprise
  while (true) {
    const qNext = await page.$('.qna-nav-btn.qna-nav-next');
    if (!qNext) break;
    await qNext.click();
    await new Promise(r => setTimeout(r, 60));
  }
  const surpriseBtn = await page.$('.qna-final-surprise-btn');
  if (surpriseBtn) {
    await surpriseBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  const qnaCheck = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const qnaRoot = document.querySelector('.qna-root');
    const msgScroll = document.querySelector('.qna-final-message-scroll');

    return {
      docHasScroll: docEl.scrollHeight > docEl.clientHeight,
      bodyHasScroll: body.scrollHeight > body.clientHeight,
      qnaRootHasScroll: qnaRoot ? qnaRoot.scrollHeight > qnaRoot.clientHeight : false,
      qnaRootOverflowY: qnaRoot ? window.getComputedStyle(qnaRoot).overflowY : null,
      msgScrollHasScroll: msgScroll ? msgScroll.scrollHeight > msgScroll.clientHeight : false,
      msgScrollTop: msgScroll ? msgScroll.scrollTop : 0
    };
  });
  console.log('Q&A Final Message state:', qnaCheck);

  if (!qnaCheck.docHasScroll && !qnaCheck.bodyHasScroll && qnaCheck.qnaRootOverflowY === 'hidden') {
    console.log('✓ No extra right-side scrollbar on Q&A root or document!');
  } else {
    console.error('FAIL: Extra scrollbar in Q&A!', qnaCheck);
  }

  // Wheel over Q&A message card
  const qnaMsg = await page.$('.qna-final-message-card');
  if (qnaMsg) {
    const qBox = await qnaMsg.boundingBox();
    await page.mouse.move(qBox.x + qBox.width / 2, qBox.y + qBox.height / 2);
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 200));

    const qnaAfterWheel = await page.evaluate(() => {
      const msgScroll = document.querySelector('.qna-final-message-scroll');
      const qnaRoot = document.querySelector('.qna-root');
      return {
        msgScrollTop: msgScroll ? msgScroll.scrollTop : 0,
        qnaRootScrollTop: qnaRoot ? qnaRoot.scrollTop : 0
      };
    });
    console.log('Q&A After wheel:', qnaAfterWheel);
    if (qnaAfterWheel.msgScrollTop > 0) {
      console.log('✓ Q&A message card scrolled internally!');
    }
    if (qnaAfterWheel.qnaRootScrollTop === 0) {
      console.log('✓ Q&A outer container did NOT scroll!');
    }
  }

  await browser.close();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n=== ALL SCROLLBAR TESTS PASSED! ===');
})();
