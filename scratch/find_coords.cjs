const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer-core');

async function measure() {
  const uniqueDir = path.join(os.tmpdir(), 'puppeteer_meas_' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    userDataDir: uniqueDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const imgBase64 = fs.readFileSync('countdown-bg.png').toString('base64');
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background:#000;">
        <canvas id="c" width="1024" height="576"></canvas>
        <script>
          const img = new Image();
          img.src = "data:image/png;base64,${imgBase64}";
          img.onload = () => {
            const ctx = document.getElementById('c').getContext('2d');
            ctx.drawImage(img, 0, 0);
            window.ready = true;
          };
        </script>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForFunction(() => window.ready);

  const coords = await page.evaluate(() => {
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, 1024, 576);
    const data = imgData.data;

    function getRGB(x, y) {
      const idx = (y * 1024 + x) * 4;
      return { r: data[idx], g: data[idx+1], b: data[idx+2] };
    }
    function getLum(x, y) {
      const c = getRGB(x, y);
      return c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
    }

    // 1. Countdown track: Scan the numbers "02 : 14 : 37 : 09"
    // Digits are white/cream with glow, located y ~ 150 to 220, x ~ 330 to 690
    let countMinX = 1024, countMaxX = 0, countMinY = 576, countMaxY = 0;
    for (let y = 140; y < 225; y++) {
      for (let x = 320; x < 710; x++) {
        if (getLum(x, y) > 215) {
          if (x < countMinX) countMinX = x;
          if (x > countMaxX) countMaxX = x;
          if (y < countMinY) countMinY = y;
          if (y > countMaxY) countMaxY = y;
        }
      }
    }

    // Also let's find each individual number position if possible (Days, Hours, Minutes, Seconds)
    // Between colons
    // 2. Input box:
    // It has a distinct border around y ~ 370 to 425, x ~ 280 to 625
    let inputMinX = 1024, inputMaxX = 0, inputMinY = 576, inputMaxY = 0;
    for (let y = 365; y < 435; y++) {
      for (let x = 275; x < 635; x++) {
        const c = getRGB(x, y);
        // Border outline
        if (c.r > 190 && c.g > 140 && c.b < 120) {
          if (x < inputMinX) inputMinX = x;
          if (x > inputMaxX) inputMaxX = x;
          if (y < inputMinY) inputMinY = y;
          if (y > inputMaxY) inputMaxY = y;
        }
      }
    }

    // 3. Hint button:
    // Located to the right of the input box, around x ~ 635 to 745, y ~ 370 to 425
    let hintMinX = 1024, hintMaxX = 0, hintMinY = 576, hintMaxY = 0;
    for (let y = 365; y < 435; y++) {
      for (let x = 635; x < 755; x++) {
        const c = getRGB(x, y);
        // Glowing reddish/pinkish border of Hint button
        if (c.r > 200 && c.g > 110 && c.b > 80) {
          if (x < hintMinX) hintMinX = x;
          if (x > hintMaxX) hintMaxX = x;
          if (y < hintMinY) hintMinY = y;
          if (y > hintMaxY) hintMaxY = y;
        }
      }
    }

    // 4. Message For You button:
    // Located at bottom center, y ~ 465 to 535, x ~ 350 to 660
    let msgMinX = 1024, msgMaxX = 0, msgMinY = 576, msgMaxY = 0;
    for (let y = 460; y < 540; y++) {
      for (let x = 350; x < 670; x++) {
        const c = getRGB(x, y);
        if (c.r > 220 && c.g > 185 && c.b > 130) {
          if (x < msgMinX) msgMinX = x;
          if (x > msgMaxX) msgMaxX = x;
          if (y < msgMinY) msgMinY = y;
          if (y > msgMaxY) msgMaxY = y;
        }
      }
    }

    const W = 1024;
    const H = 576;

    function toPct(box) {
      return {
        left: ((box.minX / W) * 100).toFixed(2) + '%',
        top: ((box.minY / H) * 100).toFixed(2) + '%',
        width: (((box.maxX - box.minX) / W) * 100).toFixed(2) + '%',
        height: (((box.maxY - box.minY) / H) * 100).toFixed(2) + '%',
        px: box
      };
    }

    return {
      countdown: toPct({ minX: countMinX, maxX: countMaxX, minY: countMinY, maxY: countMaxY }),
      inputBox: toPct({ minX: inputMinX, maxX: inputMaxX, minY: inputMinY, maxY: inputMaxY }),
      hintBtn: toPct({ minX: hintMinX, maxX: hintMaxX, minY: hintMinY, maxY: hintMaxY }),
      msgBtn: toPct({ minX: msgMinX, maxX: msgMaxX, minY: msgMinY, maxY: msgMaxY }),
    };
  });

  console.log(JSON.stringify(coords, null, 2));
  await browser.close();
  try {
    fs.rmSync(uniqueDir, { recursive: true, force: true });
  } catch (e) {}
}

measure().catch(console.error);
