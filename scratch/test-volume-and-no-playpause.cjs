const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_vol_details_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    for (const stage of ['main', 'sad-memories', 'happy-gallery']) {
      console.log(`\n--- Detailed Volume Interaction Test: ${stage} ---`);
      await page.goto(`http://localhost:5173/?stage=${stage}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1000));

      const isMain = stage === 'main';
      const volBtnSel = isMain ? '.music-vol-btn' : '.gmp-btn-vol';
      const sliderSel = isMain ? '.music-volume-slider' : '.gmp-volume-slider';
      const playBtnSel = isMain ? '.music-play-btn' : '.gmp-btn-play';
      const themeKey = stage === 'sad-memories' ? 'sad' : stage === 'happy-gallery' ? 'happy' : 'main';

      // 1. Initial play state check
      const initialPlayState = await page.evaluate((sel) => {
        const btn = document.querySelector(sel);
        return btn ? btn.getAttribute('aria-label') : null;
      }, playBtnSel);
      console.log(`[${themeKey}] Initial play button state:`, initialPlayState);

      // 2. Hover over volume button
      const volBtn = await page.$(volBtnSel);
      const btnBox = await volBtn.boundingBox();
      await page.mouse.move(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
      await new Promise(r => setTimeout(r, 200));

      const slider = await page.$(sliderSel);
      const sliderBox = await slider.boundingBox();
      const midX = sliderBox.x + sliderBox.width / 2;

      // 3. Drag from bottom (min volume) to top (max volume)
      console.log(`[${themeKey}] Dragging from bottom (min) to top (max)...`);
      await page.mouse.move(midX, sliderBox.y + sliderBox.height - 4);
      await page.mouse.down();
      for (let y = sliderBox.y + sliderBox.height - 4; y >= sliderBox.y + 4; y -= 8) {
        await page.mouse.move(midX, y);
        await new Promise(r => setTimeout(r, 20));
      }
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 150));

      const maxState = await page.evaluate((theme, sel) => {
        const s = document.querySelector(sel);
        const p = window.__audioController.players[theme];
        return { sliderVal: parseFloat(s.value), audioVal: p.audio.volume };
      }, themeKey, sliderSel);
      console.log(`[${themeKey}] After dragging to top:`, maxState);
      assert(maxState.sliderVal >= 0.9, 'Slider value should be near max');
      assert(maxState.audioVal >= 0.9, 'Audio volume should be near max');

      // 4. Drag from top (max) to bottom (min)
      console.log(`[${themeKey}] Dragging from top (max) to bottom (min)...`);
      await page.mouse.move(midX, sliderBox.y + 4);
      await page.mouse.down();
      for (let y = sliderBox.y + 4; y <= sliderBox.y + sliderBox.height - 4; y += 8) {
        await page.mouse.move(midX, y);
        await new Promise(r => setTimeout(r, 20));
      }
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 150));

      const minState = await page.evaluate((theme, sel) => {
        const s = document.querySelector(sel);
        const p = window.__audioController.players[theme];
        return { sliderVal: parseFloat(s.value), audioVal: p.audio.volume };
      }, themeKey, sliderSel);
      console.log(`[${themeKey}] After dragging to bottom:`, minState);
      assert(minState.sliderVal <= 0.1, 'Slider value should be near min');
      assert(minState.audioVal <= 0.1, 'Audio volume should be near min');

      // 5. Confirm Play/Pause button was NOT accidentally toggled
      const finalPlayState = await page.evaluate((sel) => {
        const btn = document.querySelector(sel);
        return btn ? btn.getAttribute('aria-label') : null;
      }, playBtnSel);
      console.log(`[${themeKey}] Final play button state:`, finalPlayState);
      assert.strictEqual(finalPlayState, initialPlayState, 'Play/pause button must not be accidentally toggled by volume adjustments');
      console.log(`✓ [${themeKey}] Volume test passed completely!`);
    }

    console.log('\nALL 3 PLAYERS PASSED DETAILED VOLUME DRAG & NO-PLAYPAUSE TESTS!');
  } catch (err) {
    console.error('Test failure:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
