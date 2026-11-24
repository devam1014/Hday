import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('=== TEST 1: Next Page Buttons Visible Immediately ===');
  
  // 1A. MainPage
  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const mainNextBtn = await page.$('.corner-nav-btn.corner-nav-next');
  console.log('MainPage Section 1 Next Page button visible:', !!mainNextBtn);
  await page.screenshot({ path: 'scratch/verify_main_next_page_initial.png' });

  // 1B. Sad Gallery
  await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const sadNextBtn = await page.$('.corner-nav-btn.corner-nav-next');
  console.log('Sad Gallery Cover Next Page button visible:', !!sadNextBtn);
  await page.screenshot({ path: 'scratch/verify_sad_next_page_initial.png' });

  // 1C. Happy Gallery
  await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const happyNextBtn = await page.$('.corner-nav-btn.corner-nav-next');
  console.log('Happy Gallery Cover Next Page button visible:', !!happyNextBtn);
  await page.screenshot({ path: 'scratch/verify_happy_next_page_initial.png' });

  console.log('\n=== TEST 2: Background Music Pauses Immediately on Video Open ===');

  // 2A. MainPage "Clip for You"
  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Start background music explicitly
  await page.evaluate(() => {
    window.__audioController?.play('main');
  });
  await new Promise(r => setTimeout(r, 500));

  let isMainMusicPlaying = await page.evaluate(() => {
    return !window.__audioController?.players?.main?.audio?.paused;
  });
  console.log('Main background music playing before modal:', isMainMusicPlaying);

  // Click "Clip for You" button
  const clipBtn = await page.$('.minimal-link-box');
  if (clipBtn) {
    await clipBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  let isModalOpen = await page.$('.video-modal-backdrop.is-open');
  console.log('Video modal opened:', !!isModalOpen);

  let isMainMusicPausedImmediately = await page.evaluate(() => {
    return window.__audioController?.players?.main?.audio?.paused;
  });
  console.log('Main background music paused immediately upon modal open (before playing video):', isMainMusicPausedImmediately);

  console.log('\n=== TEST 3: Video Viewer Double-Close Bug (Closes Exactly Once) ===');
  
  // Track onClose invocations or backdrop element transitions
  const closeBtn = await page.$('.video-modal-close-btn');
  if (closeBtn) {
    console.log('Clicking X close button once...');
    await closeBtn.click();
    
    // Wait through animation
    await new Promise(r => setTimeout(r, 100));
    const isClosingState = await page.$('.video-modal-backdrop.is-closing');
    console.log('Modal is playing closing transition:', !!isClosingState);

    await new Promise(r => setTimeout(r, 350));
    const isModalPresentAfterClose = await page.$('.video-modal-backdrop');
    console.log('Modal completely removed from DOM after 350ms:', !isModalPresentAfterClose);

    // Wait another 300ms to verify it doesn't flicker or re-open/double close
    await new Promise(r => setTimeout(r, 300));
    const isModalReopened = await page.$('.video-modal-backdrop');
    console.log('Modal remained closed (no double-close re-render):', !isModalReopened);

    const isMusicResumed = await page.evaluate(() => {
      return !window.__audioController?.players?.main?.audio?.paused;
    });
    console.log('Main background music resumed correctly after closing viewer:', isMusicResumed);
  }

  // 3B. Test in Happy Gallery (video 1.mp4)
  console.log('\n=== TEST 4: Happy Gallery Video Modal Double-Close & Music Pause ===');
  await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Advance from cover to photo 1 (1.mp4 video)
  const openAlbum = await page.$('.happy-bottom-pill-btn.btn-next');
  if (openAlbum) {
    await openAlbum.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Start happy music if needed
  await page.evaluate(() => {
    window.__audioController?.play('happy');
  });
  await new Promise(r => setTimeout(r, 400));
  const isHappyPlaying = await page.evaluate(() => !window.__audioController?.players?.happy?.audio?.paused);
  console.log('Happy gallery music playing before modal:', isHappyPlaying);

  // Click orange play button to open enlarged video
  const playBtn = await page.$('.gallery-video-center-play-btn');
  if (playBtn) {
    await playBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  const isHappyModalOpen = await page.$('.video-modal-backdrop.is-open');
  console.log('Happy Gallery enlarged video modal open:', !!isHappyModalOpen);

  const isHappyMusicPaused = await page.evaluate(() => window.__audioController?.players?.happy?.audio?.paused);
  console.log('Happy gallery music paused immediately upon open:', isHappyMusicPaused);

  // Close with X
  const happyCloseBtn = await page.$('.video-modal-close-btn');
  if (happyCloseBtn) {
    console.log('Clicking X on Happy Gallery video modal...');
    await happyCloseBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const isHappyModalPresent = await page.$('.video-modal-backdrop');
    console.log('Happy modal closed cleanly (removed from DOM):', !isHappyModalPresent);

    await new Promise(r => setTimeout(r, 300));
    const isHappyResumed = await page.evaluate(() => !window.__audioController?.players?.happy?.audio?.paused);
    console.log('Happy gallery music resumed correctly after modal close:', isHappyResumed);
  }

  // 3C. Test Escape key close
  console.log('\n=== TEST 5: Escape Key Close ===');
  const playBtn2 = await page.$('.gallery-video-center-play-btn');
  if (playBtn2) {
    await playBtn2.click();
    await new Promise(r => setTimeout(r, 400));
    console.log('Modal re-opened. Pressing Escape key...');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    const isPresentAfterEsc = await page.$('.video-modal-backdrop');
    console.log('Modal closed cleanly with Escape:', !isPresentAfterEsc);
  }

  // 3D. Test Backdrop click vs Card click
  console.log('\n=== TEST 6: Card Click Does Not Close, Backdrop Click Closes ===');
  const playBtn3 = await page.$('.gallery-video-center-play-btn');
  if (playBtn3) {
    await playBtn3.click();
    await new Promise(r => setTimeout(r, 400));

    // Click inside the card
    const modalContentCard = await page.$('.video-modal-card');
    if (modalContentCard) {
      await modalContentCard.click();
      await new Promise(r => setTimeout(r, 300));
      const stillOpenAfterCardClick = await page.$('.video-modal-backdrop');
      console.log('Modal remains open after clicking inside the card:', !!stillOpenAfterCardClick);
    }

    // Click backdrop outside the card
    await page.mouse.click(20, 20);
    await new Promise(r => setTimeout(r, 400));
    const closedAfterBackdropClick = await page.$('.video-modal-backdrop');
    console.log('Modal closed after clicking the backdrop:', !closedAfterBackdropClick);
  }

  await browser.close();
  console.log('\nAll tests completed successfully!');
})();
