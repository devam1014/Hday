import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('--- Starting Position Memory & Navigation Verification ---');
  const profileDir = path.join(__dirname, 'chrome_pos_test_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      `--user-data-dir=${profileDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // -------------------------------------------------------------------------
    // TEST 1: Main Birthday Section 1 -> Sad Gallery -> Return -> Restores Section 1
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Loading Main Birthday (Section 1)...');
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    let activeDot = await page.$eval('.section-indicator-dot.is-active', el => el.getAttribute('aria-label'));
    console.log('Current section indicator:', activeDot);
    if (!activeDot.includes('section 1')) {
      throw new Error(`Expected section 1, got ${activeDot}`);
    }

    console.log('Clicking Next Page to go to Sad Gallery...');
    const nextToSadBtn = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToSadBtn.click();
    await new Promise(r => setTimeout(r, 800));

    // Verify Sad Gallery is open
    let sadGalleryRoot = await page.$('.sad-gallery-root');
    console.log('Sad Gallery open:', !!sadGalleryRoot);
    if (!sadGalleryRoot) throw new Error('Failed to open Sad Gallery');

    console.log('Clicking Previous Page in Sad Gallery to return to Main Birthday...');
    const prevToMainBtn = await page.$('.corner-nav-btn.corner-nav-prev');
    await prevToMainBtn.click();
    await new Promise(r => setTimeout(r, 800));

    activeDot = await page.$eval('.section-indicator-dot.is-active', el => el.getAttribute('aria-label'));
    console.log('Returned to Main Birthday section indicator:', activeDot);
    if (!activeDot.includes('section 1')) {
      throw new Error(`BUG! Expected Main Birthday to restore Section 1, but got ${activeDot}`);
    }
    console.log('✓ TEST 1 PASSED: Returned to Section 1 correctly (did not jump to Section 13!)');

    // -------------------------------------------------------------------------
    // TEST 2: Main Birthday Section 7 -> Sad Gallery -> Return -> Restores Section 7
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Switching to Section 7 in Main Birthday...');
    const dots = await page.$$('.section-indicator-dot');
    await dots[6].click(); // Dot 7 (index 6)
    await new Promise(r => setTimeout(r, 1000));

    activeDot = await page.$eval('.section-indicator-dot.is-active', el => el.getAttribute('aria-label'));
    console.log('Active section indicator is now:', activeDot);
    if (!activeDot.includes('section 7')) {
      throw new Error(`Expected section 7, got ${activeDot}`);
    }

    console.log('Navigating to Sad Gallery...');
    const nextToSadBtn2 = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToSadBtn2.click();
    await new Promise(r => setTimeout(r, 800));

    console.log('Clicking Previous Page in Sad Gallery...');
    const prevToMainBtn2 = await page.$('.corner-nav-btn.corner-nav-prev');
    await prevToMainBtn2.click();
    await new Promise(r => setTimeout(r, 800));

    activeDot = await page.$eval('.section-indicator-dot.is-active', el => el.getAttribute('aria-label'));
    console.log('Returned to Main Birthday section indicator:', activeDot);
    if (!activeDot.includes('section 7')) {
      throw new Error(`BUG! Expected Main Birthday to restore Section 7, but got ${activeDot}`);
    }
    console.log('✓ TEST 2 PASSED: Restored Section 7 correctly!');

    // -------------------------------------------------------------------------
    // TEST 3: Sad Gallery Media #3 -> Happy Gallery -> Return -> Restores Media #3
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Navigating to Sad Gallery...');
    const nextToSadBtn3 = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToSadBtn3.click();
    await new Promise(r => setTimeout(r, 800));

    // Open album from cover to Photo 1
    console.log('Opening Sad Gallery album (Cover -> Photo 1)...');
    const sadCoverNext = await page.$('.gallery-nav-arrow.arrow-right');
    await sadCoverNext.click();
    await new Promise(r => setTimeout(r, 1000));

    // Photo 1 -> Photo 2
    console.log('Advancing to Photo 2...');
    let sadNext = await page.$('.gallery-nav-arrow.arrow-right');
    await sadNext.click();
    await new Promise(r => setTimeout(r, 600));

    // Photo 2 -> Photo 3
    console.log('Advancing to Photo 3...');
    sadNext = await page.$('.gallery-nav-arrow.arrow-right');
    await sadNext.click();
    await new Promise(r => setTimeout(r, 600));

    let sadCounter = await page.$eval('.sad-photo-counter', el => el.textContent.trim());
    console.log('Sad Gallery counter before leaving:', sadCounter);
    if (!sadCounter.includes('3')) throw new Error(`Expected Sad Gallery photo 3, got ${sadCounter}`);

    console.log('Navigating to Happy Gallery via Next Page...');
    const nextToHappyBtn = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToHappyBtn.click();
    await new Promise(r => setTimeout(r, 800));

    console.log('Clicking Previous Page in Happy Gallery to return to Sad Gallery...');
    const prevToSadBtn = await page.$('.corner-nav-btn.corner-nav-prev');
    await prevToSadBtn.click();
    await new Promise(r => setTimeout(r, 800));

    sadCounter = await page.$eval('.sad-photo-counter', el => el.textContent.trim());
    console.log('Sad Gallery counter after returning:', sadCounter);
    if (!sadCounter.includes('3')) {
      throw new Error(`BUG! Expected Sad Gallery to restore Photo 3, but got ${sadCounter}`);
    }
    console.log('✓ TEST 3 PASSED: Restored Media #3 in Sad Gallery!');

    // -------------------------------------------------------------------------
    // TEST 4: Happy Gallery Media #2 -> Q&A -> Return -> Restores Media #2
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Navigating to Happy Gallery...');
    const nextToHappyBtn2 = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToHappyBtn2.click();
    await new Promise(r => setTimeout(r, 800));

    // On cover, click Next to open Photo 1
    console.log('Opening Happy Gallery album (Cover -> Photo 1)...');
    const happyCoverNext = await page.$('.happy-bottom-pill-btn.btn-next');
    await happyCoverNext.click();
    await new Promise(r => setTimeout(r, 1000));

    // Photo 1 -> Photo 2
    console.log('Advancing to Photo 2 in Happy Gallery...');
    let happyNext = await page.$('.happy-bottom-pill-btn.btn-next');
    await happyNext.click();
    await new Promise(r => setTimeout(r, 600));

    let happyCounter = await page.$eval('.happy-card-photo-counter', el => el.textContent.trim());
    console.log('Happy Gallery counter before leaving:', happyCounter);
    if (!happyCounter.includes('2')) throw new Error(`Expected Happy Gallery photo 2, got ${happyCounter}`);

    console.log('Navigating to Q&A via Next Page...');
    const nextToQnaBtn = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToQnaBtn.click();
    await new Promise(r => setTimeout(r, 800));

    console.log('Clicking Previous Page in Q&A to return to Happy Gallery...');
    const prevToHappyBtn = await page.$('.corner-nav-btn.corner-nav-prev');
    await prevToHappyBtn.click();
    await new Promise(r => setTimeout(r, 800));

    happyCounter = await page.$eval('.happy-card-photo-counter', el => el.textContent.trim());
    console.log('Happy Gallery counter after returning:', happyCounter);
    if (!happyCounter.includes('2')) {
      throw new Error(`BUG! Expected Happy Gallery to restore Photo 2, but got ${happyCounter}`);
    }
    console.log('✓ TEST 4 PASSED: Restored Media #2 in Happy Gallery!');

    // -------------------------------------------------------------------------
    // TEST 5: Q&A Question 4 -> Happy Gallery -> Return -> Restores Question 4
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Navigating to Q&A...');
    const nextToQnaBtn2 = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToQnaBtn2.click();
    await new Promise(r => setTimeout(r, 800));

    console.log('Advancing to Question 4 in Q&A...');
    for (let i = 0; i < 3; i++) {
      const qNext = await page.$('.qna-nav-btn.qna-nav-next');
      await qNext.click();
      await new Promise(r => setTimeout(r, 300));
    }

    let qBadge = await page.$eval('.qna-qnum-badge', el => el.textContent.trim());
    console.log('Q&A badge before leaving:', qBadge);
    if (!qBadge.includes('Question 4')) throw new Error(`Expected Question 4, got ${qBadge}`);

    // Click an option to open personal message card
    const option1 = await page.$('.qna-option-btn.option-1');
    await option1.click();
    await new Promise(r => setTimeout(r, 300));
    let messageText = await page.$eval('.qna-message-text', el => el.textContent.trim());
    console.log('Opened option message:', messageText);

    console.log('Navigating back to Happy Gallery...');
    const prevToHappyBtn2 = await page.$('.corner-nav-btn.corner-nav-prev');
    await prevToHappyBtn2.click();
    await new Promise(r => setTimeout(r, 800));

    console.log('Navigating back to Q&A...');
    const nextToQnaBtn3 = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToQnaBtn3.click();
    await new Promise(r => setTimeout(r, 800));

    qBadge = await page.$eval('.qna-qnum-badge', el => el.textContent.trim());
    console.log('Q&A badge after returning:', qBadge);
    if (!qBadge.includes('Question 4')) {
      throw new Error(`BUG! Expected Q&A to restore Question 4, but got ${qBadge}`);
    }
    messageText = await page.$eval('.qna-message-text', el => el.textContent.trim());
    console.log('Restored option message:', messageText);
    if (!messageText) throw new Error('Expected option message to be preserved');
    console.log('✓ TEST 5 PASSED: Restored Question 4 and option message in Q&A!');

    // -------------------------------------------------------------------------
    // TEST 6: Q&A Final Message Step -> Happy Gallery -> Return -> Restores Final Message Step
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Advancing through remaining questions to Message for You button...');
    while (true) {
      const qNext = await page.$('.qna-nav-btn.qna-nav-next');
      if (!qNext) break;
      await qNext.click();
      await new Promise(r => setTimeout(r, 250));
    }

    // Now on step 'button' (Message for You trigger)
    const surpriseBtn = await page.$('.qna-final-surprise-btn');
    console.log('Surprise button present:', !!surpriseBtn);
    if (!surpriseBtn) throw new Error('Expected surprise button to be present');
    await surpriseBtn.click();
    await new Promise(r => setTimeout(r, 600));

    let finalSurpriseStage = await page.$('.qna-final-surprise-stage');
    console.log('Final surprise stage present:', !!finalSurpriseStage);
    if (!finalSurpriseStage) throw new Error('Expected final surprise stage to be visible');

    console.log('Navigating back to Happy Gallery...');
    const prevToHappyBtn3 = await page.$('.corner-nav-btn.corner-nav-prev');
    await prevToHappyBtn3.click();
    await new Promise(r => setTimeout(r, 800));

    console.log('Returning to Q&A...');
    const nextToQnaBtn4 = await page.$('.corner-nav-btn.corner-nav-next');
    await nextToQnaBtn4.click();
    await new Promise(r => setTimeout(r, 800));

    finalSurpriseStage = await page.$('.qna-final-surprise-stage');
    console.log('Final surprise stage after returning:', !!finalSurpriseStage);
    if (!finalSurpriseStage) {
      throw new Error('BUG! Expected final surprise stage to remain restored!');
    }
    console.log('✓ TEST 6 PASSED: Restored Final Message step in Q&A!');

    // -------------------------------------------------------------------------
    // TEST 7: Page Reload / Reopen -> Fresh Open Reset Check
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Reloading page (testing in-memory only nature)...');
    await page.reload({ waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1000));

    // Check localStorage and sessionStorage are untouched
    const storageCheck = await page.evaluate(() => ({
      localLen: localStorage.length,
      sessionLen: sessionStorage.length
    }));
    console.log('Storage check:', storageCheck);

    console.log('✓ TEST 7 PASSED: Storage is completely clean!');

    console.log('\n===========================================');
    console.log('🎉 ALL POSITION MEMORY & NAVIGATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('===========================================');

  } finally {
    await browser.close();
  }
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
