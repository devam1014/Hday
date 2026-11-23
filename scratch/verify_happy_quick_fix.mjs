import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('1. Navigating to Happy Gallery via ?stage=happy-gallery...');
  await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  // On cover, click Next to open photo 1 (which is 1.mp4 video)
  const openAlbumBtn = await page.$('.happy-bottom-pill-btn.btn-next');
  if (openAlbumBtn) {
    await openAlbumBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  // Check DOM for controls bar in Happy Gallery
  const happyControlsBar = await page.$('.happy-video-theme .gallery-video-controls-bar');
  const happyPlayBtn = await page.$('.happy-video-theme .gallery-video-center-play-btn');
  console.log('Happy Gallery - Controls bar in DOM:', !!happyControlsBar);
  console.log('Happy Gallery - Orange play button in DOM:', !!happyPlayBtn);

  // Take screenshot of Happy Gallery normal view
  await page.screenshot({ path: 'scratch/verify_happy_normal_view_nofix.png' });
  console.log('Saved scratch/verify_happy_normal_view_nofix.png');

  // Click orange Play button to open enlarged viewer
  if (happyPlayBtn) {
    await happyPlayBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Check enlarged viewer controls
  const enlargedModal = await page.$('.video-modal-overlay');
  const enlargedControls = await page.$('.video-modal-controls');
  console.log('Enlarged Modal present:', !!enlargedModal);
  console.log('Enlarged Controls present:', !!enlargedControls);

  await page.screenshot({ path: 'scratch/verify_happy_enlarged_viewer_nofix.png' });
  console.log('Saved scratch/verify_happy_enlarged_viewer_nofix.png');

  // Close modal
  const closeBtn = await page.$('.video-modal-close-btn');
  if (closeBtn) {
    await closeBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // Navigate to photo 2 (image) to verify images and navigation are unaffected
  const nextBtn = await page.$('.happy-bottom-pill-btn.btn-next');
  if (nextBtn) {
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }
  await page.screenshot({ path: 'scratch/verify_happy_image_card.png' });
  console.log('Saved scratch/verify_happy_image_card.png');

  // Check Sad Gallery
  console.log('2. Checking Sad Gallery (photo 6 is 6.mp4)...');
  await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  const sadOpenBtn = await page.$('.arrow-right');
  if (sadOpenBtn) {
    await sadOpenBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }
  for (let i = 0; i < 5; i++) {
    const arrow = await page.$('.arrow-right');
    if (arrow) {
      await arrow.click();
      await new Promise(r => setTimeout(r, 400));
    }
  }
  await new Promise(r => setTimeout(r, 800));
  const sadPlayBtn = await page.$('.sad-video-theme .gallery-video-center-play-btn');
  console.log('Sad Gallery - Blue play button present:', !!sadPlayBtn);

  await page.screenshot({ path: 'scratch/verify_sad_remains_unchanged.png' });
  console.log('Saved scratch/verify_sad_remains_unchanged.png');

  await browser.close();
  console.log('All verification checks finished.');
})();
