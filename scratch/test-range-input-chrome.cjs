const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_range_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .test-container { display: flex; gap: 40px; padding: 50px; }
          .slider-box { display: flex; flex-direction: column; align-items: center; width: 60px; height: 150px; background: #eee; }
          
          /* Style A: Current implementation */
          .style-a {
            writing-mode: vertical-lr;
            direction: rtl;
            width: 14px;
            height: 100px;
          }

          /* Style B: orient="vertical" attribute + standard appearance */
          .style-b {
            width: 14px;
            height: 100px;
          }

          /* Style C: -webkit-appearance: slider-vertical */
          .style-c {
            -webkit-appearance: slider-vertical;
            width: 14px;
            height: 100px;
          }

          /* Style D: CSS transform rotate(-90deg) */
          .style-d-wrapper {
            width: 30px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .style-d {
            width: 100px;
            height: 14px;
            transform: rotate(-90deg);
            transform-origin: center center;
          }
        </style>
      </head>
      <body>
        <div class="test-container">
          <div class="slider-box">
            <span>A</span>
            <input type="range" id="sliderA" class="style-a" min="0" max="1" step="0.02" value="0.6">
            <span id="valA">0.6</span>
          </div>

          <div class="slider-box">
            <span>B</span>
            <input type="range" id="sliderB" class="style-b" orient="vertical" min="0" max="1" step="0.02" value="0.6">
            <span id="valB">0.6</span>
          </div>

          <div class="slider-box">
            <span>C</span>
            <input type="range" id="sliderC" class="style-c" min="0" max="1" step="0.02" value="0.6">
            <span id="valC">0.6</span>
          </div>

          <div class="slider-box">
            <span>D</span>
            <div class="style-d-wrapper">
              <input type="range" id="sliderD" class="style-d" min="0" max="1" step="0.02" value="0.6">
            </div>
            <span id="valD">0.6</span>
          </div>
        </div>
        <script>
          ['A', 'B', 'C', 'D'].forEach(id => {
            const input = document.getElementById('slider' + id);
            const val = document.getElementById('val' + id);
            input.addEventListener('input', e => {
              val.textContent = e.target.value;
            });
            input.addEventListener('change', e => {
              val.textContent = e.target.value;
            });
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(html);

    // Test each slider by clicking near the top (high value) and dragging down
    for (const id of ['A', 'B', 'C', 'D']) {
      console.log(`\nTesting Slider ${id}:`);
      const elem = await page.$('#slider' + id);
      const box = await elem.boundingBox();
      console.log(`Box for ${id}:`, box);

      // Click at 15% from top
      const clickX = box.x + box.width / 2;
      const clickY = box.y + box.height * 0.15;
      await page.mouse.click(clickX, clickY);
      await new Promise(r => setTimeout(r, 100));

      let val = await page.evaluate(i => document.getElementById('slider' + i).value, id);
      console.log(`After click near top: val = ${val}`);

      // Drag from top down to bottom
      await page.mouse.move(clickX, box.y + box.height * 0.15);
      await page.mouse.down();
      for (let step = 1; step <= 8; step++) {
        await page.mouse.move(clickX, box.y + box.height * (0.15 + step * 0.09));
        await new Promise(r => setTimeout(r, 30));
      }
      await page.mouse.up();

      val = await page.evaluate(i => document.getElementById('slider' + i).value, id);
      console.log(`After drag down: val = ${val}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
