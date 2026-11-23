const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_fix');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const results = {};

  try {
    // 1. Check Test Helper restored and visible on page
    console.log('Testing Test Helper...');
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    const devHelperExists = await page.evaluate(() => {
      const el = document.querySelector('.dev-test-panel');
      return el && window.getComputedStyle(el).display !== 'none';
    });
    results.testHelperVisible = devHelperExists;
    console.log('Test Helper visible on main stage:', devHelperExists);

    // 2. Test Sad Gallery normal media size & large viewer
    console.log('Testing Sad Gallery...');
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));

    // Turn album cover to first photo if on cover
    const isCover = await page.evaluate(() => !!document.querySelector('.sad-cover-container'));
    if (isCover) {
      await page.click('.gallery-nav-arrow.arrow-right');
      await new Promise((r) => setTimeout(r, 800));
    }

    // Normal media sizing
    const sadImgInfo = await page.evaluate(() => {
      const img = document.querySelector('.sad-glass-photo-img');
      const wrapper = document.querySelector('.sad-glass-photo-wrapper');
      if (!img || !wrapper) return null;
      const rImg = img.getBoundingClientRect();
      const rWrap = wrapper.getBoundingClientRect();
      return {
        imgWidth: rImg.width,
        imgHeight: rImg.height,
        wrapWidth: rWrap.width,
        wrapHeight: rWrap.height,
        objectFit: window.getComputedStyle(img).objectFit,
      };
    });
    results.sadGalleryMedia = sadImgInfo;
    console.log('Sad Gallery Photo metrics:', sadImgInfo);

    // Open large viewer on Sad Gallery
    await page.click('.sad-glass-photo-img');
    await new Promise((r) => setTimeout(r, 600));

    // Check large viewer position & centering
    const sadModalInfo = await page.evaluate(() => {
      const card = document.querySelector('.gallery-media-modal-card');
      const backdrop = document.querySelector('.image-modal-backdrop');
      if (!card || !backdrop) return null;
      const rect = card.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return {
        cardWidth: rect.width,
        cardHeight: rect.height,
        centerX,
        centerY,
        isCenteredX: Math.abs(centerX - vw / 2) < 5,
        isCenteredY: Math.abs(centerY - vh / 2) < 5,
        hasZoomBar: !!document.querySelector('.image-viewer-zoom-bar'),
        hasCloseBtn: !!document.querySelector('.image-modal-close-btn'),
      };
    });
    results.sadModalCentering = sadModalInfo;
    console.log('Sad Modal Centering metrics:', sadModalInfo);
    await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'quick_fix_sad_modal.png') });

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));

    // 3. Test Happy Gallery normal video & large video viewer
    console.log('Testing Happy Gallery...');
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));

    // Turn cover to first item (1.mp4 video)
    const isHappyCover = await page.evaluate(() => !!document.querySelector('.happy-cover-layout'));
    if (isHappyCover) {
      await page.click('.happy-cover-bottom-nav .btn-next');
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Normal video sizing and normal video controls
    const normalVideoInfo = await page.evaluate(() => {
      const vidContainer = document.querySelector('.gallery-video-container');
      const vidElem = document.querySelector('.gallery-video-element');
      const ctrlBar = document.querySelector('.gallery-video-controls-bar');
      const playBtn = document.querySelector('.gallery-video-ctrl-btn');
      const volSlider = document.querySelector('.gallery-video-volume-slider');
      if (!vidContainer || !vidElem) return null;
      const rWrap = vidContainer.getBoundingClientRect();
      const rVid = vidElem.getBoundingClientRect();
      return {
        containerWidth: rWrap.width,
        containerHeight: rWrap.height,
        videoWidth: rVid.width,
        videoHeight: rVid.height,
        hasNormalControlsBar: !!ctrlBar,
        hasNormalPlayBtn: !!playBtn,
        hasNormalVolSlider: !!volSlider,
      };
    });
    results.normalVideoControls = normalVideoInfo;
    console.log('Normal Happy Video metrics & controls:', normalVideoInfo);
    await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'quick_fix_normal_gallery_view.png') });

    // Open large video viewer
    await page.click('.gallery-video-container');
    await new Promise((r) => setTimeout(r, 600));

    // Check large video viewer controls & centering
    const largeVideoModalInfo = await page.evaluate(() => {
      const card = document.querySelector('.gallery-media-modal-card');
      const centerOverlay = document.querySelector('.gallery-modal-center-play-overlay');
      const centerPlayBtn = document.querySelector('.gallery-modal-center-play-btn');
      const bottomControlsBar = document.querySelector('.gallery-modal-video-controls-bar');
      const volSlider = document.querySelector('.gallery-modal-video-controls-bar input, .gallery-video-volume-slider');
      const zoomBar = document.querySelector('.image-viewer-zoom-bar');
      const rect = card.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      return {
        cardWidth: rect.width,
        cardHeight: rect.height,
        isCenteredX: Math.abs(centerX - vw / 2) < 5,
        isCenteredY: Math.abs(centerY - vh / 2) < 5,
        hasCenterOverlay: !!centerOverlay,
        hasCenterPlayBtn: !!centerPlayBtn,
        hasBottomControlsBar: !!bottomControlsBar, // MUST be false
        hasVolSliderInModal: !!document.querySelector('.gallery-media-modal-card input'), // MUST be false
        hasZoomBarInVideo: !!zoomBar, // MUST be false
      };
    });
    results.largeVideoModal = largeVideoModalInfo;
    console.log('Large Video Modal metrics:', largeVideoModalInfo);
    await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'quick_fix_large_video_modal.png') });

    // Test Play/Pause center button click
    console.log('Testing Play/Pause center button...');
    await page.click('.gallery-modal-center-play-btn');
    await new Promise((r) => setTimeout(r, 500));

    const isVideoPlaying = await page.evaluate(() => {
      const vid = document.querySelector('.gallery-modal-video-element');
      return vid && !vid.paused;
    });
    results.isVideoPlayingAfterClick = isVideoPlaying;
    console.log('Is video playing after clicking center button:', isVideoPlaying);

    // Pause it again
    await page.click('.gallery-modal-video-stage');
    await new Promise((r) => setTimeout(r, 400));
    const isVideoPaused = await page.evaluate(() => {
      const vid = document.querySelector('.gallery-modal-video-element');
      return vid && vid.paused;
    });
    results.isVideoPausedAfterClick = isVideoPaused;
    console.log('Is video paused after clicking stage:', isVideoPaused);

    // Close modal
    await page.click('.image-modal-close-btn');
    await new Promise((r) => setTimeout(r, 400));

    // Next item in Happy Gallery (photo) to verify photo sizing
    console.log('Testing Happy Gallery photo sizing...');
    await page.click('.happy-bottom-pill-btn.btn-next');
    await new Promise((r) => setTimeout(r, 600));

    const happyPhotoInfo = await page.evaluate(() => {
      const img = document.querySelector('.happy-photo-element');
      const box = document.querySelector('.happy-photo-presentation-box');
      if (!img || !box) return null;
      const rImg = img.getBoundingClientRect();
      const rBox = box.getBoundingClientRect();
      return {
        imgWidth: rImg.width,
        imgHeight: rImg.height,
        boxWidth: rBox.width,
        boxHeight: rBox.height,
        objectFit: window.getComputedStyle(img).objectFit,
      };
    });
    results.happyPhotoMetrics = happyPhotoInfo;
    console.log('Happy Gallery Photo metrics:', happyPhotoInfo);

    console.log('FINAL RESULTS JSON:');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
