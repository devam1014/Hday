const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_p_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: [
        `--user-data-dir=${profileDir}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Expose a test helper in the page context to test audioController
    const testResult = await page.evaluate(async () => {
      // Find audio controller or check audio state
      // We can inspect the window or query audio element
      // Let's test the Next button and simulated ended event
      const steps = [];

      // Step 1: Initial state
      const nextBtn = document.querySelector('.music-ctrl-btn:nth-child(3)');
      const prevBtn = document.querySelector('.music-ctrl-btn:nth-child(1)');
      const playBtn = document.querySelector('.music-play-btn');

      // Click play if paused
      playBtn.click();
      await new Promise(r => setTimeout(r, 300));
      steps.push({ action: 'play', hasPlayingClass: document.querySelector('.music-player-pill').classList.contains('is-playing') });

      // Click Next
      nextBtn.click();
      await new Promise(r => setTimeout(r, 300));
      steps.push({ action: 'next_to_track_2' });

      // Click Next again
      nextBtn.click();
      await new Promise(r => setTimeout(r, 300));
      steps.push({ action: 'next_to_track_3' });

      // Click Next again (loop back to track 1)
      nextBtn.click();
      await new Promise(r => setTimeout(r, 300));
      steps.push({ action: 'loop_back_to_track_1' });

      // Click Prev (loop backwards to track 3)
      prevBtn.click();
      await new Promise(r => setTimeout(r, 300));
      steps.push({ action: 'prev_to_track_3' });

      return steps;
    });

    console.log('UI Navigation & Cycle Test:', testResult);
    await browser.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
