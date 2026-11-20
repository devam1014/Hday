const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_all_players_' + Date.now());
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
      console.log(`\n=================== TESTING STAGE: ${stage} ===================`);
      await page.goto(`http://localhost:5173/?stage=${stage}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1200));

      const isMain = stage === 'main';
      const volBtnSelector = isMain ? '.music-vol-btn' : '.gmp-btn-vol';
      const sliderSelector = isMain ? '.music-volume-slider' : '.gmp-volume-slider';
      const themeKey = stage === 'sad-memories' ? 'sad' : stage === 'happy-gallery' ? 'happy' : 'main';

      const volBtn = await page.$(volBtnSelector);
      if (!volBtn) {
        console.error(`Volume button not found for ${stage}`);
        continue;
      }

      const btnBox = await volBtn.boundingBox();
      console.log(`Button Box for ${stage}:`, btnBox);

      // Hover on volume button
      await page.mouse.move(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
      await new Promise(r => setTimeout(r, 300));

      const slider = await page.$(sliderSelector);
      if (!slider) {
        console.error(`Slider not found for ${stage}`);
        continue;
      }
      const sliderBox = await slider.boundingBox();
      console.log(`Slider Box for ${stage}:`, sliderBox);

      // Check initial values
      const initial = await page.evaluate((theme, sel) => {
        const s = document.querySelector(sel);
        const p = window.__audioController ? window.__audioController.players[theme] : null;
        return {
          sliderValue: s ? s.value : null,
          playerVolume: p ? p.volume : null,
          audioVolume: p && p.audio ? p.audio.volume : null
        };
      }, themeKey, sliderSelector);
      console.log(`Initial values for ${themeKey}:`, initial);

      // Click at 20% from top (near max)
      const topX = sliderBox.x + sliderBox.width / 2;
      const topY = sliderBox.y + sliderBox.height * 0.2;
      console.log(`Clicking near top (${topX}, ${topY})...`);
      await page.mouse.click(topX, topY);
      await new Promise(r => setTimeout(r, 200));

      const afterClick = await page.evaluate((theme, sel) => {
        const s = document.querySelector(sel);
        const p = window.__audioController ? window.__audioController.players[theme] : null;
        return {
          sliderValue: s ? s.value : null,
          playerVolume: p ? p.volume : null,
          audioVolume: p && p.audio ? p.audio.volume : null
        };
      }, themeKey, sliderSelector);
      console.log(`After click near top for ${themeKey}:`, afterClick);

      // Drag from top down to bottom
      console.log(`Dragging down...`);
      await page.mouse.move(topX, topY);
      await page.mouse.down();
      for (let y = topY; y <= sliderBox.y + sliderBox.height * 0.85; y += 10) {
        await page.mouse.move(topX, y);
        await new Promise(r => setTimeout(r, 30));
      }
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 200));

      const afterDrag = await page.evaluate((theme, sel) => {
        const s = document.querySelector(sel);
        const p = window.__audioController ? window.__audioController.players[theme] : null;
        return {
          sliderValue: s ? s.value : null,
          playerVolume: p ? p.volume : null,
          audioVolume: p && p.audio ? p.audio.volume : null
        };
      }, themeKey, sliderSelector);
      console.log(`After drag down for ${themeKey}:`, afterDrag);
    }

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
