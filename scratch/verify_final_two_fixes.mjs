import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('--- Verifying Final Two Fixes: Click & See Magic + Q&A Personal Message ---');
  const profileDir = path.join(os.tmpdir(), 'chrome_fixes_verify_' + Date.now());
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

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // =========================================================================
    // CHANGE 1: RESTRICT CLICK & SEE MAGIC TO SECOND COUNTDOWN / REVEAL PAGE
    // =========================================================================
    console.log('\n[CHANGE 1] Checking Click & See Magic visibility across pages...');

    // 1. Initial Cover (stage=countdown)
    await page.goto('http://127.0.0.1:5173/?stage=countdown', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));
    const btnOnCountdown = await page.$('.click-see-magic-btn');
    console.log('Click & See Magic on stage=countdown:', btnOnCountdown ? 'VISIBLE (FAIL)' : 'HIDDEN (PASS)');
    if (btnOnCountdown) throw new Error('Click & See Magic must be HIDDEN on stage=countdown');

    // 2. Main Birthday (stage=main)
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));
    const btnOnMain = await page.$('.click-see-magic-btn');
    console.log('Click & See Magic on stage=main:', btnOnMain ? 'VISIBLE (FAIL)' : 'HIDDEN (PASS)');
    if (btnOnMain) throw new Error('Click & See Magic must be HIDDEN on stage=main');

    // 3. Sad Gallery (stage=sad-memories)
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));
    const btnOnSad = await page.$('.click-see-magic-btn');
    console.log('Click & See Magic on stage=sad-memories:', btnOnSad ? 'VISIBLE (FAIL)' : 'HIDDEN (PASS)');
    if (btnOnSad) throw new Error('Click & See Magic must be HIDDEN on stage=sad-memories');

    // 4. Happy Gallery (stage=happy-gallery)
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));
    const btnOnHappy = await page.$('.click-see-magic-btn');
    console.log('Click & See Magic on stage=happy-gallery:', btnOnHappy ? 'VISIBLE (FAIL)' : 'HIDDEN (PASS)');
    if (btnOnHappy) throw new Error('Click & See Magic must be HIDDEN on stage=happy-gallery');

    // 5. Q&A (stage=qna)
    await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));
    const btnOnQna = await page.$('.click-see-magic-btn');
    console.log('Click & See Magic on stage=qna:', btnOnQna ? 'VISIBLE (FAIL)' : 'HIDDEN (PASS)');
    if (btnOnQna) throw new Error('Click & See Magic must be HIDDEN on stage=qna');

    // 6. Dedicated Second Countdown / Reveal Page (stage=fireworks)
    await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 800));
    const btnOnFireworks = await page.$('.click-see-magic-btn');
    console.log('Click & See Magic on stage=fireworks:', btnOnFireworks ? 'VISIBLE (PASS)' : 'HIDDEN (FAIL)');
    if (!btnOnFireworks) throw new Error('Click & See Magic must be VISIBLE on stage=fireworks when completed');

    console.log('✓ CHANGE 1 VERIFIED: Click & See Magic is strictly isolated to stage=fireworks!');

    // =========================================================================
    // CHANGE 2: Q&A PERSONAL MESSAGE CARD BESIDE SELECTED ANSWER
    // =========================================================================
    console.log('\n[CHANGE 2] Testing Q&A Personal Message Card Placement & Zero Layout Shift...');
    await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1000));

    // Initial card geometry before selecting any option
    const initialCardRect = await page.$eval('.qna-question-card', el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    console.log('Initial Q&A card geometry (no option selected):', initialCardRect);

    // Initial check: message card is null
    const initialMsgCard = await page.$('.qna-floating-message-card');
    if (initialMsgCard) throw new Error('Message card should not be visible before option is selected');

    // TEST OPTION 1 (Top-Left)
    console.log('\n-> Clicking Option 1 (Top-Left)...');
    await page.click('.qna-option-btn.option-1');
    await new Promise(r => setTimeout(r, 400));

    const opt1Check = await page.evaluate(() => {
      const card = document.querySelector('.qna-question-card').getBoundingClientRect();
      const msg = document.querySelector('.qna-floating-message-card');
      const opt1 = document.querySelector('.qna-option-btn.option-1').getBoundingClientRect();
      if (!msg) return null;
      const msgR = msg.getBoundingClientRect();

      return {
        cardGeom: { x: card.x, y: card.y, width: card.width, height: card.height },
        msgClass: msg.className,
        isLeftOfCard: msgR.right <= card.left + 5,
        msgYCenter: msgR.top + msgR.height / 2,
        opt1YCenter: opt1.top + opt1.height / 2,
        hasHeader: Boolean(msg.querySelector('.qna-message-header')),
        hasCloseBtn: Boolean(msg.querySelector('button, .qna-message-close-btn')),
        hasTitle: Boolean(msg.querySelector('.qna-message-label, h3, h4')),
        text: msg.querySelector('.qna-floating-message-text')?.textContent.trim()
      };
    });

    console.log('Option 1 Result:', opt1Check);
    if (!opt1Check) throw new Error('Message card not found after selecting Option 1');

    // Layout shift check: card position must not change
    const shiftX1 = Math.abs(opt1Check.cardGeom.x - initialCardRect.x);
    const shiftY1 = Math.abs(opt1Check.cardGeom.y - initialCardRect.y);
    const shiftW1 = Math.abs(opt1Check.cardGeom.width - initialCardRect.width);
    console.log(`Card position shift: dX=${shiftX1.toFixed(2)}px, dY=${shiftY1.toFixed(2)}px, dW=${shiftW1.toFixed(2)}px`);
    if (shiftX1 > 0.5 || shiftY1 > 0.5 || shiftW1 > 0.5) {
      throw new Error('Main Q&A card shifted or resized when Option 1 was selected!');
    }

    if (!opt1Check.isLeftOfCard) {
      throw new Error('Message card for Option 1 should be on the LEFT of the main card');
    }
    const yDiff1 = Math.abs(opt1Check.msgYCenter - opt1Check.opt1YCenter);
    console.log(`Vertical alignment difference with Option 1: ${yDiff1.toFixed(2)}px`);
    if (yDiff1 > 10) {
      throw new Error(`Vertical alignment with Option 1 row is off by ${yDiff1}px`);
    }

    if (opt1Check.hasHeader || opt1Check.hasCloseBtn || opt1Check.hasTitle) {
      throw new Error('Message card must contain ONLY message text (no headers, titles, or close buttons)');
    }

    // Capture screenshot matching reference image
    const screenshotPath = path.join(__dirname, 'verify_qna_option1_match.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Saved screenshot of Option 1 state:', screenshotPath);

    // TEST OPTION 2 (Top-Right)
    console.log('\n-> Clicking Option 2 (Top-Right)...');
    await page.click('.qna-option-btn.option-2');
    await new Promise(r => setTimeout(r, 400));

    const opt2Check = await page.evaluate(() => {
      const card = document.querySelector('.qna-question-card').getBoundingClientRect();
      const msg = document.querySelector('.qna-floating-message-card');
      const opt2 = document.querySelector('.qna-option-btn.option-2').getBoundingClientRect();
      if (!msg) return null;
      const msgR = msg.getBoundingClientRect();

      return {
        cardGeom: { x: card.x, y: card.y, width: card.width, height: card.height },
        msgClass: msg.className,
        isRightOfCard: msgR.left >= card.right - 5,
        msgYCenter: msgR.top + msgR.height / 2,
        opt2YCenter: opt2.top + opt2.height / 2,
        totalCards: document.querySelectorAll('.qna-floating-message-card').length,
        text: msg.querySelector('.qna-floating-message-text')?.textContent.trim()
      };
    });

    console.log('Option 2 Result:', opt2Check);
    if (!opt2Check) throw new Error('Message card not found after selecting Option 2');
    if (opt2Check.totalCards !== 1) throw new Error('Only ONE message card should be visible at a time');
    if (!opt2Check.isRightOfCard) throw new Error('Message card for Option 2 should be on the RIGHT of the main card');

    const shiftX2 = Math.abs(opt2Check.cardGeom.x - initialCardRect.x);
    if (shiftX2 > 0.5) throw new Error('Main Q&A card shifted when Option 2 was selected!');

    // TEST OPTION 3 (Bottom-Left)
    console.log('\n-> Clicking Option 3 (Bottom-Left)...');
    await page.click('.qna-option-btn.option-3');
    await new Promise(r => setTimeout(r, 400));

    const opt3Check = await page.evaluate(() => {
      const card = document.querySelector('.qna-question-card').getBoundingClientRect();
      const msg = document.querySelector('.qna-floating-message-card');
      const opt3 = document.querySelector('.qna-option-btn.option-3').getBoundingClientRect();
      if (!msg) return null;
      const msgR = msg.getBoundingClientRect();

      return {
        cardGeom: { x: card.x, y: card.y, width: card.width, height: card.height },
        isLeftOfCard: msgR.right <= card.left + 5,
        msgYCenter: msgR.top + msgR.height / 2,
        opt3YCenter: opt3.top + opt3.height / 2,
      };
    });

    console.log('Option 3 Result:', opt3Check);
    if (!opt3Check.isLeftOfCard) throw new Error('Message card for Option 3 should be on the LEFT of the main card');
    const yDiff3 = Math.abs(opt3Check.msgYCenter - opt3Check.opt3YCenter);
    console.log(`Vertical alignment difference with Option 3: ${yDiff3.toFixed(2)}px`);
    if (yDiff3 > 10) throw new Error(`Vertical alignment with Option 3 row is off by ${yDiff3}px`);

    // TEST OPTION 4 (Bottom-Right)
    console.log('\n-> Clicking Option 4 (Bottom-Right)...');
    await page.click('.qna-option-btn.option-4');
    await new Promise(r => setTimeout(r, 400));

    const opt4Check = await page.evaluate(() => {
      const card = document.querySelector('.qna-question-card').getBoundingClientRect();
      const msg = document.querySelector('.qna-floating-message-card');
      const opt4 = document.querySelector('.qna-option-btn.option-4').getBoundingClientRect();
      if (!msg) return null;
      const msgR = msg.getBoundingClientRect();

      return {
        cardGeom: { x: card.x, y: card.y, width: card.width, height: card.height },
        isRightOfCard: msgR.left >= card.right - 5,
        msgYCenter: msgR.top + msgR.height / 2,
        opt4YCenter: opt4.top + opt4.height / 2,
      };
    });

    console.log('Option 4 Result:', opt4Check);
    if (!opt4Check.isRightOfCard) throw new Error('Message card for Option 4 should be on the RIGHT of the main card');
    const yDiff4 = Math.abs(opt4Check.msgYCenter - opt4Check.opt4YCenter);
    console.log(`Vertical alignment difference with Option 4: ${yDiff4.toFixed(2)}px`);
    if (yDiff4 > 10) throw new Error(`Vertical alignment with Option 4 row is off by ${yDiff4}px`);

    // TEST TOGGLE OFF (Click Option 4 again)
    console.log('\n-> Clicking Option 4 again (Toggle Off)...');
    await page.click('.qna-option-btn.option-4');
    await new Promise(r => setTimeout(r, 300));
    const toggledOffMsg = await page.$('.qna-floating-message-card');
    console.log('Message card after toggle off:', toggledOffMsg ? 'STILL VISIBLE (FAIL)' : 'CLOSED (PASS)');
    if (toggledOffMsg) throw new Error('Message card should close when active option is clicked again');

    // TEST QUESTION TRANSITION
    console.log('\n-> Testing Next question transition resets message...');
    await page.click('.qna-option-btn.option-1');
    await new Promise(r => setTimeout(r, 300));
    await page.click('.qna-nav-btn.qna-nav-next');
    await new Promise(r => setTimeout(r, 400));

    const q2Msg = await page.$('.qna-floating-message-card');
    const q2Indicator = await page.$eval('.qna-qnum-badge', el => el.textContent.trim());
    console.log(`On Question: "${q2Indicator}", Message Card:`, q2Msg ? 'VISIBLE (FAIL)' : 'CLEARED (PASS)');
    if (q2Msg) throw new Error('Message card must be cleared when navigating to next question');

    console.log('\n✓ ALL TESTS PASSED SUCCESSFULLY! BOTH FIXES FULLY VERIFIED.');
  } finally {
    await browser.close();
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
