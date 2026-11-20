const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_vol_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
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

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    // Inspect the DOM elements for MusicPlayer volume
    const info = await page.evaluate(() => {
      const volContainer = document.querySelector('.music-volume-container');
      const volBtn = document.querySelector('.music-vol-btn');
      const volPopup = document.querySelector('.music-volume-popup');
      const slider = document.querySelector('.music-volume-slider');
      const pill = document.querySelector('.music-player-pill');

      if (!volContainer || !volBtn || !volPopup || !slider) {
        return { error: 'Elements not found', hasContainer: !!volContainer, hasBtn: !!volBtn, hasPopup: !!volPopup, hasSlider: !!slider };
      }

      const getDetails = (el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          pointerEvents: style.pointerEvents,
          zIndex: style.zIndex,
          overflow: style.overflow,
          writingMode: style.writingMode,
          appearance: style.appearance,
          webkitAppearance: style.webkitAppearance,
          transform: style.transform
        };
      };

      return {
        pill: getDetails(pill),
        volContainer: getDetails(volContainer),
        volBtn: getDetails(volBtn),
        volPopup: getDetails(volPopup),
        slider: getDetails(slider),
        sliderValue: slider.value,
        audioVolume: window.__audioController ? window.__audioController.players.main.audio.volume : null
      };
    });

    console.log('DOM Info:', JSON.stringify(info, null, 2));

    // Now test hover
    console.log('\n--- Testing Hover on Volume Button ---');
    const volBtnElem = await page.$('.music-vol-btn');
    const btnBox = await volBtnElem.boundingBox();
    console.log('Button Box:', btnBox);

    await page.mouse.move(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    const hoverState1 = await page.evaluate(() => {
      const volPopup = document.querySelector('.music-volume-popup');
      const slider = document.querySelector('.music-volume-slider');
      const style = window.getComputedStyle(volPopup);
      return {
        popupClass: volPopup.className,
        popupOpacity: style.opacity,
        popupPointerEvents: style.pointerEvents,
        sliderRect: slider.getBoundingClientRect()
      };
    });
    console.log('State on hover button:', hoverState1);

    // Now move mouse up onto slider
    console.log('\n--- Moving pointer onto slider ---');
    const sliderElem = await page.$('.music-volume-slider');
    const sliderBox = await sliderElem.boundingBox();
    console.log('Slider Box:', sliderBox);

    if (sliderBox) {
      await page.mouse.move(sliderBox.x + sliderBox.width / 2, sliderBox.y + sliderBox.height / 2);
      await new Promise(r => setTimeout(r, 300));

      const hoverState2 = await page.evaluate(() => {
        const volPopup = document.querySelector('.music-volume-popup');
        const style = window.getComputedStyle(volPopup);
        return {
          popupClass: volPopup.className,
          popupOpacity: style.opacity,
          popupPointerEvents: style.pointerEvents
        };
      });
      console.log('State when pointer is on slider:', hoverState2);

      // Now click on slider track (e.g. at 25% height from top)
      console.log('\n--- Clicking on slider track (top area) ---');
      const targetY = sliderBox.y + sliderBox.height * 0.25;
      const targetX = sliderBox.x + sliderBox.width / 2;
      
      const elementAtPoint = await page.evaluate((x, y) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tag: el.tagName, className: el.className } : null;
      }, targetX, targetY);
      console.log('Element at point before click:', elementAtPoint);

      await page.mouse.click(targetX, targetY);
      await new Promise(r => setTimeout(r, 300));

      const afterClick = await page.evaluate(() => {
        const slider = document.querySelector('.music-volume-slider');
        return {
          sliderValue: slider.value,
          audioVolume: window.__audioController ? window.__audioController.players.main.audio.volume : null
        };
      });
      console.log('After click at 25% height:', afterClick);

      // Now try to drag from targetY down to targetY + 40
      console.log('\n--- Dragging slider down ---');
      await page.mouse.move(targetX, targetY);
      await page.mouse.down();
      for (let i = 1; i <= 10; i++) {
        await page.mouse.move(targetX, targetY + i * 4);
        await new Promise(r => setTimeout(r, 30));
      }
      await page.mouse.up();

      const afterDrag = await page.evaluate(() => {
        const slider = document.querySelector('.music-volume-slider');
        return {
          sliderValue: slider.value,
          audioVolume: window.__audioController ? window.__audioController.players.main.audio.volume : null
        };
      });
      console.log('After drag down:', afterDrag);
    }

  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await browser.close();
  }
})();
