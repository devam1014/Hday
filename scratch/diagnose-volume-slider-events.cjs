const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_events_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));

    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    // Attach comprehensive event logging to the slider and all parent containers
    await page.evaluate(() => {
      window._eventsLog = [];
      const log = (source, type, e) => {
        window._eventsLog.push({
          source,
          type,
          targetTag: e.target ? e.target.tagName : null,
          targetClass: e.target ? e.target.className : null,
          value: e.target && e.target.value !== undefined ? e.target.value : null,
          clientX: e.clientX,
          clientY: e.clientY
        });
      };

      const slider = document.querySelector('.music-volume-slider');
      const popup = document.querySelector('.music-volume-popup');
      const container = document.querySelector('.music-volume-container');
      const pill = document.querySelector('.music-player-pill');

      ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mousemove', 'mouseup', 'click', 'input', 'change'].forEach(evt => {
        slider.addEventListener(evt, e => log('slider', evt, e));
        popup.addEventListener(evt, e => log('popup', evt, e));
        container.addEventListener(evt, e => log('container', evt, e));
      });
    });

    const volBtn = await page.$('.music-vol-btn');
    const btnBox = await volBtn.boundingBox();
    console.log('Moving mouse to volume button:', btnBox);
    await page.mouse.move(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    const slider = await page.$('.music-volume-slider');
    const sliderBox = await slider.boundingBox();
    console.log('Slider box after hover:', sliderBox);

    const clickX = sliderBox.x + sliderBox.width / 2;
    const clickY = sliderBox.y + sliderBox.height * 0.25;

    console.log(`Clicking at (${clickX}, ${clickY})...`);
    await page.mouse.click(clickX, clickY);
    await new Promise(r => setTimeout(r, 200));

    console.log('Dragging from top to bottom...');
    await page.mouse.move(clickX, sliderBox.y + 10);
    await page.mouse.down();
    for (let y = sliderBox.y + 10; y <= sliderBox.y + sliderBox.height - 10; y += 10) {
      await page.mouse.move(clickX, y);
      await new Promise(r => setTimeout(r, 30));
    }
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 200));

    const result = await page.evaluate(() => {
      const slider = document.querySelector('.music-volume-slider');
      return {
        events: window._eventsLog,
        currentSliderValue: slider.value,
        audioVolume: window.__audioController ? window.__audioController.players.main.audio.volume : null
      };
    });

    console.log('Events captured:', JSON.stringify(result.events, null, 2));
    console.log('Current slider value:', result.currentSliderValue);
    console.log('Current audio volume:', result.audioVolume);

  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await browser.close();
  }
})();
