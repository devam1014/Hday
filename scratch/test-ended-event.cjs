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

    // Test ended event on window.__audioController
    const testReport = await page.evaluate(async () => {
      const ac = window.__audioController;
      if (!ac) return { error: 'window.__audioController not found' };

      const log = [];

      // Step 1: Initial state
      log.push({ step: 'initial', currentIndex: ac.currentIndex, song: ac.songs[ac.currentIndex].filename });

      // Step 2: Trigger ended event on track 0 (Dilruba)
      ac.audio.dispatchEvent(new Event('ended'));
      await new Promise(r => setTimeout(r, 100));
      log.push({ step: 'after_first_song_ended', currentIndex: ac.currentIndex, song: ac.songs[ac.currentIndex].filename });

      // Step 3: Trigger ended event on track 1 (Aakhri Saans)
      ac.audio.dispatchEvent(new Event('ended'));
      await new Promise(r => setTimeout(r, 100));
      log.push({ step: 'after_second_song_ended', currentIndex: ac.currentIndex, song: ac.songs[ac.currentIndex].filename });

      // Step 4: Trigger ended event on track 2 (Preet Re)
      ac.audio.dispatchEvent(new Event('ended'));
      await new Promise(r => setTimeout(r, 100));
      log.push({ step: 'after_third_song_ended_should_loop', currentIndex: ac.currentIndex, song: ac.songs[ac.currentIndex].filename });

      return {
        success: true,
        totalSongs: ac.songs.length,
        log
      };
    });

    console.log('Test Report:', JSON.stringify(testReport, null, 2));

    await browser.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
