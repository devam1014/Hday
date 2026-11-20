const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  const profileDir = path.join(os.tmpdir(), 'chrome_test_videos_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  try {
    const browser = await puppeteer.launch({
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
    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Verify all 12 sections individually
    const results = [];

    for (let i = 0; i < 12; i++) {
      // 1. If i > 0, scroll down to advance section
      if (i > 0) {
        await page.evaluate(async (targetIdx) => {
          const viewport = document.querySelector('.minimal-message-scroll-viewport');
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
          await new Promise(r => setTimeout(r, 60));
          const root = document.querySelector('.main-page-root');
          root.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, bubbles: true, cancelable: true }));
          await new Promise(r => setTimeout(r, 900));
        }, i);
      }

      // Check current section info and click video button
      const sectionInfo = await page.evaluate(async (expectedSectionNum) => {
        const linkBtn = document.querySelector('.minimal-link-box');
        const linkText = linkBtn ? linkBtn.textContent.trim() : null;
        const pageTitle = document.querySelector('.minimal-page-title')?.textContent.trim();
        const activeDot = Array.from(document.querySelectorAll('.section-indicator-dot')).indexOf(
          document.querySelector('.section-indicator-dot.is-active')
        );

        // Click the button
        linkBtn.click();
        await new Promise(r => setTimeout(r, 350));

        // Inspect modal
        const modal = document.querySelector('.video-modal-backdrop.is-open');
        const isModalOpen = !!modal;

        // Check if Sad Gallery or Happy Gallery opened
        const isSadGalleryOpen = !!document.querySelector('.sad-gallery-root');
        const isHappyGalleryOpen = !!document.querySelector('.happy-gallery-container');

        const videoEl = document.querySelector('.video-player-media');
        const videoSrc = videoEl ? videoEl.getAttribute('src') : null;

        // Check missing placeholder
        const placeholder = document.querySelector('.video-missing-placeholder');
        const badgeText = document.querySelector('.video-missing-badge')?.textContent.trim();
        const pathCode = document.querySelector('.video-missing-path-code')?.textContent.trim();

        // Close modal
        const closeBtn = document.querySelector('.video-modal-close-btn');
        if (closeBtn) closeBtn.click();
        await new Promise(r => setTimeout(r, 300));

        return {
          sectionIndex: expectedSectionNum - 1,
          expectedSectionNum,
          pageTitle,
          linkText,
          isModalOpen,
          isSadGalleryOpen,
          isHappyGalleryOpen,
          videoSrc,
          hasGracefulPlaceholder: !!placeholder,
          badgeText,
          pathCode
        };
      }, i + 1);

      results.push(sectionInfo);
    }

    console.log('12 SECTIONS VERIFICATION REPORT:');
    console.log(JSON.stringify(results, null, 2));

    await browser.close();
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
