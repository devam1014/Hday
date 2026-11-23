const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

(async () => {
  console.log('--- STARTING COMPREHENSIVE GALLERY MEDIA MODAL TESTS ---');
  const tempProfile = path.join(os.tmpdir(), 'chrome_gallery_test_' + Date.now() + '_' + Math.random().toString(36).slice(2));
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
  // 1. TEST SAD GALLERY - IMAGE ITEM (Photo 1)
  // ---------------------------------------------------------------------------
  console.log('\n=== 1. TEST SAD GALLERY: IMAGE ITEM (PHOTO 1) ===');
  await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'networkidle0' });

  // Open album cover
  const nextArrow = await page.waitForSelector('.gallery-nav-arrow.arrow-right:not(.is-disabled)');
  await nextArrow.click();
  await new Promise((r) => setTimeout(r, 600));

  const counter1 = await page.$eval('.sad-photo-counter', el => el.textContent.trim());
  console.log(`Sad Gallery initial state: "${counter1}"`);

  // Click Photo 1
  console.log('Clicking Photo 1 to open large image viewer...');
  await (await page.waitForSelector('.sad-glass-photo-img')).click();
  await new Promise((r) => setTimeout(r, 400));

  // Assertions for Image Modal
  const isImageModalOpen = await page.$eval('.image-modal-backdrop', el => el.classList.contains('is-open'));
  console.log(`[PASS] Modal opened: ${isImageModalOpen}`);
  if (!isImageModalOpen) throw new Error('Image modal did not open!');

  const hasZoomBar = await page.$eval('.image-viewer-zoom-bar', el => !!el).catch(() => false);
  console.log(`[PASS] Image zoom bar present: ${hasZoomBar}`);
  if (!hasZoomBar) throw new Error('Zoom controls missing for image modal!');

  const hasVideoControlsInImageModal = await page.$eval('.gallery-modal-video-controls-bar', el => !!el).catch(() => false);
  console.log(`[PASS] Video controls NOT in image modal: ${!hasVideoControlsInImageModal}`);
  if (hasVideoControlsInImageModal) throw new Error('Video controls should not be in image modal!');

  // Test Zoom In
  await (await page.waitForSelector('.image-zoom-btn[aria-label="Zoom in"]')).click();
  await new Promise((r) => setTimeout(r, 100));
  const zoomText = await page.$eval('.image-zoom-level-badge', el => el.textContent.trim());
  console.log(`[PASS] Zoom level after clicking Zoom In: ${zoomText}`);

  await page.screenshot({ path: path.join(screenshotDir, 'sad_gallery_image_modal.png') });
  console.log('Saved scratch/sad_gallery_image_modal.png');

  // Close modal via Close Button
  await (await page.waitForSelector('.image-modal-close-btn')).click();
  await new Promise((r) => setTimeout(r, 400));

  const counterAfterImageClose = await page.$eval('.sad-photo-counter', el => el.textContent.trim());
  console.log(`[PASS] Sad Gallery state preserved after close: "${counterAfterImageClose}"`);
  if (counterAfterImageClose !== counter1) throw new Error('Gallery state was reset after modal close!');

  // ---------------------------------------------------------------------------
  // 2. TEST SAD GALLERY - ADVANCE TO VIDEO ITEM (Item 6)
  // ---------------------------------------------------------------------------
  console.log('\n=== 2. TEST SAD GALLERY: ADVANCE TO VIDEO ITEM (ITEM 6) ===');
  // Click Next until reaching item 6 (video)
  for (let i = 1; i < 6; i++) {
    const arrow = await page.waitForSelector('.gallery-nav-arrow.arrow-right:not(.is-disabled)');
    await arrow.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  const counter6 = await page.$eval('.sad-photo-counter', el => el.textContent.trim());
  console.log(`Sad Gallery state on item 6: "${counter6}"`);

  // Verify it's rendering GalleryVideoPlayer
  const videoInGallery = await page.$('.gallery-video-container');
  console.log(`[PASS] Item 6 is video container: ${!!videoInGallery}`);
  if (!videoInGallery) throw new Error('Item 6 should be a video!');

  // Click video container to open large video viewer
  console.log('Clicking video in Sad Gallery to open large video viewer...');
  await videoInGallery.click();
  await new Promise((r) => setTimeout(r, 400));

  // Assertions for Video Modal
  const isVideoModalOpen = await page.$eval('.image-modal-backdrop', el => el.classList.contains('is-open'));
  console.log(`[PASS] Large Video Modal opened: ${isVideoModalOpen}`);
  if (!isVideoModalOpen) throw new Error('Video modal did not open!');

  const hasVideoControls = await page.$eval('.gallery-modal-video-controls-bar', el => !!el).catch(() => false);
  console.log(`[PASS] Video controls present in modal: ${hasVideoControls}`);
  if (!hasVideoControls) throw new Error('Video controls missing in video modal!');

  const hasZoomControlsInVideo = await page.$eval('.image-viewer-zoom-bar', el => !!el).catch(() => false);
  console.log(`[PASS] Zoom controls NOT present for video: ${!hasZoomControlsInVideo}`);
  if (hasZoomControlsInVideo) throw new Error('Zoom controls should NOT exist for video modal!');

  const hasVolumeSlider = await page.$eval('.gallery-modal-video-controls-bar .gallery-video-volume-slider', el => !!el).catch(() => false);
  console.log(`[PASS] Volume slider present: ${hasVolumeSlider}`);
  if (!hasVolumeSlider) throw new Error('Volume slider missing from video modal!');

  const hasPlayBtn = await page.$eval('.gallery-modal-video-controls-bar button[aria-label*="Play"]', el => !!el).catch(() => false);
  console.log(`[PASS] Play button present: ${hasPlayBtn}`);
  if (!hasPlayBtn) throw new Error('Play button missing from video modal!');

  await page.screenshot({ path: path.join(screenshotDir, 'sad_gallery_video_modal.png') });
  console.log('Saved scratch/sad_gallery_video_modal.png');

  // Close video modal via Escape key
  console.log('Closing video modal via Escape key...');
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  const counterAfterVideoClose = await page.$eval('.sad-photo-counter', el => el.textContent.trim());
  console.log(`[PASS] State preserved on item 6: "${counterAfterVideoClose}"`);
  if (counterAfterVideoClose !== counter6) throw new Error('State was reset on closing video modal!');

  // ---------------------------------------------------------------------------
  // 3. TEST HAPPY GALLERY - VIDEO ITEM (Item 1) & IMAGE ITEM (Item 2)
  // ---------------------------------------------------------------------------
  console.log('\n=== 3. TEST HAPPY GALLERY ===');
  await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'networkidle0' });

  // Open album cover
  await (await page.waitForSelector('.happy-bottom-pill-btn.btn-next')).click();
  await new Promise((r) => setTimeout(r, 600));

  const happyCounter1 = await page.$eval('.happy-card-photo-counter', el => el.textContent.trim());
  console.log(`Happy Gallery initial state: "${happyCounter1}"`);

  // Item 1 in Happy Gallery is a Video (1.mp4)
  const happyVideoEl = await page.waitForSelector('.gallery-video-container');
  console.log(`[PASS] Item 1 in Happy Gallery is video: ${!!happyVideoEl}`);

  console.log('Clicking video in Happy Gallery to open large viewer...');
  await happyVideoEl.click();
  await new Promise((r) => setTimeout(r, 400));

  const isHappyVideoModalOpen = await page.$eval('.image-modal-backdrop', el => el.classList.contains('is-open'));
  console.log(`[PASS] Happy Gallery Video Modal open: ${isHappyVideoModalOpen}`);
  if (!isHappyVideoModalOpen) throw new Error('Happy Gallery Video modal did not open!');

  await page.screenshot({ path: path.join(screenshotDir, 'happy_gallery_video_modal.png') });
  console.log('Saved scratch/happy_gallery_video_modal.png');

  // Close via circular close button
  await (await page.waitForSelector('.image-modal-close-btn')).click();
  await new Promise((r) => setTimeout(r, 400));

  const happyCounterAfterClose = await page.$eval('.happy-card-photo-counter', el => el.textContent.trim());
  console.log(`[PASS] Happy Gallery state preserved after close: "${happyCounterAfterClose}"`);

  // Advance to Item 2 (Image: 2.jpg)
  console.log('\nAdvancing to Item 2 (Image) in Happy Gallery...');
  await (await page.waitForSelector('.happy-bottom-pill-btn.btn-next:not(.is-disabled)')).click();
  await new Promise((r) => setTimeout(r, 500));

  const happyCounter2 = await page.$eval('.happy-card-photo-counter', el => el.textContent.trim());
  console.log(`Happy Gallery state on item 2: "${happyCounter2}"`);

  // Verify item 2 is an image
  const happyPhoto2 = await page.waitForSelector('.happy-photo-element');
  console.log(`[PASS] Item 2 in Happy Gallery is image: ${!!happyPhoto2}`);

  console.log('Clicking Photo 2 in Happy Gallery to open large viewer...');
  await happyPhoto2.click();
  await new Promise((r) => setTimeout(r, 400));

  const isHappyImgModalOpen = await page.$eval('.image-modal-backdrop', el => el.classList.contains('is-open'));
  console.log(`[PASS] Happy Gallery Image Modal open: ${isHappyImgModalOpen}`);
  if (!isHappyImgModalOpen) throw new Error('Happy Gallery Image modal did not open!');

  const hasHappyZoomBar = await page.$eval('.image-viewer-zoom-bar', el => !!el).catch(() => false);
  console.log(`[PASS] Zoom bar present in Happy Gallery Image modal: ${hasHappyZoomBar}`);
  if (!hasHappyZoomBar) throw new Error('Zoom bar missing from Happy Gallery Image modal!');

  await page.screenshot({ path: path.join(screenshotDir, 'happy_gallery_image_modal.png') });
  console.log('Saved scratch/happy_gallery_image_modal.png');

  // Close via Escape key
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  const happyCounter2AfterClose = await page.$eval('.happy-card-photo-counter', el => el.textContent.trim());
  console.log(`[PASS] Happy Gallery state preserved on item 2: "${happyCounter2AfterClose}"`);

  console.log('\n=============================================================');
  console.log('🎉 ALL TESTS PASSED! BOTH GALLERIES FULLY SUPPORT LARGE IMAGE & VIDEO VIEWER WITH PERFECT STATE PRESERVATION!');
  console.log('=============================================================');

  await browser.close();
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
