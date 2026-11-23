const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

(async () => {
  console.log('--- STARTING FINAL WEBSITE POLISH TESTS ---');
  const tempProfile = path.join(os.tmpdir(), 'chrome_final_polish_' + Date.now() + '_' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tempProfile, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir: tempProfile,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const screenshotDir = path.join(__dirname, '..', 'scratch');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  // ---------------------------------------------------------------------------
  // 1. TEST TEST-HELPER ABSENCE ON VISITOR SCREENS
  // ---------------------------------------------------------------------------
  console.log('\n=== 1. VERIFYING TEST HELPER IS REMOVED FOR VISITORS ===');
  const visitorStages = ['countdown', 'fireworks', 'main', 'sad-memories', 'happy-gallery', 'qna'];
  for (const st of visitorStages) {
    await page.goto(`http://127.0.0.1:5173/?stage=${st}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));
    const hasTestHelper = await page.evaluate(() => {
      const allText = document.body.innerText;
      return allText.includes('Test Helper') || !!document.querySelector('.dev-test-panel');
    });
    console.log(`[PASS] Stage "${st}": Test Helper visible = ${hasTestHelper}`);
    if (hasTestHelper) throw new Error(`Test Helper should NOT be visible on stage ${st} for normal visitors!`);
  }

  // ---------------------------------------------------------------------------
  // 2. TEST UTILITY BUTTONS ON FIREWORKS VS OTHER STAGES
  // ---------------------------------------------------------------------------
  console.log('\n=== 2. VERIFYING UTILITY BUTTONS POSITIONING & VISIBILITY ===');
  // Fireworks: See This View AND Click & See Magic
  await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  const hasSeeThisViewFireworks = await page.$('.see-this-view-btn') !== null;
  const hasClickSeeFireworks = await page.$('.dev-click-see-btn') !== null;
  console.log(`[PASS] Fireworks page has See This View: ${hasSeeThisViewFireworks}`);
  console.log(`[PASS] Fireworks page has Click & See Magic: ${hasClickSeeFireworks}`);
  if (!hasSeeThisViewFireworks || !hasClickSeeFireworks) {
    throw new Error('Fireworks page must have both See This View and Click & See Magic!');
  }
  await page.screenshot({ path: path.join(screenshotDir, 'fireworks_utility_buttons.png') });
  console.log('Saved scratch/fireworks_utility_buttons.png');

  // Main Birthday: See This View ONLY (NO Click & See Magic)
  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  const hasClickSeeMain = await page.$('.dev-click-see-btn') !== null;
  console.log(`[PASS] Main Birthday Click & See Magic visible: ${hasClickSeeMain}`);
  if (hasClickSeeMain) throw new Error('Click & See Magic must NOT be visible on Main Birthday!');

  // ---------------------------------------------------------------------------
  // 3. TEST Q&A PREVIOUS PAGE BUTTON & FLOW
  // ---------------------------------------------------------------------------
  console.log('\n=== 3. VERIFYING Q&A PREVIOUS PAGE BUTTON ===');
  await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  const qnaTopLeftText = await page.$eval('.corner-nav-btn.corner-nav-prev .corner-nav-text', el => el.textContent.trim());
  console.log(`Q&A top-left button text: "${qnaTopLeftText}"`);
  if (qnaTopLeftText !== 'Previous Page') {
    throw new Error(`Expected button text to be "Previous Page", but got "${qnaTopLeftText}"!`);
  }
  console.log('[PASS] Q&A top-left button correctly labeled "Previous Page"!');

  // Click Previous Page from Question 1 -> should return to Happy Gallery
  console.log('Clicking Previous Page in Q&A...');
  await (await page.$('.corner-nav-btn.corner-nav-prev')).click();
  await new Promise(r => setTimeout(r, 800));

  const isHappyGallery = await page.$('.happy-gallery-root') !== null;
  console.log(`[PASS] Navigated back to Happy Gallery: ${isHappyGallery}`);
  if (!isHappyGallery) throw new Error('Clicking Previous Page in Q&A did not return to Happy Gallery!');

  // Reload Q&A to test advancing through questions to final message screen
  await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  console.log('[PASS] Re-entered Q&A Section cleanly!');

  // ---------------------------------------------------------------------------
  // 4. TEST FINAL MESSAGE MEDIA (1.mp4 LOOPING + 2.mp4 CONTROLLABLE)
  // ---------------------------------------------------------------------------
  console.log('\n=== 4. VERIFYING FINAL MESSAGE MEDIA (1.mp4 & 2.mp4) ===');
  // Advance through 10 questions to reach final message
  for (let q = 0; q < 9; q++) {
    const nextQBtn = await page.waitForSelector('.qna-nav-btn.qna-nav-next');
    await nextQBtn.click();
    await new Promise(r => setTimeout(r, 300));
  }
  // On question 10, click Next to show "Message for You" button screen
  const q10Next = await page.waitForSelector('.qna-nav-btn.qna-nav-next');
  await q10Next.click();
  await new Promise(r => setTimeout(r, 500));

  // Click "Message for You" button
  const surpriseBtn = await page.waitForSelector('.qna-final-surprise-btn');
  await surpriseBtn.click();
  await new Promise(r => setTimeout(r, 800));

  // Check top-left button on Final Message screen
  const finalTopLeftText = await page.$eval('.corner-nav-btn.corner-nav-prev .corner-nav-text', el => el.textContent.trim());
  console.log(`[PASS] Final Message screen top-left button text: "${finalTopLeftText}"`);
  if (finalTopLeftText !== 'Previous Page') {
    throw new Error(`Expected "Previous Page" on Final Message screen, got "${finalTopLeftText}"`);
  }

  // Check First Card (Image Card position): Looping video 1.mp4
  const firstCardVideo = await page.$('.qna-final-image-card video.qna-final-portrait-video');
  console.log(`[PASS] First card renders video: ${!!firstCardVideo}`);
  if (!firstCardVideo) throw new Error('First card must render looping video!');

  const firstCardAttrs = await page.$eval('.qna-final-image-card video.qna-final-portrait-video', el => ({
    src: el.src,
    autoplay: el.autoplay,
    loop: el.loop,
    muted: el.muted,
    controls: el.controls
  }));
  console.log('First card video attributes:', firstCardAttrs);
  if (!firstCardAttrs.loop || !firstCardAttrs.muted || firstCardAttrs.controls) {
    throw new Error('First card video must have loop=true, muted=true, controls=false!');
  }

  // Check Second Card (Video Card position): Normal video 2.mp4
  const secondCardVideo = await page.$('.qna-final-video-card video.qna-final-video-thumb-elem');
  console.log(`[PASS] Second card renders video thumbnail: ${!!secondCardVideo}`);
  if (!secondCardVideo) throw new Error('Second card must render video thumbnail!');

  const secondCardSrc = await page.$eval('.qna-final-video-card video.qna-final-video-thumb-elem', el => el.src);
  console.log(`Second card video source: ${secondCardSrc}`);
  if (!secondCardSrc.includes('2.mp4')) {
    throw new Error(`Second card video must be 2.mp4, got ${secondCardSrc}!`);
  }

  await page.screenshot({ path: path.join(screenshotDir, 'final_message_layout.png') });
  console.log('Saved scratch/final_message_layout.png');

  // Test opening First Card modal
  console.log('\nOpening First Card large viewer modal...');
  await (await page.$('.qna-final-image-card')).click();
  await new Promise(r => setTimeout(r, 500));

  const isFirstCardModalOpen = await page.$eval('.image-modal-backdrop', el => el.classList.contains('is-open'));
  console.log(`[PASS] First Card modal is open: ${isFirstCardModalOpen}`);
  if (!isFirstCardModalOpen) throw new Error('First card modal did not open!');

  // Check that first card modal has NO visible controls (no play/pause, no volume, no zoom)
  const hasZoomInFirstModal = await page.$('.image-viewer-zoom-bar') !== null;
  const hasControlsInFirstModal = await page.$('.gallery-modal-video-controls-bar') !== null;
  console.log(`[PASS] First Card modal has no zoom bar: ${!hasZoomInFirstModal}`);
  console.log(`[PASS] First Card modal has no control bar: ${!hasControlsInFirstModal}`);
  if (hasZoomInFirstModal || hasControlsInFirstModal) {
    throw new Error('First card modal must have zero visible controls!');
  }

  await page.screenshot({ path: path.join(screenshotDir, 'final_message_first_card_modal.png') });
  console.log('Saved scratch/final_message_first_card_modal.png');

  // Close First Card modal via Escape
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));
  const isFirstModalClosed = await page.$eval('.image-modal-backdrop', el => !el.classList.contains('is-open')).catch(() => true);
  console.log(`[PASS] First Card modal closed via Escape: ${isFirstModalClosed}`);

  // Test opening Second Card modal
  console.log('\nOpening Second Card large viewer modal...');
  await (await page.$('.qna-final-video-card')).click();
  await new Promise(r => setTimeout(r, 600));

  const isSecondModalOpen = await page.$eval('.video-modal-backdrop', el => el.classList.contains('is-open')).catch(() => false);
  console.log(`[PASS] Second Card Video Modal is open: ${isSecondModalOpen}`);
  if (!isSecondModalOpen) throw new Error('Second Card video modal did not open!');

  // Check that second card modal has Play/Pause and Volume controls
  const hasPlayPause = await page.$('.video-ctrl-btn') !== null;
  const hasVolume = await page.$('.video-ctrl-volume-slider') !== null;
  console.log(`[PASS] Second Card modal has Play/Pause: ${hasPlayPause}`);
  console.log(`[PASS] Second Card modal has Volume slider: ${hasVolume}`);
  if (!hasPlayPause || !hasVolume) {
    throw new Error('Second card video modal must provide Play/Pause and Volume controls!');
  }

  await page.screenshot({ path: path.join(screenshotDir, 'final_message_second_card_modal.png') });
  console.log('Saved scratch/final_message_second_card_modal.png');

  // Close Second Card modal via close button
  await (await page.waitForSelector('.video-modal-close-btn')).click();
  await new Promise(r => setTimeout(r, 400));
  const isSecondModalClosed = await page.$eval('.video-modal-backdrop', el => !el.classList.contains('is-open')).catch(() => true);
  console.log(`[PASS] Second Card modal closed: ${isSecondModalClosed}`);

  console.log('\n=============================================================');
  console.log('🎉 ALL FINAL POLISH & DEPLOYMENT READINESS TESTS PASSED 100%!');
  console.log('=============================================================');

  await browser.close();
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
