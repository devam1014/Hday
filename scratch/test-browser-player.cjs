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
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Check player element
    const playerCheck = await page.evaluate(() => {
      const pill = document.querySelector('.music-player-pill');
      const label = document.querySelector('.music-player-label-text');
      const eqBars = document.querySelectorAll('.spectrum-bar');
      const heart = document.querySelector('.music-heart-icon');
      const wave = document.querySelector('.music-flowing-wave');
      return {
        hasPill: !!pill,
        labelText: label ? label.textContent.trim() : null,
        eqBarCount: eqBars.length,
        hasHeartIcon: !!heart,
        hasWave: !!wave,
      };
    });

    console.log('Player DOM Verification:', playerCheck);

    const outPath = path.join(__dirname, 'music_player_redesign.png');
    await page.screenshot({ path: outPath });
    console.log('Saved screenshot to:', outPath);

    await browser.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
