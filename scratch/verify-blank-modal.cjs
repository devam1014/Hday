const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createServer } = require('vite');

(async () => {
  const profileDir = path.join(os.tmpdir(), 'chrome_test_blank_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  let server;
  let browser;

  try {
    // Start local Vite server programmatically on port 5174
    server = await createServer({
      root: path.resolve(__dirname, '..'),
      server: { port: 5174 }
    });
    await server.listen();

    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      userDataDir: profileDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5174/?stage=main', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Test 1: Section 1 with missing video -> Must be COMPLETELY BLANK
    const result1 = await page.evaluate(async () => {
      const linkBtn = document.querySelector('.minimal-link-box');
      linkBtn.click();
      await new Promise(r => setTimeout(r, 500));

      const modal = document.querySelector('.video-modal-backdrop.is-open');
      const container = document.querySelector('.video-player-container');
      const videoEl = document.querySelector('.video-player-media');
      const placeholder = document.querySelector('.video-missing-placeholder');
      const playBtn = document.querySelector('.video-central-play-btn');

      // Check all text content inside container
      const containerText = container ? container.textContent.trim() : '';
      const hasAnyImagesOrIcons = container ? container.querySelectorAll('svg, img').length : 0;

      // Close modal
      const closeBtn = document.querySelector('.video-modal-close-btn');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 300));

      return {
        isModalOpen: !!modal,
        videoSrc: videoEl?.getAttribute('src'),
        isPlaceholderPresent: !!placeholder,
        containerText,
        hasAnyImagesOrIcons,
        isPlayBtnPresent: !!playBtn,
        isVideoHidden: videoEl?.classList.contains('is-hidden')
      };
    });

    console.log('MISSING VIDEO (BLANK VIEWPORT) RESULT:');
    console.log(JSON.stringify(result1, null, 2));

    // Test 2: When video IS present -> Ensure play button and playback work
    const testVideoTarget = path.join(__dirname, '..', 'public', 'video-for-main-page', '1.mp4');
    const sourceVideo = path.join(__dirname, '..', 'public', 'video1.mp4');
    fs.copyFileSync(sourceVideo, testVideoTarget);

    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    const result2 = await page.evaluate(async () => {
      const linkBtn = document.querySelector('.minimal-link-box');
      linkBtn.click();
      await new Promise(r => setTimeout(r, 600));

      const videoEl = document.querySelector('.video-player-media');
      const playBtn = document.querySelector('.video-central-play-btn');
      const placeholder = document.querySelector('.video-missing-placeholder');

      const closeBtn = document.querySelector('.video-modal-close-btn');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 300));

      return {
        videoSrc: videoEl?.getAttribute('src'),
        isPlayBtnVisible: playBtn?.classList.contains('is-visible'),
        isPlaceholderPresent: !!placeholder,
        isVideoVisible: videoEl && !videoEl.classList.contains('is-hidden')
      };
    });

    console.log('PRESENT VIDEO PLAYABLE RESULT:');
    console.log(JSON.stringify(result2, null, 2));

    // Cleanup test video
    if (fs.existsSync(testVideoTarget)) {
      fs.unlinkSync(testVideoTarget);
    }

  } catch (err) {
    console.error('Error during blank modal test:', err);
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
