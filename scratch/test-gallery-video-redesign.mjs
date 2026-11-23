import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const executablePath = chromePaths.find(p => fs.existsSync(p));

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('1. Testing Sad Gallery video card...');
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Click Next arrow to open album cover to photo 1
    const nextArrow = await page.$('.arrow-right');
    if (nextArrow) await nextArrow.click();
    await new Promise(r => setTimeout(r, 600));

    // Advance to photo 6 (which is 6.mp4 in sad gallery)
    for (let i = 0; i < 5; i++) {
      const nextBtn = await page.$('.arrow-right');
      if (nextBtn) await nextBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Wait for video metadata to load
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'scratch/verify_sad_video_card.png' });
    console.log('Saved scratch/verify_sad_video_card.png');

    // Click to open enlarged viewer
    const sadPlayBtn = await page.$('.gallery-video-center-play-btn');
    if (sadPlayBtn) {
      await sadPlayBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: 'scratch/verify_sad_enlarged_viewer.png' });
      console.log('Saved scratch/verify_sad_enlarged_viewer.png');

      // Close modal
      const closeBtn = await page.$('.video-modal-close-btn');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('2. Testing Happy Gallery video card...');
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Click Next button on cover
    const happyNext = await page.$('.happy-bottom-pill-btn.btn-next');
    if (happyNext) await happyNext.click();
    await new Promise(r => setTimeout(r, 1000));

    // Photo 1 in happy gallery is 1.mp4!
    await page.screenshot({ path: 'scratch/verify_happy_video_card.png' });
    console.log('Saved scratch/verify_happy_video_card.png');

    // Click to open enlarged viewer in Happy gallery
    const happyPlayBtn = await page.$('.gallery-video-center-play-btn');
    if (happyPlayBtn) {
      await happyPlayBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: 'scratch/verify_happy_enlarged_viewer.png' });
      console.log('Saved scratch/verify_happy_enlarged_viewer.png');
    }

    console.log('\nVerification script completed successfully.');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
