const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  const profileDir = path.join(os.tmpdir(), 'chrome_test_present_' + Date.now());
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

    const checkResult = await page.evaluate(async () => {
      const linkBtn = document.querySelector('.minimal-link-box');
      linkBtn.click();
      await new Promise(r => setTimeout(r, 600));

      const videoEl = document.querySelector('.video-player-media');
      const centralPlayBtn = document.querySelector('.video-central-play-btn');
      const placeholder = document.querySelector('.video-missing-placeholder');
      const controlsBar = document.querySelector('.video-external-controls-bar');

      return {
        videoSrc: videoEl?.getAttribute('src'),
        hasVideoElement: !!videoEl,
        isCentralPlayBtnVisible: centralPlayBtn?.classList.contains('is-visible'),
        isPlaceholderPresent: !!placeholder,
        isControlsBarDisabled: controlsBar?.classList.contains('is-disabled'),
      };
    });

    console.log('PRESENT VIDEO TEST RESULT:');
    console.log(JSON.stringify(checkResult, null, 2));

    await browser.close();
  } catch (err) {
    console.error('Error in present video test:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
